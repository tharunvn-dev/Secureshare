package com.sjcit.securestorage.storage;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class FileStorageService {

    private final StorageProvider storageProvider;

    public FileStorageService(LocalStorageProvider localStorageProvider) {
        this.storageProvider = localStorageProvider;
    }

    public String storeEncryptedFile(UUID fileId, byte[] encryptedContent) {
        return storageProvider.storeEncryptedFile(fileId, encryptedContent);
    }

    public String storeStegoCarrier(UUID fileId, byte[] carrierContent) {
        return storageProvider.storeStegoCarrier(fileId, carrierContent);
    }

    public byte[] loadEncryptedFile(String storagePath) {
        return storageProvider.loadEncryptedFile(storagePath);
    }

    public byte[] loadStegoCarrier(UUID fileId) {
        return storageProvider.loadStegoCarrier(fileId);
    }

    public void deleteStoredFile(UUID fileId, String storagePath) {
        storageProvider.deleteStoredFile(fileId, storagePath);
    }

    public boolean fileExists(String storagePath) {
        return storageProvider.exists(storagePath);
    }

    public String getProviderId() {
        return storageProvider.getProviderId();
    }
}
