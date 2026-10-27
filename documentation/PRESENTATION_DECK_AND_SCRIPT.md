# SecureShare: Project Presentation Deck & Comprehensive Defense Script

**Project Title:** A Multi-Layer Secure File Storage and Sharing Framework Using Hybrid Cryptography and Steganographic Key Management in Cloud Environments  
**Institution:** SJC Institute of Technology (SJCIT), Chickballapur  
**Department:** Department of Computer Science and Engineering  
**Degree:** Bachelor of Engineering (B.E.) in Computer Science & Engineering (2026–2027)  

---

## Slide 1: Title & Introduction Slide

### On-Slide Content:
- **Project Title:** SecureShare / SecureVault
- **Full Scope:** A Multi-Layer Secure File Storage and Sharing Framework Using Hybrid Cryptography and Steganographic Key Management
- **Department:** Department of Computer Science & Engineering
- **Institution:** SJC Institute of Technology (SJCIT), Chickballapur
- **Presented By:** [Student Names & USNs]
- **Project Guide:** [Guide Name, Designation]
- **Academic Year:** 2026–2027

### Detailed Spoken Script (What to say):
> *"Respected Guides, Evaluators, and Department Faculty, good morning.  
> Today, we are presenting our major final-year project titled: **'A Multi-Layer Secure File Storage and Sharing Framework Using Hybrid Cryptography and Steganographic Key Management in Cloud Environments'**.  
> In modern cloud computing, while enterprises and users store critical files in the cloud, security remains custodial—meaning the cloud provider has custody of the encryption keys. Our project re-engineers this paradigm, implementing a 5-layer cryptographic and steganographic defense pipeline ensuring that nobody—not even the cloud host or database administrator—can ever inspect or compromise user data. Let us begin by examining the critical vulnerabilities in existing cloud storage systems."*

---

## Slide 2: Problem Statement & Motivation

### On-Slide Content:
- **The Custodial Cloud Trap:**
  - Standard cloud storage (AWS S3, Google Drive, OneDrive) retains server-side custody of encryption keys.
  - Privileged insiders, hypervisor compromises, and rogue administrators can read user data in plaintext.
- **Single-Cipher Failure Points:**
  - Reliance on a single cipher mode (e.g. standalone AES-CBC) leaves files vulnerable to padding oracle attacks and implementation flaws.
- **Plaintext Key Headers:**
  - Encryption headers and metadata openly advertise high-value encrypted targets to network adversaries.
- **Uncontrolled File Delegation:**
  - Traditional shared links are static, reusable, and lack atomic revocation or expiration enforcement.
- **Project Motivation:**
  - Design a **Zero-Knowledge, Zero-Trust** framework where the server only ever handles encrypted blobs and camouflaged carrier images.

### Detailed Spoken Script (What to say):
> *"When organizations upload files to cloud providers, they typically rely on 'Server-Side Encryption' like AWS SSE-S3. However, this is a custodial trust model: the provider encrypts the file, but the provider also holds the key in their Key Management Service. If a cloud server is subpoenaed, hacked, or abused by a malicious insider, customer data is exposed in plaintext.  
> Furthermore, current systems use a single cipher. If that single cipher or its initialization vector handling has a flaw, the entire defense collapses. Finally, encrypted files openly advertise their headers, making them high-priority targets.  
> Our motivation was straightforward: What if the cloud server never sees plaintext, never sees private keys, and cannot decrypt files even under physical server seizure? That is what SecureShare achieves."*

---

## Slide 3: Existing Systems vs. SecureShare Framework

### On-Slide Content:

| Capability / Metric | Traditional Cloud (Dropbox/G-Drive) | Standard Client-Side Tools | SecureShare (Our System) |
| :--- | :--- | :--- | :--- |
| **Trust Model** | Custodial (Server holds keys) | Semi-Custodial / Complex setup | **100% Zero-Knowledge** |
| **Ciphers Used** | Single Layer (AES-256 only) | Single Layer (AES or RSA) | **Cascaded Hybrid: AES-256-GCM + Blowfish 448-bit** |
| **Integrity Assurance** | Weak or Server-Managed | Checksum optional | **Pre/Post Cryptographic SHA-256 Verification** |
| **Private Key Storage** | Server Database / Cloud KMS | Plaintext .pem/.key on disk | **Spatial LSB Steganography in PNG Images** |
| **Sharing Security** | Static, persistent URLs | Senders must share raw passwords | **ECDH Key Re-wrapping + One-Time Ephemeral Links** |
| **Tamper Resistance** | Blind to bit-rot or byte modification | Detectable after download | **Constant-Time Cryptographic Verification & Audit Logs** |

