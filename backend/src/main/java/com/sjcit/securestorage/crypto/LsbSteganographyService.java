package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.zip.CRC32;

/**
 * Layer 5: Least Significant Bit (LSB) Lossless Steganography in PNG.
 *
 * Conceals a wrapped cryptographic key envelope inside a PNG carrier.
 * Framing format:
 * [Magic: 4 bytes ("SECK")] | [Version: 1 byte] | [PayloadLength: 4 bytes] | [Payload: N bytes] | [CRC32: 4 bytes]
 */
@Service
public class LsbSteganographyService {

    private static final byte[] MAGIC = new byte[] { 'S', 'E', 'C', 'K' };
    private static final byte VERSION = 1;
    private static final int HEADER_TRAILER_OVERHEAD = 4 + 1 + 4 + 4; // 13 bytes

    public byte[] embed(byte[] carrierPngBytes, byte[] payload) {
        if (payload == null || payload.length == 0) {
            throw new CryptoException("Payload to embed cannot be null or empty.");
        }
        BufferedImage image;
        try {
            if (carrierPngBytes == null || carrierPngBytes.length == 0) {
                image = generateCarrierImage(payload.length);
            } else {
                image = ImageIO.read(new ByteArrayInputStream(carrierPngBytes));
                if (image == null) {
                    throw new CryptoException("Failed to decode carrier image. Must be a valid PNG.");
                }
            }
        } catch (IOException e) {
            throw new CryptoException("Error reading carrier image: " + e.getMessage(), e);
        }

        // Calculate CRC32 of payload
        CRC32 crc32 = new CRC32();
        crc32.update(payload);
        long crcValue = crc32.getValue();

        // Build framed data buffer
        ByteBuffer framedBuffer = ByteBuffer.allocate(HEADER_TRAILER_OVERHEAD + payload.length);
        framedBuffer.put(MAGIC);
        framedBuffer.put(VERSION);
        framedBuffer.putInt(payload.length);
        framedBuffer.put(payload);
        framedBuffer.putInt((int) crcValue);

        byte[] framedBytes = framedBuffer.array();
        int totalBitsRequired = framedBytes.length * 8;

        int width = image.getWidth();
        int height = image.getHeight();
        int availableBits = width * height * 3; // 3 color channels (R, G, B) per pixel

        if (availableBits < totalBitsRequired) {
            throw new CryptoException(String.format(
                "Carrier image capacity insufficient. Required: %d bits, Available: %d bits (%dx%d pixels).",
                totalBitsRequired, availableBits, width, height
            ));
        }

        // Create a standard RGB copy to avoid color model loss
        BufferedImage stegoImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = stegoImage.createGraphics();
        g2d.drawImage(image, 0, 0, null);
        g2d.dispose();

        int bitIndex = 0;
        outer:
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = stegoImage.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                // Embed into Red channel LSB
                if (bitIndex < totalBitsRequired) {
                    int bit = (framedBytes[bitIndex / 8] >> (7 - (bitIndex % 8))) & 1;
                    r = (r & ~1) | bit;
                    bitIndex++;
                }

                // Embed into Green channel LSB
                if (bitIndex < totalBitsRequired) {
                    int bit = (framedBytes[bitIndex / 8] >> (7 - (bitIndex % 8))) & 1;
                    g = (g & ~1) | bit;
                    bitIndex++;
                }

                // Embed into Blue channel LSB
                if (bitIndex < totalBitsRequired) {
                    int bit = (framedBytes[bitIndex / 8] >> (7 - (bitIndex % 8))) & 1;
                    b = (b & ~1) | bit;
                    bitIndex++;
                }

                int newRgb = (r << 16) | (g << 8) | b;
                stegoImage.setRGB(x, y, newRgb);

                if (bitIndex >= totalBitsRequired) {
                    break outer;
                }
            }
        }

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(stegoImage, "png", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new CryptoException("Failed to write steganographic PNG: " + e.getMessage(), e);
        }
    }

    public byte[] extract(byte[] stegoPngBytes) {
        if (stegoPngBytes == null || stegoPngBytes.length == 0) {
            throw new CryptoException("Steganographic PNG data is null or empty.");
        }
        BufferedImage image;
        try {
            image = ImageIO.read(new ByteArrayInputStream(stegoPngBytes));
            if (image == null) {
                throw new CryptoException("Failed to decode stego image. Corrupted or invalid PNG format.");
            }
        } catch (IOException e) {
            throw new CryptoException("Error reading stego image: " + e.getMessage(), e);
        }

        int width = image.getWidth();
        int height = image.getHeight();

        // 1. First extract Header (13 bytes * 8 = 104 bits or at least 9 bytes for length)
        byte[] headerBytes = new byte[9]; // MAGIC (4) + VERSION (1) + LENGTH (4)
        int bitsToRead = headerBytes.length * 8;
        int bitIndex = 0;

        outerHeader:
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int[] channels = new int[] { (rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF };

                for (int ch : channels) {
                    int bit = ch & 1;
                    headerBytes[bitIndex / 8] |= (byte) (bit << (7 - (bitIndex % 8)));
                    bitIndex++;
                    if (bitIndex >= bitsToRead) {
                        break outerHeader;
                    }
                }
            }
        }

        ByteBuffer headerBuf = ByteBuffer.wrap(headerBytes);
        byte[] magicRead = new byte[4];
        headerBuf.get(magicRead);

        if (magicRead[0] != MAGIC[0] || magicRead[1] != MAGIC[1] ||
            magicRead[2] != MAGIC[2] || magicRead[3] != MAGIC[3]) {
            throw new CryptoException("Invalid steganographic magic identifier. No concealed key envelope found in carrier.");
        }

        byte versionRead = headerBuf.get();
        if (versionRead != VERSION) {
            throw new CryptoException("Unsupported steganographic envelope version: " + versionRead);
        }

        int payloadLength = headerBuf.getInt();
        if (payloadLength <= 0 || payloadLength > (width * height * 3 / 8)) {
            throw new CryptoException("Corrupted steganographic header: invalid payload length " + payloadLength);
        }

        // 2. Read full framed bytes: [HEADER_TRAILER_OVERHEAD + payloadLength]
        int totalBytesToRead = HEADER_TRAILER_OVERHEAD + payloadLength;
        int totalBitsToRead = totalBytesToRead * 8;

        if (width * height * 3 < totalBitsToRead) {
            throw new CryptoException("Carrier image smaller than declared steganographic payload size.");
        }

        byte[] allFramedBytes = new byte[totalBytesToRead];
        bitIndex = 0;

        outerAll:
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int[] channels = new int[] { (rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF };

                for (int ch : channels) {
                    int bit = ch & 1;
                    allFramedBytes[bitIndex / 8] |= (byte) (bit << (7 - (bitIndex % 8)));
                    bitIndex++;
                    if (bitIndex >= totalBitsToRead) {
                        break outerAll;
                    }
                }
            }
        }

        ByteBuffer fullBuffer = ByteBuffer.wrap(allFramedBytes);
        fullBuffer.position(9); // Skip Magic (4) + Version (1) + Length (4)

        byte[] payload = new byte[payloadLength];
        fullBuffer.get(payload);

        int expectedCrc = fullBuffer.getInt();

        // 3. Verify CRC32
        CRC32 crc32 = new CRC32();
        crc32.update(payload);
        if ((int) crc32.getValue() != expectedCrc) {
            throw new CryptoException("Steganographic payload integrity check failed (CRC-32 mismatch). Concealed key envelope is corrupted.");
        }

        return payload;
    }

    public BufferedImage generateCarrierImage(int payloadSizeBytes) {
        int totalBytes = HEADER_TRAILER_OVERHEAD + payloadSizeBytes;
        int totalBits = totalBytes * 8;
        int pixelsNeeded = (int) Math.ceil((double) totalBits / 3.0);

        int dimension = (int) Math.ceil(Math.sqrt(pixelsNeeded)) + 20;
        dimension = Math.max(dimension, 128); // minimum 128x128 image

        BufferedImage image = new BufferedImage(dimension, dimension, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();

        // Render sleek cybersecurity dark gradient
        GradientPaint gradient = new GradientPaint(
            0, 0, new Color(15, 23, 42),
            dimension, dimension, new Color(30, 41, 59)
        );
        g2d.setPaint(gradient);
        g2d.fillRect(0, 0, dimension, dimension);

        // Subtle geometric background accent
        g2d.setColor(new Color(56, 189, 248, 40));
        g2d.drawOval(dimension / 4, dimension / 4, dimension / 2, dimension / 2);
        g2d.drawRect(dimension / 6, dimension / 6, dimension * 2 / 3, dimension * 2 / 3);

        g2d.dispose();
        return image;
    }
}
