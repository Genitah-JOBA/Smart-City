package com.smartcity.backend.model;

import jakarta.persistence.*;
import lombok.Data; 

public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String url;

    @ManyToOne
    private Signalement signalement;
}