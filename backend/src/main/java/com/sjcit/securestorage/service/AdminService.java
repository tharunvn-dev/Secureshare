package com.sjcit.securestorage.service;

import com.sjcit.securestorage.dto.AdminStatsResponse;
import com.sjcit.securestorage.dto.AdminUserResponse;
import com.sjcit.securestorage.dto.FileMetadataResponse;
import com.sjcit.securestorage.dto.FileShareResponse;
import com.sjcit.securestorage.entity.FileShare;
import com.sjcit.securestorage.entity.Role;
import com.sjcit.securestorage.entity.StoredFile;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.exception.BadRequestException;
import com.sjcit.securestorage.exception.ResourceNotFoundException;
import com.sjcit.securestorage.repository.AuditLogRepository;
import com.sjcit.securestorage.repository.FileShareRepository;
import com.sjcit.securestorage.repository.StoredFileRepository;
import com.sjcit.securestorage.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.sjcit.securestorage.crypto.EccKeyManagementService;
import com.sjcit.securestorage.dto.AdminCreateUserRequest;
import com.sjcit.securestorage.repository.RefreshTokenRepository;
import com.sjcit.securestorage.repository.RoleRepository;
import com.sjcit.securestorage.storage.FileStorageService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.HashSet;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final StoredFileRepository fileRepository;
    private final FileShareRepository shareRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EccKeyManagementService eccKeyService;
    private final FileStorageService storageService;
    private final RefreshTokenRepository refreshTokenRepository;

    public AdminService(
            UserRepository userRepository,
            StoredFileRepository fileRepository,
            FileShareRepository shareRepository,
            AuditLogRepository auditLogRepository,
            AuditLogService auditLogService,
            NotificationService notificationService,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            EccKeyManagementService eccKeyService,
            FileStorageService storageService,
            RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.shareRepository = shareRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.eccKeyService = eccKeyService;
        this.storageService = storageService;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getSystemStats() {
        AdminStatsResponse stats = new AdminStatsResponse();
        stats.setTotalUsers(userRepository.countByDeletedFlagFalse());
        stats.setActiveUsers(userRepository.countByStatusAndDeletedFlagFalse("ACTIVE"));
        stats.setPendingUsers(userRepository.countByStatusAndDeletedFlagFalse("PENDING"));
        stats.setSuspendedUsers(userRepository.countByStatusAndDeletedFlagFalse("SUSPENDED"));
        stats.setTotalFiles(fileRepository.countByDeletedFlagFalse());
        stats.setTotalEncryptedStorageBytes(fileRepository.getTotalEncryptedStorageUsed());
        stats.setTotalShares(shareRepository.countByStatusAndDeletedFlagFalse("ACTIVE"));
        stats.setTotalAuditEvents(auditLogRepository.count());
        stats.setIntegrityFailures(auditLogRepository.countByStatusAndDeletedFlagFalse("FAILURE"));
        stats.setSystemHealthStatus("UP");
        return stats;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listUsers(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return userRepository.findByDeletedFlagFalse(pageable)
                    .map(this::mapToAdminUser);
        }
        return userRepository.searchUsers(query.trim(), pageable)
                .map(this::mapToAdminUser);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserDetails(UUID userId) {
        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeletedFlag())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        return mapToAdminUser(user);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(
            UUID userId,
            String newStatus,
            User admin,
            HttpServletRequest request) {

        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeletedFlag())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("Administrators cannot modify their own account status.");
        }

        String oldStatus = user.getStatus();
        user.setStatus(newStatus.toUpperCase().trim());
        user.setUpdatedAt(Instant.now());
        user = userRepository.save(user);

        auditLogService.logEvent(
                admin,
                "ADMIN_USER_STATUS_CHANGE",
                "USER",
                user.getId().toString(),
                "SUCCESS",
                String.format("Changed status of user '%s' from %s to %s", user.getEmail(), oldStatus,
                        user.getStatus()),
                request);

        notificationService.createNotification(
                user,
                "SECURITY_ALERT",
                "Account Status Updated",
                String.format("Your account status was changed to %s by an administrator.", user.getStatus()));

        return mapToAdminUser(user);
    }

    @Transactional(readOnly = true)
    public Page<FileMetadataResponse> listAllFiles(Pageable pageable) {
        return fileRepository.findByDeletedFlagFalseOrderByCreatedAtDesc(pageable)
                .map(file -> {
                    FileMetadataResponse resp = new FileMetadataResponse();
                    resp.setId(file.getId());
                    resp.setOriginalFilename(file.getOriginalFilename());
                    resp.setMimeType(file.getMimeType());
                    resp.setOriginalSize(file.getOriginalSize());
                    resp.setEncryptedSize(file.getEncryptedSize());
                    resp.setSha256Checksum(file.getSha256Checksum());
                    resp.setCryptoProfileVersion(file.getCryptoProfileVersion());
                    resp.setCreatedAt(file.getCreatedAt());
                    resp.setUpdatedAt(file.getUpdatedAt());
                    resp.setOwnerEmail(file.getOwner().getEmail());
                    resp.setOwnerName(file.getOwner().getDisplayName());
                    resp.setOwner(false);
                    return resp;
                });
    }

    @Transactional(readOnly = true)
    public Page<FileShareResponse> listAllShares(Pageable pageable) {
        return shareRepository.findAll(pageable)
                .map(share -> {
                    FileShareResponse resp = new FileShareResponse();
                    resp.setId(share.getId());
                    resp.setFileId(share.getFile().getId());
                    resp.setOriginalFilename(share.getFile().getOriginalFilename());
                    resp.setOriginalSize(share.getFile().getOriginalSize());
                    resp.setOwnerEmail(share.getOwner().getEmail());
                    resp.setOwnerName(share.getOwner().getDisplayName());
                    resp.setRecipientEmail(share.getRecipient().getEmail());
                    resp.setRecipientName(share.getRecipient().getDisplayName());
                    resp.setStatus(share.getStatus());
                    resp.setCreatedAt(share.getCreatedAt());
                    resp.setRevokedAt(share.getRevokedAt());
                    return resp;
                });
    }

    @Transactional
    public AdminUserResponse createUser(AdminCreateUserRequest request, User admin, HttpServletRequest httpRequest) {
        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmailIgnoreCaseAndDeletedFlagFalse(email)) {
            throw new BadRequestException("An account with email '" + email + "' already exists.");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        String name = request.getDisplayName();
        if (name == null || name.isBlank()) {
            if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
                name = request.getFirstName() + (request.getLastName() != null && !request.getLastName().isBlank() ? " " + request.getLastName() : "");
            } else {
                name = email.split("@")[0];
            }
        }
        user.setFirstName(request.getFirstName() != null && !request.getFirstName().isBlank() ? request.getFirstName().trim() : name);
        user.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        user.setStatus(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus().toUpperCase().trim() : "ACTIVE");
        user.setMfaEnabled(false);

        String roleName = (request.getRole() != null && request.getRole().equalsIgnoreCase("ADMIN")) ? "ADMIN" : "USER";
        Role role = roleRepository.findByNameIgnoreCaseAndDeletedFlagFalse(roleName)
                .orElseThrow(() -> new RuntimeException("Role '" + roleName + "' missing from database."));
        user.setRoles(new HashSet<>(Collections.singletonList(role)));

        // Generate cryptographic ECC P-256 Keypair for user
        var keyPair = eccKeyService.generateKeyPair();
        user.setPublicKeyEcc(eccKeyService.encodePublicKey(keyPair.getPublic()));

        user = userRepository.save(user);

        auditLogService.logEvent(
                admin,
                "ADMIN_USER_CREATE",
                "USER",
                user.getId().toString(),
                "SUCCESS",
                String.format("Administrator '%s' created user '%s' with role %s", admin.getEmail(), email, roleName),
                httpRequest
        );

        return mapToAdminUser(user);
    }

    @Transactional
    public void deleteUser(UUID userId, User admin, HttpServletRequest httpRequest) {
        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeletedFlag())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.getId().equals(admin.getId())) {
            throw new BadRequestException("Administrators cannot delete their own account.");
        }

        user.setDeletedFlag(true);
        user.setStatus("SUSPENDED");
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        refreshTokenRepository.revokeAllForUser(user);

        auditLogService.logEvent(
                admin,
                "ADMIN_USER_DELETE",
                "USER",
                user.getId().toString(),
                "SUCCESS",
                String.format("Administrator '%s' soft-deleted user '%s'", admin.getEmail(), user.getEmail()),
                httpRequest
        );
    }

    @Transactional
    public void deleteFileByAdmin(UUID fileId, User admin, HttpServletRequest httpRequest) {
        StoredFile file = fileRepository.findByIdAndDeletedFlagFalse(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        file.setDeletedFlag(true);
        file.setUpdatedAt(Instant.now());
        fileRepository.save(file);

        storageService.deleteStoredFile(file.getId(), file.getStoragePath());

        auditLogService.logEvent(
                admin,
                "ADMIN_FILE_DELETE",
                "FILE",
                file.getId().toString(),
                "SUCCESS",
                String.format("Administrator purged file '%s' owned by '%s'", file.getOriginalFilename(), file.getOwner().getEmail()),
                httpRequest
        );
    }

    @Transactional
    public void revokeShareByAdmin(UUID shareId, User admin, HttpServletRequest httpRequest) {
        FileShare share = shareRepository.findByIdAndDeletedFlagFalse(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found: " + shareId));

        share.setStatus("REVOKED");
        share.setRevokedAt(Instant.now());
        share.setUpdatedAt(Instant.now());
        shareRepository.save(share);

        auditLogService.logEvent(
                admin,
                "ADMIN_SHARE_REVOKE",
                "SHARE",
                shareId.toString(),
                "SUCCESS",
                String.format("Administrator revoked share for file '%s' between '%s' and '%s'",
                        share.getFile().getOriginalFilename(), share.getOwner().getEmail(), share.getRecipient().getEmail()),
                httpRequest
        );

        notificationService.createNotification(
                share.getRecipient(),
                "SHARE_REVOKED",
                "Share Access Revoked",
                String.format("Access to file '%s' was revoked by system administrator.", share.getFile().getOriginalFilename())
        );
    }

    private AdminUserResponse mapToAdminUser(User user) {
        AdminUserResponse resp = new AdminUserResponse();
        resp.setId(user.getId());
        resp.setEmail(user.getEmail());
        resp.setFirstName(user.getFirstName());
        resp.setLastName(user.getLastName());
        resp.setDisplayName(user.getDisplayName());
        resp.setStatus(user.getStatus());
        resp.setMfaEnabled(user.isMfaEnabled());
        resp.setCreatedAt(user.getCreatedAt());
        resp.setUpdatedAt(user.getUpdatedAt());

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());
        resp.setRoles(roles);

        resp.setFileCount(fileRepository.countByOwnerAndDeletedFlagFalse(user));
        resp.setStorageUsedBytes(fileRepository.getStorageUsedByOwner(user));
        return resp;
    }
}
