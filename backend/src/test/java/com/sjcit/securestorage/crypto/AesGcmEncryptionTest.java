package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class AesGcmEncryptionTest {

    private AesGcmEncryptionService aesGcmService;

    @BeforeEach
    void setUp() {
        aesGcmService = new AesGcmEncryptionService();
    }

    @Test
    @DisplayName("Layer 2: AES-256-GCM Round-trip Encryption and Decryption")
    void testAesGcmRoundTrip() {
        byte[] plaintext = "Sensitive Student Records - Major Project 2026".getBytes(StandardCharsets.UTF_8);
        byte[] aad = "FILE_METADATA_HEADER".getBytes(StandardCharsets.UTF_8);

        SecretKey key = aesGcmService.generateKey();
        byte[] ciphertext = aesGcmService.encrypt(plaintext, key, aad);

        assertNotNull(ciphertext);
        assertFalse(Arrays.equals(plaintext, ciphertext));

        byte[] decrypted = aesGcmService.decrypt(ciphertext, key, aad);
        assertArrayEquals(plaintext, decrypted);
    }

    @Test
    @DisplayName("Layer 2: Unique IV generated on every encryption call under same key")
    void testUniqueIvPerCall() {
        byte[] plaintext = "Repeated Plaintext Message".getBytes(StandardCharsets.UTF_8);
        byte[] aad = "AAD".getBytes(StandardCharsets.UTF_8);

        SecretKey key = aesGcmService.generateKey();
        byte[] ciphertext1 = aesGcmService.encrypt(plaintext, key, aad);
        byte[] ciphertext2 = aesGcmService.encrypt(plaintext, key, aad);

        assertFalse(Arrays.equals(ciphertext1, ciphertext2), "Ciphertexts must differ due to unique IV generation");
    }

    @Test
    @DisplayName("Layer 2: Tampered ciphertext or authentication tag fails safe")
    void testTamperedCiphertextFails() {
        byte[] plaintext = "Integrity Sensitive Data".getBytes(StandardCharsets.UTF_8);
        byte[] aad = "AAD".getBytes(StandardCharsets.UTF_8);

        SecretKey key = aesGcmService.generateKey();
        byte[] ciphertext = aesGcmService.encrypt(plaintext, key, aad);

        // Tamper with one byte in the ciphertext payload
        ciphertext[ciphertext.length - 1] ^= 0x55;

        assertThrows(CryptoException.class, () -> aesGcmService.decrypt(ciphertext, key, aad));
    }

    @Test
    @DisplayName("Layer 2: Additional Authenticated Data (AAD) mismatch fails decryption")
    void testAadMismatchFails() {
        byte[] plaintext = "Payload with AAD binding".getBytes(StandardCharsets.UTF_8);
        byte[] originalAad = "USER_ID_1001".getBytes(StandardCharsets.UTF_8);
        byte[] forgedAad = "USER_ID_1002".getBytes(StandardCharsets.UTF_8);

        SecretKey key = aesGcmService.generateKey();
        byte[] ciphertext = aesGcmService.encrypt(plaintext, key, originalAad);

        assertThrows(CryptoException.class, () -> aesGcmService.decrypt(ciphertext, key, forgedAad));
    }
}
