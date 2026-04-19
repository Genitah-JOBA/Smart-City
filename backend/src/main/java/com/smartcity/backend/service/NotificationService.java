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
    
    // 🔥 Notification pour nouveau signalement
    public void notifierNouveauSignalement(Signalement signalement) {
        // Notifier tous les AGENTS
        List<Utilisateur> agents = utilisateurRepository.findByRole("AGENT");
        for (Utilisateur agent : agents) {
            Notification notif = new Notification(
                agent.getId(),
                "AGENT",
                "📢 Nouveau signalement",
                signalement.getTitre() + " - " + signalement.getDescription().substring(0, Math.min(50, signalement.getDescription().length())),
                "NOUVEAU_SIGNALEMENT",
                signalement.getId()
            );
            notificationRepository.save(notif);
        }
        
        // Notifier aussi l'ADMIN
        List<Utilisateur> admins = utilisateurRepository.findByRole("ADMIN");
        for (Utilisateur admin : admins) {
            Notification notif = new Notification(
                admin.getId(),
                "ADMIN",
                "📢 Nouveau signalement",
                signalement.getTitre() + " - " + signalement.getDescription().substring(0, Math.min(50, signalement.getDescription().length())),
                "NOUVEAU_SIGNALEMENT",
                signalement.getId()
            );
            notificationRepository.save(notif);
        }
    }
    
    // 🔥 Notification pour signalement traité (résolu)
    public void notifierSignalementTraite(Signalement signalement, Utilisateur agent) {
        // Notifier le citoyen qui a créé le signalement
        Utilisateur citoyen = signalement.getUtilisateur();
        if (citoyen != null) {
            Notification notif = new Notification(
                citoyen.getId(),
                "CITIZEN",
                "✅ Signalement traité",
                "Votre signalement \"" + signalement.getTitre() + "\" a été marqué comme résolu par " + agent.getNom(),
                "SIGNALEMENT_TRAITE",
                signalement.getId()
            );
            notificationRepository.save(notif);
        }
        
        // Notifier l'ADMIN
        List<Utilisateur> admins = utilisateurRepository.findByRole("ADMIN");
        for (Utilisateur admin : admins) {
            Notification notif = new Notification(
                admin.getId(),
                "ADMIN",
                "✅ Signalement résolu",
                "Le signalement \"" + signalement.getTitre() + "\" a été résolu par " + agent.getNom(),
                "SIGNALEMENT_TRAITE",
                signalement.getId()
            );
            notificationRepository.save(notif);
        }
    }
    
    // 🔥 Notification pour assignation (admin -> agent)
    public void notifierAssignation(Signalement signalement, Utilisateur agent, Utilisateur admin) {
        Notification notif = new Notification(
            agent.getId(),
            "AGENT",
            "📋 Nouvelle assignation",
            "L'administrateur " + admin.getNom() + " vous a assigné le signalement \"" + signalement.getTitre() + "\"",
            "ASSIGNATION",
            signalement.getId()
        );
        notif.setAgentId(agent.getId());
        notificationRepository.save(notif);
    }
    
    // 🔥 Récupérer les notifications d'un utilisateur
    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findByUserIdOrderByDateCreationDesc(userId);
    }
    
    // 🔥 Marquer une notification comme lue
    public void markAsRead(Long notificationId) {
        Notification notif = notificationRepository.findById(notificationId).orElse(null);
        if (notif != null) {
            notif.setEstLu(true);
            notificationRepository.save(notif);
        }
    }
    
    // 🔥 Compter les notifications non lues
    public long countUnread(Long userId) {
        return notificationRepository.findByUserIdAndEstLuFalse(userId).size();
    }
}