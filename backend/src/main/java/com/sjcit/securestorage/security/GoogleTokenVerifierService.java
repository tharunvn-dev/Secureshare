package com.sjcit.securestorage.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.sjcit.securestorage.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);

    @Value("${app.oauth.google.client-id:unconfigured-client-id}")
    private String clientId;

    public GoogleIdToken.Payload verifyToken(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new UnauthorizedException("Google ID token is required.");
        }

        if ("unconfigured-client-id".equalsIgnoreCase(clientId) || clientId.isBlank()) {
            log.warn("Google OAuth Client ID is not configured in environment (app.oauth.google.client-id)");
            throw new UnauthorizedException("Google Sign-In is not configured on this server. Please configure GOOGLE_CLIENT_ID.");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
            .setAudience(Collections.singletonList(clientId))
            .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new UnauthorizedException("Invalid or expired Google ID token.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified == null || !emailVerified) {
                throw new UnauthorizedException("Google account email is not verified.");
            }

            return payload;
        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google ID token verification failed: {}", e.getMessage());
            throw new UnauthorizedException("Failed to verify Google identity: " + e.getMessage());
        }
    }
}
