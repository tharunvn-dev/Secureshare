package com.sjcit.securestorage.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.KeyPair;
import java.util.Random;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class BenchmarkTest {

    private static final Logger log = LoggerFactory.getLogger(BenchmarkTest.class);

    private FileCryptoPipelineService pipelineService;
    private EccKeyManagementService eccKeyService;
    private Sha256ChecksumService sha256Service;

    @BeforeEach
    void setUp() {
        sha256Service = new Sha256ChecksumService();
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
    @DisplayName("Performance Benchmark: Multi-layer Encryption & Decryption Latency and Throughput")
    void runPerformanceBenchmark() {
        int[] testSizesBytes = new int[] { 64 * 1024, 256 * 1024, 1024 * 1024 }; // 64KB, 256KB, 1MB
        Random random = new Random(42);
        KeyPair keyPair = eccKeyService.generateKeyPair();

        System.out.println("===============================================================================");
        System.out.println("  ACADEMIC PERFORMANCE BENCHMARK RESULTS (Java 25 LTS, Windows 11)");
        System.out.println("===============================================================================");
        System.out.printf("%-12s | %-15s | %-15s | %-15s%n", "File Size", "Encrypt (ms)", "Decrypt (ms)", "Throughput (MB/s)");
        System.out.println("-------------------------------------------------------------------------------");

        for (int size : testSizesBytes) {
            byte[] data = new byte[size];
            random.nextBytes(data);

            UUID fileId = UUID.randomUUID();
            UUID ownerId = UUID.randomUUID();

            // Measure Encryption
            long startEncrypt = System.nanoTime();
            CryptoPipelineResult result = pipelineService.encryptFile(
                    data, fileId, ownerId, keyPair.getPublic(), null
            );
            long encryptDurationNs = System.nanoTime() - startEncrypt;
            double encryptMs = encryptDurationNs / 1_000_000.0;

            // Measure Decryption
            long startDecrypt = System.nanoTime();
            byte[] decrypted = pipelineService.decryptFile(
                    result.getEncryptedFileBytes(),
                    result.getStegoCarrierPngBytes(),
                    null,
                    keyPair.getPrivate(),
                    fileId,
                    ownerId,
                    result.getSha256Checksum()
            );
            long decryptDurationNs = System.nanoTime() - startDecrypt;
            double decryptMs = decryptDurationNs / 1_000_000.0;

            assertArrayEquals(data, decrypted);

            double totalSeconds = (encryptDurationNs + decryptDurationNs) / 1_000_000_000.0;
            double sizeMb = (double) size / (1024 * 1024);
            double throughputMbPerSec = (sizeMb * 2) / totalSeconds;

            System.out.printf("%-12s | %-15.2f | %-15.2f | %-15.2f%n",
                    formatSize(size), encryptMs, decryptMs, throughputMbPerSec);
        }
        System.out.println("===============================================================================");
    }

    private String formatSize(long bytes) {
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)) + " MB";
        if (bytes >= 1024) return (bytes / 1024) + " KB";
        return bytes + " B";
    }
}
