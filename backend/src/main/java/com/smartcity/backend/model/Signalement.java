package com.smartcity.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data  // Cette annotation génère tous les getters et setters
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "signalements")
public class Signalement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String titre;
    private String description;
    private String type;
    private String statut = "EN_ATTENTE";
    
    private Double latitude;
    private Double longitude;
    
    @Column(length = 500)
    private String address;
    
    private String ville;
    private String commune;

    // Détails de localisation
    private String quartier;
    private String fokontany;

    @Column(name = "lieu_dit")
    private String lieuDit;

    private String rue;

    // Champs pour l'assignation des agents
    @Column(name = "agent_id")
    private Long agentId;
    
    @Column(name = "agent_email")
    private String agentEmail;
    
    @Column(name = "agent_nom")
    private String agentNom;
    
    @OneToMany(mappedBy = "signalement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Image> images = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
    
    @Column(name = "date_creation")
    private LocalDateTime dateCreation;
    
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
    
    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }
}