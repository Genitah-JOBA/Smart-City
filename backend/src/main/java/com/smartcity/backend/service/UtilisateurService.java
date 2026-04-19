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

    public Utilisateur save(Utilisateur user) { return repository.save(user); }
    public List<Utilisateur> findAll() { return repository.findAll(); }
    
    public List<Utilisateur> findByRole(String role) {
        return repository.findByRole(role);
    }
}
