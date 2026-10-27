package com.sjcit.securestorage.service;

import com.sjcit.securestorage.crypto.EccKeyManagementService;
import com.sjcit.securestorage.entity.Role;
import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.repository.RoleRepository;
import com.sjcit.securestorage.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.KeyPair;
import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EccKeyManagementService eccKeyService;
    private final AuditLogService auditLogService;

    @Value("${app.admin.bootstrap-email:admin@example.com}")
    private String adminEmail;

    @Value("${app.admin.bootstrap-display-name:System Administrator}")
    private String adminDisplayName;

    @Value("${app.admin.bootstrap-password:ChangeMeOnFirstLogin!2026}")
    private String adminPassword;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            EccKeyManagementService eccKeyService,
            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.eccKeyService = eccKeyService;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role adminRole = roleRepository.findByNameIgnoreCaseAndDeletedFlagFalse("ADMIN").orElse(null);
        if (adminRole == null) {
            log.warn("ADMIN role not found yet in database. Skipping admin bootstrap check.");
            return;
        }

        Role userRole = roleRepository.findByNameIgnoreCaseAndDeletedFlagFalse("USER").orElse(null);

        // Provision/synchronize configured admin email and default admin@gmail.com
        String[] adminEmails = { adminEmail.toLowerCase().trim(), "admin@gmail.com", "admin@example.com" };
        for (String targetEmail : adminEmails) {
            if (targetEmail == null || targetEmail.isBlank())
                continue;

            Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCaseAndDeletedFlagFalse(targetEmail);
            User adminUser;

            if (existingUserOpt.isPresent()) {
                adminUser = existingUserOpt.get();
                adminUser.setStatus("ACTIVE");
                adminUser.setDeletedFlag(false);
                adminUser.setMfaEnabled(false);
                // Always sync password if configured
                adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
                if (!adminUser.hasRole("ADMIN")) {
                    adminUser.getRoles().add(adminRole);
                }
                if (userRole != null && !adminUser.hasRole("USER")) {
                    adminUser.getRoles().add(userRole);
                }
                if (adminUser.getPublicKeyEcc() == null || adminUser.getPublicKeyEcc().isBlank()
                        || adminUser.getPublicKeyEcc().length() < 64) {
                    KeyPair keyPair = eccKeyService.generateKeyPair();
                    adminUser.setPublicKeyEcc(eccKeyService.encodePublicKey(keyPair.getPublic()));
                }
                userRepository.save(adminUser);
                log.info("Administrator account synced: {}", targetEmail);
            } else {
                adminUser = new User();
                adminUser.setEmail(targetEmail);
                adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
                adminUser.setFirstName("System");
                adminUser.setLastName("Administrator");
                adminUser.setStatus("ACTIVE");
                adminUser.setDeletedFlag(false);
                adminUser.setMfaEnabled(false);
                HashSet<Role> roles = new HashSet<>();
                roles.add(adminRole);
                if (userRole != null)
                    roles.add(userRole);
                adminUser.setRoles(roles);

                KeyPair keyPair = eccKeyService.generateKeyPair();
                adminUser.setPublicKeyEcc(eccKeyService.encodePublicKey(keyPair.getPublic()));
                adminUser.setCreatedAt(Instant.now());
                adminUser.setUpdatedAt(Instant.now());
                userRepository.save(adminUser);
                log.info("Initial system administrator created: {}", targetEmail);
            }
        }
    }
}
