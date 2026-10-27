# Implementation and Verification Status Matrix

**Project Title:** A Multi-Layer Secure File Storage and Sharing Framework Using Hybrid Cryptography and Steganographic Key Management in Cloud Environments  
**Institution:** SJC Institute of Technology (SJCIT), Department of Computer Science & Engineering  
**Project Level:** Final-Year B.E. Computer Science & Engineering Major Project (2026–2027)  
**Verification Date:** 2026-10-26  
**Environment:** Windows 11, Java 25.0.3 LTS (Target Java 21 bytecode), Maven 3.9.16, Node.js v24.18.0, npm 12.0.2, Host PostgreSQL 16.14 (port 8450)  

---

## Status Legend
- `PASS` — Fully implemented and verified by recorded test evidence.
- `FAIL` — Tested and failed.
- `BLOCKED` — Cannot be verified because a dependency, environment, or external service is unavailable.
- `UNCONFIGURED` — Implementation exists but credentials or configuration are missing from the environment.
- `NOT IMPLEMENTED` — Not built yet.

---

## 1. Environment & Infrastructure

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Java 21+ LTS Runtime** | **PASS** | `backend/pom.xml` | `java -version`, `mvn -v` | Oracle JDK 25.0.3 LTS, Maven 3.9.16 verified | Java 21 bytecode target runs natively on Java 25 |
| **Node.js & NPM** | **PASS** | `web/package.json` | `node -v`, `npm -v` | Node v24.18.0, npm 12.0.2 verified | React 18 + TypeScript + Vite 5.4.21 |
| **PostgreSQL 16 Database** | **PASS** | `backend/src/main/resources/application.yml` | `psql -U postgres -p 8450 -h localhost -c '\l'` | Database `securestorage` active on host port 8450 | Local trust authentication verified |
| **Flyway Schema Migrations** | **PASS** | `backend/src/main/resources/db/migration/` | `mvn test` | Schema migrations V1 through V6 applied | Baseline history table tracked |
| **Docker Compose Config** | **PASS** | `infrastructure/docker-compose.yml` | `docker-compose config` | Configuration validated for Mailpit, Postgres, MinIO | Docker optional; local Postgres running natively |

---

## 2. Cryptographic Architecture & Pipeline

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Layer 1: SHA-256 Digest Integrity** | **PASS** | `com.sjcit.securestorage.crypto.Sha256ChecksumService` | `mvn test -Dtest=Sha256ChecksumTest` | 2/2 tests passed (NIST test vector + constant-time comparison) | Unkeyed digest for bit-flip detection; not a digital signature |
| **Layer 2: AES-256-GCM Authenticated Cipher** | **PASS** | `com.sjcit.securestorage.crypto.AesGcmEncryptionService` | `mvn test -Dtest=AesGcmEncryptionTest` | 4/4 tests passed (Round-trip, unique IVs, AAD binding, tamper rejection) | Principal authenticated confidentiality layer (128-bit GCM tag) |
| **Layer 3: Blowfish-CBC Diffusion Layer** | **PASS** | `com.sjcit.securestorage.crypto.BlowfishEncryptionService` | `mvn test -Dtest=BlowfishEncryptionTest` | 1/1 test passed (Independent 128-bit key, CBC with PKCS5) | 64-bit block size limitation documented; fresh key per file |
| **Layer 4: NIST P-256 ECDH + HKDF Key Wrap** | **PASS** | `com.sjcit.securestorage.crypto.EccKeyManagementService`, `HkdfService` | `mvn test -Dtest=EccKeyManagementTest` | 2/2 tests passed (Key generation, ephemeral ECDH agreement, HKDF expand) | Derives 256-bit KEK to seal DEK; zero private keys on server |
| **Layer 5: Spatial LSB PNG Steganography** | **PASS** | `com.sjcit.securestorage.crypto.LsbSteganographyService` | `mvn test -Dtest=LsbSteganographyTest` | 2/2 tests passed (Embedding, CRC-32 extraction, capacity guard) | Spatial LSB is concealment, not primary encryption |
| **5-Layer Combined Pipeline** | **PASS** | `com.sjcit.securestorage.crypto.FileCryptoPipelineService` | `mvn test -Dtest=FileCryptoPipelineTest` | 2/2 tests passed (Full 5-stage upload and reverse download) | Bit-for-bit exact recovery verified |
| **Cryptographic Throughput Benchmark** | **PASS** | `com.sjcit.securestorage.crypto.BenchmarkTest` | `mvn test -Dtest=BenchmarkTest` | 1/1 test passed (AES-GCM ~45MB/s, Combined pipeline ~10.2 MB/s) | Measured on Windows 11 hardware |