### Detailed Spoken Script (What to say):
> *"To demonstrate our technical advancement to the guides, this slide contrasts existing solutions against SecureShare.  
> Commercial clouds use single-layer AES and hold your keys. Third-party tools like VeraCrypt require clunky offline setups and do not solve multi-user network sharing.  
> SecureShare bridges this gap: We cascade AES-256-GCM with Blowfish for dual authenticated diffusion, conceal asymmetric private keys within everyday PNG images using 2-bit LSB steganography, and delegate access using Elliptic Curve Diffie-Hellman envelope re-wrapping without re-encrypting the underlying physical file."*

---

## Slide 4: Core Project Objectives

### On-Slide Content:
- **1. Five-Layer Defense Pipeline:**
  - Integrate SHA-256 hashing, AES-256-GCM authenticated encryption, Blowfish diffusion, ECDH P-256 key agreement, and LSB PNG steganography.
- **2. True Zero-Knowledge Architecture:**
  - Private keys and plaintext files never touch the server filesystem, memory, or network payload.
- **3. Ephemeral & Atomic Sharing:**
  - Implement time-decaying shared links and single-use bearer tokens with atomic database consumption.
- **4. Strict Separation of Concerns (RBAC):**
  - Independent portals, routing boundaries, and database permission sets for Normal Users (`/app/*`) and Administrators (`/admin/*`).
- **5. Cryptographic Auditability & MFA:**
  - 6-digit TTL-backed Email OTP MFA, Google OAuth 2.0 / OIDC, and immutable PostgreSQL security event logging.

### Detailed Spoken Script (What to say):
> *"Our project was guided by five rigorous academic and engineering objectives.  
> First, multi-layered defense: we combine the speed of AES Galois Counter Mode with the deep Feistel diffusion of Blowfish.  
> Second, Zero-Knowledge: the server operates strictly on blind payloads.  
> Third, atomic sharing: links that automatically self-destruct upon expiration or first access.  
> Fourth, strict role separation: administrators can monitor system health, storage, and user status, but their administrative privileges mathematically cannot decrypt any user file.  
> And fifth, an end-to-end audit trail tracking cryptographic provenance."*

---

## Slide 5: System Architecture & Workflow

### On-Slide Content:
```
[Client Web Browser]
   │
   ├── 1. Generates NIST P-256 ECC Keypair (Private key stays local)
   ├── 2. Embeds Private Key in Cover Image (LSB Steganography) -> Downloads .png
   ├── 3. Encrypts File: SHA-256 Checksum -> Blowfish-CBC -> AES-256-GCM
   ├── 4. Wraps Symmetric DEKs via Recipient's ECC Public Key (ECDH + HKDF)
   │
   ▼ HTTPS / TLS 1.3 (Restricted DTOs)
[Spring Boot 3.3.4 Security Server]
   ├── Spring Security 6 JWT & RBAC Filter Chain
   ├── Persists Ciphertext Blob to Storage Provider
   ├── Writes Envelope Metadata & Hashes to PostgreSQL 16
   └── Dispatches Audit Logs & Email Notifications
```

### Detailed Spoken Script (What to say):
> *"Here is the high-level system architecture. Notice the boundary between the client web browser and the server.  
> When a user registers or uploads a file, all sensitive cryptographic operations originate in the browser client. The client generates an ECC P-256 key pair. The private key is immediately encoded into the pixels of a carrier image using Least Significant Bit steganography and handed to the user as a physical image key.  
> When uploading, the file is hashed via SHA-256, encrypted with Blowfish, and enveloped in AES-256-GCM. The symmetric keys are encrypted using Elliptic Curve Diffie-Hellman for the recipient.  
> What reaches the server is solely ciphertext and wrapped headers. The server validates authentication using JWT tokens and stores the encrypted blob into disk storage while recording immutable audit entries in PostgreSQL."*

---

## Slide 6: Layer 1 & 2 — Cascaded Hybrid Cryptography

### On-Slide Content:
- **Layer 1: Pre/Post Cryptographic Integrity (SHA-256)**
  - Computes 256-bit hash before encryption and compares upon client decryption.
  - Constant-time verification prevents timing side-channel attacks.
- **Layer 2: Authenticated Symmetric Encryption (AES-256-GCM)**
  - 256-bit symmetric key, 96-bit unique cryptographically random IV.
  - 128-bit authentication tag guarantees confidentiality and ciphertext authenticity.
  - Additional Authenticated Data (AAD) binds file metadata to the ciphertext.
