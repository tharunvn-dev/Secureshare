package com.sjcit.securestorage;

import com.sjcit.securestorage.dto.RegisterRequest;
import com.sjcit.securestorage.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;

@SpringBootTest
public class AuthRegistrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Test
    void testRegistration() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("authtest" + System.currentTimeMillis() + "@gmail.com");
        request.setPassword("Password@123");
        request.setFirstName("Auth");
        request.setLastName("Tester");
        request.setPublicKeyEcc("MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7Z5f8e5x123");

        MockHttpServletRequest mockRequest = new MockHttpServletRequest();
        authService.register(request, mockRequest);
    }

    @Test
    void testPasswordCheck() {
        String hash = "$2a$10$IT9im2hCPM6AkBfRlMiK5.ZQmOhcwUO6qub3YF//BkKcgOe8NWnRG";
        String[] candidates = {"Password@123", "admin@12345678", "Admin@123456", "Tarun@123", "Tharun@123", "12345678", "password", "Admin@123"};
        for (String c : candidates) {
            if (passwordEncoder.matches(c, hash)) {
                System.out.println(">>> MATCH FOUND FOR USER HASH: " + c);
            }
        }
        System.out.println(">>> BCRYPT HASH FOR admin@12345678: " + passwordEncoder.encode("admin@12345678"));
        System.out.println(">>> BCRYPT HASH FOR Admin@123456: " + passwordEncoder.encode("Admin@123456"));
    }
}
