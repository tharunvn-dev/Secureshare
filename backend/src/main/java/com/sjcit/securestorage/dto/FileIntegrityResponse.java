package com.sjcit.securestorage.dto;

import java.time.Instant;
import java.util.UUID;

public class FileIntegrityResponse {

    private UUID fileId;
    private String originalFilename;
    private String expectedSha256Checksum;
    private String calculatedSha256Checksum;
    private boolean integrityValid;
    private Instant verifiedAt;
    private String statusMessage;

    public FileIntegrityResponse() {
        this.verifiedAt = Instant.now();
    }

    public FileIntegrityResponse(
            UUID fileId,
            String originalFilename,
            String expectedSha256Checksum,
            String calculatedSha256Checksum,
            boolean integrityValid) {
        this.fileId = fileId;
        this.originalFilename = originalFilename;
        this.expectedSha256Checksum = expectedSha256Checksum;
        this.calculatedSha256Checksum = calculatedSha256Checksum;
        this.integrityValid = integrityValid;
        this.verifiedAt = Instant.now();
        this.statusMessage = integrityValid 
            ? "Integrity Verified: SHA-256 hash matches original file exactly."
            : "Integrity Violation: Hash mismatch detected. File may have been corrupted or modified.";
    }

    public UUID getFileId() {
        return fileId;
    }

    public void setFileId(UUID fileId) {
        this.fileId = fileId;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getExpectedSha256Checksum() {
        return expectedSha256Checksum;
    }

    public void setExpectedSha256Checksum(String expectedSha256Checksum) {
        this.expectedSha256Checksum = expectedSha256Checksum;
    }

    public String getCalculatedSha256Checksum() {
        return calculatedSha256Checksum;
    }

    public void setCalculatedSha256Checksum(String calculatedSha256Checksum) {
        this.calculatedSha256Checksum = calculatedSha256Checksum;
    }

    public boolean isIntegrityValid() {
        return integrityValid;
    }

    public void setIntegrityValid(boolean integrityValid) {
        this.integrityValid = integrityValid;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
}
