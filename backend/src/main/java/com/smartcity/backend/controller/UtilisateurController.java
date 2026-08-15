package com.smartcity.backend.controller;

import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UtilisateurController {

    @Autowired
    private UtilisateurService service;

    @PostMapping
    public Utilisateur create(@RequestBody Utilisateur user) {
        return service.save(user);
    }
    
    @GetMapping
    public List<Utilisateur> getAll() {
        return service.findAll();
    }

    @GetMapping("/role/{role}")
    public List<Utilisateur> getByRole(@PathVariable String role) {
        return service.findByRole(role.toUpperCase());
    }
    
    // ⭐ NOUVEAUX ENDPOINTS ⭐
    
    @GetMapping("/domaine/{domaine}")
    public List<Utilisateur> getByDomaine(@PathVariable String domaine) {
        return service.findByDomaine(domaine.toUpperCase());
    }
    
    @GetMapping("/domaine/{domaine}/metier/{metier}")
    public List<Utilisateur> getByDomaineAndMetier(
            @PathVariable String domaine, 
            @PathVariable String metier) {
        return service.findByDomaineAndMetier(domaine.toUpperCase(), metier);
    }
    
    @GetMapping("/{id}")
    public Utilisateur getById(@PathVariable Long id) {
        return service.findById(id);
    }
}