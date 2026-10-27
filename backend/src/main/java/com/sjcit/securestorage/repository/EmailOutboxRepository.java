package com.sjcit.securestorage.repository;

import com.sjcit.securestorage.entity.EmailOutbox;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, UUID> {

    List<EmailOutbox> findByStatusOrderByCreatedAtAsc(String status);

    Page<EmailOutbox> findByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(String status);
}
