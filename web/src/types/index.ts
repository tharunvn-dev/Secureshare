export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  mfaEnabled: boolean;
  publicKeyEcc?: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface StoredFile {
  id: string;
  originalFilename: string;
  mimeType: string;
  originalSize: number;
  encryptedSize: number;
  sha256Checksum: string;
  cryptoProfileVersion: string;
  createdAt: string;
  updatedAt?: string;
  ownerEmail: string;
  ownerName: string;
  isOwner: boolean;
}

export interface FileShare {
  id: string;
  fileId: string;
  originalFilename: string;
  originalSize: number;
  ownerEmail: string;
  ownerName: string;
  recipientEmail: string;
  recipientName: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  createdAt: string;
  revokedAt?: string;
}

export interface SharedLink {
  id: string;
  fileId: string;
  originalFilename: string;
  originalSize: number;
  token?: string;
  shareUrl?: string;
  recipientEmail?: string;
  expiryDate: string;
  isOneTime: boolean;
  accessCount: number;
  isConsumed: boolean;
  isExpired: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  totalFiles: number;
  totalEncryptedStorageBytes: number;
  totalShares: number;
  totalAuditEvents: number;
  integrityFailures: number;
  systemHealthStatus: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  mfaEnabled: boolean;
  roles: string[];
  fileCount: number;
  storageUsedBytes: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  mfaRequired: boolean;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresInMs?: number;
  user?: User;
  message?: string;
  devOtp?: string;
}

export interface FileIntegrityResult {
  fileId: string;
  originalFilename: string;
  expectedSha256Checksum: string;
  calculatedSha256Checksum: string;
  integrityValid: boolean;
  verifiedAt: string;
  statusMessage: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
