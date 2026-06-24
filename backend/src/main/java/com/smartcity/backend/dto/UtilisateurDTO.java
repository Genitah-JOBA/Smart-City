package com.smartcity.backend.dto;

public class UtilisateurDTO {
    private String nom;
    private String email;
    private String motDePasse;
    private String role;
    private String domaine;  // Valeur: VOIRIE, ECLAIRAGE, etc.
    private String metier;   // ⭐ Ajouter le métier

    // Getters et Setters
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getDomaine() { return domaine; }
    public void setDomaine(String domaine) { this.domaine = domaine; }
    
    public String getMetier() { return metier; }      // ⭐ Nouveau
    public void setMetier(String metier) { this.metier = metier; }  // ⭐ Nouveau
}