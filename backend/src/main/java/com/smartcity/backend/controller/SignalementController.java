package com.smartcity.backend.controller;

import com.smartcity.backend.model.Signalement;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.model.Image;
import com.smartcity.backend.repository.SignalementRepository;
import com.smartcity.backend.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/signalements")
@CrossOrigin(origins = "http://localhost:5173")
public class SignalementController {

    @Autowired
    private SignalementRepository signalementRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @PostMapping
    public ResponseEntity<Signalement> create(@RequestBody Signalement signalement, Principal principal) {
        Utilisateur user = utilisateurRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        signalement.setUtilisateur(user);
        signalement.setStatut("EN_ATTENTE");

        if (signalement.getImages() != null) {
            for (Image img : signalement.getImages()) {
                img.setSignalement(signalement);
            }
        }

        return ResponseEntity.ok(signalementRepository.save(signalement));
    }

    @GetMapping
    public List<Signalement> getAll() {
        return signalementRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Signalement> getById(@PathVariable Integer id) {
        return signalementRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, 
                                    @RequestBody Signalement signalementDetails,
                                    Principal principal) {
        try {
            Signalement existingSignalement = signalementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
            
            existingSignalement.setTitre(signalementDetails.getTitre());
            existingSignalement.setDescription(signalementDetails.getDescription());
            existingSignalement.setType(signalementDetails.getType());
            
            // Mise à jour des images si nécessaire
            if (signalementDetails.getImages() != null && !signalementDetails.getImages().isEmpty()) {
                existingSignalement.getImages().clear();
                for (Image img : signalementDetails.getImages()) {
                    img.setSignalement(existingSignalement);
                    existingSignalement.getImages().add(img);
                }
            }
            
            Signalement updated = signalementRepository.save(existingSignalement);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id, Principal principal) {
        try {
            Signalement signalement = signalementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
            
            signalementRepository.delete(signalement);
            return ResponseEntity.ok().body("Signalement supprimé avec succès");
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }
}