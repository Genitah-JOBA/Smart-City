package com.smartcity.backend.controller;

import com.smartcity.backend.model.Signalement;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.model.Image;
import com.smartcity.backend.model.HistoriqueStatut;
import com.smartcity.backend.repository.SignalementRepository;
import com.smartcity.backend.repository.UtilisateurRepository;
import com.smartcity.backend.repository.HistoriqueStatutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/signalements")
@CrossOrigin(origins = "http://localhost:5173")
public class SignalementController {

    @Autowired
    private SignalementRepository signalementRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired
    private HistoriqueStatutRepository historiqueStatutRepository;

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
            
            // Mise à jour des champs
            existingSignalement.setTitre(signalementDetails.getTitre());
            existingSignalement.setDescription(signalementDetails.getDescription());
            existingSignalement.setType(signalementDetails.getType());
            existingSignalement.setLatitude(signalementDetails.getLatitude());
            existingSignalement.setLongitude(signalementDetails.getLongitude());
            existingSignalement.setAddress(signalementDetails.getAddress());
            existingSignalement.setVille(signalementDetails.getVille());
            existingSignalement.setCommune(signalementDetails.getCommune());
            
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

    // 🔥 ENDPOINT POUR MODIFIER LE STATUT AVEC HISTORIQUE
    @PutMapping("/{id}/statut")
    public ResponseEntity<?> updateStatut(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            Principal principal) {
        
        try {
            // Récupérer l'utilisateur connecté
            Utilisateur currentUser = utilisateurRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Récupérer le signalement
            Signalement signalement = signalementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
            
            String nouveauStatut = body.get("statut");
            
            // Vérifier que le statut est valide
            if (!List.of("EN_ATTENTE", "EN_COURS", "RESOLU", "REJETE").contains(nouveauStatut)) {
                return ResponseEntity.badRequest().body("Statut invalide");
            }
            
            // Vérifier les permissions (seuls les AGENTS et ADMINS peuvent changer le statut)
            String role = currentUser.getRole().toUpperCase();
            if (!role.equals("AGENT") && !role.equals("ADMIN")) {
                return ResponseEntity.status(403).body("Accès refusé - Seuls les agents peuvent modifier les statuts");
            }
            
            // Sauvegarder l'ancien statut
            String ancienStatut = signalement.getStatut();
            
            // Mettre à jour le statut
            signalement.setStatut(nouveauStatut);
            signalementRepository.save(signalement);
            
            // 🔥 ENREGISTRER DANS L'HISTORIQUE
            HistoriqueStatut historique = new HistoriqueStatut(
                signalement.getId(),
                ancienStatut,
                nouveauStatut
            );
            historiqueStatutRepository.save(historique);
            
            // Retourner la réponse
            Map<String, Object> response = new HashMap<>();
            response.put("id", signalement.getId());
            response.put("ancienStatut", ancienStatut);
            response.put("nouveauStatut", nouveauStatut);
            response.put("message", "Statut mis à jour avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }
    
    // 🔥 OPTIONNEL : Endpoint pour voir l'historique d'un signalement
    @GetMapping("/{id}/historique")
    public ResponseEntity<?> getHistorique(@PathVariable Integer id) {
        try {
            List<HistoriqueStatut> historique = historiqueStatutRepository
                    .findBySignalementIdOrderByDateModificationDesc(id);
            return ResponseEntity.ok(historique);
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

    @Autowired
    private NotificationService notificationService;

    // Dans la méthode create (création de signalement), après avoir sauvegardé :
    Signalement saved = signalementRepository.save(signalement);
    notificationService.notifierNouveauSignalement(saved);
    return ResponseEntity.ok(saved);

    // Dans la méthode updateStatut (changement de statut), quand on passe à RESOLU :
    if ("RESOLU".equals(nouveauStatut)) {
        notificationService.notifierSignalementTraite(signalement, currentUser);
    }
}