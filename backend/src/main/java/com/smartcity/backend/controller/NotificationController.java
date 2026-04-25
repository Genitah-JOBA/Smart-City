package com.smartcity.backend.controller;

import com.smartcity.backend.model.Notification;
import com.smartcity.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
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
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
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
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
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
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}