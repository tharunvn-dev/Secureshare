package com.sjcit.securestorage.dto;

import jakarta.validation.constraints.NotBlank;

public class SupabaseAuthRequest {

    @NotBlank(message = "Supabase access token is required")
    private String accessToken;

    private String publicKeyEcc;

    public SupabaseAuthRequest() {
    }

    public SupabaseAuthRequest(String accessToken, String publicKeyEcc) {
        this.accessToken = accessToken;
        this.publicKeyEcc = publicKeyEcc;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getPublicKeyEcc() {
        return publicKeyEcc;
    }

    public void setPublicKeyEcc(String publicKeyEcc) {
        this.publicKeyEcc = publicKeyEcc;
    }
}
