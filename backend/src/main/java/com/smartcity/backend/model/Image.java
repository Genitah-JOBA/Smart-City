package com.smartcity.backend.model;

import jakarta.persistence.*;
import lombok.Data; 
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "images")
public class Image {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @ManyToOne
    @JoinColumn(name = "signalement_id")
    @JsonIgnore // Important pour éviter les boucles infinies lors de l'envoi en JSON
    private Signalement signalement;
}
