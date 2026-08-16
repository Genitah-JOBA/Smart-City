package com.smartcity.backend.controller;

import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.model.EmailVerification;
import com.smartcity.backend.repository.UtilisateurRepository;
import com.smartcity.backend.repository.EmailVerificationRepository;
import com.smartcity.backend.security.JwtUtil;
import com.smartcity.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.smartcity.backend.model.DomaineAgent;

import java.security.Principal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailVerificationRepository emailVerificationRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final SecureRandom random = new SecureRandom();

    // ================= VÉRIFICATION EMAIL (inscription) =================

    /** Génère un code à 6 chiffres et l'envoie à l'email fourni. */
    @PostMapping("/send-verification-code")
    public ResponseEntity<?> sendVerificationCode(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Adresse email invalide."));
            }
            if (utilisateurRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Cet email est déjà associé à un compte."));
            }

            String code = String.format("%06d", random.nextInt(1_000_000));
            emailVerificationRepository.deleteByEmail(email);
            EmailVerification ev = new EmailVerification();
            ev.setEmail(email);
            ev.setCode(code);
            ev.setExpiryDate(LocalDateTime.now().plusMinutes(10));
            ev.setVerified(false);
            emailVerificationRepository.save(ev);

            emailService.envoyerCodeVerification(email, code);
            return ResponseEntity.ok(Map.of("message", "Un code de vérification a été envoyé à votre adresse email."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Impossible d'envoyer le code pour le moment. Réessayez."));
        }
    }

    /** Vérifie le code saisi par l'utilisateur (avant l'inscription). */
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        EmailVerification ev = emailVerificationRepository.findTopByEmailOrderByIdDesc(email).orElse(null);
        if (ev == null || !ev.getCode().equals(code)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Code incorrect."));
        }
        if (ev.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Le code a expiré. Demandez-en un nouveau."));
        }
        ev.setVerified(true);
        emailVerificationRepository.save(ev);
        return ResponseEntity.ok(Map.of("message", "Adresse email confirmée."));
    }

    // ================= MOT DE PASSE OUBLIÉ =================

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            // Réponse identique que l'email existe ou non (anti-énumération).
            Map<String, String> ok = Map.of("message",
                    "Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé.");
            var userOpt = utilisateurRepository.findByEmail(email == null ? "" : email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(ok);
            }
            Utilisateur user = userOpt.get();
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            utilisateurRepository.save(user);

            String lien = frontendUrl + "/reset-password?token=" + token;
            emailService.envoyerResetMotDePasse(email, lien);
            return ResponseEntity.ok(ok);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Action impossible pour le moment. Réessayez."));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String token = body.get("token");
            String newPassword = body.get("newPassword");
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 6 caractères."));
            }
            Utilisateur user = utilisateurRepository.findByResetToken(token).orElse(null);
            if (user == null || user.getResetTokenExpiry() == null
                    || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Lien invalide ou expiré. Refaites une demande."));
            }
            user.setMotDePasse(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            utilisateurRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "La réinitialisation a échoué. Réessayez."));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> userData) {
        try {
            System.out.println("📝 Données reçues: " + userData);
            
            String email = (String) userData.get("email");
            
            // Vérifier si l'email existe déjà
            if (utilisateurRepository.findByEmail(email).isPresent()) {
                return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Cet email est déjà associé à un compte.");
            }

            // ⭐ L'email doit avoir été confirmé via le code envoyé par mail
            EmailVerification ev = emailVerificationRepository.findTopByEmailOrderByIdDesc(email).orElse(null);
            if (ev == null || !ev.isVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Veuillez confirmer votre adresse email avant de vous inscrire.");
            }

            // Vérifier les champs obligatoires
            if (userData.get("nom") == null || ((String) userData.get("nom")).isEmpty()) {
                return ResponseEntity.badRequest().body("Le nom est vide !");
            }
            if (userData.get("role") == null || ((String) userData.get("role")).isEmpty()) {
                return ResponseEntity.badRequest().body("Le rôle est vide !");
            }
            
            // Créer l'utilisateur
            Utilisateur user = new Utilisateur();
            user.setNom((String) userData.get("nom"));
            user.setEmail(email);
            user.setMotDePasse(passwordEncoder.encode((String) userData.get("motDePasse")));
            user.setRole((String) userData.get("role"));
            
            // ⭐ Champs optionnels
            if (userData.containsKey("telephone") && userData.get("telephone") != null) {
                user.setTelephone((String) userData.get("telephone"));
            }
            
            if (userData.containsKey("adresse") && userData.get("adresse") != null) {
                user.setAdresse((String) userData.get("adresse"));
            }
            
            if (userData.containsKey("domaine") && userData.get("domaine") != null) {
                try {
                    String domaineStr = (String) userData.get("domaine");
                    user.setDomaine(DomaineAgent.valueOf(domaineStr));
                } catch (IllegalArgumentException e) {
                    System.out.println("⚠️ Domaine invalide: " + userData.get("domaine"));
                }
            }
            
            if (userData.containsKey("metier") && userData.get("metier") != null) {
                user.setMetier((String) userData.get("metier"));
            }
            
            utilisateurRepository.save(user);
            emailVerificationRepository.deleteByEmail(email); // nettoyage du code utilisé

            return new ResponseEntity<>("Utilisateur créé avec succès", HttpStatus.CREATED);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("La création du compte a échoué. Vérifiez vos informations et réessayez.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        try {
            String email = loginData.get("email");
            String motDePasse = loginData.get("motDePasse");
            
            System.out.println("Tentative de login pour : " + email);
            
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, motDePasse)
            );
            
            // ⭐ Récupérer l'utilisateur depuis la base pour avoir son vrai rôle
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            System.out.println("✅ Rôle trouvé en base pour " + email + " : " + user.getRole());
            
            // ⭐ Utiliser le rôle de la base, pas celui envoyé dans la requête
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
            
            return ResponseEntity.ok(token);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur login: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email ou mot de passe incorrect");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            System.out.println("🔍 Récupération utilisateur: " + email);
            
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            System.out.println("📌 Rôle en base: " + user.getRole());
            System.out.println("📌 Domaine: " + user.getDomaine());
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("nom", user.getNom());
            response.put("role", user.getRole().toUpperCase()); // ⭐ Forcer en majuscules
            response.put("dateCreation", user.getDateCreation());
            response.put("domaine", user.getDomaine() != null ? user.getDomaine().toString() : "");
            response.put("metier", user.getMetier());
            response.put("adresse", user.getAdresse());
            
            System.out.println("📤 Rôle envoyé: " + response.get("role"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Impossible de charger votre profil pour le moment. Veuillez réessayer."));
        }
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(
            Principal principal,
            @RequestBody Map<String, String> updates) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (updates.containsKey("nom") && updates.get("nom") != null) {
                user.setNom(updates.get("nom"));
            }
            if (updates.containsKey("email") && updates.get("email") != null) {
                user.setEmail(updates.get("email"));
            }
            if (updates.containsKey("domaine") && updates.get("domaine") != null) {
                try {
                    user.setDomaine(DomaineAgent.valueOf(updates.get("domaine")));
                } catch (IllegalArgumentException e) {}
            }
            if (updates.containsKey("metier") && updates.get("metier") != null) {
                user.setMetier(updates.get("metier"));
            }
            
            // ⭐ NOUVEAU - MISE À JOUR DE L'ADRESSE
            if (updates.containsKey("adresse") && updates.get("adresse") != null) {
                user.setAdresse(updates.get("adresse"));
            }
            
            utilisateurRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("nom", user.getNom());
            response.put("role", user.getRole());
            response.put("domaine", user.getDomaine() != null ? user.getDomaine().toString() : "");
            response.put("metier", user.getMetier());
            response.put("adresse", user.getAdresse());
            response.put("message", "Profil mis à jour avec succès");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Impossible de mettre à jour votre profil pour le moment. Veuillez réessayer."));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Principal principal,
            @RequestBody Map<String, String> passwords) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            String currentPassword = passwords.get("currentPassword");
            String newPassword = passwords.get("newPassword");
            
            System.out.println("🔒 Changement mot de passe pour: " + email);
            
            if (currentPassword == null || currentPassword.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Le mot de passe actuel est requis"));
            }
            
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Le nouveau mot de passe doit contenir au moins 6 caractères"));
            }
            
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (!passwordEncoder.matches(currentPassword, user.getMotDePasse())) {
                System.out.println("❌ Mot de passe actuel incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Mot de passe actuel incorrect"));
            }
            
            user.setMotDePasse(passwordEncoder.encode(newPassword));
            utilisateurRepository.save(user);
            
            System.out.println("✅ Mot de passe changé avec succès");
            return ResponseEntity.ok(Map.of("message", "Mot de passe changé avec succès"));
            
        } catch (Exception e) {
            System.err.println("❌ Erreur dans change-password: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Impossible de modifier votre mot de passe pour le moment. Veuillez réessayer."));
        }
    }
}