package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.KeyAgreement;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Service
public class EccKeyManagementService {

    private static final Logger log = LoggerFactory.getLogger(EccKeyManagementService.class);

    public static final String EC_ALGORITHM = "EC";
    public static final String ECDH_ALGORITHM = "ECDH";
    public static final String EC_CURVE_NAME = "secp256r1"; // NIST P-256
    private static final byte[] HKDF_INFO = "SecureStorage-KeyWrap-v1".getBytes(StandardCharsets.UTF_8);

    private final HkdfService hkdfService;
    private final AesGcmEncryptionService aesGcmService;
    private final SecureRandom secureRandom = new SecureRandom();

    public EccKeyManagementService(HkdfService hkdfService, AesGcmEncryptionService aesGcmService) {
        this.hkdfService = hkdfService;
        this.aesGcmService = aesGcmService;
    }

    public KeyPair generateKeyPair() {
        try {
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance(EC_ALGORITHM);
            ECGenParameterSpec ecSpec = new ECGenParameterSpec(EC_CURVE_NAME);
            keyGen.initialize(ecSpec, secureRandom);
            return keyGen.generateKeyPair();
        } catch (Exception e) {
            throw new CryptoException("Failed to generate ECC P-256 key pair: " + e.getMessage(), e);
        }
    }

