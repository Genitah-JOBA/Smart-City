// MessageService.java
package com.smartcity.backend.service;

import com.smartcity.backend.dto.MessageDTO;
import com.smartcity.backend.model.Message;
import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.repository.MessageRepository;
import com.smartcity.backend.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    public Message envoyerMessage(MessageDTO messageDTO, String expediteurEmail) {
        Utilisateur expediteur = utilisateurRepository.findByEmail(expediteurEmail)
            .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));
        
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
        
        Message message = new Message();
        message.setExpediteurEmail(expediteurEmail);
        message.setExpediteurNom(expediteur.getNom());
        message.setDestinataireEmail(destinataire.getEmail());
        message.setDestinataireNom(destinataire.getNom());
        message.setSujet(messageDTO.getSujet());
        message.setContenu(messageDTO.getContenu());
        message.setType(messageDTO.getType());
        message.setLu(false);
        message.setDateEnvoi(LocalDateTime.now());
        
        return messageRepository.save(message);
    }
}