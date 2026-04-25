package com.smartcity.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data  // Cette annotation génère tous les getters, setters, toString, equals, hashCode
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "utilisateurs")
public class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String nom;
    
    @Column(nullable = false)
    private String motDePasse;
    
    @Column(nullable = false)
    private String role; // ADMIN, AGENT, CITOYEN
    
    @Column(name = "date_creation")
    private LocalDateTime dateCreation;
    
    @Column(name = "telephone")
    private String telephone;
    
    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}