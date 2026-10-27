package com.sjcit.securestorage.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "type", nullable = false, length = 100)
    private String type; // SHARE_RECEIVED, SHARE_REVOKED, SECURITY_ALERT, FILE_UPLOAD, SYSTEM

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "read_status", nullable = false)
    private boolean readStatus = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Notification() {
        super();
    }

    public Notification(UUID id) {
        super(id);
    }

    public Notification(User user, String type, String title, String message) {
        super();
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.readStatus = false;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    // Getters and Setters
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isReadStatus() {
        return readStatus;
    }

    public void setReadStatus(boolean readStatus) {
        this.readStatus = readStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
