package com.smartcity.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_statuts")
public class HistoriqueStatut {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "signalement_id")
    private Integer signalementId;
    
    @Column(name = "ancien_statut")
    private String ancienStatut;
    
    @Column(name = "nouveau_statut")
    private String nouveauStatut;
    
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
    
    // Constructeurs
    public HistoriqueStatut() {}
    
    public HistoriqueStatut(Integer signalementId, String ancienStatut, String nouveauStatut) {
        this.signalementId = signalementId;
        this.ancienStatut = ancienStatut;
        this.nouveauStatut = nouveauStatut;
        this.dateModification = LocalDateTime.now();
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
    
    public String getAncienStatut() {
        return ancienStatut;
    }
    
    public void setAncienStatut(String ancienStatut) {
        this.ancienStatut = ancienStatut;
    }
    
    public String getNouveauStatut() {
        return nouveauStatut;
    }
    
    public void setNouveauStatut(String nouveauStatut) {
        this.nouveauStatut = nouveauStatut;
    }
    
    public LocalDateTime getDateModification() {
        return dateModification;
    }
    
    public void setDateModification(LocalDateTime dateModification) {
        this.dateModification = dateModification;
    }
}