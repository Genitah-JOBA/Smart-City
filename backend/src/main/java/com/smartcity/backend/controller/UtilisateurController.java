package com.smartcity.backend.controller;

import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UtilisateurController {

    @Autowired
    private UtilisateurService service;

    @PostMapping
    public Utilisateur create(@RequestBody Utilisateur user) {
        return service.save(user);
    }
    
    @GetMapping
    public java.util.List<Utilisateur> getAll() {
        return service.findAll();
    }

    @GetMapping("/role/{role}")
    public List<Utilisateur> getByRole(@PathVariable String role) {
        return service.findByRole(role.toUpperCase());
    }
}
