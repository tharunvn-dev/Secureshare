package com.sjcit.securestorage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OtpVerifyRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be exactly 6 digits")
    private String otpCode;

    private String purpose = "LOGIN_MFA"; // REGISTRATION_VERIFICATION, LOGIN_MFA, PASSWORD_RESET

    public OtpVerifyRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}
