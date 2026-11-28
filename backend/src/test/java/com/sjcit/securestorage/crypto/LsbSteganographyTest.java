package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class LsbSteganographyTest {

    private LsbSteganographyService lsbService;

    @BeforeEach
    void setUp() {
        lsbService = new LsbSteganographyService();
    }

    @Test
    @DisplayName("Layer 5: LSB PNG Steganography Embedding and Extraction Round-trip")
    void testStegoRoundTrip() {
        byte[] payload = "WRAPPED_KEY_ENVELOPE_DATA_BYTES_TEST_VECTOR".getBytes(StandardCharsets.UTF_8);

        // Auto-generates carrier image
        byte[] stegoPngBytes = lsbService.embed(null, payload);
        assertNotNull(stegoPngBytes);
        assertTrue(stegoPngBytes.length > 0);

        byte[] extractedPayload = lsbService.extract(stegoPngBytes);
        assertArrayEquals(payload, extractedPayload);
    }

    @Test
    @DisplayName("Inspect real frontend stego file pixels")
    void testRealStegoFile() throws Exception {
        java.io.File f = new java.io.File("C:\\Users\\tarun\\Downloads\\pri.png");
        if (f.exists()) {
            byte[] bytes = java.nio.file.Files.readAllBytes(f.toPath());
            byte[] extracted = lsbService.extract(bytes);
            System.out.println("SUCCESSFULLY EXTRACTED KEY FROM SCREENSHOT 30: " + new String(extracted, java.nio.charset.StandardCharsets.UTF_8));
            assertNotNull(extracted);
        }
    }
}