    public String encodePublicKey(PublicKey publicKey) {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    public String encodePrivateKey(PrivateKey privateKey) {
        return Base64.getEncoder().encodeToString(privateKey.getEncoded());
    }

    public PublicKey decodePublicKey(String base64PublicKey) {
        try {
            String cleaned = cleanKeyString(base64PublicKey);
            byte[] keyBytes = Base64.getDecoder().decode(cleaned);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(EC_ALGORITHM);
            return keyFactory.generatePublic(spec);
        } catch (Exception e) {
            throw new CryptoException("Invalid or malformed ECC public key", e);
        }
    }

    public PrivateKey decodePrivateKey(String base64PrivateKey) {
        try {
            String cleaned = cleanKeyString(base64PrivateKey);
            byte[] keyBytes = Base64.getDecoder().decode(cleaned);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(EC_ALGORITHM);
            return keyFactory.generatePrivate(spec);
        } catch (Exception e) {
            log.error("Failed to decode ECC private key: {}", e.getMessage());
            throw new CryptoException("Invalid or malformed ECC private key", e);
        }
    }

    private String cleanKeyString(String key) {
        if (key == null) return null;
        return key.replaceAll("(?s)-----BEGIN.*?-----", "")
                  .replaceAll("(?s)-----END.*?-----", "")
                  .replaceAll("\"", "")
                  .replaceAll("'", "")
                  .replaceAll("\\s+", "");
    }

    public byte[] computeSharedSecret(PrivateKey privateKey, PublicKey peerPublicKey) {
        try {
            KeyAgreement keyAgreement = KeyAgreement.getInstance(ECDH_ALGORITHM);
            keyAgreement.init(privateKey);
            keyAgreement.doPhase(peerPublicKey, true);
            return keyAgreement.generateSecret();
        } catch (Exception e) {
            throw new CryptoException("ECDH key agreement failed: " + e.getMessage(), e);
        }
    }

    /**
     * Wraps per-file cryptographic keys (AES DEK + Blowfish sub-key) under recipient's ECC public key.
     * Output Envelope Format:
     * [Salt: 32 bytes] | [EphPubKeyLen: 2 bytes] | [EphPubKey: N bytes] | [Encrypted Keys Payload]
     */
    public byte[] wrapKeysForRecipient(byte[] aesDek, byte[] blowfishKey, PublicKey recipientPublicKey) {
        try {
            // 1. Generate ephemeral ECC key pair
            KeyPair ephemeralKeyPair = generateKeyPair();

            // 2. Compute ECDH shared secret Z
            byte[] sharedSecret = computeSharedSecret(ephemeralKeyPair.getPrivate(), recipientPublicKey);

            // 3. Generate 32-byte fresh salt
            byte[] salt = new byte[32];
            secureRandom.nextBytes(salt);

            // 4. Derive wrapping key via HKDF-SHA-256
            byte[] derivedWrappingKeyBytes = hkdfService.deriveKey(sharedSecret, salt, HKDF_INFO, 32);
            SecretKey wrappingKey = new SecretKeySpec(derivedWrappingKeyBytes, "AES");

            // 5. Serialize plaintext key payload: [AES DEK (32B)] | [Blowfish Key (16B)]
            ByteBuffer payloadBuffer = ByteBuffer.allocate(aesDek.length + blowfishKey.length);
            payloadBuffer.put(aesDek);
            payloadBuffer.put(blowfishKey);

            // 6. Encrypt under wrapping key with AES-GCM
            byte[] aad = "SECURE_STORAGE_KEY_WRAP".getBytes(StandardCharsets.UTF_8);
            byte[] encryptedPayload = aesGcmService.encrypt(payloadBuffer.array(), wrappingKey, aad);

            // 7. Serialize complete key envelope
            byte[] ephPubEncoded = ephemeralKeyPair.getPublic().getEncoded();
            ByteBuffer envelopeBuffer = ByteBuffer.allocate(
                salt.length + 2 + ephPubEncoded.length + encryptedPayload.length
            );
            envelopeBuffer.put(salt);
            envelopeBuffer.putShort((short) ephPubEncoded.length);
            envelopeBuffer.put(ephPubEncoded);
            envelopeBuffer.put(encryptedPayload);

            return envelopeBuffer.array();
        } catch (Exception e) {
            throw new CryptoException("Failed to wrap cryptographic keys for recipient: " + e.getMessage(), e);
        }
    }

    /**
     * Unwraps per-file cryptographic keys using recipient's ECC private key.
     * Returns: Array of two keys: [0] = AES DEK (32 bytes), [1] = Blowfish Key (16 bytes).
     */
    public byte[][] unwrapKeys(byte[] keyEnvelope, PrivateKey recipientPrivateKey) {
        try {
            ByteBuffer buffer = ByteBuffer.wrap(keyEnvelope);

            // 1. Read Salt (32 bytes)
            byte[] salt = new byte[32];
            buffer.get(salt);

            // 2. Read Ephemeral Public Key
            short ephPubLen = buffer.getShort();
            byte[] ephPubEncoded = new byte[ephPubLen];
            buffer.get(ephPubEncoded);
            X509EncodedKeySpec x509Spec = new X509EncodedKeySpec(ephPubEncoded);
            KeyFactory keyFactory = KeyFactory.getInstance(EC_ALGORITHM);
            PublicKey ephemeralPublicKey = keyFactory.generatePublic(x509Spec);

            // 3. Read Encrypted Key Payload
            byte[] encryptedPayload = new byte[buffer.remaining()];
            buffer.get(encryptedPayload);

            // 4. Compute ECDH shared secret Z
            byte[] sharedSecret = computeSharedSecret(recipientPrivateKey, ephemeralPublicKey);

            // 5. Derive wrapping key via HKDF-SHA-256
            byte[] derivedWrappingKeyBytes = hkdfService.deriveKey(sharedSecret, salt, HKDF_INFO, 32);
            SecretKey wrappingKey = new SecretKeySpec(derivedWrappingKeyBytes, "AES");

            // 6. Decrypt payload with AES-GCM
            byte[] aad = "SECURE_STORAGE_KEY_WRAP".getBytes(StandardCharsets.UTF_8);
            byte[] decryptedPayload = aesGcmService.decrypt(encryptedPayload, wrappingKey, aad);

            // 7. Unpack AES DEK (32 bytes) and Blowfish key (16 bytes)
            ByteBuffer payloadBuffer = ByteBuffer.wrap(decryptedPayload);
            byte[] aesDek = new byte[32];
            payloadBuffer.get(aesDek);

            byte[] blowfishKey = new byte[payloadBuffer.remaining()];
            payloadBuffer.get(blowfishKey);

            return new byte[][] { aesDek, blowfishKey };
        } catch (Exception e) {
            throw new CryptoException("Failed to unwrap cryptographic keys: " + e.getMessage(), e);
        }
    }
}
