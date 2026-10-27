package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

@Service
public class AesGcmEncryptionService {

    public static final String ALGORITHM = "AES";
    public static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    public static final int KEY_SIZE_BITS = 256;
    public static final int GCM_IV_LENGTH_BYTES = 12; // 96 bits
    public static final int GCM_TAG_LENGTH_BITS = 128; // 16 bytes

    private final SecureRandom secureRandom = new SecureRandom();

    public SecretKey generateKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
            keyGen.init(KEY_SIZE_BITS, secureRandom);
            return keyGen.generateKey();
        } catch (NoSuchAlgorithmException e) {
            throw new CryptoException("AES key generator unavailable", e);
        }
    }

    public byte[] encrypt(byte[] plaintext, SecretKey key, byte[] aad) {
        if (plaintext == null || key == null) {
            throw new CryptoException("Plaintext and SecretKey cannot be null");
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);

            if (aad != null && aad.length > 0) {
                cipher.updateAAD(aad);
            }

            byte[] ciphertextWithTag = cipher.doFinal(plaintext);

            // Prepend IV to ciphertext
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertextWithTag.length);
            buffer.put(iv);
            buffer.put(ciphertextWithTag);
            return buffer.array();
        } catch (Exception e) {
            throw new CryptoException("AES-GCM encryption failed: " + e.getMessage(), e);
        }
    }

    public byte[] decrypt(byte[] encryptedData, SecretKey key, byte[] aad) {
        if (encryptedData == null || key == null) {
            throw new CryptoException("Encrypted data and SecretKey cannot be null");
        }
        if (encryptedData.length < GCM_IV_LENGTH_BYTES + (GCM_TAG_LENGTH_BITS / 8)) {
            throw new CryptoException("Ciphertext length is too short for AES-GCM envelope");
        }
        try {
            ByteBuffer buffer = ByteBuffer.wrap(encryptedData);
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            buffer.get(iv);

            byte[] ciphertextWithTag = new byte[buffer.remaining()];
            buffer.get(ciphertextWithTag);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

            if (aad != null && aad.length > 0) {
                cipher.updateAAD(aad);
            }

            return cipher.doFinal(ciphertextWithTag);
        } catch (javax.crypto.AEADBadTagException e) {
            throw new CryptoException("AES-GCM authentication tag verification failed. Data is corrupted or tampered with.", e);
        } catch (Exception e) {
            throw new CryptoException("AES-GCM decryption failed: " + e.getMessage(), e);
        }
    }

    public SecretKey recreateKey(byte[] rawKeyBytes) {
        if (rawKeyBytes == null || rawKeyBytes.length != 32) {
            throw new CryptoException("AES-256 key must be exactly 32 bytes");
        }
        return new SecretKeySpec(rawKeyBytes, ALGORITHM);
    }
}
