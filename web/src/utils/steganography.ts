// Spatial LSB Steganography Utility for Key Management
// Compatible with backend LsbSteganographyService:
// Framing: [MAGIC: 4B ("SECK")] | [Version: 1B] | [PayloadLength: 4B] | [Payload: NB] | [CRC32: 4B]

// Standard IEEE 802.3 CRC32 Table & Calculator
const makeCRCTable = (): Uint32Array => {
  let c: number;
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
};

const crcTable = makeCRCTable();

export function computeCRC32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const MAGIC = [0x53, 0x45, 0x43, 0x4b]; // 'S', 'E', 'C', 'K'
const VERSION = 1;
const HEADER_TRAILER_OVERHEAD = 4 + 1 + 4 + 4; // 13 bytes

/**
 * Creates a futuristic cybersecurity gradient canvas to serve as a high-tech carrier image.
 */
export function createCyberpunkCanvas(payloadSizeBytes: number, title = 'SECUREVAULT CARRIER'): HTMLCanvasElement {
  const totalBytes = HEADER_TRAILER_OVERHEAD + payloadSizeBytes;
  const totalBits = totalBytes * 8;
  const pixelsNeeded = Math.ceil(totalBits / 3);

  let dimension = Math.ceil(Math.sqrt(pixelsNeeded)) + 40;
  dimension = Math.max(dimension, 256); // Minimum 256x256 image for aesthetic presentation

  const canvas = document.createElement('canvas');
  canvas.width = dimension;
  canvas.height = dimension;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, dimension, dimension);
  gradient.addColorStop(0, '#060b14');
  gradient.addColorStop(0.5, '#0b192c');
  gradient.addColorStop(1, '#052e25');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, dimension, dimension);

  // Decorative Matrix / Circuit Grid Lines
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
  ctx.lineWidth = 1;
  const gridSize = 24;
  for (let x = 0; x < dimension; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, dimension);
    ctx.stroke();
  }
  for (let y = 0; y < dimension; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(dimension, y);
    ctx.stroke();
  }

  // Geometric Circuit Circles
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(dimension / 2, dimension / 2, dimension * 0.32, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.beginPath();
  ctx.arc(dimension / 2, dimension / 2, dimension * 0.22, 0, Math.PI * 2);
  ctx.stroke();

  // Futuristic Crosshairs
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
  ctx.beginPath();
  ctx.moveTo(dimension / 2 - 20, dimension / 2);
  ctx.lineTo(dimension / 2 + 20, dimension / 2);
  ctx.moveTo(dimension / 2, dimension / 2 - 20);
  ctx.lineTo(dimension / 2, dimension / 2 + 20);
  ctx.stroke();

  // Branding Text
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, dimension / 2, dimension - 24);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.font = '8px monospace';
  ctx.fillText('LSB STEGANOGRAPHIC KEY ENVELOPE', dimension / 2, dimension - 12);

  return canvas;
}

/**
 * Embeds a private key string into a PNG carrier using Spatial LSB Steganography.
 * @param privateKeyText Base64 or PEM ECC private key
 * @param customCarrier Optional PNG carrier file chosen by user
 * @returns Blob of the steganographic PNG image
 */
