package com.smartcity.backend.repository;

import com.smartcity.backend.model.Signalement;
import com.smartcity.backend.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Integer> {

    // Trouver tous les signalements d'un utilisateur spécifique (pour son historique)
    List<Signalement> findByUtilisateur(Utilisateur utilisateur);

    // Trouver les signalements par statut (ex: "EN_ATTENTE", "TERMINE")
    List<Signalement> findByStatut(String statut);

    // Trouver par type (ex: "DECHET", "ECLAIRAGE")
    List<Signalement> findByType(String type);
    
    // Trouver les signalements récents (optionnel)
    List<Signalement> findAllByOrderByDateCreationDesc();
}
