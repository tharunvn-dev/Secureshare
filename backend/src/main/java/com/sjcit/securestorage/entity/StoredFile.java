package com.sjcit.securestorage.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stored_files")
public class StoredFile extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "original_size", nullable = false)
    private Long originalSize;

    @Column(name = "encrypted_size", nullable = false)
    private Long encryptedSize;

    @Column(name = "sha256_checksum", nullable = false, length = 64)
    private String sha256Checksum;

    @Column(name = "storage_provider_id", nullable = false, length = 100)
    private String storageProviderId = "local";

    @Column(name = "crypto_profile_version", nullable = false, length = 20)
    private String cryptoProfileVersion = "v1";

    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    private String storagePath;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public StoredFile() {
        super();
    }

    public StoredFile(UUID id) {
        super(id);
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    public void onPreUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
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

    public Long getOriginalSize() {
        return originalSize;
    }

    public void setOriginalSize(Long originalSize) {
        this.originalSize = originalSize;
    }

    public Long getEncryptedSize() {
        return encryptedSize;
    }

    public void setEncryptedSize(Long encryptedSize) {
        this.encryptedSize = encryptedSize;
    }

    public String getSha256Checksum() {
        return sha256Checksum;
    }

    public void setSha256Checksum(String sha256Checksum) {
        this.sha256Checksum = sha256Checksum;
    }

    public String getStorageProviderId() {
        return storageProviderId;
    }

    public void setStorageProviderId(String storageProviderId) {
        this.storageProviderId = storageProviderId;
    }

    public String getCryptoProfileVersion() {
        return cryptoProfileVersion;
    }

    public void setCryptoProfileVersion(String cryptoProfileVersion) {
        this.cryptoProfileVersion = cryptoProfileVersion;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
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
}
