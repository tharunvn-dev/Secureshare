package com.sjcit.securestorage.crypto;

public class CryptoPipelineResult {

    private byte[] encryptedFileBytes;
    private byte[] stegoCarrierPngBytes;
    private byte[] wrappedKeyEnvelope;
    private String sha256Checksum;
    private long originalSize;
    private long encryptedSize;

    public CryptoPipelineResult(
            byte[] encryptedFileBytes,
            byte[] stegoCarrierPngBytes,
            byte[] wrappedKeyEnvelope,
            String sha256Checksum,
            long originalSize,
            long encryptedSize) {
        this.encryptedFileBytes = encryptedFileBytes;
        this.stegoCarrierPngBytes = stegoCarrierPngBytes;
        this.wrappedKeyEnvelope = wrappedKeyEnvelope;
        this.sha256Checksum = sha256Checksum;
        this.originalSize = originalSize;
        this.encryptedSize = encryptedSize;
    }

    public byte[] getEncryptedFileBytes() {
        return encryptedFileBytes;
    }

    public byte[] getStegoCarrierPngBytes() {
        return stegoCarrierPngBytes;
    }

    public byte[] getWrappedKeyEnvelope() {
        return wrappedKeyEnvelope;
    }

    public String getSha256Checksum() {
        return sha256Checksum;
    }

    public long getOriginalSize() {
        return originalSize;
    }

    public long getEncryptedSize() {
        return encryptedSize;
    }
}
