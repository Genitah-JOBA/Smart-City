package com.smartcity.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Code de vérification envoyé par email lors de l'inscription
 * (l'utilisateur n'existe pas encore dans la table utilisateurs).
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "email_verifications")
public class EmailVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String code;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    private boolean verified = false;
}
