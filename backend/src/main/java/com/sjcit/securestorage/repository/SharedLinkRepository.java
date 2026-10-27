package com.sjcit.securestorage.repository;

import com.sjcit.securestorage.entity.SharedLink;
import com.sjcit.securestorage.entity.StoredFile;
import com.sjcit.securestorage.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SharedLinkRepository extends JpaRepository<SharedLink, UUID> {

    Optional<SharedLink> findByIdAndDeletedFlagFalse(UUID id);

    Optional<SharedLink> findByAccessTokenHashAndDeletedFlagFalse(String accessTokenHash);

    List<SharedLink> findBySharedByAndDeletedFlagFalseOrderByCreatedAtDesc(User sharedBy);

    Page<SharedLink> findBySharedByAndDeletedFlagFalse(User sharedBy, Pageable pageable);

    List<SharedLink> findByFileAndDeletedFlagFalse(StoredFile file);

    long countBySharedByAndDeletedFlagFalse(User sharedBy);
}
