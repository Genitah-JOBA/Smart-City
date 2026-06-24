package com.smartcity.backend.repository;

import com.smartcity.backend.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    
    Optional<Utilisateur> findByEmail(String email);
    
    List<Utilisateur> findByRole(String role);
    
    // ⭐ AJOUTER CES MÉTHODES ⭐
    
    List<Utilisateur> findByDomaine(String domaine);
    
    List<Utilisateur> findByDomaineAndMetier(String domaine, String metier);
}