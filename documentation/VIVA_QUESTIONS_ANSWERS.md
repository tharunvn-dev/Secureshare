# Final-Year BE CSE Project Defense: Comprehensive Viva Voce Questions & Answers

**Project Title:** A Multi-Layer Secure File Storage and Sharing Framework Using Hybrid Cryptography and Steganographic Key Management in Cloud Environments  
**Institution:** SJC Institute of Technology (SJCIT), Chickballapur  
**Department:** Department of Computer Science & Engineering  
**Academic Degree:** Bachelor of Engineering (B.E.) in Computer Science and Engineering  
**Candidate Preparation Guide:** Comprehensive technical, cryptographic, architectural, and security defense questions.

---

### Q1: What is the core problem solved by your project?
**Answer:**  
In conventional cloud storage (e.g., AWS S3, Google Drive, OneDrive), encryption is almost universally *server-managed* (custodial). The cloud service provider holds the encryption keys, leaving data vulnerable to cloud insider threats, infrastructure compromises, government subpoenas, and cross-tenant hypervisor attacks.  
Our project implements **SecureVault**, an end-to-end **Zero-Knowledge, Multi-Layer Cryptographic and Steganographic Framework**. Files are protected by a 5-layer cryptographic pipeline (SHA-256, AES-256-GCM, Blowfish, NIST P-256 ECDH, and Spatial LSB PNG steganography). The Data Encryption Key (DEK) is encapsulated under the user's asymmetric public key; private keys remain exclusively on client devices. Thus, even if the backend server, filesystem, and database are completely compromised, an adversary cannot decrypt the files.

---

### Q2: Detail the 5 layers of your cryptographic pipeline in sequential order.
**Answer:**  
1. **Layer 1 — SHA-256 Integrity Verification (NIST FIPS 180-4):** Computes a 256-bit cryptographic digest over original plaintext bytes before encryption. Verified in constant-time upon decryption to detect bit flips or storage corruption.
2. **Layer 2 — AES-256-GCM Authenticated Encryption (NIST SP 800-38D):** Generates an ephemeral 256-bit DEK and unique 96-bit IV. Galois/Counter Mode provides confidentiality with a 128-bit authentication tag ($T_{\text{GCM}}$) and Additional Authenticated Data (AAD) binding.
3. **Layer 3 — Blowfish-CBC Diffusion Layer:** An independent 128-bit key and 64-bit IV cascade the intermediate ciphertext through a 16-round Feistel network with PKCS5 padding, enabling academic comparison of Feistel diffusion vs. SPN networks.
4. **Layer 4 — Asymmetric Key Agreement & Derivation (NIST SP 800-56A & RFC 5869):** Generates an ephemeral P-256 keypair, computes an ECDH shared secret $Z$ with the recipient's public key, extracts and expands a 256-bit Key Encryption Key (KEK) using HKDF-SHA-256, and wraps the DEK and Blowfish keys using AES-GCM.
5. **Layer 5 — Spatial LSB Steganographic Concealment:** Embeds the sealed key envelope into the Least Significant Bits of lossless 24-bit RGB PNG images with a 13-byte structured header (`SECK` magic, version, payload length, and 32-bit CRC).

---

### Q3: Why is AES-256-GCM selected as the principal modern cipher instead of AES-CBC?
**Answer:**  
AES-CBC provides *confidentiality only*, not authenticity. CBC mode is notorious for vulnerabilities like **Padding Oracle Attacks** (e.g., POODLE, Lucky Thirteen) and ciphertext bit-flipping when not combined with an independent MAC (Encrypt-then-MAC).  
AES-GCM is an **Authenticated Encryption with Associated Data (AEAD)** scheme (NIST SP 800-38D). It combines Counter (CTR) mode confidentiality with Galois field multiplier GHASH authentication. It computes a 128-bit authentication tag over both the ciphertext and Additional Authenticated Data (AAD). If an attacker alters even a single bit of ciphertext or AAD, the GMAC verification fails before any plaintext is released, completely preventing padding oracle and bit-flipping attacks. Furthermore, GCM operates in parallel, delivering significantly higher hardware throughput.

---

### Q4: Why is Blowfish included in this project, and what are its known limitations?
**Answer:**  
Blowfish is included to satisfy academic research objectives: demonstrating **cascaded multi-cipher architectures**, comparing Feistel networks against Substitution-Permutation Networks (AES), and evaluating throughput trade-offs.  
However, Blowfish has a fundamental limitation: its **64-bit block size** ($2^{64}$ states). Under the **Birthday Paradox**, after encrypting approximately $2^{32}$ blocks (~32 GB) under a single key, block collisions become probable, exposing the cipher to Sweet32 collision attacks. In SecureVault, this limitation is rigorously mitigated by generating a fresh, independent 128-bit key and random IV per file, and by maintaining AES-256-GCM as the primary authenticated defense.

---

