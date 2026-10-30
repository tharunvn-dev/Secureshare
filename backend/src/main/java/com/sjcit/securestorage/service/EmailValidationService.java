package com.sjcit.securestorage.service;

import com.sjcit.securestorage.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Validates that registration email addresses exist and belong to active, legitimate domains.
 * Rejects non-existent domains, throwaway/disposable domains, and random malformed inputs.
 */
@Service
public class EmailValidationService {

    private static final Logger log = LoggerFactory.getLogger(EmailValidationService.class);

    private static final Pattern EMAIL_SYNTAX_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,15}$"
    );

    // Common legitimate email providers that are guaranteed valid (fast-path bypass for DNS queries)
    private static final Set<String> TRUSTED_PROVIDER_DOMAINS = Set.of(
            "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
            "msn.com", "yahoo.com", "ymail.com", "icloud.com", "me.com", "mac.com",
            "proton.me", "protonmail.com", "zoho.com", "aol.com", "sjcit.ac.in",
            "vtu.ac.in", "edu", "ac.in", "gov.in"
    );

    // Known temporary, disposable, and fake email providers
    private static final Set<String> DISPOSABLE_DOMAINS = Set.of(
            "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
            "throwawaymail.com", "fakeinbox.com", "yopmail.com", "trashmail.com",
            "getairmail.com", "sharklasers.com", "dispostable.com", "maildrop.cc",
            "crazymailing.com", "mytemp.email", "nada.ltd", "temp-mail.org",
            "fake-mail.net", "dropmail.me", "inboxkitten.com", "burnermail.io",
            "tempinbox.com", "emailondeck.com", "minuteinbox.com", "generator.email"
    );

    /**
     * Validates that an email is legitimate, correctly formatted, not disposable,
     * and that its domain actually exists and is configured to receive emails.
     *
     * @param email The email to validate
     * @throws BadRequestException if the email is invalid, disposable, or does not exist
     */
    public void validateEmailDeliverability(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email address is required.");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        // 1. Strict regex format check
        if (!EMAIL_SYNTAX_PATTERN.matcher(normalizedEmail).matches()) {
            throw new BadRequestException("Please enter a valid, well-formed email address (e.g. name@example.com).");
        }

        String[] parts = normalizedEmail.split("@");
        if (parts.length != 2) {
            throw new BadRequestException("Invalid email format.");
        }

        String username = parts[0];
        String domain = parts[1];

        // 2. Reject disposable / temporary email providers
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            throw new BadRequestException("Disposable, temporary, or throwaway email addresses are not allowed. Please register with your real email address.");
        }

        // 3. Fast-path check: if domain is a well-known major provider, it is guaranteed real
        if (TRUSTED_PROVIDER_DOMAINS.contains(domain) || domain.endsWith(".edu") || domain.endsWith(".ac.in")) {
            return;
        }

        // 4. DNS MX Record Verification: verify domain exists and has active mail servers
        boolean hasMailServer = verifyDomainHasMailServer(domain);
        if (!hasMailServer) {
            log.warn("Registration rejected for non-existent or inactive email domain: {}", domain);
            throw new BadRequestException("The email domain @" + domain + " does not exist or cannot receive emails. Please use a real email address.");
        }
    }

    private boolean verifyDomainHasMailServer(String domain) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            // Set short 2.5-second DNS lookup timeout to keep user registration fast
            env.put("com.sun.jndi.dns.timeout.initial", "2500");
            env.put("com.sun.jndi.dns.timeout.retries", "1");

            DirContext ictx = new InitialDirContext(env);

            // First check MX (Mail Exchanger) records
            Attributes attrs = ictx.getAttributes(domain, new String[]{"MX"});
            Attribute attr = attrs.get("MX");
            if (attr != null && attr.size() > 0) {
                return true;
            }

            // Fallback according to RFC 5321: If no MX record, check for A record (host fallback)
            attrs = ictx.getAttributes(domain, new String[]{"A"});
            attr = attrs.get("A");
            return attr != null && attr.size() > 0;

        } catch (NamingException e) {
            log.debug("DNS lookup failed for domain {}: {}", domain, e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("Error during DNS verification for {}: {}", domain, e.getMessage());
            // If DNS lookup throws unexpected environment exception, allow with warning to prevent false positives
            return true;
        }
    }
}

