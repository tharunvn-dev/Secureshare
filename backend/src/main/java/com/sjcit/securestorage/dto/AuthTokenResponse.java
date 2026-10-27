package com.sjcit.securestorage.dto;

public class AuthTokenResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresInMs;

    public AuthTokenResponse() {
    }

    public AuthTokenResponse(String accessToken, String refreshToken, long expiresInMs) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresInMs = expiresInMs;
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
}