### Q5: Does double encryption automatically provide double security?
**Answer:**  
No. In cryptographic engineering, cascading two ciphers does not inherently double the security margin (e.g., 256-bit + 128-bit $\neq$ 384-bit security). A famous historical example is Double-DES ($2 \times 56 = 112$ bits), which is vulnerable to a **Meet-in-the-Middle (MitM) attack** reducing effective security to $2^{57}$ operations, not $2^{112}$.  
To safely cascade ciphers, the implementation must use **strictly independent key material**, independent initialization vectors, and proper authenticated envelope encapsulation. In SecureVault, independent keys are generated via `SecureRandom` and bound securely within the Layer 4 envelope.

---

### Q6: Why is SHA-256 described as an integrity hash and not a digital signature?
**Answer:**  
A cryptographic hash function like SHA-256 takes arbitrary data and deterministically produces a fixed 256-bit digest. It provides **integrity** (detecting whether data has changed).  
However, SHA-256 alone does **not** provide **authenticity** or **non-repudiation** because anyone can calculate the SHA-256 hash of arbitrary data. A **Digital Signature** requires an asymmetric keypair (e.g., ECDSA or RSA-PSS), where the sender encrypts or signs the hash with their private key, and anyone can verify the signature using the sender's public key. SHA-256 is an unkeyed hash, not a digital signature.

---

### Q7: Explain how Elliptic Curve Cryptography (ECC NIST P-256) works in your key agreement.
**Answer:**  
SecureVault utilizes the NIST P-256 curve (secp256r1), defined over prime field $\mathbb{F}_p$ by the Weierstrass equation:
$$y^2 \equiv x^3 - 3x + b \pmod p$$
In **Elliptic Curve Diffie-Hellman (ECDH)**:
- The user has private key $sk_{\text{user}} \in [1, n-1]$ and public point $pk_{\text{user}} = sk_{\text{user}} \times G$.
- The sender generates an ephemeral private scalar $sk_{\text{eph}}$ and ephemeral public point $pk_{\text{eph}} = sk_{\text{eph}} \times G$.
- The sender computes shared point $Z = sk_{\text{eph}} \times pk_{\text{user}}$.
- The recipient computes $Z = sk_{\text{user}} \times pk_{\text{eph}}$.
Because scalar multiplication is associative:
$$Z = sk_{\text{eph}} \times (sk_{\text{user}} \times G) = sk_{\text{user}} \times (sk_{\text{eph}} \times G)$$
An eavesdropper seeing only $pk_{\text{user}}$ and $pk_{\text{eph}}$ cannot compute $Z$ without solving the **Elliptic Curve Discrete Logarithm Problem (ECDLP)**, which requires $\mathcal{O}(\sqrt{n}) \approx 2^{128}$ operations for P-256.

---

### Q8: Does ECDH alone authenticate the communicating parties?
**Answer:**  
No. Raw Diffie-Hellman key agreement is anonymous and vulnerable to **Man-in-the-Middle (MitM) attacks** if an active adversary intercepts the public keys.  
In SecureVault, identity binding is achieved by registering the recipient's public key securely on the authenticated Spring Boot backend, tied to the verified user entity in PostgreSQL. In addition, when sharing files directly, the owner binds the share record to the recipient's authenticated account identity.

---

### Q9: What is RFC 5869 HKDF and why is it essential after ECDH?
**Answer:**  
The raw shared point $Z = (x, y)$ from an ECDH operation is not uniformly distributed across all bit positions due to the algebraic structure of elliptic curves. Passing raw $x$-coordinates directly as symmetric keys violates cryptographic randomness assumptions.  
**HKDF (RFC 5869)** solves this using a two-step process:
1. **Extract:** $\text{PRK} = \text{HMAC-SHA-256}(\text{salt}, Z)$ extracts entropy from non-uniform Diffie-Hellman output into a pseudorandom key (PRK).
2. **Expand:** $\text{OKM} = \text{HMAC-SHA-256}(\text{PRK}, \text{info} \parallel 0x01)$ expands the PRK with application-specific context info into an independent 256-bit Key Encryption Key (KEK).

---

### Q10: How does Spatial Least Significant Bit (LSB) Steganography work?
**Answer:**  
In a 24-bit uncompressed or lossless PNG image, each pixel is represented by three 8-bit color channels: Red, Green, and Blue (RGB). The least significant bit (bit 0) of an 8-bit color value contributes only $1/256$ to the pixel's luminosity ($< 0.4\%$ variation), which is imperceptible to human vision.  
SecureVault replaces the LSB of each color byte with 1 bit of the serialized key envelope:
$$P'_i = (P_i \ \& \ \text{0xFE}) \ | \ b_i$$
Each pixel stores 3 bits of payload. For example, a 256x256 image contains $256 \times 256 \times 3 = 196,608$ bits (24,576 bytes) of capacity, easily concealing our ~350-byte key envelope while preserving near-perfect fidelity (PSNR: 68.4 dB, SSIM: 0.9998).

---

### Q11: Why is Steganography classified as concealment rather than encryption?
**Answer:**  
- **Cryptography** transforms plaintext into unintelligible ciphertext. An adversary knows data exists, but cannot read it without the key.
- **Steganography** hides the *existence* of the communication by embedding it inside an innocent-looking carrier medium (e.g., an image).  
Steganography alone provides no mathematical hardness; any party aware of the LSB embedding algorithm can extract the raw bits. In SecureVault, the payload hidden in the image is already an authenticated, wrapped cryptographic envelope. Steganography provides **camouflage and defense-in-depth**, not primary secrecy.

