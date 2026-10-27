package com.sjcit.securestorage.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_outbox")
public class EmailOutbox implements Serializable {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @Column(name = "recipient", nullable = false, length = 255)
    private String recipient;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    @Column(name = "body_html", columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "PENDING"; // PENDING, SENT, FAILED

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "sent_at")
    private Instant sentAt;

    public EmailOutbox() {
    }

    public EmailOutbox(String recipient, String subject, String bodyText, String bodyHtml) {
        this.id = UUID.randomUUID();
        this.recipient = recipient;
        this.subject = subject;
        this.bodyText = bodyText;
        this.bodyHtml = bodyHtml;
        this.status = "PENDING";
        this.attemptCount = 0;
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBodyText() {
        return bodyText;
    }

    public void setBodyText(String bodyText) {
        this.bodyText = bodyText;
    }

    public String getBodyHtml() {
        return bodyHtml;
    }

    public void setBodyHtml(String bodyHtml) {
        this.bodyHtml = bodyHtml;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(int attemptCount) {
        this.attemptCount = attemptCount;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }
}
