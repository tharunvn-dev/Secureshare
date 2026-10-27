# System Architecture & Cryptographic Sequence Diagrams

**Project Title:** A Multi-Layer Secure File Storage and Sharing Framework Using Hybrid Cryptography and Steganographic Key Management in Cloud Environments  
**Institution:** SJC Institute of Technology (SJCIT), Department of Computer Science & Engineering  

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    Client["Client Web Browser (React 18 + TypeScript)"]
    WebCrypto["WebCrypto API (NIST P-256 Keypair)"]
    Gateway["Spring Boot 3 Reverse Proxy / Filter Chain"]
    AuthService["Auth & Session Service (JWT + OTP)"]
    CryptoEngine["5-Layer Hybrid Cryptographic Engine"]
    Storage["Private Encrypted Local Filesystem"]
    Postgres[("PostgreSQL 16 Database")]
    Mailpit["Mailpit Local SMTP Relay"]

    Client <-->|"HTTPS / REST"| Gateway
    Client <-->|"Local Keygen"| WebCrypto
    Gateway <-->|"Stateless Auth"| AuthService
    Gateway <-->|"Cipher Operations"| CryptoEngine
    CryptoEngine <-->|"Encrypted Payloads & PNG"| Storage
    Gateway <-->|"JPA / Flyway"| Postgres
    AuthService <-->|"Outbox Dispatch"| Mailpit
```

---

## 2. Component Diagram

```mermaid
graph LR
    subgraph Frontend ["Frontend Portal (React 18 + Vite)"]
        UserUI["User Portal (/app/*)"]
        AdminUI["Admin Portal (/admin/*)"]
        KeyringContext["Auth & Keyring Context"]
        AxiosClient["Axios Interceptor (Bearer + X-Private-Key)"]
    end

    subgraph BackendCore ["Spring Boot 3 Backend Core"]
        SecFilter["Security Filter Chain (JWT)"]
        Controllers["REST Controllers (Auth, File, Share, Admin, Notif)"]
        Services["Domain Services (FileService, ShareService, AdminService)"]
    end

    subgraph CryptoLayer ["5-Layer Hybrid Cryptosystem"]
        L1["L1: SHA-256 Digest"]
        L2["L2: AES-256-GCM (DEK)"]
        L3["L3: Blowfish-CBC (Cascaded)"]
        L4["L4: NIST P-256 ECDH + HKDF"]
        L5["L5: Spatial LSB PNG Stego"]
    end

    subgraph StorageInfra ["Persistence & Storage"]
        DB[("PostgreSQL 16 (Port 8450)")]
        DiskStorage["./storage/files (Path-Protected)"]
    end

    UserUI --> AxiosClient
    AdminUI --> AxiosClient
    KeyringContext --> AxiosClient
    AxiosClient --> SecFilter
    SecFilter --> Controllers
    Controllers --> Services
    Services --> CryptoLayer
    CryptoLayer --> DiskStorage
    Services --> DB
```

---

## 3. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ STORED_FILES : owns
    USERS ||--o{ FILE_SHARES : grants
    USERS ||--o{ FILE_SHARES : receives
    USERS ||--o{ SHARED_LINKS : creates
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : triggers
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned

    USERS {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR status
        BOOLEAN mfa_enabled
        TEXT public_key_ecc
        TIMESTAMP created_at
    }

    STORED_FILES {
        UUID id PK
        UUID user_id FK
        VARCHAR original_filename
        VARCHAR mime_type
        BIGINT original_size
        BIGINT encrypted_size
        VARCHAR sha256_checksum
        VARCHAR storage_path
        VARCHAR stego_carrier_path
        VARCHAR crypto_profile_version
        TIMESTAMP created_at
    }

    FILE_SHARES {
        UUID id PK
        UUID file_id FK
        UUID owner_id FK
        UUID recipient_id FK
        TEXT encrypted_key_envelope
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP revoked_at
    }

    SHARED_LINKS {
        UUID id PK
        UUID file_id FK
        UUID user_id FK
        VARCHAR token UK
        TIMESTAMP expiry_date
        BOOLEAN is_one_time
        INT access_count
        BOOLEAN is_consumed
        TIMESTAMP created_at
    }

    NOTIFICATIONS {
        UUID id PK
        UUID user_id FK
        VARCHAR type
        VARCHAR title
        TEXT message
        BOOLEAN read_status
        TIMESTAMP created_at
    }

    AUDIT_LOGS {
        UUID id PK
        UUID user_id FK
        VARCHAR action
        VARCHAR resource_type
        VARCHAR resource_id
        VARCHAR status
        TEXT details
        VARCHAR ip_address
        TIMESTAMP created_at
    }
```

