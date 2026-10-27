package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class FileCryptoPipelineTest {

    private FileCryptoPipelineService pipelineService;
    private EccKeyManagementService eccKeyService;

    @BeforeEach
    void setUp() {
        Sha256ChecksumService sha256Service = new Sha256ChecksumService();
        AesGcmEncryptionService aesGcmService = new AesGcmEncryptionService();
        BlowfishEncryptionService blowfishService = new BlowfishEncryptionService();
        HkdfService hkdfService = new HkdfService();
        eccKeyService = new EccKeyManagementService(hkdfService, aesGcmService);
        LsbSteganographyService lsbService = new LsbSteganographyService();

        pipelineService = new FileCryptoPipelineService(
                sha256Service,
                aesGcmService,
                blowfishService,
                eccKeyService,
                lsbService
        );
    }

    @Test
    @DisplayName("End-to-End 5-Layer Cryptographic Pipeline: Encryption -> Concealment -> Extraction -> Decryption")
    void testFullPipelineRoundTrip() {
        byte[] originalContent = "Confidential Final Year BE Project Source Document\nSJCIT CSE 2026\nMulti-Layer Security".getBytes(StandardCharsets.UTF_8);
        UUID fileId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        // 1. Owner generates ECC key pair
        KeyPair ownerKeyPair = eccKeyService.generateKeyPair();

        // 2. Encrypt through 5-Layer Pipeline
        CryptoPipelineResult result = pipelineService.encryptFile(
                originalContent,
                fileId,
                ownerId,
                ownerKeyPair.getPublic(),
                null // Auto-generates carrier PNG
        );

        assertNotNull(result);
        assertNotNull(result.getEncryptedFileBytes());
        assertNotNull(result.getStegoCarrierPngBytes());
        assertNotNull(result.getSha256Checksum());
        assertNotEquals(new String(originalContent), new String(result.getEncryptedFileBytes()));

        // 3. Decrypt through Reverse Pipeline using Owner's Private Key
        byte[] decryptedContent = pipelineService.decryptFile(
                result.getEncryptedFileBytes(),
                result.getStegoCarrierPngBytes(),
                null,
                ownerKeyPair.getPrivate(),
                fileId,
                ownerId,
                result.getSha256Checksum()
        );

        assertArrayEquals(originalContent, decryptedContent);
    }

    @Test
    @DisplayName("Tampered Encrypted File fails safe and releases zero plaintext")
    void testTamperedFileFailsSafe() {
        byte[] originalContent = "Original authentic plaintext file".getBytes(StandardCharsets.UTF_8);
        UUID fileId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        KeyPair ownerKeyPair = eccKeyService.generateKeyPair();

        CryptoPipelineResult result = pipelineService.encryptFile(
                originalContent,
                fileId,
                ownerId,
                ownerKeyPair.getPublic(),
                null
        );

        // Tamper with encrypted bytes
        byte[] tamperedBytes = result.getEncryptedFileBytes().clone();
        tamperedBytes[tamperedBytes.length - 2] ^= 0x44;

        assertThrows(CryptoException.class, () -> pipelineService.decryptFile(
                tamperedBytes,
                result.getStegoCarrierPngBytes(),
                null,
                ownerKeyPair.getPrivate(),
                fileId,
                ownerId,
                result.getSha256Checksum()
        ));
    }
}
