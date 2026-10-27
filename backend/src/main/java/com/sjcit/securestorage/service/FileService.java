package com.sjcit.securestorage.service;

import com.sjcit.securestorage.crypto.CryptoPipelineResult;
import com.sjcit.securestorage.crypto.EccKeyManagementService;
import com.sjcit.securestorage.crypto.FileCryptoPipelineService;
import com.sjcit.securestorage.dto.FileIntegrityResponse;
import com.sjcit.securestorage.dto.FileMetadataResponse;
import com.sjcit.securestorage.dto.FileUploadResponse;
import com.sjcit.securestorage.entity.FileShare;
import com.sjcit.securestorage.entity.StoredFile;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.exception.BadRequestException;
import com.sjcit.securestorage.exception.ForbiddenException;
import com.sjcit.securestorage.exception.ResourceNotFoundException;
import com.sjcit.securestorage.repository.FileShareRepository;
import com.sjcit.securestorage.repository.StoredFileRepository;
import com.sjcit.securestorage.storage.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.sjcit.securestorage.repository.UserRepository;
import org.springframework.web.multipart.MultipartFile;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private final StoredFileRepository fileRepository;
    private final FileShareRepository shareRepository;
    private final UserRepository userRepository;
    private final FileStorageService storageService;
    private final FileCryptoPipelineService cryptoPipelineService;
    private final EccKeyManagementService eccKeyService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public FileService(
            StoredFileRepository fileRepository,
            FileShareRepository shareRepository,
            UserRepository userRepository,
            FileStorageService storageService,
            FileCryptoPipelineService cryptoPipelineService,
            EccKeyManagementService eccKeyService,
            AuditLogService auditLogService,
            NotificationService notificationService) {
        this.fileRepository = fileRepository;
        this.shareRepository = shareRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.cryptoPipelineService = cryptoPipelineService;
        this.eccKeyService = eccKeyService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Transactional
    public FileUploadResponse uploadFile(
            MultipartFile file,
            MultipartFile carrierImage,
            User owner,
            HttpServletRequest request) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty.");
        }

        try {
            byte[] originalBytes = file.getBytes();
            byte[] carrierBytes = (carrierImage != null && !carrierImage.isEmpty()) ? carrierImage.getBytes() : null;

            UUID fileId = UUID.randomUUID();

            // Validate NIST P-256 ECC public key for owner
            PublicKey ownerPublicKey;
            String pubKeyEcc = owner.getPublicKeyEcc();
            if (pubKeyEcc == null || pubKeyEcc.trim().isEmpty() || pubKeyEcc.length() < 64) {
                throw new BadRequestException("NIST P-256 ECC Public Key is missing for your account. Please open Keyring Settings in your dashboard and click 'Generate New Keypair' before uploading files.");
            }
            try {
                ownerPublicKey = eccKeyService.decodePublicKey(pubKeyEcc);
            } catch (Exception ex) {
                log.error("Failed to decode owner ECC public key: {}", ex.getMessage());
                throw new BadRequestException("Invalid ECC Public Key registered for your account. Please open Keyring Settings in your dashboard and click 'Generate New Keypair'.");
            }

            // Execute 5-Layer Cryptographic Pipeline
            CryptoPipelineResult cryptoResult = cryptoPipelineService.encryptFile(
                    originalBytes,
                    fileId,
                    owner.getId(),
                    ownerPublicKey,
                    carrierBytes
            );

            // Store encrypted payload on storage provider
            String storagePath = storageService.storeEncryptedFile(fileId, cryptoResult.getEncryptedFileBytes());

            // Store steganographic carrier containing the key envelope
            storageService.storeStegoCarrier(fileId, cryptoResult.getStegoCarrierPngBytes());

            // Persist File Metadata Record
            StoredFile storedFile = new StoredFile(fileId);
            storedFile.setOwner(owner);
            storedFile.setOriginalFilename(sanitizeFilename(file.getOriginalFilename()));
            storedFile.setMimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            storedFile.setOriginalSize(cryptoResult.getOriginalSize());
            storedFile.setEncryptedSize(cryptoResult.getEncryptedSize());
            storedFile.setSha256Checksum(cryptoResult.getSha256Checksum());
            storedFile.setStorageProviderId(storageService.getProviderId());
            storedFile.setCryptoProfileVersion("v1");
            storedFile.setStoragePath(storagePath);
            storedFile.setCreatedAt(Instant.now());
            storedFile.setUpdatedAt(Instant.now());

            storedFile = fileRepository.save(storedFile);

            auditLogService.logEvent(
                    owner,
                    "FILE_UPLOAD",
                    "FILE",
                    storedFile.getId().toString(),
                    "SUCCESS",
                    String.format("Uploaded & encrypted '%s' (%d bytes -> %d bytes)",
                            storedFile.getOriginalFilename(), storedFile.getOriginalSize(), storedFile.getEncryptedSize()),
                    request
            );

            notificationService.createNotification(
                    owner,
                    "FILE_UPLOAD",
                    "File Encrypted Successfully",
                    String.format("'%s' was encrypted and securely stored using the 5-layer pipeline.", storedFile.getOriginalFilename())
            );

            return new FileUploadResponse(
                    storedFile.getId(),
                    storedFile.getOriginalFilename(),
                    storedFile.getOriginalSize(),
                    storedFile.getEncryptedSize(),
                    storedFile.getSha256Checksum(),
                    storedFile.getCreatedAt()
            );
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to process file upload: {}", e.getMessage(), e);
            throw new BadRequestException("File upload and encryption failed: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<FileMetadataResponse> listUserFiles(User owner, String query, Pageable pageable) {
        Page<StoredFile> page;
        if (query == null || query.isBlank()) {
            page = fileRepository.findByOwnerAndDeletedFlagFalse(owner, pageable);
        } else {
            page = fileRepository.searchOwnerFiles(owner, query.trim(), pageable);
        }
        return page.map(file -> mapToFileMetadata(file, owner));
    }

    @Transactional(readOnly = true)
    public FileMetadataResponse getFileMetadata(UUID fileId, User currentUser) {
        StoredFile file = fileRepository.findByIdAndDeletedFlagFalse(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        boolean isOwner = file.getOwner().getId().equals(currentUser.getId());
        if (!isOwner) {
            // Check share access
            boolean hasShare = shareRepository.findByFileAndRecipientAndStatusAndDeletedFlagFalse(file, currentUser, "ACTIVE").isPresent();
            if (!hasShare) {
                throw new ForbiddenException("You do not have permission to view metadata for this file.");
            }
        }

        return mapToFileMetadata(file, currentUser);
    }

    @Transactional(readOnly = true)
    public DecryptedFileResult downloadFile(
            UUID fileId,
            String privateKeyBase64,
            User currentUser,
            HttpServletRequest request) {

        StoredFile file = fileRepository.findByIdAndDeletedFlagFalse(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        boolean isOwner = file.getOwner().getId().equals(currentUser.getId());
        byte[] fallbackEnvelope = null;

        if (!isOwner) {
            Optional<FileShare> shareOpt = shareRepository.findByFileAndRecipientAndStatusAndDeletedFlagFalse(file, currentUser, "ACTIVE");
            if (shareOpt.isEmpty()) {
                auditLogService.logEvent(currentUser, "UNAUTHORIZED_DOWNLOAD_ATTEMPT", "FILE", fileId.toString(), "FAILURE", "IDOR attempt on private file", request);
                throw new ForbiddenException("Access denied. You do not own this file and it has not been shared with you.");
            }
            fallbackEnvelope = shareOpt.get().getWrappedKeyEnvelope();
        }

        if (privateKeyBase64 == null || privateKeyBase64.isBlank()) {
            throw new BadRequestException("ECC private key is required to decrypt this file.");
        }

        try {
            PrivateKey privateKey = eccKeyService.decodePrivateKey(privateKeyBase64);

            // Load encrypted bytes and stego carrier from storage
            byte[] encryptedFileBytes = storageService.loadEncryptedFile(file.getStoragePath());
            byte[] stegoCarrierBytes = storageService.loadStegoCarrier(file.getId());

            // Execute reverse 5-layer decryption pipeline
            byte[] plaintextBytes = cryptoPipelineService.decryptFile(
                    encryptedFileBytes,
                    stegoCarrierBytes,
                    fallbackEnvelope,
                    privateKey,
                    file.getId(),
                    file.getOwner().getId(),
                    file.getSha256Checksum()
            );

            auditLogService.logEvent(
                    currentUser,
                    "FILE_DOWNLOAD",
                    "FILE",
                    file.getId().toString(),
                    "SUCCESS",
                    String.format("Decrypted and downloaded '%s'", file.getOriginalFilename()),
                    request
            );

            return new DecryptedFileResult(
                    plaintextBytes,
                    file.getOriginalFilename(),
                    file.getMimeType(),
                    file.getSha256Checksum()
            );
        } catch (Exception e) {
            auditLogService.logEvent(currentUser, "DECRYPTION_FAILURE", "FILE", fileId.toString(), "FAILURE", e.getMessage(), request);
            throw new BadRequestException("Decryption failed: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public FileIntegrityResponse verifyFileIntegrity(UUID fileId, String privateKeyBase64, User currentUser) {
        StoredFile file = fileRepository.findByIdAndDeletedFlagFalse(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        try {
            DecryptedFileResult result = downloadFile(fileId, privateKeyBase64, currentUser, null);
            return new FileIntegrityResponse(
                    file.getId(),
                    file.getOriginalFilename(),
                    file.getSha256Checksum(),
                    result.sha256Checksum(),
                    true
            );
        } catch (Exception e) {
            FileIntegrityResponse resp = new FileIntegrityResponse(
                    file.getId(),
                    file.getOriginalFilename(),
                    file.getSha256Checksum(),
                    "VERIFICATION_FAILED",
                    false
            );
            if (privateKeyBase64 == null || privateKeyBase64.isBlank()) {
                resp.setStatusMessage("ECC Private Key is required to decrypt and verify SHA-256 integrity hash. Please ensure your key is loaded in Keyring Settings.");
            } else {
                resp.setStatusMessage("Verification failed: " + e.getMessage());
            }
            return resp;
        }
    }

    @Transactional
    public void deleteFile(UUID fileId, User currentUser, HttpServletRequest request) {
        StoredFile file = fileRepository.findByIdAndDeletedFlagFalse(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        if (!file.getOwner().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Only the file owner can delete this file.");
        }

        // Soft delete metadata
        file.setDeletedFlag(true);
        file.setUpdatedAt(Instant.now());
        fileRepository.save(file);

        // Delete physical storage
        storageService.deleteStoredFile(file.getId(), file.getStoragePath());

        auditLogService.logEvent(
                currentUser,
                "FILE_DELETE",
                "FILE",
                file.getId().toString(),
                "SUCCESS",
                String.format("Deleted file '%s'", file.getOriginalFilename()),
                request
        );
    }

    private FileMetadataResponse mapToFileMetadata(StoredFile file, User currentUser) {
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
        resp.setOwner(file.getOwner().getId().equals(currentUser.getId()));
        return resp;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) return "unnamed_file.bin";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public record DecryptedFileResult(byte[] content, String filename, String mimeType, String sha256Checksum) {}
}