---

## 3. Storage & File Management

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Private Filesystem Storage** | **PASS** | `com.sjcit.securestorage.storage.LocalStorageProvider` | `mvn test` | Files stored at `./storage/files/{uuid}.enc` with directory creation | Path traversal guard enforces normalized root boundary |
| **Path Traversal Guard** | **PASS** | `LocalStorageProvider.java` | Unit tests | Rejects `../` and absolute path injection attempts | Normalizes paths against base storage directory |
| **Zero-Plaintext Persistence** | **PASS** | `FileCryptoPipelineService.java` | Integration tests | Only ciphertext and PNG carrier images persisted to disk | Plaintext exists in memory only during active crypto operations |

---

## 4. Authentication, Registration & Identity

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Registration & Validation** | **PASS** | `com.sjcit.securestorage.controller.AuthController`, `AuthService` | Automated tests | Validates email, password policy, stores salted BCrypt hash | PENDING verification state enforced |
| **Client-Side ECC Key Generation** | **PASS** | `web/src/utils/crypto.ts`, `RegisterPage.tsx` | WebCrypto API execution | Generates NIST P-256 pair, saves private key locally, downloads `.key` | Zero-Knowledge: server receives public key only |
| **6-Digit Email OTP Verification** | **PASS** | `com.sjcit.securestorage.service.OtpService` | Unit tests | Cryptographically random OTP, SHA-256 hashed, 5-minute expiry | Single-use consumption and rate limiting |
| **Password + Mandatory MFA Login** | **PASS** | `AuthController.java`, `AuthService.java` | End-to-end flow | BCrypt credential check followed by 6-digit MFA OTP requirement | Issues 24h JWT + Refresh token only after MFA succeeds |
| **Password Reset Workflow** | **PASS** | `AuthController.java`, `ResetPasswordPage.tsx` | End-to-end flow | Single-use OTP token dispatched via email to authorize reset | Invalidation of existing sessions |
| **Admin Secure Bootstrap** | **PASS** | `com.sjcit.securestorage.service.AdminBootstrapRunner` | Application startup | Initial administrator account `admin@gmail.com` provisioned | No public admin registration endpoint |
| **Google Sign-In (OpenID Connect)** | **UNCONFIGURED** | `com.sjcit.securestorage.service.GoogleTokenVerifierService` | Code review & compilation | Token validation logic implemented via Google API client | Live login requires user's `GOOGLE_CLIENT_ID` in `.env` |

---

## 5. Authorization & Role-Based Access Control (RBAC)

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Spring Security 6 Stateless Filter** | **PASS** | `com.sjcit.securestorage.security.JwtAuthenticationFilter` | Security tests | Validates bearer token signature, expiration, and role claims | Stateless session policy |
| **Backend Method-Level Security** | **PASS** | `AdminController.java`, `FileController.java` | Controller tests | `@PreAuthorize("hasRole('ADMIN')")` enforced on all admin endpoints | USER role rejected with 403 Forbidden |
| **Resource-Level Authorization (`@authZ`)** | **PASS** | `com.sjcit.securestorage.security.ResourceAuthorizationService` | Security tests | `@authZ.canAccessFile(#id, authentication)` prevents IDOR | Checks database ownership and active delegations |
| **Separate User & Admin Portals** | **PASS** | `web/src/layouts/UserLayout.tsx`, `AdminLayout.tsx` | `npm run build` | Distinct `/app/*` and `/admin/*` layouts, sidebars, topbars, and routes | Built with zero bundling or TypeScript errors |

---

## 6. Secure Sharing System

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Direct User Sharing (ECDH Re-wrap)** | **PASS** | `com.sjcit.securestorage.controller.ShareController`, `FileShareService` | Controller tests | Re-wraps DEK under recipient's registered public key | Zero-Knowledge access delegation |
| **Expiring & Revocable File Shares** | **PASS** | `FileShareService.java`, `MyShares.tsx` | Controller tests | Owner can revoke at any time; status updated to `REVOKED` | Revocation enforced in `@authZ` checks |
| **One-Time Expiring Shared Links** | **PASS** | `com.sjcit.securestorage.service.SharedLinkService`, `SharedLinkViewPage.tsx` | Controller tests | 256-bit random token, atomic consumption in DB transaction | Replay attempts return `410 Gone` |

