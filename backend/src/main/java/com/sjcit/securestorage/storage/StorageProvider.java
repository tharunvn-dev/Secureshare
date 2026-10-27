package com.sjcit.securestorage.storage;

import java.io.InputStream;
import java.util.UUID;

public interface StorageProvider {

    String getProviderId();

    String storeEncryptedFile(UUID fileId, byte[] encryptedContent);

    String storeStegoCarrier(UUID fileId, byte[] carrierPngContent);

    byte[] loadEncryptedFile(String storagePath);

    byte[] loadStegoCarrier(UUID fileId);

    void deleteStoredFile(UUID fileId, String storagePath);

    boolean exists(String storagePath);
}
