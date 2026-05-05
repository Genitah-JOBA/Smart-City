package com.smartcity.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String userEmail;
    private String title;
    private String message;
    private String type;
    private boolean lu;
    private LocalDateTime dateCreation;
    private String lien;
    
    @Column(name = "signalement_id", nullable = true)  // ← AJOUTEZ CE CHAMP
    private Long signalementId;
    
    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        lu = false;
    }
    
    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public boolean isLu() { return lu; }
    public void setLu(boolean lu) { this.lu = lu; }
    
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    
    public String getLien() { return lien; }
    public void setLien(String lien) { this.lien = lien; }
    
    public Long getSignalementId() { return signalementId; }  // ← AJOUTEZ
    public void setSignalementId(Long signalementId) { this.signalementId = signalementId; }  // ← AJOUTEZ
}