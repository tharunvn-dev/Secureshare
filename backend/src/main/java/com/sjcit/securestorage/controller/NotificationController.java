package com.sjcit.securestorage.controller;

import com.sjcit.securestorage.dto.NotificationResponse;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "In-app persistent notification center and alert management")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List persistent notifications for authenticated user")
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal User user) {
        Page<NotificationResponse> page = notificationService.getUserNotifications(user, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get count of unread notifications for badge display")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark all unread notifications as read")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }
}
