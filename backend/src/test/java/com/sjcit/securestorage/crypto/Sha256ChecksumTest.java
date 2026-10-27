package com.sjcit.securestorage.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class Sha256ChecksumTest {

    private Sha256ChecksumService sha256Service;

    @BeforeEach
    void setUp() {
        sha256Service = new Sha256ChecksumService();
    }

    @Test
    @DisplayName("Layer 1: SHA-256 Checksum Calculation matches known standard test vector")
    void testChecksumKnownVector() {
        // "The quick brown fox jumps over the lazy dog" -> d7a8fbb307d7809469ca9ab0b9b0c607051b478735ddaee594ddb271f2b8d0de
        byte[] input = "The quick brown fox jumps over the lazy dog".getBytes(StandardCharsets.UTF_8);
        String expectedHash = "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592";

        String actualHash = sha256Service.calculateChecksum(input);
        assertEquals(expectedHash, actualHash);
        assertTrue(sha256Service.verifyChecksum(input, expectedHash));
    }

    @Test
    @DisplayName("Layer 1: Tampered data is detected and rejected by SHA-256 verification")
    void testTamperedDataFailsVerification() {
        byte[] original = "Confidential Financial Report 2026".getBytes(StandardCharsets.UTF_8);
        String originalChecksum = sha256Service.calculateChecksum(original);

        byte[] tampered = "Confidential Financial Report 2027".getBytes(StandardCharsets.UTF_8);
        assertFalse(sha256Service.verifyChecksum(tampered, originalChecksum));
    }
}
