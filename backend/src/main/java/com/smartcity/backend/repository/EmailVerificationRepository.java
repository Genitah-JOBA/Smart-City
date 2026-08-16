package com.smartcity.backend.repository;

import com.smartcity.backend.model.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    Optional<EmailVerification> findTopByEmailOrderByIdDesc(String email);

    @Transactional
    void deleteByEmail(String email);
}
