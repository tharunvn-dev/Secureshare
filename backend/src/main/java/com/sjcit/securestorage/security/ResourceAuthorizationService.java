package com.sjcit.securestorage.security;

import com.sjcit.securestorage.entity.FileShare;
import com.sjcit.securestorage.entity.StoredFile;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.repository.FileShareRepository;
import com.sjcit.securestorage.repository.StoredFileRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service("authZ")
public class ResourceAuthorizationService {

    private final StoredFileRepository fileRepository;
    private final FileShareRepository shareRepository;

    public ResourceAuthorizationService(StoredFileRepository fileRepository, FileShareRepository shareRepository) {
        this.fileRepository = fileRepository;
        this.shareRepository = shareRepository;
    }

    public boolean isOwnerOfFile(UUID fileId, Authentication authentication) {
        if (fileId == null || authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return false;
        }
        Optional<StoredFile> fileOpt = fileRepository.findByIdAndDeletedFlagFalse(fileId);
        return fileOpt.map(file -> file.getOwner().getId().equals(user.getId())).orElse(false);
    }

    public boolean canAccessFile(UUID fileId, Authentication authentication) {
        if (fileId == null || authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return false;
        }
        Optional<StoredFile> fileOpt = fileRepository.findByIdAndDeletedFlagFalse(fileId);
        if (fileOpt.isEmpty()) {
            return false;
        }
        StoredFile file = fileOpt.get();

        // Check if user is owner
        if (file.getOwner().getId().equals(user.getId())) {
            return true;
        }

        // Check if user is active recipient of a share
        Optional<FileShare> shareOpt = shareRepository.findByFileAndRecipientAndStatusAndDeletedFlagFalse(file, user, "ACTIVE");
        return shareOpt.isPresent();
    }

    public boolean canAccessShare(UUID shareId, Authentication authentication) {
        if (shareId == null || authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return false;
        }
        Optional<FileShare> shareOpt = shareRepository.findByIdAndDeletedFlagFalse(shareId);
        if (shareOpt.isEmpty()) {
            return false;
        }
        FileShare share = shareOpt.get();
        return share.getOwner().getId().equals(user.getId()) || share.getRecipient().getId().equals(user.getId());
    }
}
