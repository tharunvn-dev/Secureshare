# SecureVault — Multi-Layer Secure File Storage & Sharing Framework

[![Academic Major Project](https://img.shields.io/badge/SJCIT-Final--Year%20BE%20CSE-blue.svg)](http://sjcit.ac.in)
[![Java 21 LTS](https://img.shields.io/badge/Backend-Java%2021%20LTS-orange.svg)](https://openjdk.org)
[![Spring Boot 3.3.4](https://img.shields.io/badge/Framework-Spring%20Boot%203.3.4-brightgreen.svg)](https://spring.io)
[![PostgreSQL 16](https://img.shields.io/badge/Database-PostgreSQL%2016%20(Port%208450)-blue.svg)](https://www.postgresql.org)
[![React 18 + Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-cyan.svg)](https://vitejs.dev)
[![Cryptography](https://img.shields.io/badge/Crypto-5--Layer%20Hybrid%20%2B%20Stego-purple.svg)](#cryptographic-architecture)

**Institution:** SJC Institute of Technology (SJCIT), Chickballapur  
**Department:** Department of Computer Science and Engineering  
**Project Level:** Final-Year B.E. Computer Science & Engineering Major Project (2026–2027)  

---

## 1. Project Overview

**SecureVault** is an enterprise-grade secure file storage and sharing framework designed to eliminate single points of cryptographic failure in cloud environments. It implements a **5-Layer Hybrid Cryptosystem** paired with **Spatial Steganographic Key Management**, guaranteeing **Zero-Knowledge** file storage where server administrators have zero access to customer plaintext.

### The 5-Layer Defensive Cryptosystem:
1. **Layer 1 (Integrity):** Pre-encryption and post-decryption **SHA-256** digest verification (NIST FIPS 180-4) with constant-time equality checks.
2. **Layer 2 (Authenticated Cipher):** Primary authenticated confidentiality via **AES-256-GCM** (NIST SP 800-38D) with unique 96-bit nonces, 128-bit authentication tags, and Additional Authenticated Data (AAD).
3. **Layer 3 (Cascaded Diffusion):** Cascaded **Blowfish-CBC** diffusion layer with independent 128-bit keys and PKCS5 padding, enabling academic comparison of Feistel networks vs. SPN ciphers.
4. **Layer 4 (Asymmetric Key Encapsulation):** Elliptic Curve Cryptography using **NIST P-256** (secp256r1, NIST SP 800-56A) and **HKDF-SHA-256** (RFC 5869) to seal per-file Data Encryption Keys (DEKs).
5. **Layer 5 (Steganographic Concealment):** **Spatial LSB Steganography** over lossless 24-bit PNG images, embedding sealed key envelopes behind a 13-byte structured frame with 32-bit CRC verification.



## 2. Separate Portals & Zero-Trust RBAC

The application strictly bifurcates frontend and backend operations into two isolated portals:

| Portal | Route Prefix | Target Audience | Primary Capabilities |
|---|---|---|---|
| **Normal User Portal** | `/app/*` | End users, clients | Personal encrypted vault, drag-and-drop 5-layer upload, client-side ECC keyring, live SHA-256 integrity checker, direct user sharing, expiring one-time link generation, and in-app notifications. |
| **Administrator Portal** | `/admin/*` | System administrators, auditors | System overview analytics, user lifecycle controls (activate/suspend), encrypted storage repository oversight, global share tracking, immutable security audit trail explorer, and live engine telemetry. |

> **Zero-Trust Administrative Principle:** Being an administrator grants authority over user account statuses and storage quotas, but **zero access** to customer plaintext files or private cryptographic keys.

---

## 3. Technology Stack

### Backend
- **Language / Runtime:** Java 21 LTS (compiled and tested with Java 25.0.3)
- **Framework:** Spring Boot 3.3.4
- **Security:** Spring Security 6 (Stateless JWT Filter + Method-Level Security `@PreAuthorize`, `@authZ`)
- **Database:** PostgreSQL 16 (configured on host port **8450**)
- **Database Migrations:** Flyway 10.x (`V1` through `V6`)
- **Cryptographic Engine:** BouncyCastle 1.78.1
- **API Documentation:** SpringDoc OpenAPI 2.6.0 (Swagger UI)
- **Email:** Spring Mail with Mailpit local SMTP relay

### Frontend
- **Framework:** React 18 with TypeScript
- **Bundler:** Vite 5.4
- **Styling:** Tailwind CSS with Lucide Icons
- **Charts:** Recharts for authentic dashboard analytics
- **HTTP Client:** Axios with bearer token and private key interceptors
- **Client Cryptography:** WebCrypto API (NIST P-256 keypair generation & SHA-256 preview)

---

## 4. Local Setup & Execution Guide (Windows 11)

### Prerequisites Check
Verify installed tools in Windows PowerShell:
```powershell
java -version       # Java 21+ LTS
mvn -version        # Maven 3.9+
node -v             # Node v20+
npm -v              # npm 10+
```

### Step 1: Clone & Configure Environment
The repository comes pre-configured for local execution:
- Copy `.env.example` to `.env` if desired (the Spring Boot backend reads defaults directly from `application.yml` targeting PostgreSQL on port **8450**).

### Step 2: Start Local Infrastructure
Ensure PostgreSQL 16 is active on port **8450**:
```powershell
# Optional: Launch Mailpit for local email testing
docker-compose -f infrastructure/docker-compose.yml up -d mailpit
```
- **Mailpit Web UI:** `http://localhost:8025`
- **Mailpit SMTP Port:** `localhost:1025`

### Step 3: Run Backend Tests & Start Backend
Open a terminal in the root workspace:
```powershell
cd backend
mvn clean test             # Executes all 14 cryptographic tests & benchmarks
mvn spring-boot:run        # Starts Spring Boot on port 8080
```
- **Backend Port:** `http://localhost:8080`
- **OpenAPI Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Docs:** `http://localhost:8080/v3/api-docs`

### Step 4: Start Frontend Portal
Open a second terminal in the root workspace:
```powershell
cd web
npm run build              # Verifies TypeScript compilation
npm run dev                # Starts Vite development server
```
- **Frontend Portal:** `http://localhost:5173`

---

## 5. Demonstration & Default Credentials

### Administrator Portal
- **URL:** `http://localhost:5173/login`
- **Email:** `admin@gmail.com`
- **Password:** `Admin@12345`
- **MFA OTP:** Check Mailpit Web UI at `http://localhost:8025` for the 6-digit code.
- **Redirects to:** `/admin/dashboard`

### Normal User Workflow
1. Register a new user at `http://localhost:5173/register`.
2. The browser automatically derives a 256-bit ECC P-256 keypair and downloads your `.key` file.
3. Retrieve the 6-digit verification code from Mailpit (`http://localhost:8025`).
4. Log in and access `/app/dashboard`.
5. Upload a test document; inspect the live 5-stage pipeline progress indicator.
6. Verify bit-for-bit integrity using the SHA-256 integrity verification modal.
7. Share the file with another user or generate an expiring one-time link.

---

## 6. Project Documentation Index

Comprehensive academic thesis and technical manuals are located in `documentation/`:
- **[`PROJECT_REPORT.md`](file:///c:/Placements-%202027/Projects/final%20copy/documentation/PROJECT_REPORT.md):** Complete 28-chapter major project report with problem statement, literature survey, mathematical specifications, benchmark tables, and IEEE references.
- **[`DIAGRAMS.md`](file:///c:/Placements-%202027/Projects/final%20copy/documentation/DIAGRAMS.md):** Complete Mermaid diagrams (Architecture, Component, ER diagram, Sequence diagrams for Registration, Login OTP, 5-Layer Upload, Download, Sharing, and Deployment).
- **[`USER_MANUAL.md`](file:///c:/Placements-%202027/Projects/final%20copy/documentation/USER_MANUAL.md):** End-user guide for registration, keyring management, upload, download, and sharing.
- **[`ADMIN_MANUAL.md`](file:///c:/Placements-%202027/Projects/final%20copy/documentation/ADMIN_MANUAL.md):** Administrator manual covering zero-trust governance, user lifecycles, and audit exploration.
- **[`VIVA_QUESTIONS_ANSWERS.md`](file:///c:/Placements-%202027/Projects/final%20copy/documentation/VIVA_QUESTIONS_ANSWERS.md):** 18 detailed viva voce questions and answers covering cryptography, Spring Boot, and security.
- **[`IMPLEMENTATION_STATUS.md`](file:///c:/Placements-%202027/Projects/final%20copy/documentation/IMPLEMENTATION_STATUS.md):** Verified feature matrix with recorded test evidence.
#   S e c u r e s h a r e  
 