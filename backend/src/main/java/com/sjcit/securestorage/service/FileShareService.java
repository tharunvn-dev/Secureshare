package com.sjcit.securestorage.service;

import com.sjcit.securestorage.crypto.EccKeyManagementService;
import com.sjcit.securestorage.crypto.LsbSteganographyService;
import com.sjcit.securestorage.dto.FileShareResponse;
import com.sjcit.securestorage.entity.FileShare;
import com.sjcit.securestorage.entity.StoredFile;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.exception.BadRequestException;
import com.sjcit.securestorage.exception.ForbiddenException;
import com.sjcit.securestorage.exception.ResourceNotFoundException;
import com.sjcit.securestorage.repository.FileShareRepository;
import com.sjcit.securestorage.repository.StoredFileRepository;
import com.sjcit.securestorage.repository.UserRepository;
import com.sjcit.securestorage.storage.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.PublicKey;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileShareService {

    private static final Logger log = LoggerFactory.getLogger(FileShareService.class);

    private final StoredFileRepository fileRepository;
    private final FileShareRepository shareRepository;
    private final UserRepository userRepository;
    private final FileStorageService storageService;
    private final LsbSteganographyService lsbService;
    private final EccKeyManagementService eccKeyService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final EmailDeliveryService emailService;

    public FileShareService(
            StoredFileRepository fileRepository,
            FileShareRepository shareRepository,
            UserRepository userRepository,
            FileStorageService storageService,
            LsbSteganographyService lsbService,
            EccKeyManagementService eccKeyService,
            AuditLogService auditLogService,
            NotificationService notificationService,
            EmailDeliveryService emailService) {
        this.fileRepository = fileRepository;
        this.shareRepository = shareRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.lsbService = lsbService;
        this.eccKeyService = eccKeyService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional
    public FileShareResponse shareFileWithUser(
            UUID fileId,
            String recipientEmail,
            String ownerPrivateKeyBase64,
            User owner,
            HttpServletRequest request) {

        StoredFile file = fileRepository.findByIdAndDeletedFlagFalse(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("Only the file owner can share this file.");
        }

        String normalizedEmail = recipientEmail.toLowerCase().trim();
        if (normalizedEmail.equalsIgnoreCase(owner.getEmail())) {
            throw new BadRequestException("You cannot share a file with yourself.");
        }

        User recipient = userRepository.findByEmailIgnoreCaseAndDeletedFlagFalse(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("No registered user found with email: " + recipientEmail));

        // Check if active share already exists
        Optional<FileShare> existingShare = shareRepository.findByFileAndRecipientAndStatusAndDeletedFlagFalse(file, recipient, "ACTIVE");
        if (existingShare.isPresent()) {
            return mapToShareResponse(existingShare.get());
        }

        try {
            // Load stego carrier to extract owner's key envelope
            byte[] stegoCarrier = storageService.loadStegoCarrier(file.getId());
            byte[] ownerEnvelope = lsbService.extract(stegoCarrier);

            if (ownerPrivateKeyBase64 == null || ownerPrivateKeyBase64.isBlank()) {
                throw new BadRequestException("Your active NIST P-256 ECC Private Key is required to re-encrypt this file for the recipient. Please configure your key in Keyring Settings.");
            }

            // Validate recipient's ECC public key
            PublicKey recipientPublicKey;
            String recPubKeyEcc = recipient.getPublicKeyEcc();
            if (recPubKeyEcc == null || recPubKeyEcc.isBlank() || recPubKeyEcc.length() < 64) {
                throw new BadRequestException(String.format("Recipient '%s' has not registered their NIST P-256 ECC Public Key yet. They must log in and generate their key in Keyring Settings before files can be shared with them.", recipient.getEmail()));
            }
            try {
                recipientPublicKey = eccKeyService.decodePublicKey(recPubKeyEcc);
            } catch (Exception ex) {
                log.error("Failed to decode recipient ECC public key: {}", ex.getMessage());
                throw new BadRequestException(String.format("Recipient '%s' has an invalid ECC Public Key. They must regenerate their key in Keyring Settings.", recipient.getEmail()));
            }

            var ownerPrivateKey = eccKeyService.decodePrivateKey(ownerPrivateKeyBase64);

            byte[][] unwrappedKeys;
            try {
                unwrappedKeys = eccKeyService.unwrapKeys(ownerEnvelope, ownerPrivateKey);
            } catch (Exception ex) {
                log.error("Failed to unwrap owner key envelope during file share: {}", ex.getMessage());
                throw new BadRequestException("Key Mismatch: The ECC Private Key in your keyring does not match the key used when this file was uploaded. Please open Keyring Settings to ensure your active key matches, or generate a new key and re-upload the file.");
            }
            byte[] recipientEnvelope = eccKeyService.wrapKeysForRecipient(unwrappedKeys[0], unwrappedKeys[1], recipientPublicKey);

            byte[] hkdfSalt = new byte[32]; // 32-byte salt recorded for reference
            System.arraycopy(recipientEnvelope, 0, hkdfSalt, 0, 32);

            FileShare share = new FileShare();
            share.setFile(file);
            share.setOwner(owner);
            share.setRecipient(recipient);
            share.setWrappedKeyEnvelope(recipientEnvelope);
            share.setHkdfSalt(hkdfSalt);
            share.setStatus("ACTIVE");
            share.setCreatedAt(Instant.now());
            share.setUpdatedAt(Instant.now());

            share = shareRepository.save(share);

            auditLogService.logEvent(
                    owner,
                    "SHARE_CREATE",
                    "SHARE",
                    share.getId().toString(),
                    "SUCCESS",
                    String.format("Shared file '%s' with '%s'", file.getOriginalFilename(), recipient.getEmail()),
                    request
            );

            notificationService.createNotification(
                    recipient,
                    "SHARE_RECEIVED",
                    "New File Shared",
                    String.format("%s shared '%s' with you.", owner.getDisplayName(), file.getOriginalFilename())
            );

            emailService.sendFileSharedNotification(recipient.getEmail(), owner.getDisplayName(), file.getOriginalFilename());

            return mapToShareResponse(share);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to share file: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to share file: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<FileShareResponse> listIncomingShares(User recipient, Pageable pageable) {
        return shareRepository.findByRecipientAndStatusAndDeletedFlagFalse(recipient, "ACTIVE", pageable)
                .map(this::mapToShareResponse);
    }

    @Transactional(readOnly = true)
    public Page<FileShareResponse> listOutgoingShares(User owner, Pageable pageable) {
        return shareRepository.findByOwnerAndDeletedFlagFalse(owner, pageable)
                .map(this::mapToShareResponse);
    }

    @Transactional
    public void revokeShare(UUID shareId, User owner, HttpServletRequest request) {
        FileShare share = shareRepository.findByIdAndDeletedFlagFalse(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found: " + shareId));

        if (!share.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("Only the share creator can revoke this share.");
        }

        share.setStatus("REVOKED");
        share.setRevokedAt(Instant.now());
        share.setUpdatedAt(Instant.now());
        shareRepository.save(share);

        auditLogService.logEvent(
                owner,
                "SHARE_REVOKE",
                "SHARE",
                shareId.toString(),
                "SUCCESS",
                String.format("Revoked share for file '%s' with '%s'", share.getFile().getOriginalFilename(), share.getRecipient().getEmail()),
                request
        );

        notificationService.createNotification(
                share.getRecipient(),
                "SHARE_REVOKED",
                "Share Access Revoked",
                String.format("Access to file '%s' shared by %s was revoked.", share.getFile().getOriginalFilename(), owner.getDisplayName())
        );
    }

    private FileShareResponse mapToShareResponse(FileShare share) {
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
    }
}