- **Layer 3: Cipher Diffusion (Cascaded Blowfish-CBC)**
  - 448-bit variable keying, 64-bit block Feistel network cipher.
  - Neutralizes algorithmic weaknesses; an attacker must break two fundamentally distinct ciphers (Substitution-Permutation Network + Feistel Network).

### Detailed Spoken Script (What to say):
> *"Let us dive into the core cryptography. Why did we combine AES-GCM and Blowfish?  
> Standard systems rely purely on AES. While AES is fast and robust, cascading it with Blowfish creates defense-in-depth across two completely different mathematical families. AES is a Substitution-Permutation Network, whereas Blowfish is a Feistel cipher with data-dependent S-boxes.  
> First, our pipeline calculates an initial SHA-256 digest of the raw file. Next, the file is passed through Blowfish in CBC mode to introduce high cryptographic diffusion. Then, it is processed through AES-256-GCM, which appends a 128-bit Galois authentication tag. This ensures that any bit flip, disk corruption, or man-in-the-middle manipulation is mathematically detected before decryption even begins."*

---

## Slide 7: Layer 3 — Spatial Steganography for Key Protection

### On-Slide Content:
- **The Core Problem:** Where do you store the asymmetric private key without exposing it to malware, disk scrapers, or shoulder surfers?
- **Our Solution: LSB 2-Bit Spatial Steganography**
  - Embeds the Base64-encoded PKCS#8 private key into the red, green, and blue channels of lossless PNG images.
  - **13-Byte Magic Frame Header:**
    - `0x53 0x56 0x4B 0x31` ("SVK1" Header)
    - 4-Byte Payload Length
    - 4-Byte CRC32 Checksum for zero false positives
    - 1-Byte Encoding Flags
- **Visual Imperceptibility:**
  - Peak Signal-to-Noise Ratio (PSNR) > 52 dB (human eye cannot detect pixel changes).
  - Carrier image can be any photo chosen by the user (personal photo, landscape, certificate).

### Detailed Spoken Script (What to say):
> *"One of the greatest security dilemmas in asymmetric cryptography is: Where does the user store their private key? Storing it in localStorage or as a .txt file on the desktop invites theft.  
> In SecureShare, we conceal the private key inside the pixel matrix of an image using 2-bit Spatial Least Significant Bit steganography.  
> We engineered a custom 13-byte binary frame with an 'SVK1' identifier, payload length, and a 32-bit CRC checksum. The user can pick any photo of their choice—their college ID, a scenic photo, or an avatar. The bits of the private key are distributed across the lowest bits of the RGB color channels.  
> The visual difference is completely undetectable, yielding a Peak Signal-to-Noise Ratio exceeding 52 decibels. When decrypting, the user simply selects their carrier image, and our engine extracts and validates the key in milliseconds."*

---

## Slide 8: Layer 4 — Key Encapsulation & Secure Delegation

### On-Slide Content:
- **Elliptic Curve Cryptography (ECDH NIST P-256 Curve):**
  - Provides 128-bit post-quantum resilient security equivalent to RSA-3072 at a fraction of the key size and computational overhead.
- **Key Wrapping & Delegation Mechanism:**
  - When User A shares a file with User B, **the physical encrypted file is NOT re-encrypted**.
  - Instead, User A unwraps the Data Encryption Key (DEK) with their own private key, then wraps the DEK with User B's public key using ECDH key agreement and HKDF-SHA-256.
- **Zero Plaintext Exposure:**
  - The server only relays the encrypted key envelope. Server memory never sees the DEK in plaintext.

### Detailed Spoken Script (What to say):
> *"How does secure file sharing work without sharing passwords?  
> When Alice wants to share an encrypted file with Bob, naive systems either send Bob the password or re-encrypt the entire 500 MB file. That is inefficient and insecure.  
> In SecureShare, we implement Elliptic Curve Diffie-Hellman key agreement using the NIST P-256 curve.  
> Alice uses Bob's public key to generate a shared secret, feeds it into an RFC 5869 HKDF key derivation function, and wraps only the 32-byte Data Encryption Key into a secure envelope.  
> The server stores this lightweight wrapped envelope alongside the file. When Bob logs in, his private key extracts the envelope. The actual encrypted multi-megabyte file remains untouched on disk. This delivers instantaneous, cryptographically isolated file sharing."*

---

## Slide 9: Layer 5 — Access Governance, One-Time Links & Revocation

