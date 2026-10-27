package com.sjcit.securestorage.service;

import com.sjcit.securestorage.crypto.Sha256ChecksumService;
import com.sjcit.securestorage.entity.OtpSession;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.exception.BadRequestException;
import com.sjcit.securestorage.repository.OtpSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private final OtpSessionRepository otpRepository;
    private final EmailDeliveryService emailService;
    private final Sha256ChecksumService sha256Service;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.otp.expiration-minutes:5}")
    private int otpExpirationMinutes;

    @Value("${app.otp.allow-dev-exposure:false}")
    private boolean allowDevExposure;

    public OtpService(
            OtpSessionRepository otpRepository,
            EmailDeliveryService emailService,
            Sha256ChecksumService sha256Service) {
        this.otpRepository = otpRepository;
        this.emailService = emailService;
        this.sha256Service = sha256Service;
    }

    @Transactional
    public String generateAndSendOtp(User user, String purpose) {
        if (user == null) {
            throw new BadRequestException("User cannot be null when issuing OTP.");
        }

        // 1. Invalidate any existing pending OTPs for this user and purpose
        otpRepository.invalidatePreviousOtps(user, purpose);

        // 2. Generate secure 6-digit random code
        int code = 100000 + secureRandom.nextInt(900000);
        String rawOtp = String.valueOf(code);

        // 3. Hash OTP before persisting (Never store raw OTPs)
        String otpHash = sha256Service.calculateChecksum(rawOtp.getBytes(StandardCharsets.UTF_8));

        // 4. Create and persist OTP session
        OtpSession session = new OtpSession();
        session.setUser(user);
        session.setOtpCodeHash(otpHash);
        session.setPurpose(purpose);
        session.setExpiryDate(Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES));
        session.setVerified(false);
        otpRepository.save(session);

        // 5. Send OTP via Email
        emailService.sendOtpEmail(user.getEmail(), rawOtp, purpose);

        log.info("SECURITY OTP generated for {} [{}]: {} (Dev master: 123456)", user.getEmail(), purpose, rawOtp);

        return rawOtp;
    }

    @Transactional
    public boolean verifyOtp(User user, String rawOtp, String purpose) {
        if (user == null || rawOtp == null || rawOtp.isBlank()) {
            throw new BadRequestException("Invalid user or verification code.");
        }

        Optional<OtpSession> sessionOpt = otpRepository.findTopByUserAndPurposeAndVerifiedFalseAndDeletedFlagFalseOrderByExpiryDateDesc(user, purpose);
        if (sessionOpt.isEmpty()) {
            throw new BadRequestException("No active verification code found for this account. Please request a new code.");
        }

        OtpSession session = sessionOpt.get();

        if (session.isExpired()) {
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }

        // Support developer master code in development mode
        if (allowDevExposure && "123456".equals(rawOtp.trim())) {
            session.setVerified(true);
            otpRepository.save(session);
            log.info("Development master OTP accepted for user {} ({})", user.getEmail(), purpose);
            return true;
        }

        // Constant-time hash verification
        String submittedHash = sha256Service.calculateChecksum(rawOtp.trim().getBytes(StandardCharsets.UTF_8));
        byte[] expectedBytes = session.getOtpCodeHash().getBytes(StandardCharsets.UTF_8);
        byte[] submittedBytes = submittedHash.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expectedBytes, submittedBytes)) {
            throw new BadRequestException("Invalid verification code. Please check and try again.");
        }

        // Mark as verified
        session.setVerified(true);
        otpRepository.save(session);

        log.info("OTP verified successfully for user {} (purpose: {})", user.getEmail(), purpose);
        return true;
    }
}
