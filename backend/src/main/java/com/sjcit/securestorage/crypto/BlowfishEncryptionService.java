package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

/**
 * Layer 3: Blowfish Academic Comparison & Diffusion Layer.
 *
 * <p><strong>Academic & Cryptographic Note:</strong> Blowfish is a symmetric block cipher designed
 * by Bruce Schneier in 1993 with a 64-bit (8-byte) block size and variable key length (32-448 bits).
 * In modern cryptographic engineering, 64-bit block ciphers are susceptible to collision attacks
 * (Sweet32 / birthday paradox) when encrypting more than 2^32 blocks (approx. 32 GB of data) under
 * a single key. In this framework, Blowfish is utilized as an inner academic diffusion layer
 * evaluated against AES-256-GCM. An independent 128-bit sub-key is generated specifically for Blowfish,
 * ensuring strict isolation from the primary AES key.</p>
 */
@Service
public class BlowfishEncryptionService {

    private static final Logger log = LoggerFactory.getLogger(BlowfishEncryptionService.class);

    public static final String ALGORITHM = "Blowfish";
    public static final String CIPHER_TRANSFORMATION = "Blowfish/CBC/PKCS5Padding";
    public static final int KEY_SIZE_BITS = 128;
    public static final int BLOWFISH_IV_LENGTH_BYTES = 8; // 64-bit block size

    private final SecureRandom secureRandom = new SecureRandom();

    public SecretKey generateKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
            keyGen.init(KEY_SIZE_BITS, secureRandom);
            return keyGen.generateKey();
        } catch (NoSuchAlgorithmException e) {
            throw new CryptoException("Blowfish key generator unavailable in runtime environment", e);
        }
    }

    public byte[] encrypt(byte[] plaintext, SecretKey key) {
        if (plaintext == null || key == null) {
            throw new CryptoException("Plaintext and Blowfish key cannot be null");
        }
        try {
            byte[] iv = new byte[BLOWFISH_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);

            byte[] ciphertext = cipher.doFinal(plaintext);

            // Prepend 8-byte IV to ciphertext
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return buffer.array();
        } catch (Exception e) {
            throw new CryptoException("Blowfish encryption failed: " + e.getMessage(), e);
        }
    }

    public byte[] decrypt(byte[] encryptedData, SecretKey key) {
        if (encryptedData == null || key == null) {
            throw new CryptoException("Encrypted data and Blowfish key cannot be null");
        }
        if (encryptedData.length < BLOWFISH_IV_LENGTH_BYTES + 8) {
            throw new CryptoException("Data is too short for valid Blowfish CBC envelope");
        }
        try {
            ByteBuffer buffer = ByteBuffer.wrap(encryptedData);
            byte[] iv = new byte[BLOWFISH_IV_LENGTH_BYTES];
            buffer.get(iv);

            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.DECRYPT_MODE, key, ivSpec);

            return cipher.doFinal(ciphertext);
        } catch (Exception e) {
            throw new CryptoException("Blowfish decryption failed: " + e.getMessage(), e);
        }
    }

    public SecretKey recreateKey(byte[] rawKeyBytes) {
        if (rawKeyBytes == null || rawKeyBytes.length < 16) {
            throw new CryptoException("Blowfish key must be at least 16 bytes (128 bits)");
        }
        return new SecretKeySpec(rawKeyBytes, ALGORITHM);
    }
}
