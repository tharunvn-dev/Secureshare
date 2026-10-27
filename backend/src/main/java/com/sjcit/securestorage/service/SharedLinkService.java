package com.sjcit.securestorage.service;

import com.sjcit.securestorage.crypto.Sha256ChecksumService;
import com.sjcit.securestorage.dto.ConsumeLinkResponse;
import com.sjcit.securestorage.dto.CreateSharedLinkRequest;
import com.sjcit.securestorage.dto.SharedLinkResponse;
import com.sjcit.securestorage.entity.SharedLink;
import com.sjcit.securestorage.entity.StoredFile;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.exception.BadRequestException;
import com.sjcit.securestorage.exception.ForbiddenException;
import com.sjcit.securestorage.exception.ResourceNotFoundException;
import com.sjcit.securestorage.repository.SharedLinkRepository;
import com.sjcit.securestorage.repository.StoredFileRepository;
import com.sjcit.securestorage.storage.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class SharedLinkService {

    private static final Logger log = LoggerFactory.getLogger(SharedLinkService.class);

    private final SharedLinkRepository linkRepository;
    private final StoredFileRepository fileRepository;
    private final FileStorageService storageService;
    private final Sha256ChecksumService sha256Service;
    private final AuditLogService auditLogService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    public SharedLinkService(
            SharedLinkRepository linkRepository,
            StoredFileRepository fileRepository,
            FileStorageService storageService,
            Sha256ChecksumService sha256Service,
            AuditLogService auditLogService) {
        this.linkRepository = linkRepository;
        this.fileRepository = fileRepository;
        this.storageService = storageService;
        this.sha256Service = sha256Service;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public SharedLinkResponse createSharedLink(
            CreateSharedLinkRequest request,
            User sharedBy,
            HttpServletRequest httpRequest) {

        StoredFile file = fileRepository.findByIdAndDeletedFlagFalse(request.getFileId())
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + request.getFileId()));

        if (!file.getOwner().getId().equals(sharedBy.getId())) {
            throw new ForbiddenException("Only the file owner can create shared links.");
        }

        // Generate 32-byte secure bearer token
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        // Store only the SHA-256 hash of the token
        String tokenHash = sha256Service.calculateChecksum(rawToken.getBytes(StandardCharsets.UTF_8));

        SharedLink link = new SharedLink();
        link.setFile(file);
        link.setSharedBy(sharedBy);
        link.setRecipientEmail(request.getRecipientEmail());
        link.setAccessTokenHash(tokenHash);
        link.setExpiryDate(Instant.now().plus(request.getExpiryDays(), ChronoUnit.DAYS));
        link.setOneTime(request.isOneTime());
        link.setAccessCount(0);
        link.setCreatedAt(Instant.now());
        link.setUpdatedAt(Instant.now());

        link = linkRepository.save(link);

        auditLogService.logEvent(
                sharedBy,
                "LINK_CREATE",
                "SHARED_LINK",
                link.getId().toString(),
                "SUCCESS",
                String.format("Created %s shared link for '%s'", request.isOneTime() ? "one-time" : "expiring", file.getOriginalFilename()),
                httpRequest
        );

        SharedLinkResponse resp = mapToResponse(link);
        resp.setToken(rawToken);
        resp.setShareUrl(appBaseUrl + "/share/" + rawToken);
        return resp;
    }

    @Transactional(readOnly = true)
    public Page<SharedLinkResponse> listUserLinks(User sharedBy, Pageable pageable) {
        return linkRepository.findBySharedByAndDeletedFlagFalse(sharedBy, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public ConsumeLinkResponse getLinkDetails(String rawToken, HttpServletRequest request) {
        String tokenHash = sha256Service.calculateChecksum(rawToken.getBytes(StandardCharsets.UTF_8));
        SharedLink link = linkRepository.findByAccessTokenHashAndDeletedFlagFalse(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Shared link does not exist or has been removed."));

        if (link.isExpired()) {
            auditLogService.logEvent(null, "EXPIRED_LINK_ACCESS", "SHARED_LINK", link.getId().toString(), "FAILURE", "Attempted access on expired link", request);
            throw new BadRequestException("This shared link has expired.");
        }

        if (link.isConsumed()) {
            auditLogService.logEvent(null, "CONSUMED_LINK_REPLAY", "SHARED_LINK", link.getId().toString(), "FAILURE", "Replay attempt on consumed one-time link", request);
            throw new BadRequestException("This one-time access link has already been used and is no longer valid.");
        }

        ConsumeLinkResponse resp = new ConsumeLinkResponse();
        resp.setFileId(link.getFile().getId());
        resp.setOriginalFilename(link.getFile().getOriginalFilename());
        resp.setOriginalSize(link.getFile().getOriginalSize());
        resp.setSha256Checksum(link.getFile().getSha256Checksum());
        resp.setOneTime(link.isOneTime());
        resp.setExpiryDate(link.getExpiryDate());
        resp.setValid(true);
        resp.setMessage("Link is valid and ready for download.");
        return resp;
    }

    @Transactional
    public DownloadLinkResult consumeAndDownload(String rawToken, HttpServletRequest request) {
        String tokenHash = sha256Service.calculateChecksum(rawToken.getBytes(StandardCharsets.UTF_8));
        SharedLink link = linkRepository.findByAccessTokenHashAndDeletedFlagFalse(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Shared link does not exist."));

        if (!link.isAccessible()) {
            auditLogService.logEvent(null, "LINK_ACCESS_REJECTED", "SHARED_LINK", link.getId().toString(), "FAILURE", "Inaccessible link download attempt", request);
            throw new BadRequestException("This link is no longer accessible (expired or already consumed).");
        }

        // Atomically increment access count
        link.setAccessCount(link.getAccessCount() + 1);
        link.setUpdatedAt(Instant.now());
        linkRepository.save(link);

        StoredFile file = link.getFile();
        byte[] encryptedBytes = storageService.loadEncryptedFile(file.getStoragePath());
        byte[] stegoBytes = storageService.loadStegoCarrier(file.getId());

        auditLogService.logEvent(
                null,
                "LINK_DOWNLOAD_SUCCESS",
                "SHARED_LINK",
                link.getId().toString(),
                "SUCCESS",
                String.format("Downloaded file '%s' via shared link (Access count: %d)", file.getOriginalFilename(), link.getAccessCount()),
                request
        );

        return new DownloadLinkResult(
                encryptedBytes,
                stegoBytes,
                file.getOriginalFilename(),
                file.getMimeType(),
                file.getSha256Checksum()
        );
    }

    @Transactional
    public void deleteLink(UUID linkId, User sharedBy) {
        SharedLink link = linkRepository.findByIdAndDeletedFlagFalse(linkId)
                .orElseThrow(() -> new ResourceNotFoundException("Link not found: " + linkId));

        if (!link.getSharedBy().getId().equals(sharedBy.getId())) {
            throw new ForbiddenException("Only the link creator can delete this link.");
        }

        link.setDeletedFlag(true);
        link.setUpdatedAt(Instant.now());
        linkRepository.save(link);
    }

    private SharedLinkResponse mapToResponse(SharedLink link) {
        SharedLinkResponse resp = new SharedLinkResponse();
        resp.setId(link.getId());
        resp.setFileId(link.getFile().getId());
        resp.setOriginalFilename(link.getFile().getOriginalFilename());
        resp.setOriginalSize(link.getFile().getOriginalSize());
        resp.setRecipientEmail(link.getRecipientEmail());
        resp.setExpiryDate(link.getExpiryDate());
        resp.setOneTime(link.isOneTime());
        resp.setAccessCount(link.getAccessCount());
        resp.setConsumed(link.isConsumed());
        resp.setExpired(link.isExpired());
        resp.setCreatedAt(link.getCreatedAt());
        return resp;
    }

    public record DownloadLinkResult(
            byte[] encryptedBytes,
            byte[] stegoBytes,
            String filename,
            String mimeType,
            String sha256Checksum
    ) {}
}
