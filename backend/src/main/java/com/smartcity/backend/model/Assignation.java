package com.smartcity.backend.model;

// IMPORTANT : Utilisez jakarta.persistence pour Spring Boot 3.x
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignations")
public class Assignation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "signalement_id")
    private Integer signalementId;
    
    @Column(name = "agent_id")
    private Integer agentId;
    
    @Column(name = "date_assignation")
    private LocalDateTime dateAssignation;
    
    // Constructeurs
    public Assignation() {}
    
    public Assignation(Integer signalementId, Integer agentId, LocalDateTime dateAssignation) {
        this.signalementId = signalementId;
        this.agentId = agentId;
        this.dateAssignation = dateAssignation;
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
    
    public Integer getAgentId() {
        return agentId;
    }
    
    public void setAgentId(Integer agentId) {
        this.agentId = agentId;
    }
    
    public LocalDateTime getDateAssignation() {
        return dateAssignation;
    }
    
    public void setDateAssignation(LocalDateTime dateAssignation) {
        this.dateAssignation = dateAssignation;
    }
}