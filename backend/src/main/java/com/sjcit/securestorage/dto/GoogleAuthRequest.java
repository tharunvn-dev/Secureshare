package com.sjcit.securestorage.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleAuthRequest {

    @NotBlank(message = "Google ID token is required")
    private String idToken;

    private String publicKeyEcc;

    public GoogleAuthRequest() {
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getPublicKeyEcc() {
        return publicKeyEcc;
    }

    public void setPublicKeyEcc(String publicKeyEcc) {
        this.publicKeyEcc = publicKeyEcc;
    }
}
