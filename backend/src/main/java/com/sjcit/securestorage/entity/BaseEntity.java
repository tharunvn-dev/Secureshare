package com.sjcit.securestorage.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@MappedSuperclass
public abstract class BaseEntity implements Serializable {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Long version = 0L;

    @Column(name = "deleted_flag", nullable = false)
    private boolean deletedFlag = false;

    public BaseEntity() {
        this.id = UUID.randomUUID();
    }

    public BaseEntity(UUID id) {
        this.id = id != null ? id : UUID.randomUUID();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public boolean isDeletedFlag() {
        return deletedFlag;
    }

    public void setDeletedFlag(boolean deletedFlag) {
        this.deletedFlag = deletedFlag;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BaseEntity that = (BaseEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
