package com.smartcity.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    // Version avec 4 paramètres (utilisée dans MessageService)
    public void envoyerEmail(String destinataire, String expediteurNom, String sujet, String contenu) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(destinataire);
            message.setSubject("[SmartCity] " + sujet);
            
            String emailContent = String.format(
                "Bonjour,\n\n%s vous a envoyé un message via la plateforme SmartCity :\n\nSujet: %s\n\nMessage:\n%s\n\n---\nCordialement,\nL'équipe SmartCity",
                expediteurNom, sujet, contenu
            );
            message.setText(emailContent);
            
            mailSender.send(message);
            System.out.println("✅ Email envoyé à " + destinataire);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur envoi email à " + destinataire + ": " + e.getMessage());
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage());
        }
    }
}