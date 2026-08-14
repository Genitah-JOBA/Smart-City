package com.smartcity.backend.controller;

import com.smartcity.backend.service.GeocodingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/geocode")
@CrossOrigin(origins = "http://localhost:5173")
public class GeocodingController {

    @Autowired
    private GeocodingService geocodingService;

    /**
     * Géocodage inverse via Google (clé côté serveur).
     * - 200 + adresse normalisée si Google est configuré et répond.
     * - 204 (No Content) sinon : le frontend basculera sur OpenStreetMap.
     */
    @GetMapping("/reverse")
    public ResponseEntity<?> reverse(@RequestParam double lat, @RequestParam double lng) {
        try {
            Map<String, Object> data = geocodingService.reverseGeocodeGoogle(lat, lng);
            if (data == null) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            e.printStackTrace();
            // En cas d'erreur, on laisse le frontend utiliser OpenStreetMap
            return ResponseEntity.noContent().build();
        }
    }
}
