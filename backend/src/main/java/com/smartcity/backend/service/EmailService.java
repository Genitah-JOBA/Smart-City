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

    /** Envoi bas niveau d'un email HTML via Resend. */
    private void envoyerHtml(String destinataire, String sujet, String htmlContent) {
        try {
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
                System.out.println("✅ Email envoyé à " + destinataire);
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

    /** Code de vérification à 6 chiffres (inscription). */
    public void envoyerCodeVerification(String destinataire, String code) {
        String html = String.format("""
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif; background:#f3f4f6; padding:24px;">
              <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:24px;text-align:center;">
                  <h2 style="margin:0;">SmartCity</h2>
                  <p style="margin:4px 0 0;">Vérification de votre adresse email</p>
                </div>
                <div style="padding:24px;text-align:center;color:#0f172a;">
                  <p>Voici votre code de confirmation :</p>
                  <div style="font-size:34px;font-weight:bold;letter-spacing:8px;color:#059669;margin:16px 0;">%s</div>
                  <p style="color:#64748b;font-size:13px;">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
                </div>
              </div>
            </body></html>
            """, code);
        envoyerHtml(destinataire, "Code de vérification", html);
    }

    /** Lien de réinitialisation de mot de passe. */
    public void envoyerResetMotDePasse(String destinataire, String lien) {
        String html = String.format("""
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif; background:#f3f4f6; padding:24px;">
              <div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:24px;text-align:center;">
                  <h2 style="margin:0;">SmartCity</h2>
                  <p style="margin:4px 0 0;">Réinitialisation du mot de passe</p>
                </div>
                <div style="padding:24px;color:#0f172a;">
                  <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="%s" style="background:#059669;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">Réinitialiser mon mot de passe</a>
                  </div>
                  <p style="color:#64748b;font-size:13px;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.</p>
                </div>
              </div>
            </body></html>
            """, lien);
        envoyerHtml(destinataire, "Réinitialisation du mot de passe", html);
    }

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