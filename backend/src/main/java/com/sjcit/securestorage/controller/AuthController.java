package com.sjcit.securestorage.controller;

import com.sjcit.securestorage.dto.*;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Registration, OTP verification, password reset, and session management")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account (creates PENDING account & dispatches 6-digit OTP)")
    public ResponseEntity<UserProfileResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        UserProfileResponse profile = authService.register(request, httpRequest);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify account email with 6-digit OTP code")
    public ResponseEntity<UserProfileResponse> verifyEmail(
            @Valid @RequestBody OtpVerifyRequest request,
            HttpServletRequest httpRequest) {
        UserProfileResponse profile = authService.verifyEmail(request, httpRequest);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend a fresh OTP verification code")
    public ResponseEntity<Void> resendOtp(
            @RequestParam String email,
            @RequestParam(defaultValue = "LOGIN_MFA") String purpose) {
        authService.resendOtp(email, purpose);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    @Operation(summary = "Primary password authentication (dispatches OTP if MFA is active)")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        LoginResponse response = authService.login(request, httpRequest);
        attachAuthCookies(response, httpResponse);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-login-otp")
    @Operation(summary = "Complete MFA login factor with 6-digit OTP")
    public ResponseEntity<LoginResponse> verifyLoginOtp(
            @Valid @RequestBody OtpVerifyRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        LoginResponse response = authService.verifyLoginOtp(request, httpRequest);
        attachAuthCookies(response, httpResponse);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    @Operation(summary = "Authenticate using Google OpenID Connect ID token")
    public ResponseEntity<LoginResponse> googleLogin(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        LoginResponse response = authService.googleLogin(request, httpRequest);
        attachAuthCookies(response, httpResponse);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset OTP code")
    public ResponseEntity<Void> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.forgotPassword(request, httpRequest);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using verified OTP code")
    public ResponseEntity<Void> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        authService.resetPassword(request, httpRequest);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh expired access token with valid refresh token")
    public ResponseEntity<AuthTokenResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthTokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Log out user and revoke session tokens")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        authService.logout(user, httpRequest);
        clearAuthCookies(httpResponse);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile and permissions")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        UserProfileResponse profile = authService.getCurrentUserProfile(user);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/public-key")
    @Operation(summary = "Update current authenticated user's ECC public key")
    public ResponseEntity<UserProfileResponse> updatePublicKey(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String publicKeyEcc = body != null ? body.get("publicKeyEcc") : null;
        UserProfileResponse profile = authService.updatePublicKey(user, publicKeyEcc);
        return ResponseEntity.ok(profile);
    }

    private void attachAuthCookies(LoginResponse response, HttpServletResponse httpResponse) {
        if (response.getAccessToken() != null) {
            Cookie accessCookie = new Cookie("access_token", response.getAccessToken());
            accessCookie.setHttpOnly(true);
            accessCookie.setPath("/");
            accessCookie.setMaxAge((int) (response.getExpiresInMs() / 1000));
            httpResponse.addCookie(accessCookie);
        }
    }

    private void clearAuthCookies(HttpServletResponse httpResponse) {
        Cookie accessCookie = new Cookie("access_token", "");
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        httpResponse.addCookie(accessCookie);
    }
}
