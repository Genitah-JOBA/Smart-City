package com.smartcity.backend.controller;

import com.smartcity.backend.dto.StatutUpdateRequest;
import com.smartcity.backend.model.Signalement;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.model.Image;
import com.smartcity.backend.model.HistoriqueStatut;
import com.smartcity.backend.model.Assignation;
import com.smartcity.backend.repository.SignalementRepository;
import com.smartcity.backend.repository.UtilisateurRepository;
import com.smartcity.backend.repository.HistoriqueStatutRepository;
import com.smartcity.backend.repository.AssignationRepository;
import com.smartcity.backend.service.NotificationService;  // ✅ AJOUTER CET IMPORT
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
    
    @Autowired
    private AssignationRepository assignationRepository;

    @Autowired
    private NotificationService notificationService;

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

        Signalement saved = signalementRepository.save(signalement);
        
        // 🔔 ENVOYER DES NOTIFICATIONS
        try {
            // Notifier tous les agents
            List<Utilisateur> agents = utilisateurRepository.findByRole("AGENT");
            for (Utilisateur agent : agents) {
                notificationService.createNotification(
                    agent.getEmail(),
                    "📢 Nouveau signalement",
                    "Un nouveau signalement a été créé: " + signalement.getTitre(),
                    "NOUVEAU_SIGNALEMENT",
                    "/agent/signalements-assignes"
                );
            }
            
            // Notifier l'admin
            List<Utilisateur> admins = utilisateurRepository.findByRole("ADMIN");
            for (Utilisateur admin : admins) {
                notificationService.createNotification(
                    admin.getEmail(),
                    "📢 Nouveau signalement",
                    "Un nouveau signalement nécessite votre attention: " + signalement.getTitre(),
                    "NOUVEAU_SIGNALEMENT",
                    "/admin/signalements"
                );
            }
            
            // Notifier le citoyen (confirmation)
            notificationService.createNotification(
                user.getEmail(),
                "✅ Signalement enregistré",
                "Votre signalement #" + saved.getId() + " a bien été enregistré et sera traité rapidement.",
                "CONFIRMATION_SIGNALEMENT",
                "/mes-signalements"
            );
            
        } catch (Exception e) {
            System.err.println("Erreur envoi notifications: " + e.getMessage());
        }

        return ResponseEntity.ok(saved);
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

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> updateStatut(
            @PathVariable Integer id,
            @RequestBody StatutUpdateRequest request,
            Principal principal) {
        
        try {
            Utilisateur currentUser = utilisateurRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Signalement signalement = signalementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
            
            String nouveauStatut = request.getStatut();
            
            if (!List.of("EN_ATTENTE", "EN_COURS", "RESOLU", "REJETE").contains(nouveauStatut)) {
                return ResponseEntity.badRequest().body("Statut invalide");
            }
            
            String role = currentUser.getRole().toUpperCase();
            if (!role.equals("AGENT") && !role.equals("ADMIN")) {
                return ResponseEntity.status(403).body("Accès refusé - Seuls les agents peuvent modifier les statuts");
            }
            
            String ancienStatut = signalement.getStatut();
            String ancienAgent = signalement.getAgentNom();
            
            if (("EN_COURS".equals(nouveauStatut) || "RESOLU".equals(nouveauStatut)) 
                    && !ancienStatut.equals(nouveauStatut)) {
                
                if (request.getAgentId() != null) {
                    Utilisateur agent = utilisateurRepository.findById(request.getAgentId())
                            .orElse(null);
                    if (agent != null && "AGENT".equals(agent.getRole().toUpperCase())) {
                        signalement.setAgentId(agent.getId().longValue());
                        signalement.setAgentEmail(agent.getEmail());
                        signalement.setAgentNom(agent.getNom());
                        
                        // 🔔 NOTIFIER L'AGENT ASSIGNÉ
                        notificationService.createNotification(
                            agent.getEmail(),
                            "✅ Signalement assigné",
                            "Le signalement #" + id + " vous a été assigné: " + signalement.getTitre(),
                            "ASSIGNATION",
                            "/agent/signalements-assignes"
                        );
                    }
                } 
                else if ("AGENT".equals(role)) {
                    signalement.setAgentId(currentUser.getId().longValue());
                    signalement.setAgentEmail(currentUser.getEmail());
                    signalement.setAgentNom(currentUser.getNom());
                    
                    // 🔔 NOTIFIER L'AGENT (lui-même)
                    notificationService.createNotification(
                        currentUser.getEmail(),
                        "✅ Signalement assigné",
                        "Le signalement #" + id + " vous a été assigné automatiquement.",
                        "ASSIGNATION",
                        "/agent/signalements-assignes"
                    );
                }
            }
            
            signalement.setStatut(nouveauStatut);
            signalementRepository.save(signalement);
            
            // 🔔 NOTIFIER LE CITOYEN DU CHANGEMENT DE STATUT
            if (!ancienStatut.equals(nouveauStatut)) {
                String messageStatut = "";
                if ("EN_COURS".equals(nouveauStatut)) {
                    messageStatut = "est maintenant en cours de traitement";
                } else if ("RESOLU".equals(nouveauStatut)) {
                    messageStatut = "a été résolu ! Merci pour votre contribution.";
                } else if ("REJETE".equals(nouveauStatut)) {
                    messageStatut = "a été rejeté. Vous pouvez contacter l'administration pour plus d'informations.";
                }
                
                notificationService.createNotification(
                    signalement.getUtilisateur().getEmail(),
                    "🔄 Mise à jour de votre signalement",
                    "Votre signalement #" + id + " " + messageStatut,
                    "CHANGEMENT_STATUS",
                    "/mes-signalements"
                );
            }
            
            HistoriqueStatut historique = new HistoriqueStatut(
                signalement.getId(),
                ancienStatut,
                nouveauStatut
            );
            historiqueStatutRepository.save(historique);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", signalement.getId());
            response.put("ancienStatut", ancienStatut);
            response.put("nouveauStatut", nouveauStatut);
            response.put("agentAssigne", signalement.getAgentNom());
            response.put("message", "Statut mis à jour avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }
    
    @PutMapping("/{id}/assigner")
    public ResponseEntity<?> assignerAgent(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body,
            Principal principal) {
        
        try {
            Utilisateur currentUser = utilisateurRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (!"ADMIN".equals(currentUser.getRole().toUpperCase())) {
                return ResponseEntity.status(403).body("Accès refusé - Réservé aux administrateurs");
            }
            
            Signalement signalement = signalementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
            
            Long agentId = ((Number) body.get("agentId")).longValue();
            Utilisateur agent = utilisateurRepository.findById(agentId)
                    .orElseThrow(() -> new RuntimeException("Agent non trouvé"));
            
            if (!"AGENT".equals(agent.getRole().toUpperCase())) {
                return ResponseEntity.badRequest().body("L'utilisateur sélectionné n'est pas un agent");
            }
            
            String ancienAgent = signalement.getAgentNom();
            
            signalement.setAgentId(agent.getId().longValue());
            signalement.setAgentEmail(agent.getEmail());
            signalement.setAgentNom(agent.getNom());
            
            signalementRepository.save(signalement);
            
            // 🔔 NOTIFIER LE NOUVEL AGENT
            notificationService.createNotification(
                agent.getEmail(),
                "✅ Nouvelle assignation",
                "Le signalement #" + id + " vous a été assigné: " + signalement.getTitre(),
                "ASSIGNATION",
                "/agent/signalements-assignes"
            );
            
            // 🔔 NOTIFIER LE CITOYEN
            notificationService.createNotification(
                signalement.getUtilisateur().getEmail(),
                "👤 Agent assigné",
                "Un agent a été assigné à votre signalement #" + id + " : " + agent.getNom(),
                "AGENT_ASSIGNE",
                "/mes-signalements"
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Agent assigné avec succès");
            response.put("agentNom", agent.getNom());
            response.put("agentEmail", agent.getEmail());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }
    
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<?> getByAgent(@PathVariable Long agentId, Principal principal) {
        try {
            Utilisateur currentUser = utilisateurRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            String role = currentUser.getRole().toUpperCase();
            
            if (!role.equals("ADMIN") && !currentUser.getId().equals(agentId)) {
                return ResponseEntity.status(403).body("Accès refusé");
            }
            
            List<Signalement> signalements = signalementRepository.findByAgentId(agentId);
            return ResponseEntity.ok(signalements);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }
    
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
            System.out.println("=== SUPPRESSION SIGNALEMENT ID: " + id + " ===");
            
            Signalement signalement = signalementRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
            
            Utilisateur currentUser = utilisateurRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            String role = currentUser.getRole().toUpperCase();
            
            if (!role.equals("ADMIN") && !signalement.getUtilisateur().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(403).body("Accès refusé - Vous ne pouvez pas supprimer ce signalement");
            }
            
            // Supprimer les assignations
            try {
                List<Assignation> assignations = assignationRepository.findBySignalementId(id);
                if (!assignations.isEmpty()) {
                    assignationRepository.deleteAll(assignations);
                }
            } catch (Exception e) {
                System.out.println("Erreur suppression assignations: " + e.getMessage());
            }
            
            // Supprimer l'historique
            try {
                List<HistoriqueStatut> historiques = historiqueStatutRepository.findBySignalementId(id);
                if (!historiques.isEmpty()) {
                    historiqueStatutRepository.deleteAll(historiques);
                }
            } catch (Exception e) {
                System.out.println("Erreur suppression historique: " + e.getMessage());
            }
            
            // Nettoyer les images
            try {
                if (signalement.getImages() != null) {
                    signalement.getImages().clear();
                }
            } catch (Exception e) {
                System.out.println("Erreur nettoyage images: " + e.getMessage());
            }
            
            signalementRepository.delete(signalement);
            System.out.println("Signalement supprimé avec succès!");
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Signalement supprimé avec succès");
            response.put("id", id);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("ERREUR GLOBALE: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur lors de la suppression: " + e.getMessage());
        }
    }
}