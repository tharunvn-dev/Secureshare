package com.sjcit.securestorage.dto;

public class AdminStatsResponse {

    private long totalUsers;
    private long activeUsers;
    private long pendingUsers;
    private long suspendedUsers;
    private long totalFiles;
    private long totalEncryptedStorageBytes;
    private long totalShares;
    private long totalAuditEvents;
    private long integrityFailures;
    private String systemHealthStatus = "UP";

    public AdminStatsResponse() {
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getPendingUsers() {
        return pendingUsers;
    }

    public void setPendingUsers(long pendingUsers) {
        this.pendingUsers = pendingUsers;
    }

    public long getSuspendedUsers() {
        return suspendedUsers;
    }

    public void setSuspendedUsers(long suspendedUsers) {
        this.suspendedUsers = suspendedUsers;
    }

    public long getTotalFiles() {
        return totalFiles;
    }

    public void setTotalFiles(long totalFiles) {
        this.totalFiles = totalFiles;
    }

    public long getTotalEncryptedStorageBytes() {
        return totalEncryptedStorageBytes;
    }

    public void setTotalEncryptedStorageBytes(long totalEncryptedStorageBytes) {
        this.totalEncryptedStorageBytes = totalEncryptedStorageBytes;
    }

    public long getTotalShares() {
        return totalShares;
    }

    public void setTotalShares(long totalShares) {
        this.totalShares = totalShares;
    }

    public long getTotalAuditEvents() {
        return totalAuditEvents;
    }

    public void setTotalAuditEvents(long totalAuditEvents) {
        this.totalAuditEvents = totalAuditEvents;
    }

    public long getIntegrityFailures() {
        return integrityFailures;
    }

    public void setIntegrityFailures(long integrityFailures) {
        this.integrityFailures = integrityFailures;
    }

    public String getSystemHealthStatus() {
        return systemHealthStatus;
    }

    public void setSystemHealthStatus(String systemHealthStatus) {
        this.systemHealthStatus = systemHealthStatus;
    }
}
