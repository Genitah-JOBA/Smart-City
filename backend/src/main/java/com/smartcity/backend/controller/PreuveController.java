package com.smartcity.backend.controller;

import com.smartcity.backend.model.Preuve;
import com.smartcity.backend.repository.PreuveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/preuves")
@CrossOrigin(origins = "http://localhost:5173")
public class PreuveController {

    @Autowired
    private PreuveRepository preuveRepository;

    @PostMapping
    public ResponseEntity<?> createPreuve(@RequestBody Preuve preuve, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Ajouter l'email de l'agent connecté
            preuve.setAgentEmail(userDetails.getUsername());
            preuve.setDateCreation(LocalDateTime.now());
            
            Preuve saved = preuveRepository.save(preuve);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("message", "Preuve enregistrée avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Impossible d'enregistrer la preuve pour le moment. Veuillez réessayer.");
        }
    }

    @GetMapping("/signalement/{signalementId}")
    public ResponseEntity<?> getPreuvesBySignalement(@PathVariable Integer signalementId) {
        try {
            List<Preuve> preuves = preuveRepository.findBySignalementId(signalementId);
            return ResponseEntity.ok(preuves);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Impossible de charger les preuves pour le moment. Veuillez réessayer.");
        }
    }
}