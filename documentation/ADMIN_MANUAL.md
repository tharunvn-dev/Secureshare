# SecureVault — Administrator Operations & Governance Manual

**Project Title:** A Multi-Layer Secure File Storage and Sharing Framework Using Hybrid Cryptography and Steganographic Key Management in Cloud Environments  
**Institution:** SJC Institute of Technology (SJCIT) &bull; Department of Computer Science & Engineering  
**Admin Portal Route:** `/admin/*`  

---

## 1. Administrative Philosophy & Zero-Trust Architecture

In conventional systems, "administrator" often implies unrestricted access to all data, including customer plaintext files. SecureVault enforces a **Zero-Trust, Zero-Knowledge Administrative Architecture**:

1. **Governance & Oversight, Not Plaintext Access:** Administrators possess authority over system health, storage quotas, user lifecycles, and audit compliance.
2. **Cryptographic Isolation:** File Data Encryption Keys (DEKs) are wrapped with individual users' private ECC keys. The administrative backend cannot decrypt or view customer files.
3. **Auditability:** All administrative actions (user suspensions, policy changes, metadata inspections) are permanently recorded in the immutable PostgreSQL audit trail.

---

## 2. Administrator Authentication & Provisioning

### Default Seeded Administrator
- **Email:** `admin@gmail.com`
- **Password:** As configured in initial bootstrap (e.g., `Admin@12345`)
- **Assigned Role:** `ROLE_ADMIN`

### Logging In
1. Navigate to `/login`.
2. Enter the administrator credentials.
3. Enter the 6-digit MFA OTP sent to the admin email.
4. The system automatically inspects your role claims in the issued JWT and routes you directly to `/admin/dashboard`.

> **Note:** If an authenticated user with only `ROLE_USER` attempts to navigate directly to `/admin/*`, the frontend route guard redirects them to `/app/dashboard`, and any direct backend API calls to `/api/admin/*` reject with `403 Forbidden`.

---

## 3. Administrator Portal Capabilities

### 3.1 Master System Overview (`/admin/dashboard`)
Displays high-level operational intelligence:
- **Registered Users:** Total registered accounts, segmented into **Active**, **Pending Verification**, and **Suspended**.
- **Encrypted Storage Footprint:** Total files stored and aggregate encrypted volume (KB).
- **Global File Shares:** Total user-to-user sharing authorizations.
- **Security Events & Failures:** Real-time tally of audit events and integrity verification failures.
- **Demographic Chart:** Visual bar chart of user statuses and repository distribution.
- **Recent Security Journal:** Quick-view table of the most recent audit events.

### 3.2 User Directory & Governance (`/admin/users`)
Manage user accounts and lifecycle status:
- **Search:** Query users in real-time by email address or display name.
- **Inspect Attributes:** View account registration date, assigned roles, file count, and storage used.
- **Account Suspension & Reactivation:**
  - Click **Suspend Account** to immediately revoke access for a compromised or policy-violating user. Suspended users receive `403 Forbidden` on all protected endpoints.
  - Click **Activate Account** to restore a suspended or pending account.
  - *Safety Guard:* An administrator cannot suspend their own active administrative session.

### 3.3 Storage Repository Oversight (`/admin/files`)
Inspect stored file metadata across all users:
- View File ID, Original Filename, Encrypted Size, Owner Email, SHA-256 Checksum, and Cryptographic Profile Version.
- *Zero-Trust Isolation:* Confirm that plaintext bytes remain inaccessible to administrative accounts.

### 3.4 Global Sharing Activity (`/admin/shares`)
Monitor data flow and file delegation across the organization:
- Inspect active and revoked shares.
- Track granter (owner), recipient email, grant timestamp, and revocation timestamp.

### 3.5 Security Audit Trail Explorer (`/admin/audit-logs`)
Comprehensive investigation interface for compliance and forensic analysis:
- **Action Filters:** Filter by `LOGIN`, `LOGIN_MFA`, `REGISTRATION`, `FILE_UPLOAD`, `FILE_DOWNLOAD`, `FILE_INTEGRITY_CHECK`, `FILE_SHARE`, `SHARE_REVOKE`, `ACCESS_DENIED`.
- **Status Filters:** Filter by `SUCCESS`, `FAILURE`, `WARNING`.
- **Inspector Modal:** Click the eye icon on any record to open the detailed JSON context, actor ID, client IP address, and timestamp.

### 3.6 Engine Health & Telemetry (`/admin/health`)
Real-time diagnostic probe testing all system layers:
- **Backend Service:** Spring Boot 3.3.4 runtime status.
- **Database Subsystem:** PostgreSQL 16 connectivity on port 8450.
- **Cryptographic Engine:** BouncyCastle 5-layer pipeline operational status.
- **Physical Storage:** Path-traversal guarded filesystem status (`./storage/files`).
- Click **Run Live Diagnostic** to execute an on-demand telemetry check.

### 3.7 System Configuration & Policy Baseline (`/admin/settings`)
Review non-negotiable security rules:
- Work-factor 12 BCrypt password hashing.
- Mandatory 6-digit MFA OTP with 300-second expiration.
- 5-attempt rate limit and brute-force lockout.
- 50 MB payload upload limit.
- Mailpit SMTP host (`localhost:1025`) configuration.
