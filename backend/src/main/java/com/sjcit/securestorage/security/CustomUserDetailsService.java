package com.sjcit.securestorage.security;

import com.sjcit.securestorage.entity.User;
import com.sjcit.securestorage.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmailIgnoreCaseAndDeletedFlagFalse(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public User loadUserById(UUID id) {
        return userRepository.findById(id)
                .filter(u -> !u.isDeletedFlag())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + id));
    }
}
