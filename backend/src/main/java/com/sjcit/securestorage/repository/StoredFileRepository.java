package com.sjcit.securestorage.repository;

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
public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByIdAndDeletedFlagFalse(UUID id);

    List<StoredFile> findByOwnerAndDeletedFlagFalseOrderByCreatedAtDesc(User owner);

    Page<StoredFile> findByOwnerAndDeletedFlagFalse(User owner, Pageable pageable);

    @Query("SELECT f FROM StoredFile f WHERE f.owner = :owner AND f.deletedFlag = false AND " +
           "(cast(:query as string) IS NULL OR LOWER(f.originalFilename) LIKE LOWER(CONCAT('%', cast(:query as string), '%')))")
    Page<StoredFile> searchOwnerFiles(@Param("owner") User owner, @Param("query") String query, Pageable pageable);

    long countByOwnerAndDeletedFlagFalse(User owner);

    long countByDeletedFlagFalse();

    @Query("SELECT COALESCE(SUM(f.encryptedSize), 0) FROM StoredFile f WHERE f.deletedFlag = false")
    long getTotalEncryptedStorageUsed();

    @Query("SELECT COALESCE(SUM(f.encryptedSize), 0) FROM StoredFile f WHERE f.owner = :owner AND f.deletedFlag = false")
    long getStorageUsedByOwner(@Param("owner") User owner);

    Page<StoredFile> findByDeletedFlagFalseOrderByCreatedAtDesc(Pageable pageable);
}
