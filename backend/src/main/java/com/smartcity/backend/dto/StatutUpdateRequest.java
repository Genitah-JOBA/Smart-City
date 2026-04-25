// StatutUpdateRequest.java - Nouveau fichier DTO
package com.smartcity.backend.dto;

import lombok.Data;

@Data
public class StatutUpdateRequest {
    private String statut;
    private Long agentId;  // Optionnel - pour assigner un agent
    private String agentEmail;
    private String agentNom;
}