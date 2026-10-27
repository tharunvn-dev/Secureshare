package com.sjcit.securestorage.controller;

import com.sjcit.securestorage.dto.ConsumeLinkResponse;
import com.sjcit.securestorage.dto.CreateShareRequest;
import com.sjcit.securestorage.dto.CreateSharedLinkRequest;
import com.sjcit.securestorage.dto.FileShareResponse;
import com.sjcit.securestorage.dto.SharedLinkResponse;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.service.FileShareService;
import com.sjcit.securestorage.service.SharedLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/shares")
@Tag(name = "Sharing", description = "User-to-user cryptographic file sharing and expiring/one-time shared links")
public class ShareController {

    private final FileShareService fileShareService;
    private final SharedLinkService sharedLinkService;

    public ShareController(FileShareService fileShareService, SharedLinkService sharedLinkService) {
        this.fileShareService = fileShareService;
        this.sharedLinkService = sharedLinkService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Share file with another registered user using ECDH key re-wrapping")
    public ResponseEntity<FileShareResponse> shareFile(
            @Valid @RequestBody CreateShareRequest request,
            @RequestHeader(value = "X-Private-Key", required = false) String privateKeyHeader,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest) {

        FileShareResponse response = fileShareService.shareFileWithUser(
                request.getFileId(),
                request.getRecipientEmail(),
                privateKeyHeader,
                user,
                httpRequest
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/incoming")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List files shared with the current user")
    public ResponseEntity<Page<FileShareResponse>> listIncomingShares(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal User user) {
        Page<FileShareResponse> shares = fileShareService.listIncomingShares(user, pageable);
        return ResponseEntity.ok(shares);
    }

    @GetMapping("/outgoing")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List shares created by the current user")
    public ResponseEntity<Page<FileShareResponse>> listOutgoingShares(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal User user) {
        Page<FileShareResponse> shares = fileShareService.listOutgoingShares(user, pageable);
        return ResponseEntity.ok(shares);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@authZ.canAccessShare(#id, authentication)")
    @Operation(summary = "Revoke an active file share")
    public ResponseEntity<Void> revokeShare(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest) {
        fileShareService.revokeShare(id, user, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/link")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create an expiring or one-time shared bearer link")
    public ResponseEntity<SharedLinkResponse> createSharedLink(
            @Valid @RequestBody CreateSharedLinkRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest) {
        SharedLinkResponse response = sharedLinkService.createSharedLink(request, user, httpRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/link/my-links")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List shared links created by current user")
    public ResponseEntity<Page<SharedLinkResponse>> listMyLinks(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal User user) {
        Page<SharedLinkResponse> links = sharedLinkService.listUserLinks(user, pageable);
        return ResponseEntity.ok(links);
    }

    @GetMapping("/link/{token}")
    @Operation(summary = "Inspect shared link validity and file metadata (Public)")
    public ResponseEntity<ConsumeLinkResponse> getLinkDetails(
            @PathVariable String token,
            HttpServletRequest httpRequest) {
        ConsumeLinkResponse response = sharedLinkService.getLinkDetails(token, httpRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/link/{token}/consume")
    @Operation(summary = "Consume shared link and download file (Public, atomically enforces single-use)")
    public ResponseEntity<ByteArrayResource> consumeAndDownload(
            @PathVariable String token,
            HttpServletRequest httpRequest) {

        SharedLinkService.DownloadLinkResult result = sharedLinkService.consumeAndDownload(token, httpRequest);
        ByteArrayResource resource = new ByteArrayResource(result.encryptedBytes());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.filename() + ".enc\"")
                .header("X-Checksum-SHA256", result.sha256Checksum())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(result.encryptedBytes().length)
                .body(resource);
    }

    @DeleteMapping("/link/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete/revoke a shared link")
    public ResponseEntity<Void> deleteLink(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        sharedLinkService.deleteLink(id, user);
        return ResponseEntity.noContent().build();
    }
}
