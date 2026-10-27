package com.sjcit.securestorage.repository;

import com.sjcit.securestorage.entity.AuditLog;
import com.sjcit.securestorage.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByDeletedFlagFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByUserAndDeletedFlagFalseOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.deletedFlag = false AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:resourceType IS NULL OR a.resourceType = :resourceType) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> filterAuditLogs(
        @Param("action") String action,
        @Param("status") String status,
        @Param("resourceType") String resourceType,
        Pageable pageable
    );

    List<AuditLog> findTop10ByDeletedFlagFalseOrderByCreatedAtDesc();

    long countByStatusAndDeletedFlagFalse(String status);
}