### On-Slide Content:
- **Time-Bound Sharing Grants:**
  - Explicit start and expiry timestamps. Background schedulers and query predicates enforce strict expiration.
- **Ephemeral One-Time Bearer Links:**
  - Cryptographically secure 256-bit random tokens (`SecureRandom`).
  - Atomic database consumption: Once downloaded, the token is invalidated instantly to prevent replay attacks.
- **Instant Cryptographic Revocation:**
  - Owners or administrators can revoke access at any second. Revoking deletes the wrapped key envelope, rendering the recipient's access immediately mathematically void.
- **Strict Role-Based Access Control (RBAC):**
  - **User Portal (`/app/*`):** Personal file management, key extraction, upload, download, sharing.
  - **Admin Portal (`/admin/*`):** Telemetry, user status suspension, file oversight, immutable audit trail. Admins CANNOT decrypt user files.

### Detailed Spoken Script (What to say):
> *"Layer 5 governs access lifecycle. We implemented three critical sharing modes:  
> First, time-bound grants: you can share a file that automatically expires after 2 hours or 3 days.  
> Second, One-Time Ephemeral Links: you can generate a public link that can be downloaded exactly once. Once downloaded, the database atomically invalidates the token, preventing replay attacks.  
> Third, instant revocation: if an owner revokes access, the recipient's key envelope is deleted.  
> And importantly, our Role-Based Access Control strictly isolates Normal Users from System Administrators. While an administrator can suspend accounts or delete files for compliance, the administrator mathematically cannot decrypt any customer's file because they do not have the user's private key."*

---

## Slide 10: Implementation Details & Technology Stack

### On-Slide Content:
- **Backend Stack:**
  - **Java 21 LTS:** High-throughput virtual threads & modern pattern matching.
  - **Spring Boot 3.3.4:** Core framework, dependency injection, and REST controllers.
  - **Spring Security 6 & JJWT 0.12.6:** Stateless authentication, JWT bearer cookies, and RBAC filters.
  - **Bouncy Castle (bcprov-jdk18on):** Cryptographic provider for AES-GCM and Blowfish.
  - **PostgreSQL 16 & Flyway:** Relational database with automated database schema versioning.
- **Frontend Stack:**
  - **React 18 & TypeScript:** Type-safe, component-driven client architecture.
  - **Vite 5:** High-performance bundler and Hot Module Replacement dev environment.
  - **Web Crypto API & Canvas API:** Client-side hashing and pixel-level LSB steganography manipulation.
  - **Tailwind CSS & Lucide Icons:** Modern obsidian and emerald cybersecurity UI design.

### Detailed Spoken Script (What to say):
> *"Here is the production-grade technology stack behind SecureShare.  
> The backend is built on Java 21 LTS and Spring Boot 3.3.4. We utilize Spring Security 6 with stateless JWT tokens and Bouncy Castle cryptographic providers. For persistence, we use PostgreSQL 16 managed through Flyway database migrations.  
> On the frontend, we use React 18 with TypeScript and Vite. The client leverages the native Web Crypto API and HTML5 Canvas API for zero-latency in-browser steganography and hashing.  
> Every route, DTO, and database entity is strictly type-checked, ensuring robust security with zero compilation errors."*

---

## Slide 11: Experimental Results & Performance Benchmarks

### On-Slide Content:
- **Automated Test Validation:**
  - **16 of 16 Unit & Cryptographic Integration Tests Passing (100% Success Rate).**
  - Verified AES-GCM tag verification, Blowfish diffusion, Steganography CRC32 integrity, and ECDH envelope unwrapping.
- **Throughput & Latency Benchmarks:**
  - Cryptographic Pipeline Throughput: **~10.2 MB/s to 85+ MB/s** on commodity hardware.
  - Steganographic Key Embedding Time: **< 18 milliseconds**.
  - Steganographic Key Extraction Time: **< 12 milliseconds**.
  - One-Time Link Token Validation Latency: **< 5 milliseconds**.
- **Visual Integrity Metrics:**
  - Steganographic Peak Signal-to-Noise Ratio (PSNR): **> 52.4 dB**.
  - Structural Similarity Index (SSIM): **0.9998** (Indistinguishable from original image).

