package com.smartcity.backend.controller;

import com.smartcity.backend.model.Notification;
import com.smartcity.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String userEmail = principal.getName();
            List<Notification> notifications = notificationRepository.findByUserEmailOrderByDateCreationDesc(userEmail);
            long unreadCount = notificationRepository.countByUserEmailAndLuFalse(userEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("notifications", notifications);
            response.put("unreadCount", unreadCount);
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Impossible de charger vos notifications pour le moment. Veuillez réessayer."));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Principal principal) {
        try {
            Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
            
            if (!notification.getUserEmail().equals(principal.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Non autorisé"));
            }
            
            notification.setLu(true);
            notificationRepository.save(notification);
            
            return ResponseEntity.ok(Map.of("message", "Notification marquée comme lue"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Cette action n'a pas pu être effectuée. Veuillez réessayer."));
        }
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Principal principal) {
        try {
            String userEmail = principal.getName();
            List<Notification> notifications = notificationRepository.findByUserEmailAndLuFalse(userEmail);
            for (Notification notif : notifications) {
                notif.setLu(true);
                notificationRepository.save(notif);
            }
            return ResponseEntity.ok(Map.of("message", "Toutes les notifications ont été marquées comme lues"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Cette action n'a pas pu être effectuée. Veuillez réessayer."));
        }
    }
    
    // 🔥 NOUVEAU : Partager un signalement (crée une notification)
    @PostMapping("/share")
    public ResponseEntity<?> shareSignalement(
            @RequestBody Map<String, Object> shareData,
            Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Non authentifié"));
            }
            
            String senderEmail = principal.getName();
            String senderName = (String) shareData.get("senderName");
            Long signalementId = shareData.get("signalementId") instanceof Integer ? 
                ((Integer) shareData.get("signalementId")).longValue() : 
                (Long) shareData.get("signalementId");
            Long recipientUserId = shareData.get("recipientUserId") instanceof Integer ?
                ((Integer) shareData.get("recipientUserId")).longValue() :
                (Long) shareData.get("recipientUserId");
            String recipientEmail = (String) shareData.get("recipientEmail");
            String signalementTitle = (String) shareData.get("signalementTitle");
            
            if (recipientEmail == null || recipientUserId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Destinataire invalide"));
            }
            
            // Créer une notification pour le destinataire
            Notification notification = new Notification();
            notification.setUserEmail(recipientEmail);
            notification.setTitle("📢 Signalement partagé");
            notification.setMessage(senderName + " a partagé le signalement \"" + signalementTitle + "\" avec vous");
            notification.setType("PARTAGE_SIGNALEMENT");
            notification.setLu(false);
            notification.setLien("/signalement/" + signalementId);
            notification.setSignalementId(signalementId);
            notification.setDateCreation(LocalDateTime.now());
            
            notificationRepository.save(notification);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Signalement partagé avec succès");
            response.put("notification", notification);
            
            System.out.println("✅ Notification créée pour " + recipientEmail + " (ID: " + recipientUserId + ")");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Le partage n'a pas pu aboutir. Veuillez réessayer."));
        }
    }
    
    // Endpoint de test pour créer une notification
    @PostMapping("/test")
    public ResponseEntity<?> createTestNotification(Principal principal) {
        try {
            String userEmail = principal.getName();
            
            Notification notif = new Notification();
            notif.setUserEmail(userEmail);
            notif.setTitle("🔔 Test notification");
            notif.setMessage("Ceci est une notification de test ! Le système fonctionne.");
            notif.setType("TEST");
            notif.setLu(false);
            notif.setLien("/");
            
            notificationRepository.save(notif);
            
            return ResponseEntity.ok(Map.of(
                "message", "✅ Notification de test créée avec succès",
                "notification", Map.of(
                    "title", notif.getTitle(),
                    "message", notif.getMessage()
                )
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Cette action n'a pas pu être effectuée. Veuillez réessayer."));
        }
    }
}