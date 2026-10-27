package com.sjcit.securestorage.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "file_shares")
public class FileShare extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private StoredFile file;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(name = "wrapped_key_envelope", nullable = false)
    private byte[] wrappedKeyEnvelope;

    @Column(name = "hkdf_salt", nullable = false)
    private byte[] hkdfSalt;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, REVOKED, EXPIRED

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public FileShare() {
        super();
    }

    public FileShare(UUID id) {
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
    public StoredFile getFile() {
        return file;
    }

    public void setFile(StoredFile file) {
        this.file = file;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
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
