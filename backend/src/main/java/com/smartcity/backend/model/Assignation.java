package com.smartcity.backend.model;

import jakarta.persistence.*;
import lombok.Data; 

public class Assignation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Signalement signalement;

    @ManyToOne
    private Utilisateur agent;
}