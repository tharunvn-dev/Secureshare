package com.sjcit.securestorage.service;

import com.sjcit.securestorage.entity.EmailOutbox;
import com.sjcit.securestorage.repository.EmailOutboxRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class EmailDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(EmailDeliveryService.class);

    private final JavaMailSender mailSender;
    private final EmailOutboxRepository outboxRepository;

    @Value("${app.mail.from:no-reply@securestorage.local}")
    private String mailFrom;

    public EmailDeliveryService(JavaMailSender mailSender, EmailOutboxRepository outboxRepository) {
        this.mailSender = mailSender;
        this.outboxRepository = outboxRepository;
    }

    @Transactional
    public EmailOutbox queueEmail(String recipient, String subject, String bodyText, String bodyHtml) {
        EmailOutbox outbox = new EmailOutbox(recipient, subject, bodyText, bodyHtml);
        outbox = outboxRepository.save(outbox);
        sendOutboxEmail(outbox.getId());
        return outbox;
    }

    @Async
    @Transactional
    public void sendOutboxEmail(java.util.UUID outboxId) {
        EmailOutbox outbox = outboxRepository.findById(outboxId).orElse(null);
        if (outbox == null || !"PENDING".equals(outbox.getStatus())) {
            return;
        }

        outbox.setAttemptCount(outbox.getAttemptCount() + 1);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(mailFrom, "SecureShare Verification");
            } catch (Exception ignored) {
                helper.setFrom(mailFrom);
            }
            helper.setTo(outbox.getRecipient());
            helper.setSubject(outbox.getSubject());

            if (outbox.getBodyHtml() != null && !outbox.getBodyHtml().isBlank()) {
                helper.setText(outbox.getBodyText(), outbox.getBodyHtml());
            } else {
                helper.setText(outbox.getBodyText(), false);
            }

            mailSender.send(message);

            outbox.setStatus("SENT");
            outbox.setSentAt(Instant.now());
            outbox.setLastError(null);
            outboxRepository.save(outbox);

            log.info("Email delivered to {} via configured SMTP. Subject: {}", outbox.getRecipient(), outbox.getSubject());
        } catch (Exception e) {
            log.warn("SMTP email delivery to {} failed (attempt {}): {}", outbox.getRecipient(), outbox.getAttemptCount(), e.getMessage());
            outbox.setStatus("FAILED");
            outbox.setLastError(e.getMessage());
            outboxRepository.save(outbox);
        }
    }

    public void sendOtpEmail(String recipient, String otpCode, String purpose) {
        String title;
        String actionDescription;

        switch (purpose) {
            case "REGISTRATION_VERIFICATION" -> {
                title = "Verify Your Account Email";
                actionDescription = "Please use the following 6-digit verification code to activate your account:";
            }
            case "PASSWORD_RESET" -> {
                title = "Password Reset Request";
                actionDescription = "We received a request to reset your password. Use the following code to proceed:";
            }
            default -> {
                title = "Login Verification Code (MFA)";
                actionDescription = "Use the following 6-digit one-time password to complete your login:";
            }
        }

        String bodyText = String.format("""
            Security Verification Code
            
            %s
            
            Verification Code: %s
            
            This code expires in 5 minutes. If you did not make this request, please ignore this email or contact security.
            
            SJCIT Secure Storage Framework
            """, actionDescription, otpCode);

        String bodyHtml = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
                .card { max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(56, 189, 248, 0.1); color: #38bdf8; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
                h2 { color: #ffffff; margin-top: 0; font-size: 22px; }
                p { color: #94a3b8; line-height: 1.6; font-size: 14px; }
                .code-box { background: #0f172a; border: 2px dashed #38bdf8; border-radius: 8px; text-align: center; padding: 20px; margin: 24px 0; }
                .code { font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #38bdf8; }
                .footer { font-size: 12px; color: #64748b; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
              </style>
            </head>
            <body>
              <div class="card">
                <span class="badge">Security Notification</span>
                <h2>%s</h2>
                <p>%s</p>
                <div class="code-box">
                  <span class="code">%s</span>
                </div>
                <p>This code will expire in <strong>5 minutes</strong>. Never share this code with anyone.</p>
                <div class="footer">
                  SJCIT Final Year Major Project &bull; Multi-Layer Secure Storage Framework
                </div>
              </div>
            </body>
            </html>
            """, title, actionDescription, otpCode);

        queueEmail(recipient, title + " - Secure Storage", bodyText, bodyHtml);
    }

    public void sendFileSharedNotification(String recipient, String senderName, String fileName) {
        String subject = senderName + " shared a secure file with you";
        String bodyText = String.format("""
            Secure File Shared
            
            %s has shared the encrypted file "%s" with you on the Secure Storage platform.
            
            Log in to your account at http://localhost:5173 to access and decrypt the file.
            
            SJCIT Secure Storage Framework
            """, senderName, fileName);

        String bodyHtml = String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 20px;">
              <div style="max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
                <h2 style="color: #38bdf8; margin-top: 0;">New File Shared With You</h2>
                <p style="color: #94a3b8;"><strong>%s</strong> has shared an encrypted file with you:</p>
                <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #38bdf8;">
                  <span style="font-weight: 600; color: #ffffff;">&#128196; %s</span>
                </div>
                <p style="color: #94a3b8;">To download and decrypt this file using your ECC private key, sign in to the application.</p>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="http://localhost:5173/app/shared-with-me" style="background: #38bdf8; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Shared Files</a>
                </div>
              </div>
            </body>
            </html>
            """, senderName, fileName);

        queueEmail(recipient, subject, bodyText, bodyHtml);
    }
}
