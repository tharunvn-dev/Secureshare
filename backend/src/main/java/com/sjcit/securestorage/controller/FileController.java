package com.sjcit.securestorage.controller;

import com.sjcit.securestorage.dto.FileIntegrityResponse;
import com.sjcit.securestorage.dto.FileMetadataResponse;
import com.sjcit.securestorage.dto.FileUploadResponse;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@Tag(name = "Files", description = "Multi-layer file encryption, upload, download, and integrity verification")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Encrypt and securely store a new file through the 5-layer pipeline")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "carrier", required = false) MultipartFile carrier,
            @RequestParam(value = "carrierImage", required = false) MultipartFile carrierImage,
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {
        MultipartFile activeCarrier = (carrier != null && !carrier.isEmpty()) ? carrier : carrierImage;
        FileUploadResponse response = fileService.uploadFile(file, activeCarrier, user, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "List files owned by the current authenticated user")
    public ResponseEntity<Page<FileMetadataResponse>> listUserFiles(
            @RequestParam(value = "query", required = false) String query,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal User user) {
        Page<FileMetadataResponse> page = fileService.listUserFiles(user, query, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authZ.canAccessFile(#id, authentication)")
    @Operation(summary = "Get file metadata and cryptographic properties")
    public ResponseEntity<FileMetadataResponse> getFileMetadata(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        FileMetadataResponse metadata = fileService.getFileMetadata(id, user);
        return ResponseEntity.ok(metadata);
    }

    @RequestMapping(value = "/{id}/download", method = {RequestMethod.GET, RequestMethod.POST})
    @PreAuthorize("@authZ.canAccessFile(#id, authentication)")
    @Operation(summary = "Decrypt and download a file using user's ECC private key")
    public ResponseEntity<ByteArrayResource> downloadFile(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            @RequestHeader(value = "X-Private-Key", required = false) String privateKeyHeader,
            @RequestParam(value = "privateKey", required = false) String privateKeyParam,
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {

        String privateKey = null;
        if (body != null && body.containsKey("privateKey") && body.get("privateKey") != null && !body.get("privateKey").isBlank()) {
            privateKey = body.get("privateKey");
        } else if (privateKeyHeader != null && !privateKeyHeader.isBlank()) {
            privateKey = privateKeyHeader;
        } else if (privateKeyParam != null && !privateKeyParam.isBlank()) {
            privateKey = privateKeyParam;
        }

        FileService.DecryptedFileResult result = fileService.downloadFile(id, privateKey, user, request);

        ByteArrayResource resource = new ByteArrayResource(result.content());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.filename() + "\"")
                .header("X-Checksum-SHA256", result.sha256Checksum())
                .contentType(MediaType.parseMediaType(result.mimeType()))
                .contentLength(result.content().length)
                .body(resource);
    }

    @RequestMapping(value = "/{id}/integrity", method = {RequestMethod.GET, RequestMethod.POST})
    @PreAuthorize("@authZ.canAccessFile(#id, authentication)")
    @Operation(summary = "Verify file integrity against stored SHA-256 hash")
    public ResponseEntity<FileIntegrityResponse> verifyFileIntegrity(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            @RequestHeader(value = "X-Private-Key", required = false) String privateKeyHeader,
            @RequestParam(value = "privateKey", required = false) String privateKeyParam,
            @AuthenticationPrincipal User user) {

        String privateKey = null;
        if (body != null && body.containsKey("privateKey") && body.get("privateKey") != null && !body.get("privateKey").isBlank()) {
            privateKey = body.get("privateKey");
        } else if (privateKeyHeader != null && !privateKeyHeader.isBlank()) {
            privateKey = privateKeyHeader;
        } else if (privateKeyParam != null && !privateKeyParam.isBlank()) {
            privateKey = privateKeyParam;
        }

        FileIntegrityResponse response = fileService.verifyFileIntegrity(id, privateKey, user);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@authZ.isOwnerOfFile(#id, authentication)")
    @Operation(summary = "Delete an owned file and its associated encrypted storage")
    public ResponseEntity<Void> deleteFile(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {
        fileService.deleteFile(id, user, request);
        return ResponseEntity.noContent().build();
    }
}
