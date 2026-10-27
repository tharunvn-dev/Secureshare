package com.sjcit.securestorage.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "otp_sessions")
public class OtpSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "otp_code_hash", nullable = false, length = 255)
    private String otpCodeHash;

    @Column(name = "purpose", nullable = false, length = 100)
    private String purpose; // REGISTRATION_VERIFICATION, LOGIN_MFA, PASSWORD_RESET

    @Column(name = "expiry_date", nullable = false)
    private Instant expiryDate;

    @Column(name = "verified", nullable = false)
    private boolean verified = false;

    public OtpSession() {
        super();
    }

    public OtpSession(UUID id) {
        super(id);
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiryDate);
    }

    public boolean isValid() {
        return !isDeletedFlag() && !verified && !isExpired();
    }

    // Getters and Setters
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getOtpCodeHash() {
        return otpCodeHash;
    }

    public void setOtpCodeHash(String otpCodeHash) {
        this.otpCodeHash = otpCodeHash;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Instant expiryDate) {
        this.expiryDate = expiryDate;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }
}
