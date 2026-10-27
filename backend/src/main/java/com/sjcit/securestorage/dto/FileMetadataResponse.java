package com.sjcit.securestorage.dto;

import java.time.Instant;
import java.util.UUID;

public class FileMetadataResponse {

    private UUID id;
    private String originalFilename;
    private String mimeType;
    private long originalSize;
    private long encryptedSize;
    private String sha256Checksum;
    private String cryptoProfileVersion;
    private Instant createdAt;
    private Instant updatedAt;
    private String ownerEmail;
    private String ownerName;
    private boolean isOwner;

    public FileMetadataResponse() {
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

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
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

    public String getCryptoProfileVersion() {
        return cryptoProfileVersion;
    }

    public void setCryptoProfileVersion(String cryptoProfileVersion) {
        this.cryptoProfileVersion = cryptoProfileVersion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public boolean isOwner() {
        return isOwner;
    }

    public void setOwner(boolean owner) {
        isOwner = owner;
    }
}
