package com.sjcit.securestorage.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class CreateSharedLinkRequest {

    @NotNull(message = "File ID is required")
    private UUID fileId;

    private String recipientEmail;

    @Min(value = 1, message = "Expiry must be at least 1 day")
    @Max(value = 30, message = "Expiry cannot exceed 30 days")
    private int expiryDays = 7;

    private boolean isOneTime = false;

    public CreateSharedLinkRequest() {
    }

    public UUID getFileId() {
        return fileId;
    }

    public void setFileId(UUID fileId) {
        this.fileId = fileId;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public int getExpiryDays() {
        return expiryDays;
    }

    public void setExpiryDays(int expiryDays) {
        this.expiryDays = expiryDays;
    }

    public boolean isOneTime() {
        return isOneTime;
    }

    public void setOneTime(boolean oneTime) {
        isOneTime = oneTime;
    }
}
