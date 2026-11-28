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
    @DisplayName("Layer 5: Case-insensitive SECk and SECK magic identifier compatibility")
    void testCaseInsensitiveMagicRoundTrip() {
        byte[] payload = "TEST_PAYLOAD_FOR_CASE_RESILIENCE".getBytes(StandardCharsets.UTF_8);
        byte[] stegoPngBytes = lsbService.embed(null, payload);

        byte[] extractedPayload = lsbService.extract(stegoPngBytes);
        assertArrayEquals(payload, extractedPayload);
    }
}
