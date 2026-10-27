// Web Crypto API helper for ECC P-256 generation and client-side SHA-256 hashing

export interface EccKeyPair {
  publicKeyBase64: string;
  privateKeyBase64: string;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Generate an ECC P-256 (prime256v1) KeyPair using WebCrypto
export async function generateEccKeyPair(): Promise<EccKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKeyBase64: arrayBufferToBase64(spki),
    privateKeyBase64: arrayBufferToBase64(pkcs8),
  };
}

// Calculate SHA-256 checksum of a File object in browser
export async function calculateFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Download raw text as a file (e.g. key backup)
export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
