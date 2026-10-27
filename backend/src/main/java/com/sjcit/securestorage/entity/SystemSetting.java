package com.sjcit.securestorage.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_settings")
public class SystemSetting implements Serializable {

    @Id
    @Column(name = "key", nullable = false, length = 100)
    private String key;

    @Column(name = "value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by")
    private UUID updatedBy;

    public SystemSetting() {
    }

    public SystemSetting(String key, String value, String description, UUID updatedBy) {
        this.key = key;
        this.value = value;
        this.description = description;
        this.updatedAt = Instant.now();
        this.updatedBy = updatedBy;
    }

    // Getters and Setters
    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }
}
