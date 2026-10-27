package com.sjcit.securestorage.repository;

import com.sjcit.securestorage.entity.OtpSession;
import com.sjcit.securestorage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpSessionRepository extends JpaRepository<OtpSession, UUID> {

    List<OtpSession> findByUserAndPurposeAndVerifiedFalseAndDeletedFlagFalseOrderByExpiryDateDesc(User user, String purpose);

    Optional<OtpSession> findTopByUserAndPurposeAndVerifiedFalseAndDeletedFlagFalseOrderByExpiryDateDesc(User user, String purpose);

    @Modifying
    @Query("UPDATE OtpSession o SET o.deletedFlag = true WHERE o.user = :user AND o.purpose = :purpose AND o.verified = false")
    void invalidatePreviousOtps(@Param("user") User user, @Param("purpose") String purpose);

    @Modifying
    @Query("DELETE FROM OtpSession o WHERE o.expiryDate < :cutoff")
    void purgeExpiredOtps(@Param("cutoff") Instant cutoff);
}
