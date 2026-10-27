package com.sjcit.securestorage.storage;

import com.sjcit.securestorage.exception.CryptoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Component
public class LocalStorageProvider implements StorageProvider {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageProvider.class);
    public static final String PROVIDER_ID = "local";

    private final Path baseStoragePath;

    public LocalStorageProvider(@Value("${app.storage.local-directory:./storage}") String storageDir) {
        this.baseStoragePath = Paths.get(storageDir).toAbsolutePath().normalize();
        try {
            if (!Files.exists(baseStoragePath)) {
                Files.createDirectories(baseStoragePath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize local encrypted storage directory: " + baseStoragePath, e);
        }
    }

    @Override
    public String getProviderId() {
        return PROVIDER_ID;
    }

    @Override
    public String storeEncryptedFile(UUID fileId, byte[] encryptedContent) {
        validateFileId(fileId);
        String relativeFilename = fileId.toString() + ".enc";
        Path targetPath = resolveAndValidate(relativeFilename);
        try {
            Files.write(targetPath, encryptedContent, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return relativeFilename;
        } catch (IOException e) {
            throw new CryptoException("Failed to store encrypted file on local storage: " + e.getMessage(), e);
        }
    }

    @Override
    public String storeStegoCarrier(UUID fileId, byte[] carrierPngContent) {
        validateFileId(fileId);
        String relativeFilename = fileId.toString() + ".stego.png";
        Path targetPath = resolveAndValidate(relativeFilename);
        try {
            Files.write(targetPath, carrierPngContent, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return relativeFilename;
        } catch (IOException e) {
            throw new CryptoException("Failed to store steganographic carrier on local storage: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] loadEncryptedFile(String storagePath) {
        Path targetPath = resolveAndValidate(storagePath);
        if (!Files.exists(targetPath)) {
            throw new CryptoException("Stored encrypted file not found on disk: " + storagePath);
        }
        try {
            return Files.readAllBytes(targetPath);
        } catch (IOException e) {
            throw new CryptoException("Failed to read encrypted file from storage: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] loadStegoCarrier(UUID fileId) {
        validateFileId(fileId);
        String relativeFilename = fileId.toString() + ".stego.png";
        Path targetPath = resolveAndValidate(relativeFilename);
        if (!Files.exists(targetPath)) {
            return null;
        }
        try {
            return Files.readAllBytes(targetPath);
        } catch (IOException e) {
            log.warn("Failed to read stego carrier for {}: {}", fileId, e.getMessage());
            return null;
        }
    }

    @Override
    public void deleteStoredFile(UUID fileId, String storagePath) {
        if (storagePath != null && !storagePath.isBlank()) {
            try {
                Path targetPath = resolveAndValidate(storagePath);
                Files.deleteIfExists(targetPath);
            } catch (Exception e) {
                log.warn("Error deleting encrypted file: {}", e.getMessage());
            }
        }
        if (fileId != null) {
            try {
                Path stegoPath = resolveAndValidate(fileId.toString() + ".stego.png");
                Files.deleteIfExists(stegoPath);
            } catch (Exception e) {
                log.warn("Error deleting stego carrier: {}", e.getMessage());
            }
        }
    }

    @Override
    public boolean exists(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return false;
        Path targetPath = resolveAndValidate(storagePath);
        return Files.exists(targetPath);
    }

    private Path resolveAndValidate(String relativePath) {
        Path resolved = baseStoragePath.resolve(relativePath).normalize();
        if (!resolved.startsWith(baseStoragePath)) {
            throw new CryptoException("Security Violation: Path traversal attempt detected!");
        }
        return resolved;
    }

    private void validateFileId(UUID fileId) {
        if (fileId == null) {
            throw new CryptoException("File ID cannot be null.");
        }
    }
}
