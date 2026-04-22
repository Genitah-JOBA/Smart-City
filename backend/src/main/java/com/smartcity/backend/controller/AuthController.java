package com.smartcity.backend.controller;

import com.smartcity.backend.model.Utilisateur;
import com.smartcity.backend.repository.UtilisateurRepository;
import com.smartcity.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Utilisateur user) {
        if (utilisateurRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body("Cet email est déjà associé à un compte.");
        }

        if (user.getNom() == null || user.getNom().isEmpty()) {
            return ResponseEntity.badRequest().body("Le nom est vide !");
        }
        if (user.getRole() == null || user.getRole().isEmpty()) {
            return ResponseEntity.badRequest().body("Le rôle est vide !");
        }
        
        user.setMotDePasse(passwordEncoder.encode(user.getMotDePasse()));
        utilisateurRepository.save(user);
        
        return new ResponseEntity<>("Utilisateur créé avec succès", HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Utilisateur user) {
        System.out.println("Tentative de login pour : " + user.getEmail());
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(user.getEmail(), user.getMotDePasse())
        );
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(token);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Non authentifié"));
            }
            
            String email = principal.getName();
            System.out.println("Récupération de l'utilisateur: " + email);
            
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("nom", user.getNom());
            response.put("role", user.getRole());
            response.put("dateCreation", user.getDateCreation());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Erreur dans /me: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ AJOUTEZ CETTE MÉTHODE POUR LA MISE À JOUR DU PROFIL
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
            System.out.println("📝 Mise à jour profil pour: " + email);
            System.out.println("📝 Données reçues: " + updates);
            
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            // Mettre à jour le nom si fourni
            if (updates.containsKey("nom") && updates.get("nom") != null && !updates.get("nom").isEmpty()) {
                user.setNom(updates.get("nom"));
                System.out.println("✅ Nom mis à jour: " + user.getNom());
            }
            
            // Mettre à jour l'email si fourni et différent
            if (updates.containsKey("email") && updates.get("email") != null && !updates.get("email").isEmpty()) {
                String newEmail = updates.get("email");
                if (!newEmail.equals(email)) {
                    // Vérifier si le nouvel email n'est pas déjà utilisé
                    if (utilisateurRepository.findByEmail(newEmail).isPresent()) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "Cet email est déjà utilisé"));
                    }
                    user.setEmail(newEmail);
                    System.out.println("✅ Email mis à jour: " + newEmail);
                }
            }
            
            utilisateurRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("nom", user.getNom());
            response.put("role", user.getRole());
            response.put("message", "Profil mis à jour avec succès");
            
            System.out.println("✅ Profil mis à jour avec succès");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur dans update-profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ AJOUTEZ CETTE MÉTHODE POUR LE CHANGEMENT DE MOT DE PASSE
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
            
            // Vérifier l'ancien mot de passe
            if (!passwordEncoder.matches(currentPassword, user.getMotDePasse())) {
                System.out.println("❌ Mot de passe actuel incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Mot de passe actuel incorrect"));
            }
            
            // Changer le mot de passe
            user.setMotDePasse(passwordEncoder.encode(newPassword));
            utilisateurRepository.save(user);
            
            System.out.println("✅ Mot de passe changé avec succès");
            return ResponseEntity.ok(Map.of("message", "Mot de passe changé avec succès"));
            
        } catch (Exception e) {
            System.err.println("❌ Erreur dans change-password: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
}