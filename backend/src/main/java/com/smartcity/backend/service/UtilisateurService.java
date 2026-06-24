package com.smartcity.backend.service;

import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UtilisateurService {
    @Autowired
    private UtilisateurRepository repository;

    public Utilisateur save(Utilisateur user) { 
        return repository.save(user); 
    }
    
    public List<Utilisateur> findAll() { 
        return repository.findAll(); 
    }
    
    public List<Utilisateur> findByRole(String role) {
        return repository.findByRole(role);
    }
    
    // ⭐ AJOUTER CES MÉTHODES ⭐
    
    public List<Utilisateur> findByDomaine(String domaine) {
        return repository.findByDomaine(domaine);
    }
    
    public List<Utilisateur> findByDomaineAndMetier(String domaine, String metier) {
        return repository.findByDomaineAndMetier(domaine, metier);
    }
    
    public Utilisateur findById(Long id) {
        return repository.findById(id).orElse(null);
    }
    
    public Utilisateur findByEmail(String email) {
        return repository.findByEmail(email).orElse(null);
    }
}