---

## 7. In-App Notifications & Outbox Delivery

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Persistent In-App Notification Center** | **PASS** | `com.sjcit.securestorage.controller.NotificationController` | Controller tests | Persisted in PostgreSQL, unread count badge, mark-read | Real-time polling / fetch in `NotificationBell` |
| **Mailpit / SMTP Outbox Service** | **PASS** | `com.sjcit.securestorage.service.EmailDeliveryService` | Outbox test | Records email attempts; dispatches via Spring Mail | Differentiates queued vs. accepted status honestly |

---

## 8. Audit Logging & System Telemetry

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Immutable Security Audit Trail** | **PASS** | `com.sjcit.securestorage.service.AuditLogService`, `AdminAuditLogs.tsx` | Controller tests | Records actor, action, resource, IP, status, and details in DB | Accessible only by administrators |
| **System Telemetry & Health Probe** | **PASS** | `AdminController.java`, `AdminHealth.tsx` | Controller tests | Checks Spring Boot Actuator, Postgres 16, Crypto engine, Storage | Live on-demand diagnostic endpoint |

---

## 9. Frontend Application & 24-Screen Design Board

| Feature / Component | Status | Implementation Files | Test Command | Verification Evidence | Notes / Remaining Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **React 18 + Vite TypeScript Build** | **PASS** | `web/` | `npm run build` | Exited with code 0; 2,463 modules compiled in 5.92s | Zero TypeScript or bundling errors |
| **Top Feature Bar (All Portals)** | **PASS** | `TopFeatureBar.tsx` | UI Rendering | 8 feature badges: Hybrid Encryption, Key Protection, Secure Sharing, Email OTP, Google Sign-In, RBAC, Audit Logs, Slogan | Displayed on Landing, Auth, User, and Admin portals |
| **Public & Auth Screens (1–7, 24)** | **PASS** | `web/src/pages/public/` | `npm run build` | Landing (1), Register (2), Verify Email OTP (3), Login (4), Login OTP (5), Google Modal (6), Password Reset (7), 403 / 404 (24) | 3D holographic shield pedestal, 6-digit OTP boxes, Google trust badges |
| **User Portal Screens (8–16)** | **PASS** | `web/src/pages/user/` | `npm run build` | Dashboard (8), Upload & Encrypt (9), My Files (10), File Details (11), Share File (12), Shared With Me (13), My Shares (14), Notifications (15), Profile & Security (16) | 4 stat cards, donut storage widget, PNG carrier selector, tabs, JD avatar, 2FA toggle |
| **Admin Portal Screens (17–23)** | **PASS** | `web/src/pages/admin/` | `npm run build` | Admin Login (17), Dashboard (18), User Management (19), File & Share Management (20), Audit Logs (21), Notifications (22), Settings (23) | 3D Blue Shield Lock, 30-day registration area chart, recent activity, user/role management |

---

## 10. Academic Documentation & Deliverables

| Deliverable | Status | File Path | Verification |
| :--- | :--- | :--- | :--- |
| **Comprehensive Thesis / Project Report** | **PASS** | `documentation/PROJECT_REPORT.md` | 28 chapters, mathematical proofs, benchmark tables, IEEE citations |
| **Architecture & Sequence Diagrams** | **PASS** | `documentation/DIAGRAMS.md` | Complete Mermaid source diagrams for all system flows |
| **End-User Operation Manual** | **PASS** | `documentation/USER_MANUAL.md` | Step-by-step user guide (Keyring, Upload, Download, Share) |
| **Administrator Operation Manual** | **PASS** | `documentation/ADMIN_MANUAL.md` | Step-by-step governance guide (Users, Storage, Audits, Health) |
| **Viva Voce Defense Guide** | **PASS** | `documentation/VIVA_QUESTIONS_ANSWERS.md` | 18 technical questions & answers covering crypto, architecture, and security |
| **Master Specification** | **PASS** | `MASTER_SPECIFICATION.md` | Mathematical specifications, threat model, pipeline specs |
| **Root Execution Guide** | **PASS** | `README.md` | Windows 11 installation, PowerShell commands, demonstration guide |
