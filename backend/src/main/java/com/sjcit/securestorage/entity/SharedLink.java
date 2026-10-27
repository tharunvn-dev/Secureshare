package com.sjcit.securestorage.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shared_links")
public class SharedLink extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private StoredFile file;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_by_id", nullable = false)
    private User sharedBy;

    @Column(name = "recipient_email", length = 255)
    private String recipientEmail;

    @Column(name = "access_token_hash", nullable = false, unique = true, length = 255)
    private String accessTokenHash;

    @Column(name = "expiry_date", nullable = false)
    private Instant expiryDate;

    @Column(name = "is_one_time", nullable = false)
    private boolean isOneTime = false;

    @Column(name = "access_count", nullable = false)
    private int accessCount = 0;

    @Column(name = "wrapped_key_envelope")
    private byte[] wrappedKeyEnvelope;

    @Column(name = "hkdf_salt")
    private byte[] hkdfSalt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public SharedLink() {
        super();
    }

    public SharedLink(UUID id) {
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

    public boolean isExpired() {
        return Instant.now().isAfter(expiryDate);
    }

    public boolean isConsumed() {
        return isOneTime && accessCount > 0;
    }

    public boolean isAccessible() {
        return !isDeletedFlag() && !isExpired() && !isConsumed();
    }

    // Getters and Setters
    public StoredFile getFile() {
        return file;
    }

    public void setFile(StoredFile file) {
        this.file = file;
    }

    public User getSharedBy() {
        return sharedBy;
    }

    public void setSharedBy(User sharedBy) {
        this.sharedBy = sharedBy;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getAccessTokenHash() {
        return accessTokenHash;
    }

    public void setAccessTokenHash(String accessTokenHash) {
        this.accessTokenHash = accessTokenHash;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Instant expiryDate) {
        this.expiryDate = expiryDate;
    }

    public boolean isOneTime() {
        return isOneTime;
    }

    public void setOneTime(boolean oneTime) {
        isOneTime = oneTime;
    }

    public int getAccessCount() {
        return accessCount;
    }

    public void setAccessCount(int accessCount) {
        this.accessCount = accessCount;
    }

    public byte[] getWrappedKeyEnvelope() {
        return wrappedKeyEnvelope;
    }

    public void setWrappedKeyEnvelope(byte[] wrappedKeyEnvelope) {
        this.wrappedKeyEnvelope = wrappedKeyEnvelope;
    }

    public byte[] getHkdfSalt() {
        return hkdfSalt;
    }

    public void setHkdfSalt(byte[] hkdfSalt) {
        this.hkdfSalt = hkdfSalt;
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
