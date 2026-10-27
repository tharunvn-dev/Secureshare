package com.sjcit.securestorage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateUserStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(ACTIVE|SUSPENDED|PENDING)$", message = "Status must be ACTIVE, SUSPENDED, or PENDING")
    private String status;

    public UpdateUserStatusRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
