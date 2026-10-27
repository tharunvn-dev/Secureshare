package com.sjcit.securestorage.repository;

import com.sjcit.securestorage.entity.FileShare;
import com.sjcit.securestorage.entity.StoredFile;
import com.sjcit.securestorage.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileShareRepository extends JpaRepository<FileShare, UUID> {

    Optional<FileShare> findByIdAndDeletedFlagFalse(UUID id);

    Optional<FileShare> findByFileAndRecipientAndStatusAndDeletedFlagFalse(StoredFile file, User recipient, String status);

    List<FileShare> findByRecipientAndStatusAndDeletedFlagFalseOrderByCreatedAtDesc(User recipient, String status);

    Page<FileShare> findByRecipientAndStatusAndDeletedFlagFalse(User recipient, String status, Pageable pageable);

    List<FileShare> findByOwnerAndStatusAndDeletedFlagFalseOrderByCreatedAtDesc(User owner, String status);

    Page<FileShare> findByOwnerAndDeletedFlagFalse(User owner, Pageable pageable);

    long countByOwnerAndStatusAndDeletedFlagFalse(User owner, String status);

    long countByRecipientAndStatusAndDeletedFlagFalse(User recipient, String status);

    long countByStatusAndDeletedFlagFalse(String status);

    @Query("SELECT fs FROM FileShare fs WHERE fs.file = :file AND fs.deletedFlag = false")
    List<FileShare> findAllByFile(@Param("file") StoredFile file);
}
