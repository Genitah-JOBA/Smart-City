// MessageController.java (version complète)
package com.smartcity.backend.controller;

import com.smartcity.backend.dto.EnvoiMessageRequest;
import com.smartcity.backend.dto.MessageDTO;
import com.smartcity.backend.model.Message;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.repository.MessageRepository;
import com.smartcity.backend.repository.UtilisateurRepository;
import com.smartcity.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
            
            Utilisateur destinataire = utilisateurRepository.findByEmail(request.getDestinataireEmail())
                    .orElseThrow(() -> new RuntimeException("Destinataire non trouvé"));
            
            String expediteurRole = expediteur.getRole();
            String destinataireRole = destinataire.getRole();
            
            // Vérifier les permissions
            boolean peutEnvoyer = false;
            
            if ("ADMIN".equals(expediteurRole)) {
                peutEnvoyer = true;
            } else if (("AGENT".equals(expediteurRole) || "CITIZEN".equals(expediteurRole)) 
                    && "ADMIN".equals(destinataireRole)) {
                peutEnvoyer = true;
            }
            
            if (!peutEnvoyer) {
                return ResponseEntity.status(403).body(Map.of("error", 
                    "Vous ne pouvez envoyer des messages qu'aux administrateurs uniquement."));
            }
            
            Message message = new Message();
            message.setExpediteurEmail(expediteurEmail);
            message.setExpediteurNom(expediteur.getNom());
            message.setDestinataireEmail(request.getDestinataireEmail());
            message.setDestinataireNom(destinataire.getNom());
            message.setSujet(request.getSujet());
            message.setContenu(request.getContenu());
            message.setDateEnvoi(LocalDateTime.now());
            message.setLu(false);
            message.setType(request.getType() != null ? request.getType() : "MESSAGE");
            
            messageRepository.save(message);
            
            if ("EMAIL".equals(request.getType())) {
                emailService.envoyerEmail(
                    request.getDestinataireEmail(),
                    "[SmartCity] " + request.getSujet(),
                    "Message de " + expediteur.getNom() + ":\n\n" + request.getContenu()
                );
            }
            
            return ResponseEntity.ok(Map.of("message", "Message envoyé avec succès"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<?> getMesMessages(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            List<Message> messages = messageRepository.findByDestinataireEmailOrderByDateEnvoiDesc(email);
            
            List<MessageDTO> messageDTOs = messages.stream().map(msg -> {
                MessageDTO dto = new MessageDTO();
                dto.setId(msg.getId());
                dto.setExpediteurEmail(msg.getExpediteurEmail());
                dto.setExpediteurNom(msg.getExpediteurNom());
                dto.setDestinataireEmail(msg.getDestinataireEmail());
                dto.setDestinataireNom(msg.getDestinataireNom());
                dto.setSujet(msg.getSujet());
                dto.setContenu(msg.getContenu());
                dto.setLu(msg.isLu());
                dto.setDateEnvoi(msg.getDateEnvoi());
                dto.setType(msg.getType());
                
                // ✅ Récupérer le rôle de l'expéditeur depuis la base
                utilisateurRepository.findByEmail(msg.getExpediteurEmail()).ifPresent(exp -> {
                    dto.setExpediteurRole(exp.getRole());
                });
                
                return dto;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(messageDTOs);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/non-lus")
    public ResponseEntity<?> getMessagesNonLus(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            long count = messageRepository.countByDestinataireEmailAndLuFalse(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("nonLuCount", count);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
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
            
            List<Map<String, String>> userList = tousUtilisateurs.stream()
                    .filter(u -> !u.getEmail().equals(currentUserEmail))
                    .filter(u -> {
                        if ("ADMIN".equals(currentUser.getRole())) {
                            return true;
                        } else {
                            return "ADMIN".equals(u.getRole());
                        }
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
}