---

## 4. Registration & Email Verification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Web Client (React)
    participant WebCrypto as WebCrypto API
    participant Server as Spring Boot Backend
    participant DB as PostgreSQL
    participant Mail as Mailpit SMTP

    User->>Browser: Enters Name, Email, Password
    Browser->>WebCrypto: generateKey("ECDH", "P-256")
    WebCrypto-->>Browser: (PublicKeyBase64, PrivateKeyBase64)
    Browser->>Browser: Persist PrivateKey in Local Keyring & Download .key
    Browser->>Server: POST /api/auth/register (Email, Password, PublicKeyEcc)
    Server->>DB: Check uniqueness & Hash Password (BCrypt)
    Server->>DB: Save User (status: PENDING)
    Server->>Server: Generate cryptographically random 6-digit OTP
    Server->>DB: Store hashed OTP challenge (5-min expiry)
    Server->>Mail: Dispatch Verification Email
    Server-->>Browser: HTTP 200 (Account Created, Awaiting Verification)
    User->>Mail: Inspects 6-digit OTP
    User->>Browser: Enters 6-digit OTP
    Browser->>Server: POST /api/auth/verify-email (Email, OTP)
    Server->>DB: Validate OTP hash & expiry
    Server->>DB: Update User (status: ACTIVE)
    Server-->>Browser: HTTP 200 (Account Verified)
```

---

## 5. Password & MFA OTP Login Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Web Client (React)
    participant Server as Spring Boot Backend
    participant DB as PostgreSQL
    participant Mail as Mailpit SMTP

    User->>Browser: Submits Email & Password
    Browser->>Server: POST /api/auth/login (Email, Password)
    Server->>DB: Fetch user by email
    Server->>Server: Verify password with BCrypt
    alt Credentials Invalid
        Server-->>Browser: HTTP 401 Unauthorized (Invalid credentials)
    else Credentials Valid & MFA Enabled
        Server->>Server: Generate 6-digit OTP
        Server->>DB: Save OTP challenge (PURPOSE: LOGIN_MFA)
        Server->>Mail: Dispatch MFA Email
        Server-->>Browser: HTTP 200 { mfaRequired: true }
        User->>Browser: Enters 6-digit MFA OTP
        Browser->>Server: POST /api/auth/verify-login-otp (Email, OTP)
        Server->>DB: Validate OTP challenge
        Server->>Server: Generate JWT Access Token (24h) & Refresh Token
        Server->>DB: Record LOGIN audit event (SUCCESS)
        Server-->>Browser: HTTP 200 { accessToken, userProfile }
        Browser->>Browser: Save JWT in storage
        Browser->>Browser: Redirect to /app/dashboard (or /admin/dashboard if ADMIN)
    end
```

---

## 6. File Upload & 5-Layer Encryption Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Web Client (React)
    participant Server as Spring Boot Backend
    participant Crypto as Crypto Engine (BC)
    participant Storage as Local Storage Disk
    participant DB as PostgreSQL

    User->>Browser: Selects file to upload
    Browser->>Browser: Calculates client-side SHA-256 preview
    Browser->>Server: POST /api/files (multipart: file, optional carrier)
    Server->>Server: Authenticate JWT Principal
    Server->>Crypto: L1: Calculate SHA-256 over original bytes
    Crypto-->>Server: Original SHA-256 Digest
    Server->>Crypto: L2: Generate 256-bit DEK & 96-bit IV -> AES-GCM Encrypt
    Crypto-->>Server: Ciphertext_1 + GCM 128-bit Tag
    Server->>Crypto: L3: Generate 128-bit Key & 64-bit IV -> Blowfish-CBC Encrypt
    Crypto-->>Server: Final Cascaded Ciphertext
    Server->>Crypto: L4: Ephemeral ECDH with User Public Key + HKDF-SHA-256 -> Wrap DEK
    Crypto-->>Server: Sealed Key Envelope
    Server->>Crypto: L5: Spatial LSB Stego Embed (Frame + CRC32) into Lossless PNG
    Crypto-->>Server: Stego Carrier PNG Image
    Server->>Storage: Persist Final Ciphertext to ./storage/files/{uuid}.enc
    Server->>Storage: Persist Carrier Image to ./storage/files/{uuid}.png
    Server->>DB: Save StoredFile metadata record (Encrypted sizes, SHA-256)
    Server->>DB: Write FILE_UPLOAD Audit Record (SUCCESS)
    Server-->>Browser: HTTP 201 Created (StoredFileDTO)
