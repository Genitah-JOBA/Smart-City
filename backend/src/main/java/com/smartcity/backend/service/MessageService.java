package com.smartcity.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // MODIFIER CETTE MÉTHODE
    public Message envoyerMessage(MessageDTO messageDTO, String expediteurEmail) {
        User expediteur = userRepository.findByEmail(expediteurEmail)
            .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));
        
        User destinataire = userRepository.findByEmail(messageDTO.getDestinataireEmail())
            .orElseThrow(() -> new RuntimeException("Destinataire non trouvé"));
        
        // ✅ NOUVELLE RÈGLE : Vérifier les droits d'envoi
        boolean peutEnvoyer = false;
        
        if (expediteur.getRole() == Role.ADMIN) {
            // Admin peut envoyer à tout le monde
            peutEnvoyer = true;
        } 
        else if (expediteur.getRole() == Role.AGENT && destinataire.getRole() == Role.ADMIN) {
            // Agent peut envoyer uniquement aux admins
            peutEnvoyer = true;
        }
        else if (expediteur.getRole() == Role.CITIZEN && destinataire.getRole() == Role.ADMIN) {
            // Citoyen peut envoyer uniquement aux admins
            peutEnvoyer = true;
        }
        
        if (!peutEnvoyer) {
            throw new RuntimeException("Vous n'êtes pas autorisé à envoyer un message à cet utilisateur. Les citoyens et agents ne peuvent envoyer qu'aux administrateurs.");
        }
        
        // Créer et sauvegarder le message
        Message message = new Message();
        message.setExpediteur(expediteur);
        message.setDestinataire(destinataire);
        message.setSujet(messageDTO.getSujet());
        message.setContenu(messageDTO.getContenu());
        message.setType(messageDTO.getType());
        message.setLu(false);
        message.setDateEnvoi(LocalDateTime.now());
        
        return messageRepository.save(message);
    }
}