# SecureVault — End-User Operations Manual

**Project Title:** A Multi-Layer Secure File Storage and Sharing Framework Using Hybrid Cryptography and Steganographic Key Management in Cloud Environments  
**Institution:** SJC Institute of Technology (SJCIT) &bull; Department of Computer Science & Engineering  
**Portal URL:** `http://localhost:5173` (or configured host)  

---

## 1. Introduction

Welcome to **SecureVault**, an enterprise-grade cloud storage and file sharing platform built with a **5-Layer Hybrid Cryptographic Pipeline** and **Steganographic Key Management**. Unlike standard cloud storage, SecureVault implements **Zero-Knowledge encryption**: your files are encrypted with an ephemeral 256-bit AES key, cascaded through Blowfish, and protected using your personal Elliptic Curve Cryptography (ECC NIST P-256) keypair. The server never possesses your private key and cannot view your plaintext files.

---

## 2. Getting Started & Account Registration

### Step 1: Open the Application
Navigate to `http://localhost:5173` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave).

### Step 2: Create an Account
1. Click **Get Started** or **Register** on the landing page.
2. Enter your **First Name**, **Last Name**, **Email Address**, and choose a strong **Master Password** (minimum 8 characters).
3. Click **Generate Keys & Register**.
4. **What Happens Behind the Scenes:**
   - Your browser automatically uses the **WebCrypto API** to generate a 256-bit NIST P-256 (secp256r1) keypair locally on your machine.
   - The **Public Key** is transmitted to the server to allow other users to encrypt files for you.
   - The **Private Key** is stored in your browser's local secure session and **automatically downloaded** to your `Downloads` folder as a `.key` file (e.g., `user_ecc_private.key`).
   - Keep this `.key` file safe! It is your personal decryption key.

### Step 3: Verify Your Email Address
1. Check your email inbox (or open Mailpit Web UI at `htt~p://localhost:8025` during local demonstration).
2. Locate the 6-digit verification code.
3. Enter the 6-digit code into the prompt and click **Verify & Activate Account**.

---

## 3. Signing In & Multi-Factor Authentication (MFA)

1. Navigate to `/login`.
2. Enter your registered email address and master password.
3. Click **Authenticate**.
4. When prompted for **Security Verification (MFA)**:
   - A 6-digit one-time passcode (valid for 5 minutes) is dispatched to your email.
   - Enter the 6-digit code.
   - Upon verification, you will be redirected automatically to your **Personal Vault Dashboard** at `/app/dashboard`.

---

## 4. Managing Your Cryptographic Keyring

Your ECC private key is required to decrypt files that you own or that have been shared with you.

### Inspecting Your Keyring
1. Navigate to **Security & Keyring** (`/app/security`) or click the **ECC Keyring** button in the top navigation bar.
2. Here you can:
   - **View Public Key:** Your registered P-256 public key.
   - **Backup Private Key:** Click **Backup (.key)** to re-download an offline copy.
   - **Reveal / Hide Private Key:** Verify that your private key is present in your current browser session.

### Restoring Your Key on a New Device or Browser
If you log in from a new computer, private browsing tab, or cleared browser cache:
1. Open **Security & Keyring**.
2. Under **Restore or Import Private Key**, paste the text of your backed-up `.key` file.
3. Click **Import Key**. The key is immediately restored to your local session.

---

## 5. Uploading & 5-Layer Encrypting Files

1. Navigate to **Upload & Encrypt** (`/app/upload`).
2. **Select Target File:** Drag and drop your file or click to browse. The browser immediately calculates and displays a **SHA-256 integrity preview**.
3. **Optional Steganography Carrier:**
   - You may upload a custom lossless 24-bit **PNG image** to act as the camouflage carrier.
   - If you do not provide one, SecureVault automatically generates a high-entropy 256x256 PNG carrier.
4. Click **Execute 5-Layer Encryption & Save File**.
5. The system processes the file through:
   - **Layer 1:** SHA-256 pre-encryption digest calculation.
   - **Layer 2:** AES-256-GCM authenticated cipher with 128-bit authentication tag.
   - **Layer 3:** Blowfish-CBC cascaded diffusion with independent 128-bit key.
   - **Layer 4:** Ephemeral ECDH key agreement with HKDF-SHA-256 key wrapping.
   - **Layer 5:** Spatial LSB embedding of the key envelope into the PNG carrier.
6. Upon completion, a green summary card confirms file ID, cipher size, and checksum.

---

## 6. Decrypting, Downloading & Verifying Integrity

1. Navigate to **My Encrypted Files** (`/app/files`).
2. Here you will see a list of all your stored files, their encrypted sizes, SHA-256 digests, and crypto version tags.

### Decrypt & Download Plaintext
- Click the green **Download** button.
- The server retrieves the ciphertext, extracts the key envelope from the PNG carrier, uses your ECC private key to unwrap the DEK, reverses Blowfish, verifies the AES-GCM authentication tag, and re-computes the SHA-256 checksum.
- If valid, the original plaintext file is streamed to your browser.

### Run Live SHA-256 Integrity Verification
- Click the cyan **Shield Check** icon.
- The modal displays:
  - **Stored Initial SHA-256:** The hash computed during upload.
  - **Decrypted Recalculated Digest:** The hash computed over decrypted bytes.
  - **Constant-Time Comparison Result:** `HASH MATCH` / `VALID`.

---

## 7. Secure File Sharing

### Method A: Direct User Delegation
1. In **My Encrypted Files**, click the purple **Share** icon on any file.
2. Choose **Direct User Share**.
3. Enter the registered recipient's email address.
4. Click **Authorize Share**.
5. The system performs an ECDH key agreement using the recipient's public key, creating an independent wrapped key envelope. The recipient can immediately see and decrypt the file under **Shared With Me** (`/app/shared-with-me`).

### Method B: Ephemeral One-Time Link
1. In the Share dialog, choose **Expiring Link Token**.
2. Select the expiration time (1 hour, 6 hours, 24 hours, or 72 hours).
3. Check **Enforce One-Time Access** to ensure the link automatically burns after a single download.
4. Click **Authorize Share**.
5. Copy the generated URL (e.g., `http://localhost:5173/share/{token}`).
6. Anyone with this link can inspect and download the file. If marked **One-Time**, any subsequent access attempt returns `410 Gone (Token already consumed)`.

### Revoking Shares
- Navigate to **Outgoing Shares** (`/app/my-shares`).
- Click **Revoke Access** on any direct delegation or **Revoke Link** on any shared URL. Access is terminated immediately.

---

## 8. In-App Notification Center

1. Click the **Notification Bell** in the top navigation bar or navigate to **Notification Center** (`/app/notifications`).
2. You will receive alerts when:
   - A file is shared with you.
   - An outgoing share is accessed or revoked.
   - Security logins or password changes occur on your account.
3. Click **Mark Read** on individual items or **Mark All Read** to clear badges.
