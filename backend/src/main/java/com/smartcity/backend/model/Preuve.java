package com.smartcity.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "preuves")
public class Preuve {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "signalement_id")
    private Integer signalementId;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "agent_email")
    private String agentEmail;
    
    @ElementCollection
    @CollectionTable(name = "preuve_images", joinColumns = @JoinColumn(name = "preuve_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> images = new ArrayList<>();
    
    @Column(name = "date_creation")
    private LocalDateTime dateCreation;
    
    // Constructeurs
    public Preuve() {}
    
    public Preuve(Integer signalementId, String description, String agentEmail, List<String> images) {
        this.signalementId = signalementId;
        this.description = description;
        this.agentEmail = agentEmail;
        this.images = images;
        this.dateCreation = LocalDateTime.now();
    }
    
    // Getters et Setters
    public Integer getId() {
        return id;
    }
    
    public void setId(Integer id) {
        this.id = id;
    }
    
    public Integer getSignalementId() {
        return signalementId;
    }
    
    public void setSignalementId(Integer signalementId) {
        this.signalementId = signalementId;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getAgentEmail() {
        return agentEmail;
    }
    
    public void setAgentEmail(String agentEmail) {
        this.agentEmail = agentEmail;
    }
    
    public List<String> getImages() {
        return images;
    }
    
    public void setImages(List<String> images) {
        this.images = images;
    }
    
    public LocalDateTime getDateCreation() {
        return dateCreation;
    }
    
    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}