package com.sjcit.securestorage.repository;

import com.sjcit.securestorage.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByNameIgnoreCaseAndDeletedFlagFalse(String name);
}
