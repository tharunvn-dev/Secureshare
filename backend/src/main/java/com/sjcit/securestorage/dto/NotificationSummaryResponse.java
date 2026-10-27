package com.sjcit.securestorage.dto;

import java.util.List;

public class NotificationSummaryResponse {

    private long unreadCount;
    private List<NotificationResponse> recentNotifications;

    public NotificationSummaryResponse() {
    }

    public NotificationSummaryResponse(long unreadCount, List<NotificationResponse> recentNotifications) {
        this.unreadCount = unreadCount;
        this.recentNotifications = recentNotifications;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public List<NotificationResponse> getRecentNotifications() {
        return recentNotifications;
    }

    public void setRecentNotifications(List<NotificationResponse> recentNotifications) {
        this.recentNotifications = recentNotifications;
    }
}
