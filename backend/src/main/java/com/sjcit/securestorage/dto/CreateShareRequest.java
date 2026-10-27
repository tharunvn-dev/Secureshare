package com.sjcit.securestorage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class CreateShareRequest {

    @NotNull(message = "File ID is required")
    private UUID fileId;

    @NotBlank(message = "Recipient email is required")
    @Email(message = "Valid recipient email is required")
    private String recipientEmail;

    public CreateShareRequest() {
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
}