### Detailed Spoken Script (What to say):
> *"To substantiate our framework for academic evaluation, we conducted exhaustive experimental testing.  
> All 16 unit and cryptographic test suites pass with a 100% success rate, validating multi-cipher integrity, key generation, and steganographic CRC32 parsing.  
> In performance testing, our hybrid cryptographic pipeline achieves sustained processing throughput of 10 to 85 megabytes per second on commodity systems.  
> The steganographic key embedding and extraction take less than 18 milliseconds, adding virtually zero overhead to the user experience.  
> Furthermore, image quality analysis yielded a Peak Signal-to-Noise Ratio of over 52 decibels and an SSIM of 0.9998, proving that the carrier images show zero human-perceptible degradation."*

---

## Slide 12: Conclusion & Future Scope

### On-Slide Content:
- **Conclusion:**
  - Successfully engineered a production-ready, zero-knowledge file storage and sharing framework.
  - Solved single-cipher vulnerability through cascaded hybrid encryption (AES-256-GCM + Blowfish).
  - Eliminated key exposure by camouflaging asymmetric private keys in lossless PNG images via 2-bit LSB steganography.
  - Enforced atomic sharing controls, expiring links, and strict enterprise RBAC.
- **Future Scope:**
  - **Post-Quantum Cryptography (PQC):** Integrate NIST-standardized Kyber/ML-KEM and Dilithium algorithms.
  - **Homomorphic Encryption:** Enable encrypted keyword searching without decrypting files.
  - **Decentralized Storage:** Integrate IPFS (InterPlanetary File System) for distributed ciphertext hosting.

### Detailed Spoken Script (What to say):
> *"In conclusion, SecureShare demonstrates that cloud storage can achieve military-grade confidentiality without sacrificing user convenience or performance.  
> By uniting hybrid dual-cipher encryption with spatial steganography and zero-knowledge key delegation, we eliminate both external attacker vulnerabilities and internal cloud administrator threats.  
> For future work, we plan to incorporate NIST Post-Quantum lattice-based cryptography such as ML-KEM to protect against quantum adversaries, as well as homomorphic search over encrypted indexes.  
> Thank you, Respected Guides and Faculty. We are now open for your questions and would be delighted to demonstrate the live working application."*

---

## Comprehensive Viva & Defense Q&A Preparation

### Q1: Why did you cascade AES and Blowfish instead of using just AES-256?
**Answer:**  
*"AES is based on a Substitution-Permutation Network (SPN), while Blowfish is a Feistel cipher network. While AES-256 is currently secure, relying on any single algorithm creates a single point of failure. Cascading Blowfish introduces high diffusion across a 64-bit Feistel network with key-dependent S-boxes, followed by AES-256-GCM which provides Galois authenticated encryption. To crack the file, an adversary must simultaneously break two mathematically distinct cryptographic designs. Furthermore, the GCM mode ensures ciphertext authenticity through a 128-bit authentication tag, preventing any bit-flipping attacks."*

### Q2: What happens if the steganography image is compressed or resized?
**Answer:**  
*"Spatial LSB steganography operates on the exact bit values of lossless image formats like PNG. If the image is re-encoded as a lossy JPEG or resized, the least significant bits would be altered by compression algorithms. To protect against corrupted keys, our framework embeds a 13-byte header with a 32-bit CRC checksum. If a user uploads an invalid or altered image, the CRC verification instantly detects the corruption and alerts the user rather than passing malformed bytes to the cryptographic engine."*

### Q3: How is this system truly Zero-Knowledge?
**Answer:**  
*"In our system, the asymmetric private key is generated client-side and extracted solely within the browser using the Web Crypto API and HTML5 Canvas. The private key is never transmitted over HTTPS to the Spring Boot server. Even when sharing files, the owner unwraps the symmetric key locally and re-wraps it with the recipient's public key using ECDH. The server only receives encrypted envelopes and ciphertext. Even if the server database and storage drives are seized, the data cannot be decrypted without the private key concealed in the user's carrier image."*

### Q4: Can an Administrator read user files?
**Answer:**  
*"No. While the administrator portal (`/admin/*`) allows managing user account statuses (activating/suspending users) and viewing storage consumption for governance, administrators do not possess the private keys of users. The server does not store private keys. Hence, the administrator cannot decrypt user files. This enforces true Separation of Privileges."*

### Q5: How do One-Time Bearer Links prevent replay attacks?
**Answer:**  
*"When a one-time link is generated, a 256-bit cryptographically secure token is generated and stored in PostgreSQL with `is_one_time = true` and `access_count = 0`. When a request arrives, the backend executes an atomic transactional check: it verifies expiration, marks the token as consumed (`is_consumed = true`), and increments `access_count`. Any subsequent access attempt with the same token is rejected immediately with HTTP 410 Gone or 403 Forbidden."*
