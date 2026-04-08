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
        // Contrôle de doublon
        if (utilisateurRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body("Cet email est déjà associé à un compte.");
        }

        // 2. Vérifications
        if (user.getNom() == null || user.getNom().isEmpty()) {
            return ResponseEntity.badRequest().body("Le nom est vide !");
        }
        if (utilisateurRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Cet email est déjà pris");
        }
        if (user.getRole() == null || user.getRole().isEmpty()) {
            return ResponseEntity.badRequest().body("Le rôle est vide !");
        }
        
        // 3. Traitement
        user.setMotDePasse(passwordEncoder.encode(user.getMotDePasse()));
        utilisateurRepository.save(user);
        
        return new ResponseEntity<>("Utilisateur créé avec succès", HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Utilisateur user) {
        System.out.println("Tentative de login pour : " + user.getEmail());
        System.out.println("Mot de passe reçu : " + user.getMotDePasse());
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
}
