package com.sjcit.securestorage.repository;

import com.sjcit.securestorage.entity.Notification;
import com.sjcit.securestorage.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Optional<Notification> findByIdAndDeletedFlagFalse(UUID id);

    List<Notification> findByUserAndDeletedFlagFalseOrderByCreatedAtDesc(User user);

    Page<Notification> findByUserAndDeletedFlagFalse(User user, Pageable pageable);

    long countByUserAndReadStatusFalseAndDeletedFlagFalse(User user);

    @Modifying
    @Query("UPDATE Notification n SET n.readStatus = true WHERE n.user = :user AND n.readStatus = false AND n.deletedFlag = false")
    int markAllAsReadForUser(@Param("user") User user);
}
