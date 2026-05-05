package com.smartcity.backend.service;

import com.smartcity.backend.dto.MessageDTO;
import com.smartcity.backend.model.Message;
import com.smartcity.backend.model.Notification;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.repository.MessageRepository;
import com.smartcity.backend.repository.NotificationRepository;
import com.smartcity.backend.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Transactional
    public Message envoyerMessage(MessageDTO messageDTO, String expediteurEmail) {
        // Récupérer l'expéditeur
        Utilisateur expediteur = utilisateurRepository.findByEmail(expediteurEmail)
            .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));
        
        // Récupérer le destinataire
        Utilisateur destinataire = utilisateurRepository.findByEmail(messageDTO.getDestinataireEmail())
            .orElseThrow(() -> new RuntimeException("Destinataire non trouvé"));
        
        // ✅ Vérifier les droits d'envoi
        boolean peutEnvoyer = false;
        
        if ("ADMIN".equals(expediteur.getRole())) {
            peutEnvoyer = true;
        } 
        else if (("AGENT".equals(expediteur.getRole()) || "CITIZEN".equals(expediteur.getRole())) 
                    && "ADMIN".equals(destinataire.getRole())) {
            peutEnvoyer = true;
        }
        
        if (!peutEnvoyer) {
            throw new RuntimeException("Les citoyens et agents ne peuvent envoyer des messages qu'aux administrateurs.");
        }
        
        // Déterminer le type de message
        String messageType = messageDTO.getType();
        if (messageType == null || messageType.isEmpty()) {
            messageType = "INTERNAL";
        }
        messageType = messageType.toUpperCase();
        
        // Créer et sauvegarder le message (sans les champs de rôle)
        Message message = new Message();
        message.setExpediteurEmail(expediteurEmail);
        message.setExpediteurNom(expediteur.getNom());
        // ⚠️ PAS de setExpediteurRole - votre modèle n'a pas ce champ
        message.setDestinataireEmail(destinataire.getEmail());
        message.setDestinataireNom(destinataire.getNom());
        // ⚠️ PAS de setDestinataireRole - votre modèle n'a pas ce champ
        message.setSujet(messageDTO.getSujet());
        message.setContenu(messageDTO.getContenu());
        message.setType(messageType);
        message.setLu(false);
        message.setDateEnvoi(LocalDateTime.now());
        
        Message savedMessage = messageRepository.save(message);
        
        // 🔥 CRÉER UNE NOTIFICATION DANS L'APPLICATION
        Notification notification = new Notification();
        notification.setUserEmail(destinataire.getEmail());
        
        if ("EMAIL".equals(messageType)) {
            notification.setType("EMAIL_RECU");
            notification.setTitle("📧 Nouvel email reçu");
            notification.setMessage(String.format("%s vous a envoyé un email : \"%s\"", 
                expediteur.getNom(), messageDTO.getSujet()));
        } else {
            notification.setType("MESSAGE_RECU");
            notification.setTitle("💬 Nouveau message reçu");
            notification.setMessage(String.format("%s vous a envoyé un message : \"%s\"", 
                expediteur.getNom(), messageDTO.getSujet()));
        }
        
        notification.setLien("/messages");
        notification.setLu(false);
        notification.setDateCreation(LocalDateTime.now());
        
        notificationRepository.save(notification);
        System.out.println("🔔 Notification créée pour " + destinataire.getEmail());
        
        // 🔥 ENVOYER L'EMAIL RÉEL SI LE TYPE EST "EMAIL"
        if ("EMAIL".equals(messageType)) {
            try {
                emailService.envoyerEmail(
                    destinataire.getEmail(),
                    expediteur.getNom(),
                    messageDTO.getSujet(),
                    messageDTO.getContenu()
                );
                System.out.println("📧 Email réel envoyé à " + destinataire.getEmail());
            } catch (Exception e) {
                System.err.println("⚠️ Erreur envoi email réel, mais message sauvegardé: " + e.getMessage());
                // On ne bloque pas l'envoi du message si l'email échoue
            }
        }
        
        return savedMessage;
    }
    
    public List<Message> getMessagesForUser(String email) {
        return messageRepository.findByDestinataireEmailOrderByDateEnvoiDesc(email);
    }
    
    public long countNonLu(String email) {
        return messageRepository.countByDestinataireEmailAndLuFalse(email);
    }
    
    @Transactional
    public void marquerCommeLu(Long messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        message.setLu(true);
        messageRepository.save(message);
    }
    
    @Transactional
    public void supprimerMessage(Long messageId, String userEmail) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message non trouvé"));
        
        Utilisateur user = utilisateurRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        if (!message.getDestinataireEmail().equals(userEmail) && !"ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Non autorisé à supprimer ce message");
        }
        
        messageRepository.delete(message);
    }
}