package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.UUID;

@Service
public class FileCryptoPipelineService {

    private static final Logger log = LoggerFactory.getLogger(FileCryptoPipelineService.class);

    private final Sha256ChecksumService sha256Service;
    private final AesGcmEncryptionService aesGcmService;
    private final BlowfishEncryptionService blowfishService;
    private final EccKeyManagementService eccKeyService;
    private final LsbSteganographyService lsbSteganographyService;

    public FileCryptoPipelineService(
            Sha256ChecksumService sha256Service,
            AesGcmEncryptionService aesGcmService,
            BlowfishEncryptionService blowfishService,
            EccKeyManagementService eccKeyService,
            LsbSteganographyService lsbSteganographyService) {
        this.sha256Service = sha256Service;
        this.aesGcmService = aesGcmService;
        this.blowfishService = blowfishService;
        this.eccKeyService = eccKeyService;
        this.lsbSteganographyService = lsbSteganographyService;
    }

    /**
     * Executes the complete multi-layer encryption pipeline.
     */
    public CryptoPipelineResult encryptFile(
            byte[] originalBytes,
            UUID fileId,
            UUID ownerId,
            PublicKey ownerPublicKey,
            byte[] optionalCarrierPngBytes) {

        if (originalBytes == null || originalBytes.length == 0) {
            throw new CryptoException("Cannot encrypt empty or null file content.");
        }
        if (ownerPublicKey == null) {
            throw new CryptoException("Owner ECC public key is required for cryptographic key wrapping.");
        }

        // Layer 1: SHA-256 Checksum of Plaintext
        String sha256Checksum = sha256Service.calculateChecksum(originalBytes);
        long originalSize = originalBytes.length;

        // Layer 2: AES-256-GCM Authenticated Encryption
        SecretKey aesDek = aesGcmService.generateKey();
        byte[] aad = buildAad(fileId, ownerId);
        byte[] aesCiphertext = aesGcmService.encrypt(originalBytes, aesDek, aad);

        // Layer 3: Blowfish Academic Comparison & Diffusion Layer
        SecretKey blowfishKey = blowfishService.generateKey();
        byte[] doubleEncryptedBytes = blowfishService.encrypt(aesCiphertext, blowfishKey);
        long encryptedSize = doubleEncryptedBytes.length;

        // Layer 4: ECC/ECDH/HKDF Key Wrapping Envelope
        byte[] wrappedKeyEnvelope = eccKeyService.wrapKeysForRecipient(
                aesDek.getEncoded(),
                blowfishKey.getEncoded(),
                ownerPublicKey
        );

        // Layer 5: Spatial LSB Steganographic Concealment in Lossless PNG
        byte[] stegoCarrierPng = lsbSteganographyService.embed(optionalCarrierPngBytes, wrappedKeyEnvelope);

        log.info("Encrypted file {} ({} bytes -> {} bytes) through 5-layer pipeline", fileId, originalSize, encryptedSize);

        return new CryptoPipelineResult(
                doubleEncryptedBytes,
                stegoCarrierPng,
                wrappedKeyEnvelope,
                sha256Checksum,
                originalSize,
                encryptedSize
        );
    }

    /**
     * Executes the reverse multi-layer decryption pipeline.
     */
    public byte[] decryptFile(
            byte[] encryptedFileBytes,
            byte[] stegoCarrierPngBytes,
            byte[] fallbackWrappedEnvelope,
            PrivateKey recipientPrivateKey,
            UUID fileId,
            UUID ownerId,
            String expectedSha256Checksum) {

        if (encryptedFileBytes == null || encryptedFileBytes.length == 0) {
            throw new CryptoException("Encrypted file bytes are null or empty.");
        }
        if (recipientPrivateKey == null) {
            throw new CryptoException("Recipient private key is required for decryption.");
        }

        // Layer 5: Extract Wrapped Key Envelope
        // Layer 4: Unwrap Keys using Recipient's Private Key
        byte[][] unpackedKeys = null;

        // Try unwrapping fallbackWrappedEnvelope first (if this is a shared file)
        if (fallbackWrappedEnvelope != null && fallbackWrappedEnvelope.length > 0) {
            try {
                unpackedKeys = eccKeyService.unwrapKeys(fallbackWrappedEnvelope, recipientPrivateKey);
            } catch (Exception e) {
                log.warn("Failed to unwrap keys from share envelope with provided private key ({}). Attempting steganographic carrier fallback...", e.getMessage());
            }
        }

        // If fallbackWrappedEnvelope was not present or failed to unwrap, extract and unwrap from stego carrier
        if (unpackedKeys == null && stegoCarrierPngBytes != null && stegoCarrierPngBytes.length > 0) {
            try {
                byte[] carrierEnvelope = lsbSteganographyService.extract(stegoCarrierPngBytes);
                if (carrierEnvelope != null && carrierEnvelope.length > 0) {
                    unpackedKeys = eccKeyService.unwrapKeys(carrierEnvelope, recipientPrivateKey);
                }
            } catch (Exception e) {
                log.warn("Steganographic carrier unwrap failed: {}", e.getMessage());
            }
        }

        if (unpackedKeys == null) {
            throw new CryptoException("Failed to unwrap cryptographic keys: Provided ECC private key does not match either the file share envelope or the steganographic carrier.");
        }

        byte[] aesDekBytes = unpackedKeys[0];
        byte[] blowfishKeyBytes = unpackedKeys[1];

        // Layer 3: Reverse Blowfish CBC Layer
        SecretKey blowfishKey = blowfishService.recreateKey(blowfishKeyBytes);
        byte[] aesCiphertext = blowfishService.decrypt(encryptedFileBytes, blowfishKey);

        // Layer 2: Decrypt AES-256-GCM and verify authentication tag
        SecretKey aesDek = aesGcmService.recreateKey(aesDekBytes);
        byte[] aad = buildAad(fileId, ownerId);
        byte[] decryptedPlaintext = aesGcmService.decrypt(aesCiphertext, aesDek, aad);

        // Layer 1: Verify SHA-256 Integrity Hash
        if (expectedSha256Checksum != null && !expectedSha256Checksum.isBlank()) {
            boolean valid = sha256Service.verifyChecksum(decryptedPlaintext, expectedSha256Checksum);
            if (!valid) {
                throw new CryptoException("Critical Integrity Failure: Decrypted data does not match original SHA-256 checksum.");
            }
        }

        return decryptedPlaintext;
    }

    /**
     * Re-wraps keys for a new recipient (for user-to-user file sharing).
     */
    public byte[] rewrapKeysForRecipient(
            byte[] existingWrappedEnvelope,
            PrivateKey ownerPrivateKey,
            PublicKey recipientPublicKey) {

        byte[][] unpackedKeys = eccKeyService.unwrapKeys(existingWrappedEnvelope, ownerPrivateKey);
        return eccKeyService.wrapKeysForRecipient(unpackedKeys[0], unpackedKeys[1], recipientPublicKey);
    }

    private byte[] buildAad(UUID fileId, UUID ownerId) {
        String aadString = "FILE_ID:" + fileId + "|OWNER_ID:" + ownerId;
        return aadString.getBytes(StandardCharsets.UTF_8);
    }
}
