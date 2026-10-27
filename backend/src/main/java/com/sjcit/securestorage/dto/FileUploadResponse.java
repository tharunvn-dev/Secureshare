package com.sjcit.securestorage.dto;

import java.time.Instant;
import java.util.UUID;

public class FileUploadResponse {

    private UUID id;
    private String originalFilename;
    private long originalSize;
    private long encryptedSize;
    private String sha256Checksum;
    private Instant createdAt;
    private String message;

    public FileUploadResponse() {
    }

    public FileUploadResponse(UUID id, String originalFilename, long originalSize, long encryptedSize, String sha256Checksum, Instant createdAt) {
        this.id = id;
        this.originalFilename = originalFilename;
        this.originalSize = originalSize;
        this.encryptedSize = encryptedSize;
        this.sha256Checksum = sha256Checksum;
        this.createdAt = createdAt;
        this.message = "File encrypted and stored successfully with 5-layer security.";
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public long getOriginalSize() {
        return originalSize;
    }

    public void setOriginalSize(long originalSize) {
        this.originalSize = originalSize;
    }

    public long getEncryptedSize() {
        return encryptedSize;
    }

    public void setEncryptedSize(long encryptedSize) {
        this.encryptedSize = encryptedSize;
    }

    public String getSha256Checksum() {
        return sha256Checksum;
    }

    public void setSha256Checksum(String sha256Checksum) {
        this.sha256Checksum = sha256Checksum;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
