package com.sjcit.securestorage.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class BlowfishEncryptionTest {

    private BlowfishEncryptionService blowfishService;

    @BeforeEach
    void setUp() {
        blowfishService = new BlowfishEncryptionService();
    }

    @Test
    @DisplayName("Layer 3: Blowfish CBC Round-trip Encryption and Decryption")
    void testBlowfishRoundTrip() {
        byte[] plaintext = "Secondary Diffusion Layer Payload via Blowfish-CBC".getBytes(StandardCharsets.UTF_8);

        SecretKey key = blowfishService.generateKey();
        byte[] ciphertext = blowfishService.encrypt(plaintext, key);

        assertNotNull(ciphertext);
        assertFalse(Arrays.equals(plaintext, ciphertext));

        byte[] decrypted = blowfishService.decrypt(ciphertext, key);
        assertArrayEquals(plaintext, decrypted);
    }
}
