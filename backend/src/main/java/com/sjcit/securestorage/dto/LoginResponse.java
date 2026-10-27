package com.sjcit.securestorage.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {

    private boolean mfaRequired;
    private String email;
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresInMs;
    private UserProfileResponse user;
    private String message;
    private String devOtp;

    public LoginResponse() {
    }

    public static LoginResponse mfaRequired(String email, String message) {
        return mfaRequired(email, message, null);
    }

    public static LoginResponse mfaRequired(String email, String message, String devOtp) {
        LoginResponse resp = new LoginResponse();
        resp.setMfaRequired(true);
        resp.setEmail(email);
        resp.setMessage(message != null ? message : "Verification code sent to your registered email address.");
        resp.setDevOtp(devOtp);
        return resp;
    }

    public static LoginResponse success(String accessToken, String refreshToken, long expiresInMs, UserProfileResponse user) {
        LoginResponse resp = new LoginResponse();
        resp.setMfaRequired(false);
        resp.setAccessToken(accessToken);
        resp.setRefreshToken(refreshToken);
        resp.setExpiresInMs(expiresInMs);
        resp.setUser(user);
        resp.setMessage("Authentication successful");
        return resp;
    }

    public boolean isMfaRequired() {
        return mfaRequired;
    }

    public void setMfaRequired(boolean mfaRequired) {
        this.mfaRequired = mfaRequired;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresInMs() {
        return expiresInMs;
    }

    public void setExpiresInMs(long expiresInMs) {
        this.expiresInMs = expiresInMs;
    }

    public UserProfileResponse getUser() {
        return user;
    }

    public void setUser(UserProfileResponse user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDevOtp() {
        return devOtp;
    }

    public void setDevOtp(String devOtp) {
        this.devOtp = devOtp;
    }
}
