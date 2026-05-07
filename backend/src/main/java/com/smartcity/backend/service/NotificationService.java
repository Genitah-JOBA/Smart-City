package com.smartcity.backend.service;

import com.smartcity.backend.model.Notification;
import com.smartcity.backend.model.Signalement;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.repository.NotificationRepository;
import com.smartcity.backend.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;

    // ✅ VERSION 1 : Sans signalementId (pour compatibilité)
    public void createNotification(String userEmail, String title, String message, String type, String lien) {
        createNotification(userEmail, title, message, type, lien, null);
    }

    // ✅ VERSION 2 : Avec signalementId (pour la redirection)
    public void createNotification(String userEmail, String title, String message, String type, String lien, Long signalementId) {
        Notification notif = new Notification();
        notif.setUserEmail(userEmail);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setType(type);
        notif.setLien(lien);
        notif.setSignalementId(signalementId);
        notif.setLu(false);
        notif.setDateCreation(LocalDateTime.now());
        
        notificationRepository.save(notif);
        System.out.println("🔔 Notification créée pour " + userEmail + ": " + title);
    }

    // 🔔 Notification quand un nouveau signalement est créé
    public void notifierNouveauSignalement(Signalement signalement) {
        List<Utilisateur> agents = utilisateurRepository.findByRole("AGENT");
        for (Utilisateur agent : agents) {
            createNotification(
                agent.getEmail(),
                "📢 Nouveau signalement",
                "Un nouveau signalement a été créé: " + signalement.getTitre(),
                "NOUVEAU_SIGNALEMENT",
                "/agent/signalements-assignes"
            );
        }
        
        List<Utilisateur> admins = utilisateurRepository.findByRole("ADMIN");
        for (Utilisateur admin : admins) {
            createNotification(
                admin.getEmail(),
                "📢 Nouveau signalement",
                "Un nouveau signalement nécessite votre attention: " + signalement.getTitre(),
                "NOUVEAU_SIGNALEMENT",
                "/admin/signalements"
            );
        }
    }

    // 🔔 Notification quand un signalement est assigné à un agent
    public void notifierAssignation(Signalement signalement, String agentEmail) {
        createNotification(
            agentEmail,
            "✅ Signalement assigné",
            "Le signalement #" + signalement.getId() + " vous a été assigné: " + signalement.getTitre(),
            "ASSIGNATION",
            "/agent/signalements-assignes",
            signalement.getId().longValue()  // ✅ AVEC signalementId
        );
    }

    // 🔔 Notification quand le statut d'un signalement change
    public void notifierChangementStatus(Signalement signalement, String ancienStatut, String nouveauStatut) {
        createNotification(
            signalement.getUtilisateur().getEmail(),
            "🔄 Statut mis à jour",
            "Votre signalement #" + signalement.getId() + " est passé de " + ancienStatut + " à " + nouveauStatut,
            "CHANGEMENT_STATUS",
            "/mes-signalements",
            signalement.getId().longValue()
        );
        
        if (signalement.getAgentEmail() != null && !signalement.getAgentEmail().equals(signalement.getUtilisateur().getEmail())) {
            createNotification(
                signalement.getAgentEmail(),
                "🔄 Statut mis à jour",
                "Le signalement #" + signalement.getId() + " a changé de statut: " + nouveauStatut,
                "CHANGEMENT_STATUS",
                "/agent/signalements-assignes",
                signalement.getId().longValue()
            );
        }
    }

    // 🔔 Notification quand un signalement est résolu
    public void notifierSignalementResolu(Signalement signalement) {
        createNotification(
            signalement.getUtilisateur().getEmail(),
            "🎉 Signalement résolu",
            "Votre signalement #" + signalement.getId() + " a été marqué comme résolu. Merci pour votre contribution !",
            "SIGNALEMENT_RESOLU",
            "/mes-signalements",
            signalement.getId().longValue()
        );
    }

    // 🔔 Notification de bienvenue
    public void notifierBienvenue(Utilisateur user) {
        createNotification(
            user.getEmail(),
            "👋 Bienvenue sur SmartCity !",
            "Merci de rejoindre la plateforme. Vous pouvez maintenant signaler des problèmes dans votre ville.",
            "BIENVENUE",
            "/signalements"
        );
    }

    // 🔔 Notification pour tous
    public void notifierTous(String title, String message, String type) {
        List<Utilisateur> allUsers = utilisateurRepository.findAll();
        for (Utilisateur user : allUsers) {
            createNotification(user.getEmail(), title, message, type, "/");
        }
    }

    public long getUnreadCount(String userEmail) {
        return notificationRepository.countByUserEmailAndLuFalse(userEmail);
    }

    public List<Notification> getUserNotifications(String userEmail) {
        return notificationRepository.findByUserEmailOrderByDateCreationDesc(userEmail);
    }
}