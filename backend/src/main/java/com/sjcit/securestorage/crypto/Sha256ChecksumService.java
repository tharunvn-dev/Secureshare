package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class Sha256ChecksumService {

    private static final String ALGORITHM = "SHA-256";

    public String calculateChecksum(byte[] data) {
        if (data == null) {
            throw new CryptoException("Cannot calculate checksum on null data.");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new CryptoException("SHA-256 algorithm not available in runtime", e);
        }
    }

    public String calculateChecksum(InputStream inputStream) {
        if (inputStream == null) {
            throw new CryptoException("Cannot calculate checksum on null input stream.");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] buffer = new byte[8192];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (Exception e) {
            throw new CryptoException("Failed to calculate SHA-256 stream checksum", e);
        }
    }

    public boolean verifyChecksum(byte[] data, String expectedChecksumHex) {
        if (data == null || expectedChecksumHex == null) {
            return false;
        }
        String actualHex = calculateChecksum(data);
        byte[] expectedBytes = expectedChecksumHex.trim().toLowerCase().getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = actualHex.toLowerCase().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expectedBytes, actualBytes);
    }
}
