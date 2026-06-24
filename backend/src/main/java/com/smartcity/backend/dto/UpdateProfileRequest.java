package com.smartcity.backend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String nom;
    private String email;
    private String domaine;
    private String metier;
    private String adresse;  // ⭐ NOUVEAU
}