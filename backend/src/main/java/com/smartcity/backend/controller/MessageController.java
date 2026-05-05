package com.smartcity.backend.controller;

import com.smartcity.backend.dto.MessageDTO;
import com.smartcity.backend.model.Message;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.repository.UtilisateurRepository;
import com.smartcity.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:5173")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @PostMapping("/envoyer")
    public ResponseEntity<?> envoyerMessage(
            Principal principal,
            @RequestBody MessageDTO messageDTO) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String expediteurEmail = principal.getName();
            
            // Validation des champs obligatoires
            if (messageDTO.getDestinataireEmail() == null || messageDTO.getDestinataireEmail().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Destinataire requis"));
            }
            if (messageDTO.getSujet() == null || messageDTO.getSujet().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Sujet requis"));
            }
            if (messageDTO.getContenu() == null || messageDTO.getContenu().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Contenu requis"));
            }
            
            // Définir le type par défaut si non spécifié
            if (messageDTO.getType() == null || messageDTO.getType().isEmpty()) {
                messageDTO.setType("INTERNAL");
            }
            messageDTO.setType(messageDTO.getType().toUpperCase());
            
            // Appeler le service pour envoyer le message
            Message savedMessage = messageService.envoyerMessage(messageDTO, expediteurEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Message envoyé avec succès");
            response.put("type", messageDTO.getType());
            response.put("messageId", savedMessage.getId());
            
            if ("EMAIL".equals(messageDTO.getType())) {
                response.put("info", "✅ Email envoyé ! Le destinataire recevra une notification dans son espace ET un email réel dans sa boîte email.");
            } else {
                response.put("info", "✅ Message envoyé ! Le destinataire recevra une notification dans son espace.");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erreur lors de l'envoi: " + e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<?> getMesMessages(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            List<Message> messages = messageService.getMessagesForUser(email);
            
            // Transformer les messages en DTO pour l'affichage
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
                
                // Ajouter le rôle de l'expéditeur
                utilisateurRepository.findByEmail(msg.getExpediteurEmail()).ifPresent(exp -> {
                    dto.setExpediteurRole(exp.getRole());
                });
                
                return dto;
            }).collect(Collectors.toList());
            
            long nonLuCount = messageService.countNonLu(email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("messages", messageDTOs);
            response.put("count", messageDTOs.size());
            response.put("nonLuCount", nonLuCount);
            
            return ResponseEntity.ok(response);
            
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
            long count = messageService.countNonLu(email);
            
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
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            messageService.marquerCommeLu(id);
            
            return ResponseEntity.ok(Map.of("message", "Message marqué comme lu"));
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerMessage(@PathVariable Long id, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String userEmail = principal.getName();
            messageService.supprimerMessage(id, userEmail);
            
            return ResponseEntity.ok(Map.of("message", "Message supprimé avec succès"));
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
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
            
            Map<String, Object> response = new HashMap<>();
            response.put("utilisateurs", userList);
            response.put("count", userList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}