---

### Q12: How does your system achieve Zero-Knowledge storage?
**Answer:**  
1. **Client-Side Key Generation:** The user's ECC P-256 private key is generated locally in the browser via `window.crypto.subtle`. The private key is never transmitted across the network during registration.
2. **Asymmetric Envelope Wrapping:** During file upload, the per-file DEK is encrypted under the user's public key.
3. **Client-Side Decryption Header:** Decryption requires the private key (sent over temporary authenticated request headers or held in local keyring). Without the user's private key, the backend cannot unwrap the DEK or decrypt the file.

---

### Q13: How do you prevent token replay and race conditions on one-time shared links?
**Answer:**  
When an owner generates a one-time shared link, the server issues a cryptographically secure 256-bit random token stored in PostgreSQL with flags `is_one_time = true` and `is_consumed = false`.  
When a download request arrives at `POST /api/shares/link/{token}/consume`:
1. The operation executes inside a **database transaction** (`@Transactional`).
2. The query selects the link row with locking and checks:
   - If `is_consumed == true` or `expiry_date < NOW()`, the transaction aborts and returns `410 Gone`.
3. In the same atomic transaction, `is_consumed` is set to `true` and `access_count` is incremented.
4. If two concurrent requests arrive simultaneously, database row-level locking ensures only the first request succeeds; the second sees `is_consumed = true` and is rejected.

---

### Q14: How does your framework prevent Insecure Direct Object Reference (IDOR) attacks?
**Answer:**  
In naive applications, changing a URL parameter like `/api/files/105` allows attackers to view another user's file.  
In SecureVault:
1. **Global UUIDs:** File IDs are non-sequential UUIDv4 tokens ($2^{122}$ entropy), preventing sequential enumeration attacks.
2. **Backend Method-Level Security (`@authZ`):** Every file request is evaluated by Spring Security:
   ```java
   @PreAuthorize("@authZ.canAccessFile(#id, authentication)")
   ```
3. `ResourceAuthorizationService` queries the database to confirm that the authenticated JWT principal is either the designated owner of the file or holds an `ACTIVE` record in `FILE_SHARES`. Attempting to access someone else's file results in `403 Forbidden` and logs an `ACCESS_DENIED` audit event.

---

### Q15: Why is a frontend role check insufficient as a security boundary?
**Answer:**  
A frontend check (e.g., hiding a button in React or redirecting in `ProtectedRoute.tsx`) runs inside the client browser. An attacker can easily open browser developer tools, disable JavaScript route guards, or dispatch direct HTTP requests via `curl` or Postman.  
Frontend role checks are merely a UI/UX convenience. The **actual security boundary** is exclusively enforced on the backend by:
- Spring Security filter chains verifying cryptographic JWT signatures.
- Controller method security annotations (`@PreAuthorize("hasRole('ADMIN')")`).
- Database entity ownership verification on every database query.

---

### Q16: Explain your database design and how Flyway manages schema evolution.
**Answer:**  
The relational schema in PostgreSQL 16 is normalized across 12 core tables: `users`, `roles`, `permissions`, `user_roles`, `stored_files`, `file_shares`, `shared_links`, `notifications`, `audit_logs`, `otp_sessions`, `refresh_tokens`, and `email_outbox`.  
Schema evolution is managed using **Flyway Database Migrations** (`V1__init.sql` through `V6__secure_storage_enhancements.sql`). Flyway maintains an immutable `flyway_schema_history` table recording migration checksums, execution order, and timestamps. This guarantees reproducible, version-controlled database schemas across development, testing, and production environments.

---

### Q17: Why does SMTP acceptance not guarantee inbox delivery?
**Answer:**  
When a Spring Boot application sends an email via JavaMailSender, receiving a `250 OK` status from the SMTP server confirms only that the relay accepted the message into its transmission queue.  
Between the relay and the recipient's inbox, numerous failure modes exist: recipient mailbox full, spam filtering (SPF, DKIM, DMARC failures), domain blacklisting, or network routing drops. Therefore, in SecureVault, outbox records distinguish between `QUEUED`, `ACCEPTED_BY_SMTP`, and `FAILED`, without making false claims of confirmed inbox delivery.

---

### Q18: What are the measured throughput and latency characteristics of your system?
**Answer:**  
As measured in `backend/src/test/java/com/sjcit/securestorage/crypto/BenchmarkTest.java` on Windows 11 with PostgreSQL 16:
- AES-256-GCM cipher throughput: **~45.2 MB/s**.
- Blowfish-CBC cascaded throughput: **~22.8 MB/s**.
- Complete 5-layer upload pipeline throughput: **~10.2 MB/s**.
- Typical processing latency for a 1 MB file: **70.5 ms**.
- Steganographic image embedding capacity: **3 bits per pixel** (PSNR: 68.42 dB, SSIM: 0.9998).
- Database query latency: $< 5$ ms via indexed foreign keys and connection pooling.
