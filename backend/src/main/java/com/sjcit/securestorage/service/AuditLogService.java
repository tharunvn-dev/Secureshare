package com.sjcit.securestorage.service;

import com.sjcit.securestorage.dto.AdminAuditResponse;
import com.sjcit.securestorage.entity.AuditLog;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.repository.AuditLogRepository;
import com.sjcit.securestorage.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(
            User user,
            String action,
            String resourceType,
            String resourceId,
            String status,
            String details,
            HttpServletRequest request) {

        String ipAddress = "127.0.0.1";
        if (request != null) {
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isBlank()) {
                ipAddress = xfHeader.split(",")[0].trim();
            } else {
                ipAddress = request.getRemoteAddr();
            }
        }

        User attachedUser = user;
        String logDetails = details;
        if (user != null && user.getId() != null) {
            // Verify if user is committed and visible to this isolated transaction
            if (!userRepository.existsById(user.getId())) {
                attachedUser = null;
                logDetails = (logDetails != null ? logDetails + " | " : "") + "Actor Email: " + user.getEmail();
            }
        }

        AuditLog auditLog = new AuditLog(attachedUser, action, resourceType, resourceId, ipAddress, status, logDetails);
        try {
            auditLogRepository.saveAndFlush(auditLog);
            log.info("AUDIT [{} - {}]: user={}, resource={}:{}, status={}, ip={}",
                    action, status, user != null ? user.getEmail() : "anonymous",
                    resourceType, resourceId, status, ipAddress);
        } catch (Exception e) {
            log.error("Failed to write persistent audit log: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<AdminAuditResponse> filterAuditLogs(
            String action,
            String status,
            String resourceType,
            Pageable pageable) {

        Page<AuditLog> page = auditLogRepository.filterAuditLogs(action, status, resourceType, pageable);
        return page.map(this::mapToResponse);
    }

    private AdminAuditResponse mapToResponse(AuditLog log) {
        AdminAuditResponse resp = new AdminAuditResponse();
        resp.setId(log.getId());
        if (log.getUser() != null) {
            resp.setUserId(log.getUser().getId());
            resp.setUserEmail(log.getUser().getEmail());
        }
        resp.setAction(log.getAction());
        resp.setResourceType(log.getResourceType());
        resp.setResourceId(log.getResourceId());
        resp.setIpAddress(log.getIpAddress());
        resp.setStatus(log.getStatus());
        resp.setDetails(log.getDetails());
        resp.setCreatedAt(log.getCreatedAt());
        return resp;
    }
}
