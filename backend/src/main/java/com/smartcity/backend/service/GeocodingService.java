package com.smartcity.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Géocodage inverse (coordonnées -> adresse) via Google Maps.
 * La clé API reste côté serveur. Si aucune clé n'est configurée,
 * les méthodes renvoient null et le frontend bascule sur OpenStreetMap.
 */
@Service
public class GeocodingService {

    @Value("${google.maps.api-key:}")
    private String googleApiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public boolean isGoogleEnabled() {
        return googleApiKey != null && !googleApiKey.isBlank();
    }

    /**
     * Reverse geocoding via Google. Renvoie une adresse normalisée,
     * ou null si Google n'est pas configuré ou en cas d'échec.
     */
    public Map<String, Object> reverseGeocodeGoogle(double lat, double lng) {
        if (!isGoogleEnabled()) {
            return null;
        }
        try {
            String url = "https://maps.googleapis.com/maps/api/geocode/json"
                    + "?latlng=" + lat + "," + lng
                    + "&language=fr"
                    + "&key=" + URLEncoder.encode(googleApiKey, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                System.err.println("Google Geocoding HTTP " + response.statusCode());
                return null;
            }

            JsonNode root = mapper.readTree(response.body());
            String status = root.path("status").asText();
            if (!"OK".equals(status)) {
                System.err.println("Google Geocoding status: " + status);
                return null;
            }

            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) {
                return null;
            }

            // Parcourir tous les résultats et retenir la 1re occurrence de chaque type
            String route = null, neighborhood = null, sublocality = null,
                    locality = null, admin2 = null, admin3 = null, admin1 = null;

            for (JsonNode result : results) {
                for (JsonNode comp : result.path("address_components")) {
                    String name = comp.path("long_name").asText();
                    for (JsonNode t : comp.path("types")) {
                        switch (t.asText()) {
                            case "route": if (route == null) route = name; break;
                            case "neighborhood": if (neighborhood == null) neighborhood = name; break;
                            case "sublocality":
                            case "sublocality_level_1": if (sublocality == null) sublocality = name; break;
                            case "locality": if (locality == null) locality = name; break;
                            case "administrative_area_level_2": if (admin2 == null) admin2 = name; break;
                            case "administrative_area_level_3": if (admin3 == null) admin3 = name; break;
                            case "administrative_area_level_1": if (admin1 == null) admin1 = name; break;
                            default: break;
                        }
                    }
                }
            }

            String formatted = results.get(0).path("formatted_address").asText();

            String quartier = neighborhood != null ? neighborhood : (sublocality != null ? sublocality : "");
            String ville = locality != null ? locality : (admin1 != null ? admin1 : "");
            String commune = admin2 != null ? admin2 : (admin3 != null ? admin3 : "");
            String rue = route != null ? route : "";

            Map<String, Object> data = new HashMap<>();
            data.put("source", "google");
            data.put("fullAddress", (formatted != null && !formatted.isBlank()) ? formatted : (lat + ", " + lng));
            data.put("ville", ville);
            data.put("commune", commune);
            data.put("quartier", quartier);
            data.put("fokontany", "");
            data.put("lieuDit", "");
            data.put("rue", rue);
            data.put("latitude", lat);
            data.put("longitude", lng);
            return data;

        } catch (Exception e) {
            System.err.println("Erreur reverse geocoding Google: " + e.getMessage());
            return null;
        }
    }
}
