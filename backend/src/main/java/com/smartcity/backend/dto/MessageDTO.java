package com.smartcity.backend.dto;

import java.time.LocalDateTime;

public class MessageDTO {
    private Long id;
    private String expediteurEmail;
    private String expediteurNom;
    private String expediteurRole;
    private String destinataireEmail;
    private String destinataireNom;
    private String destinataireRole;
    private String sujet;
    private String contenu;
    private boolean lu;
    private LocalDateTime dateEnvoi;
    private String type; // "INTERNAL" ou "EMAIL"
    
    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getExpediteurEmail() { return expediteurEmail; }
    public void setExpediteurEmail(String expediteurEmail) { this.expediteurEmail = expediteurEmail; }
    
    public String getExpediteurNom() { return expediteurNom; }
    public void setExpediteurNom(String expediteurNom) { this.expediteurNom = expediteurNom; }
    
    public String getExpediteurRole() { return expediteurRole; }
    public void setExpediteurRole(String expediteurRole) { this.expediteurRole = expediteurRole; }
    
    public String getDestinataireEmail() { return destinataireEmail; }
    public void setDestinataireEmail(String destinataireEmail) { this.destinataireEmail = destinataireEmail; }
    
    public String getDestinataireNom() { return destinataireNom; }
    public void setDestinataireNom(String destinataireNom) { this.destinataireNom = destinataireNom; }
    
    public String getDestinataireRole() { return destinataireRole; }
    public void setDestinataireRole(String destinataireRole) { this.destinataireRole = destinataireRole; }
    
    public String getSujet() { return sujet; }
    public void setSujet(String sujet) { this.sujet = sujet; }
    
    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }
    
    public boolean isLu() { return lu; }
    public void setLu(boolean lu) { this.lu = lu; }
    
    public LocalDateTime getDateEnvoi() { return dateEnvoi; }
    public void setDateEnvoi(LocalDateTime dateEnvoi) { this.dateEnvoi = dateEnvoi; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}