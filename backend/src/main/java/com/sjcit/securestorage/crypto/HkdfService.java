package com.sjcit.securestorage.crypto;

import com.sjcit.securestorage.exception.CryptoException;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

/**
 * RFC 5869: HMAC-based Extract-and-Expand Key Derivation Function (HKDF) using SHA-256.
 */
@Service
public class HkdfService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int HASH_LEN = 32; // SHA-256 output length in bytes

    public byte[] extract(byte[] salt, byte[] ikm) {
        if (salt == null || salt.length == 0) {
            salt = new byte[HASH_LEN]; // Default to all-zero array of HashLen
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(salt, HMAC_ALGORITHM));
            return mac.doFinal(ikm);
        } catch (Exception e) {
            throw new CryptoException("HKDF extract step failed: " + e.getMessage(), e);
        }
    }

    public byte[] expand(byte[] prk, byte[] info, int length) {
        if (length > 255 * HASH_LEN) {
            throw new CryptoException("Requested HKDF length is too large: " + length);
        }
        if (info == null) {
            info = new byte[0];
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(prk, HMAC_ALGORITHM));

            ByteArrayOutputStream okm = new ByteArrayOutputStream();
            byte[] t = new byte[0];
            int n = (int) Math.ceil((double) length / HASH_LEN);

            for (int i = 1; i <= n; i++) {
                mac.reset();
                mac.update(t);
                mac.update(info);
                mac.update((byte) i);
                t = mac.doFinal();

                int bytesToCopy = Math.min(t.length, length - okm.size());
                okm.write(t, 0, bytesToCopy);
            }

            return okm.toByteArray();
        } catch (Exception e) {
            throw new CryptoException("HKDF expand step failed: " + e.getMessage(), e);
        }
    }

    public byte[] deriveKey(byte[] ikm, byte[] salt, byte[] info, int length) {
        byte[] prk = extract(salt, ikm);
        return expand(prk, info, length);
    }
}
