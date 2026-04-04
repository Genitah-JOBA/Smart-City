package com.smartcity.backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtil {

    // Utilise une chaîne simple sans caractères spéciaux complexes pour le test
    private final String SECRET_STRING = "MaCleSecreteTresLongueEtTresSecurisee2026";
    
    // On génère la clé à partir des octets bruts (évite le décodage Base64 automatique)
    private final Key KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 24h
                .signWith(KEY, SignatureAlgorithm.HS256) // Utilise KEY (l'objet), pas SECRET_STRING
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(KEY)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