```

---

## 7. File Download & Decryption Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Web Client (React)
    participant Server as Spring Boot Backend
    participant Storage as Local Storage Disk
    participant Crypto as Crypto Engine (BC)
    participant DB as PostgreSQL

    User->>Browser: Clicks Decrypt & Download
    Browser->>Server: GET /api/files/{id}/download (Header: X-Private-Key or from Vault)
    Server->>DB: Check file ownership or active share permission via @authZ
    alt Unauthorized Access Attempt
        Server->>DB: Record ACCESS_DENIED audit log
        Server-->>Browser: HTTP 403 Forbidden
    else Authorized Request
        Server->>Storage: Read Final Ciphertext and Stego Carrier PNG
        Server->>Crypto: L5: Extract & verify CRC32 of Key Envelope from PNG
        Crypto-->>Server: Sealed Key Envelope
        Server->>Crypto: L4: Recover KEK via User ECC Private Key + HKDF -> Unwrap DEK & BF Key
        Crypto-->>Server: Plaintext DEK, Blowfish Key, IVs
        Server->>Crypto: L3: Reverse Blowfish-CBC Decryption
        Crypto-->>Server: Intermediate Ciphertext
        Server->>Crypto: L2: Reverse AES-256-GCM Decryption (Verify 128-bit Tag)
        alt Tag Verification Fails (Tampering Detected)
            Server->>DB: Log INTEGRITY_FAILURE
            Server-->>Browser: HTTP 400 Bad Request (Ciphertext Tampered)
        else Tag Valid
            Crypto-->>Server: Recovered Plaintext Bytes
            Server->>Crypto: L1: Recalculate SHA-256 of recovered bytes
            Server->>Server: Constant-time comparison with stored SHA-256
            alt Digest Mismatch
                Server-->>Browser: HTTP 400 Integrity Compromised
            else Digest Matches
                Server->>DB: Log FILE_DOWNLOAD (SUCCESS)
                Server-->>Browser: HTTP 200 (Stream original plaintext file)
            end
        end
    end
```

---

## 8. Ephemeral One-Time Sharing Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Owner
    participant Browser as Owner Client
    participant Server as Spring Boot Backend
    participant DB as PostgreSQL
    actor Recipient
    participant RecipientBrowser as Recipient Client

    Owner->>Browser: Share file as One-Time Link (24-hour expiry)
    Browser->>Server: POST /api/shares/link (fileId, expiryHours: 24, isOneTime: true)
    Server->>Server: Generate cryptographically secure random token (32 bytes Base64URL)
    Server->>DB: Save SharedLink record (is_one_time: true, is_consumed: false)
    Server-->>Browser: HTTP 200 { token, shareUrl }
    Owner->>Recipient: Transmits share link: https://vault.local/share/{token}
    Recipient->>RecipientBrowser: Opens share URL
    RecipientBrowser->>Server: GET /api/shares/link/{token}
    Server->>DB: Query link by token
    Server-->>RecipientBrowser: HTTP 200 { filename, size, isOneTime: true, isExpired: false }
    Recipient->>RecipientBrowser: Clicks "Decrypt & Download Plaintext"
    RecipientBrowser->>Server: POST /api/shares/link/{token}/consume
    Server->>DB: Check if consumed or expired in database transaction
    alt Already Consumed (Replay Attack)
        Server-->>RecipientBrowser: HTTP 410 Gone (Token already consumed)
    else Valid First Use
        Server->>DB: Atomically set is_consumed = true and increment access_count
        Server->>Server: Execute 5-Layer decryption pipeline
        Server-->>RecipientBrowser: Stream original plaintext file
    end
```

---

## 9. Deployment Architecture Diagram

```mermaid
graph TD
    subgraph Host ["Windows 11 Local Host / Production Server"]
        subgraph FrontendHost ["Vite / Static Web Server"]
            VitePort["Frontend Port 5173 / Nginx 80"]
        end

        subgraph BackendHost ["JVM Process (Java 21 LTS)"]
            SpringPort["Spring Boot Server Port 8080"]
        end

        subgraph InfraHost ["Local Infrastructure"]
            PostgresPort["PostgreSQL 16 Port 8450"]
            MailpitPort["Mailpit SMTP Port 1025 / Web UI 8025"]
            StorageFolder["Encrypted Filesystem Directory ./storage/files"]
        end
    end

    UserWeb["User Web Browser"] -->|"HTTP:5173"| VitePort
    VitePort -->|"/api Reverse Proxy"| SpringPort
    SpringPort -->|"JDBC TCP:8450"| PostgresPort
    SpringPort -->|"SMTP TCP:1025"| MailpitPort
    SpringPort -->|"Local I/O"| StorageFolder
```
