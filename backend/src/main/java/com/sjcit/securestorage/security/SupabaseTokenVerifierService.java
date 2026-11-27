package com.sjcit.securestorage.security;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sjcit.securestorage.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
public class SupabaseTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseTokenVerifierService.class);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.supabase.url:}")
    private String supabaseUrl;

    @Value("${app.supabase.anon-key:}")
    private String supabaseAnonKey;

    public static class SupabaseUserClaims {
        private String email;
        private String firstName;
        private String lastName;
        private String provider;

        public SupabaseUserClaims(String email, String firstName, String lastName, String provider) {
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.provider = provider;
        }

        public String getEmail() {
            return email;
        }

        public String getFirstName() {
            return firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public String getProvider() {
            return provider;
        }
    }

    public SupabaseUserClaims verifyToken(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new UnauthorizedException("Supabase access token is required.");
        }

        String token = accessToken.trim();

        // 1. If Supabase URL and anon key are configured, verify directly against Supabase auth server
        if (supabaseUrl != null && !supabaseUrl.isBlank() && supabaseUrl.startsWith("http")) {
            try {
                String normalizedUrl = supabaseUrl.replaceAll("/+$", "");
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(normalizedUrl + "/auth/v1/user"))
                        .timeout(Duration.ofSeconds(10))
                        .header("Authorization", "Bearer " + token)
                        .header("apikey", (supabaseAnonKey != null && !supabaseAnonKey.isBlank()) ? supabaseAnonKey : token)
                        .GET()
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    JsonObject json = JsonParser.parseString(response.body()).getAsJsonObject();
                    String email = json.has("email") && !json.get("email").isJsonNull()
                            ? json.get("email").getAsString() : null;

                    if (email != null && !email.isBlank()) {
                        String firstName = "User";
                        String lastName = "";
                        String provider = "supabase";

                        if (json.has("app_metadata") && json.get("app_metadata").isJsonObject()) {
                            JsonObject appMeta = json.getAsJsonObject("app_metadata");
                            if (appMeta.has("provider") && !appMeta.get("provider").isJsonNull()) {
                                provider = appMeta.get("provider").getAsString();
                            }
                        }

                        if (json.has("user_metadata") && json.get("user_metadata").isJsonObject()) {
                            JsonObject userMeta = json.getAsJsonObject("user_metadata");
                            if (userMeta.has("full_name") && !userMeta.get("full_name").isJsonNull()) {
                                String fullName = userMeta.get("full_name").getAsString();
                                String[] parts = fullName.split(" ", 2);
                                firstName = parts[0];
                                if (parts.length > 1) lastName = parts[1];
                            } else if (userMeta.has("name") && !userMeta.get("name").isJsonNull()) {
                                String name = userMeta.get("name").getAsString();
                                String[] parts = name.split(" ", 2);
                                firstName = parts[0];
                                if (parts.length > 1) lastName = parts[1];
                            } else if (userMeta.has("given_name") && !userMeta.get("given_name").isJsonNull()) {
                                firstName = userMeta.get("given_name").getAsString();
                                if (userMeta.has("family_name") && !userMeta.get("family_name").isJsonNull()) {
                                    lastName = userMeta.get("family_name").getAsString();
                                }
                            }
                        }

                        log.info("Supabase Auth API successfully verified user: {} (provider: {})", email, provider);
                        return new SupabaseUserClaims(email, firstName, lastName, provider);
                    }
                } else {
                    log.warn("Supabase Auth API returned non-200 status {}: {}", response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("Direct Supabase API call failed, falling back to JWT claims decoding: {}", e.getMessage());
            }
        }

        // 2. Decode standard JWT claims from Supabase access token (fallback / local dev)
        try {
            String[] segments = token.split("\\.");
            if (segments.length >= 2) {
                byte[] decodedPayload = Base64.getUrlDecoder().decode(segments[1]);
                String payloadJson = new String(decodedPayload, StandardCharsets.UTF_8);
                JsonObject json = JsonParser.parseString(payloadJson).getAsJsonObject();

                String email = json.has("email") && !json.get("email").isJsonNull()
                        ? json.get("email").getAsString() : null;

                if ((email == null || email.isBlank()) && json.has("user_metadata") && json.get("user_metadata").isJsonObject()) {
                    JsonObject um = json.getAsJsonObject("user_metadata");
                    if (um.has("email") && !um.get("email").isJsonNull()) {
                        email = um.get("email").getAsString();
                    }
                }

                if (email != null && !email.isBlank()) {
                    String firstName = "User";
                    String lastName = "";
                    String provider = "supabase";

                    if (json.has("app_metadata") && json.get("app_metadata").isJsonObject()) {
                        JsonObject appMeta = json.getAsJsonObject("app_metadata");
                        if (appMeta.has("provider") && !appMeta.get("provider").isJsonNull()) {
                            provider = appMeta.get("provider").getAsString();
                        }
                    }

                    if (json.has("user_metadata") && json.get("user_metadata").isJsonObject()) {
                        JsonObject userMeta = json.getAsJsonObject("user_metadata");
                        if (userMeta.has("full_name") && !userMeta.get("full_name").isJsonNull()) {
                            String fullName = userMeta.get("full_name").getAsString();
                            String[] parts = fullName.split(" ", 2);
                            firstName = parts[0];
                            if (parts.length > 1) lastName = parts[1];
                        } else if (userMeta.has("given_name") && !userMeta.get("given_name").isJsonNull()) {
                            firstName = userMeta.get("given_name").getAsString();
                            if (userMeta.has("family_name") && !userMeta.get("family_name").isJsonNull()) {
                                lastName = userMeta.get("family_name").getAsString();
                            }
                        }
                    }

                    log.info("Successfully decoded Supabase JWT token for: {} (provider: {})", email, provider);
                    return new SupabaseUserClaims(email, firstName, lastName, provider);
                }
            }
        } catch (Exception e) {
            log.error("Failed to decode Supabase JWT claims: {}", e.getMessage());
        }

        throw new UnauthorizedException("Invalid or expired Supabase authentication token.");
    }
}
