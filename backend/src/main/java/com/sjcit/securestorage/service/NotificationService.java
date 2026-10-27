package com.sjcit.securestorage.service;

import com.sjcit.securestorage.dto.NotificationResponse;
import com.sjcit.securestorage.entity.Notification;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.exception.ResourceNotFoundException;
import com.sjcit.securestorage.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification createNotification(User user, String type, String title, String message) {
        Notification notification = new Notification(user, type, title, message);
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(User user, Pageable pageable) {
        return notificationRepository.findByUserAndDeletedFlagFalse(user, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadStatusFalseAndDeletedFlagFalse(user);
    }

    @Transactional
    public void markAsRead(UUID notificationId, User user) {
        Notification notification = notificationRepository.findByIdAndDeletedFlagFalse(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Notification not found: " + notificationId);
        }

        notification.setReadStatus(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        NotificationResponse resp = new NotificationResponse();
        resp.setId(notification.getId());
        resp.setType(notification.getType());
        resp.setTitle(notification.getTitle());
        resp.setMessage(notification.getMessage());
        resp.setReadStatus(notification.isReadStatus());
        resp.setCreatedAt(notification.getCreatedAt());
        return resp;
    }
}
