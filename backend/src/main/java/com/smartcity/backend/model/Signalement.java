package com.smartcity.backend.model;

import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "signalements")
public class Signalement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String titre;
    private String description;
    private String type;
    private String statut = "EN_ATTENTE";
    
    private Double latitude;
    private Double longitude;
    
    @Column(length = 500)
    private String address;
    
    private String ville;
    
    private String commune;
    
    @OneToMany(mappedBy = "signalement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Image> images = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
    
    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;
}