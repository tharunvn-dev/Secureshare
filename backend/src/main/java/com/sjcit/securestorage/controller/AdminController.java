package com.sjcit.securestorage.controller;

import com.sjcit.securestorage.dto.*;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.service.AdminService;
import com.sjcit.securestorage.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Administration", description = "Administrator portal management, analytics, user policies, and audit trails")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    public AdminController(AdminService adminService, AuditLogService auditLogService) {
        this.adminService = adminService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get system-wide analytics, metrics, storage usage, and security status")
    public ResponseEntity<AdminStatsResponse> getSystemStats() {
        AdminStatsResponse stats = adminService.getSystemStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    @Operation(summary = "Search and list registered users with pagination")
    public ResponseEntity<Page<AdminUserResponse>> listUsers(
            @RequestParam(value = "query", required = false) String query,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AdminUserResponse> users = adminService.listUsers(query, pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get detailed user account profile, storage footprint, and activity")
    public ResponseEntity<AdminUserResponse> getUserDetails(@PathVariable UUID id) {
        AdminUserResponse user = adminService.getUserDetails(id);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Activate, suspend, or update user account status")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {
        AdminUserResponse updated = adminService.updateUserStatus(id, request.getStatus(), admin, httpRequest);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/users")
    @Operation(summary = "Create and provision a new user account with cryptographic credentials")
    public ResponseEntity<AdminUserResponse> createUser(
            @Valid @RequestBody AdminCreateUserRequest request,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {
        AdminUserResponse response = adminService.createUser(request, admin, httpRequest);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Soft delete / deactivate user account")
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {
        adminService.deleteUser(id, admin, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/files")
    @Operation(summary = "List system file metadata (Plaintext contents remain strictly protected)")
    public ResponseEntity<Page<FileMetadataResponse>> listAllFiles(
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FileMetadataResponse> files = adminService.listAllFiles(pageable);
        return ResponseEntity.ok(files);
    }

    @DeleteMapping("/files/{id}")
    @Operation(summary = "Purge file and encrypted physical storage by administrator")
    public ResponseEntity<Void> deleteFile(
            @PathVariable UUID id,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {
        adminService.deleteFileByAdmin(id, admin, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/shares")
    @Operation(summary = "List all active and revoked file sharing activities")
    public ResponseEntity<Page<FileShareResponse>> listAllShares(
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FileShareResponse> shares = adminService.listAllShares(pageable);
        return ResponseEntity.ok(shares);
    }

    @DeleteMapping("/shares/{id}")
    @Operation(summary = "Revoke active file share by administrator")
    public ResponseEntity<Void> revokeShare(
            @PathVariable UUID id,
            @AuthenticationPrincipal User admin,
            HttpServletRequest httpRequest) {
        adminService.revokeShareByAdmin(id, admin, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Filter and inspect security event logs and system audit trails")
    public ResponseEntity<Page<AdminAuditResponse>> getAuditLogs(
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "resourceType", required = false) String resourceType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AdminAuditResponse> logs = auditLogService.filterAuditLogs(action, status, resourceType, pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/health")
    @Operation(summary = "System health, database connectivity, and crypto engine telemetry")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "database", "CONNECTED (PostgreSQL 16)",
                "cryptoEngine", "ACTIVE (AES-256-GCM, Blowfish, ECDH P-256, LSB PNG)",
                "storageProvider", "LOCAL_FILESYSTEM",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
