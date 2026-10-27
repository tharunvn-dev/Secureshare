package com.sjcit.securestorage.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class EccKeyManagementTest {

    private EccKeyManagementService eccKeyService;

    @BeforeEach
    void setUp() {
        HkdfService hkdfService = new HkdfService();
        AesGcmEncryptionService aesGcmService = new AesGcmEncryptionService();
        eccKeyService = new EccKeyManagementService(hkdfService, aesGcmService);
    }

    @Test
    @DisplayName("Layer 4: ECC P-256 Key Agreement & Key Wrapping Round-trip")
    void testKeyWrapAndUnwrapRoundTrip() {
        // Generate recipient's ECC key pair (Bob)
        KeyPair recipientKeyPair = eccKeyService.generateKeyPair();

        // Synthetic cryptographic keys to wrap
        byte[] aesDek = "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8); // 32 bytes
        byte[] blowfishKey = "1234567890123456".getBytes(StandardCharsets.UTF_8); // 16 bytes

        // Wrap keys under recipient's public key
        byte[] wrappedEnvelope = eccKeyService.wrapKeysForRecipient(aesDek, blowfishKey, recipientKeyPair.getPublic());
        assertNotNull(wrappedEnvelope);

        // Unwrap keys using recipient's private key
        byte[][] recoveredKeys = eccKeyService.unwrapKeys(wrappedEnvelope, recipientKeyPair.getPrivate());
        assertArrayEquals(aesDek, recoveredKeys[0]);
        assertArrayEquals(blowfishKey, recoveredKeys[1]);
    }

    @Test
    @DisplayName("Layer 4: ECDH shared secret derivation symmetry between Alice and Bob")
    void testEcdhSymmetry() {
        KeyPair alice = eccKeyService.generateKeyPair();
        KeyPair bob = eccKeyService.generateKeyPair();

        byte[] secretAlice = eccKeyService.computeSharedSecret(alice.getPrivate(), bob.getPublic());
        byte[] secretBob = eccKeyService.computeSharedSecret(bob.getPrivate(), alice.getPublic());

        assertArrayEquals(secretAlice, secretBob);
    }
}
