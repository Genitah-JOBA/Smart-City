package com.smartcity.backend.model;

import jakarta.persistence.*;
import lombok.Data;

public class Signalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String description;
    private String type;
    private String statut;

    private Double latitude;
    private Double longitude;

    @ManyToOne
    private Utilisateur utilisateur;
}