export async function embedKeyInStegoImage(
  privateKeyText: string,
  customCarrier?: File | null
): Promise<Blob> {
  // 1. Sanitize the private key string to raw Base64
  let cleanKey = privateKeyText.trim();
  if (cleanKey.includes('-----BEGIN')) {
    cleanKey = cleanKey
      .replace(/-----BEGIN[\s\S]*?-----/g, '')
      .replace(/-----END[\s\S]*?-----/g, '')
      .replace(/["']/g, '')
      .replace(/\s+/g, '');
  }

  if (!cleanKey) {
    throw new Error('Private key cannot be empty.');
  }

  const payload = new TextEncoder().encode(cleanKey);
  const crc = computeCRC32(payload);

  // 2. Build 13-byte framed buffer: [MAGIC: 4B] + [VERSION: 1B] + [Length: 4B] + [Payload: NB] + [CRC32: 4B]
  const framedBuffer = new Uint8Array(HEADER_TRAILER_OVERHEAD + payload.length);
  const dataView = new DataView(framedBuffer.buffer);

  framedBuffer.set(MAGIC, 0);
  framedBuffer[4] = VERSION;
  dataView.setInt32(5, payload.length, false); // Big-endian
  framedBuffer.set(payload, 9);
  dataView.setUint32(9 + payload.length, crc, false); // Big-endian

  const totalBitsRequired = framedBuffer.length * 8;

  // 3. Prepare canvas image
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  if (customCarrier) {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d')!;
    const img = await loadImageFromFile(customCarrier);
    let targetWidth = img.width;
    let targetHeight = img.height;
    const maxDim = 2048;
    if (targetWidth > maxDim || targetHeight > maxDim) {
      if (targetWidth > targetHeight) {
        targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
        targetWidth = maxDim;
      } else {
        targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
        targetHeight = maxDim;
      }
    }
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  } else {
    canvas = createCyberpunkCanvas(payload.length, 'SECUREVAULT ECC KEY VAULT');
    ctx = canvas.getContext('2d')!;
  }

  const width = canvas.width;
  const height = canvas.height;
  const availableBits = width * height * 3;

  if (availableBits < totalBitsRequired) {
    throw new Error(
      `Carrier image too small. Required: ${totalBitsRequired} bits, Available: ${availableBits} bits (${width}x${height} px).`
    );
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 4. LSB Embedding into R, G, B channels
  let bitIndex = 0;
  for (let i = 0; i < data.length && bitIndex < totalBitsRequired; i += 4) {
    // Red channel
    if (bitIndex < totalBitsRequired) {
      const bit = (framedBuffer[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1;
      data[i] = (data[i] & ~1) | bit;
      bitIndex++;
    }
    // Green channel
    if (bitIndex < totalBitsRequired) {
      const bit = (framedBuffer[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1;
      data[i + 1] = (data[i + 1] & ~1) | bit;
      bitIndex++;
    }
    // Blue channel
    if (bitIndex < totalBitsRequired) {
      const bit = (framedBuffer[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1;
      data[i + 2] = (data[i + 2] & ~1) | bit;
      bitIndex++;
    }
    // Alpha channel data[i+3] remains untouched (255)
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate PNG blob from steganography canvas.'));
    }, 'image/png');
  });
}

/**
 * Extracts a concealed private key from a steganographic PNG image.
 * @param imageFile The PNG file containing the hidden key envelope
 * @returns The extracted Base64 ECC private key string
 */
export async function extractKeyFromStegoImage(imageFile: File | Blob): Promise<string> {
  const img = await loadImageFromFile(imageFile);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  // 1. Read the 9-byte header (72 bits): MAGIC(4) + VERSION(1) + LENGTH(4)
  const headerBytes = new Uint8Array(9);
  const headerBitsToRead = 9 * 8;
  let bitIndex = 0;

  for (let i = 0; i < data.length && bitIndex < headerBitsToRead; i += 4) {
    for (let ch = 0; ch < 3 && bitIndex < headerBitsToRead; ch++) {
      const bit = data[i + ch] & 1;
      headerBytes[Math.floor(bitIndex / 8)] |= (bit << (7 - (bitIndex % 8)));
      bitIndex++;
    }
  }

  // Validate MAGIC bytes: 'S', 'E', 'C', 'K'
  if (
    headerBytes[0] !== MAGIC[0] ||
    headerBytes[1] !== MAGIC[1] ||
    headerBytes[2] !== MAGIC[2] ||
    headerBytes[3] !== MAGIC[3]
  ) {
    throw new Error('No concealed key envelope found. Image lacks the "SECK" steganographic identifier.');
  }

  // Validate VERSION
  if (headerBytes[4] !== VERSION) {
    throw new Error(`Unsupported steganographic envelope version: ${headerBytes[4]}`);
  }

  // Read payload length (big-endian Int32)
  const headerView = new DataView(headerBytes.buffer);
  const payloadLength = headerView.getInt32(5, false);

  const availableBytes = Math.floor((img.width * img.height * 3) / 8);
  if (payloadLength <= 0 || payloadLength > availableBytes) {
    throw new Error(`Corrupted steganographic header: invalid payload length (${payloadLength} bytes).`);
  }

  // 2. Read full framed bytes: [HEADER_TRAILER_OVERHEAD (13) + payloadLength]
  const totalBytesToRead = HEADER_TRAILER_OVERHEAD + payloadLength;
  const totalBitsToRead = totalBytesToRead * 8;

  const framedBytes = new Uint8Array(totalBytesToRead);
  bitIndex = 0;

  for (let i = 0; i < data.length && bitIndex < totalBitsToRead; i += 4) {
    for (let ch = 0; ch < 3 && bitIndex < totalBitsToRead; ch++) {
      const bit = data[i + ch] & 1;
      framedBytes[Math.floor(bitIndex / 8)] |= (bit << (7 - (bitIndex % 8)));
      bitIndex++;
    }
  }

  const frameView = new DataView(framedBytes.buffer);
  const payload = framedBytes.slice(9, 9 + payloadLength);
  const expectedCrc = frameView.getUint32(9 + payloadLength, false);

  // 3. Verify CRC32
  const actualCrc = computeCRC32(payload);
  if (actualCrc !== expectedCrc) {
    throw new Error('Steganographic payload integrity check failed (CRC-32 mismatch). The key envelope is corrupted.');
  }

  return new TextDecoder().decode(payload);
}

/**
 * Triggers a browser download of any Blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadImageFromFile(fileOrBlob: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file. Ensure it is a valid image (PNG, JPG, WebP, etc.).'));
    };
    img.src = url;
  });
}

export interface CarrierCapacityInfo {
  width: number;
  height: number;
  totalPixels: number;
  availableBits: number;
  availableBytes: number;
  requiredBytes: number;
  utilizationPercentage: number;
  isSufficient: boolean;
}

/**
 * Calculates carrier steganographic capacity vs NIST P-256 ECC key payload requirements.
 */
export function inspectCarrierCapacity(
  width: number,
  height: number,
  privateKeyText: string
): CarrierCapacityInfo {
  let cleanKey = privateKeyText.trim();
  if (cleanKey.includes('-----BEGIN')) {
    cleanKey = cleanKey
      .replace(/-----BEGIN[\s\S]*?-----/g, '')
      .replace(/-----END[\s\S]*?-----/g, '')
      .replace(/["']/g, '')
      .replace(/\s+/g, '');
  }
  const payloadBytes = new TextEncoder().encode(cleanKey).length;
  const requiredBytes = HEADER_TRAILER_OVERHEAD + payloadBytes;
  const totalPixels = width * height;
  const availableBits = totalPixels * 3;
  const availableBytes = Math.floor(availableBits / 8);
  const utilizationPercentage = availableBytes > 0 ? (requiredBytes / availableBytes) * 100 : 100;

  return {
    width,
    height,
    totalPixels,
    availableBits,
    availableBytes,
    requiredBytes,
    utilizationPercentage: Math.min(utilizationPercentage, 100),
    isSufficient: availableBytes >= requiredBytes,
  };
}

