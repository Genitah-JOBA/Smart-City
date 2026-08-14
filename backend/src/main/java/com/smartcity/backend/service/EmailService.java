package com.smartcity.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {
    
    @Value("${resend.api.key}")
    private String apiKey;
    
    @Value("${resend.from.email}")
    private String fromEmail;
    
    private final HttpClient httpClient = HttpClient.newHttpClient();
    
    public void envoyerEmail(String destinataire, String expediteurNom, String sujet, String contenu) {
        try {
            String htmlContent = String.format("""
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #253788 0%%, #3097d3 100%%); color: white; padding: 20px; text-align: center;">
                        <h2>SmartCity</h2>
                        <p>Nouveau message reçu</p>
                    </div>
                    <div style="padding: 20px;">
                        <p><strong>De :</strong> %s</p>
                        <p><strong>📋 Sujet :</strong> %s</p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                            <p>%s</p>
                        </div>
                        <hr/>
                        <p>Cordialement,<br/>L'équipe SmartCity</p>
                    </div>
                </body>
                </html>
                """, expediteurNom, sujet, contenu);
            
            String jsonBody = String.format("""
                {
                    "from": "%s",
                    "to": ["%s"],
                    "subject": "[SmartCity] %s",
                    "html": "%s"
                }
                """, fromEmail, destinataire, sujet, 
                htmlContent.replace("\"", "\\\"").replace("\n", "\\n"));
            
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(30))
                .build();
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                System.out.println("✅ Email envoyé avec Resend à " + destinataire);
            } else {
                System.err.println("⚠️ Erreur Resend (" + response.statusCode() + "): " + response.body());
                throw new RuntimeException("L'email n'a pas pu être envoyé. Veuillez réessayer plus tard.");
            }

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("❌ Erreur envoi email: " + e.getMessage());
            throw new RuntimeException("L'email n'a pas pu être envoyé. Veuillez réessayer plus tard.");
        }
    }
}