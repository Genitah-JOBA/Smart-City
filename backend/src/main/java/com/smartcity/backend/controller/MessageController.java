// MessageController.java
package com.smartcity.backend.controller;

import com.smartcity.backend.dto.EnvoiMessageRequest;
import com.smartcity.backend.dto.MessageDTO;
import com.smartcity.backend.model.Message;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.repository.MessageRepository;
import com.smartcity.backend.repository.UtilisateurRepository;
import com.smartcity.backend.service.EmailService;
import com.smartcity.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:5173")
public class MessageController {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired
    private EmailService emailService;

    @Autowired
    private MessageService messageService;
    
    // ✅ SUPPRIME CETTE DOUBLE MÉTHODE - Garde une seule version
    
    // ✅ VERSION CORRIGÉE : Envoyer un message (avec les bonnes permissions)
    @PostMapping("/envoyer")
    public ResponseEntity<?> envoyerMessage(
            Principal principal,
            @RequestBody EnvoiMessageRequest request) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String expediteurEmail = principal.getName();
            Utilisateur expediteur = utilisateurRepository.findByEmail(expediteurEmail)
                    .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));
            
            // ✅ NOUVELLE RÈGLE : Vérifier les permissions selon le rôle
            String expediteurRole = expediteur.getRole();
            Utilisateur destinataire = utilisateurRepository.findByEmail(request.getDestinataireEmail())
                    .orElseThrow(() -> new RuntimeException("Destinataire non trouvé"));
            String destinataireRole = destinataire.getRole();
            
            boolean peutEnvoyer = false;
            
            // Admin peut envoyer à tout le monde
            if ("ADMIN".equals(expediteurRole)) {
                peutEnvoyer = true;
            }
            // Agent peut envoyer uniquement aux admins
            else if ("AGENT".equals(expediteurRole) && "ADMIN".equals(destinataireRole)) {
                peutEnvoyer = true;
            }
            // Citoyen peut envoyer uniquement aux admins
            else if ("CITIZEN".equals(expediteurRole) && "ADMIN".equals(destinataireRole)) {
                peutEnvoyer = true;
            }
            
            if (!peutEnvoyer) {
                String messageErreur;
                if ("AGENT".equals(expediteurRole) || "CITIZEN".equals(expediteurRole)) {
                    messageErreur = "Vous ne pouvez envoyer des messages qu'aux administrateurs uniquement.";
                } else {
                    messageErreur = "Vous n'êtes pas autorisé à envoyer un message à cet utilisateur.";
                }
                return ResponseEntity.status(403).body(Map.of("error", messageErreur));
            }
            
            // Créer le message
            Message message = new Message();
            message.setExpediteurEmail(expediteurEmail);
            message.setExpediteurNom(expediteur.getNom());
            message.setExpediteurRole(expediteurRole); // Ajouter cette propriété si nécessaire
            message.setDestinataireEmail(request.getDestinataireEmail());
            message.setDestinataireNom(destinataire.getNom());
            message.setDestinataireRole(destinataireRole); // Ajouter cette propriété si nécessaire
            message.setSujet(request.getSujet());
            message.setContenu(request.getContenu());
            message.setDateEnvoi(LocalDateTime.now());
            message.setLu(false);
            message.setType(request.getType());
            
            messageRepository.save(message);
            
            // Envoyer l'email si demandé
            if ("EMAIL".equals(request.getType())) {
                emailService.envoyerEmail(
                    request.getDestinataireEmail(),
                    "[SmartCity] " + request.getSujet(),
                    "Message de " + expediteur.getNom() + ":\n\n" + request.getContenu()
                );
            }
            
            return ResponseEntity.ok(Map.of("message", "Message envoyé avec succès"));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    // Récupérer tous les messages de l'utilisateur connecté
    @GetMapping
    public ResponseEntity<?> getMesMessages(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            List<Message> messages = messageRepository.findByDestinataireEmailOrderByDateEnvoiDesc(email);
            
            List<MessageDTO> messageDTOs = messages.stream().map(this::convertToDTO).collect(Collectors.toList());
            
            return ResponseEntity.ok(messageDTOs);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    // Récupérer les messages non lus
    @GetMapping("/non-lus")
    public ResponseEntity<?> getMessagesNonLus(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            List<Message> messages = messageRepository.findNonLusByDestinataireEmail(email);
            long count = messageRepository.countByDestinataireEmailAndLuFalse(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("messages", messages.stream().map(this::convertToDTO).collect(Collectors.toList()));
            response.put("nonLuCount", count);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    // Marquer un message comme lu
    @PutMapping("/{id}/lu")
    public ResponseEntity<?> marquerCommeLu(@PathVariable Long id, Principal principal) {
        try {
            Message message = messageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Message non trouvé"));
            
            if (!message.getDestinataireEmail().equals(principal.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
            }
            
            message.setLu(true);
            messageRepository.save(message);
            
            return ResponseEntity.ok(Map.of("message", "Message marqué comme lu"));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    // Supprimer un message
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerMessage(@PathVariable Long id, Principal principal) {
        try {
            Message message = messageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Message non trouvé"));
            
            if (!message.getDestinataireEmail().equals(principal.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
            }
            
            messageRepository.delete(message);
            
            return ResponseEntity.ok(Map.of("message", "Message supprimé"));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    // Récupérer la liste des utilisateurs (accessible à tous avec filtrage)
    @GetMapping("/utilisateurs")
    public ResponseEntity<?> getUtilisateurs(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String currentUserEmail = principal.getName();
            Utilisateur currentUser = utilisateurRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            List<Utilisateur> tousUtilisateurs = utilisateurRepository.findAll();
            
            // ✅ Filtrer selon le rôle de l'utilisateur connecté
            List<Map<String, String>> userList = tousUtilisateurs.stream()
                    .filter(u -> !u.getEmail().equals(currentUserEmail)) // Exclure l'utilisateur courant
                    .filter(u -> {
                        // Admin voit tous les utilisateurs
                        if ("ADMIN".equals(currentUser.getRole())) {
                            return true;
                        }
                        // Agent et Citoyen ne voient que les admins
                        else if ("AGENT".equals(currentUser.getRole()) || "CITIZEN".equals(currentUser.getRole())) {
                            return "ADMIN".equals(u.getRole());
                        }
                        return false;
                    })
                    .map(u -> {
                        Map<String, String> userMap = new HashMap<>();
                        userMap.put("email", u.getEmail());
                        userMap.put("nom", u.getNom());
                        userMap.put("role", u.getRole());
                        return userMap;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(userList);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    private MessageDTO convertToDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setExpediteurEmail(message.getExpediteurEmail());
        dto.setExpediteurNom(message.getExpediteurNom());
        dto.setDestinataireEmail(message.getDestinataireEmail());
        dto.setDestinataireNom(message.getDestinataireNom());
        dto.setSujet(message.getSujet());
        dto.setContenu(message.getContenu());
        dto.setLu(message.isLu());
        dto.setDateEnvoi(message.getDateEnvoi());
        dto.setType(message.getType());
        // Ajouter le rôle de l'expéditeur si nécessaire
        if (message.getExpediteurRole() != null) {
            dto.setExpediteurRole(message.getExpediteurRole());
        }
        return dto;
    }
}