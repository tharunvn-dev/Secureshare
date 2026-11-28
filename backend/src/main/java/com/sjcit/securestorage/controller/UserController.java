package com.sjcit.securestorage.controller;

import com.sjcit.securestorage.dto.UserProfileResponse;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.exception.ResourceNotFoundException;
import com.sjcit.securestorage.repository.UserRepository;
import com.sjcit.securestorage.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Users", description = "Current user profile and cryptographic key operations")
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public UserController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PutMapping("/keys")
    @Operation(summary = "Update current user's ECC public key")
    public ResponseEntity<UserProfileResponse> updateKeys(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String publicKeyEcc = body != null ? body.get("publicKeyEcc") : null;
        UserProfileResponse profile = authService.updatePublicKey(user, publicKeyEcc);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user's profile details")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUser.getId()));

        if (body != null) {
            if (body.containsKey("firstName")) {
                user.setFirstName(body.get("firstName") != null ? body.get("firstName").trim() : "");
            }
            if (body.containsKey("lastName")) {
                user.setLastName(body.get("lastName") != null ? body.get("lastName").trim() : "");
            }
            user.setUpdatedAt(Instant.now());
            user = userRepository.save(user);
        }

        return ResponseEntity.ok(authService.mapToProfile(user));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getCurrentUserProfile(user));
    }
}
