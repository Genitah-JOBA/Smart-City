package com.smartcity.backend.service;

import com.smartcity.backend.model.Notification;
import com.smartcity.backend.model.Signalement;  // ✅ Correction: un seul 's'
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

    // 🔔 Créer une notification pour un utilisateur spécifique
    public void createNotification(String userEmail, String title, String message, String type, String lien) {
        Notification notif = new Notification();
        notif.setUserEmail(userEmail);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setType(type);
        notif.setLien(lien);
        notif.setLu(false);
        notif.setDateCreation(LocalDateTime.now());
        
        notificationRepository.save(notif);
        System.out.println("🔔 Notification créée pour " + userEmail + ": " + title);
    }

    // 🔔 Notification quand un nouveau signalement est créé
    public void notifierNouveauSignalement(Signalement signalement) {
        // Notifier tous les agents
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
        
        // Notifier aussi l'admin
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
            "/agent/signalements-assignes"
        );
    }

    // 🔔 Notification quand le statut d'un signalement change
    public void notifierChangementStatus(Signalement signalement, String ancienStatut, String nouveauStatut) {
        // Notifier le citoyen qui a créé le signalement
        createNotification(
            signalement.getUtilisateur().getEmail(),
            "🔄 Statut mis à jour",
            "Votre signalement #" + signalement.getId() + " est passé de " + ancienStatut + " à " + nouveauStatut,
            "CHANGEMENT_STATUS",
            "/mes-signalements"
        );
        
        // Notifier l'agent assigné si différent
        if (signalement.getAgentEmail() != null && !signalement.getAgentEmail().equals(signalement.getUtilisateur().getEmail())) {
            createNotification(
                signalement.getAgentEmail(),
                "🔄 Statut mis à jour",
                "Le signalement #" + signalement.getId() + " a changé de statut: " + nouveauStatut,
                "CHANGEMENT_STATUS",
                "/agent/signalements-assignes"
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
            "/mes-signalements"
        );
    }

    // 🔔 Notification de bienvenue pour un nouvel utilisateur
    public void notifierBienvenue(Utilisateur user) {
        createNotification(
            user.getEmail(),
            "👋 Bienvenue sur SmartCity !",
            "Merci de rejoindre la plateforme. Vous pouvez maintenant signaler des problèmes dans votre ville.",
            "BIENVENUE",
            "/signalements"
        );
    }

    // 🔔 Notification pour tous les utilisateurs (ex: alerte générale)
    public void notifierTous(String title, String message, String type) {
        List<Utilisateur> allUsers = utilisateurRepository.findAll();
        for (Utilisateur user : allUsers) {
            createNotification(user.getEmail(), title, message, type, "/");
        }
    }

    // 🔔 Récupérer les non lues d'un utilisateur
    public long getUnreadCount(String userEmail) {
        return notificationRepository.countByUserEmailAndLuFalse(userEmail);
    }

    // 🔔 Récupérer toutes les notifications d'un utilisateur
    public List<Notification> getUserNotifications(String userEmail) {
        return notificationRepository.findByUserEmailOrderByDateCreationDesc(userEmail);
    }
}