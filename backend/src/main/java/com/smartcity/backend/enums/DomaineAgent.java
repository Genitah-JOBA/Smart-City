package com.smartcity.backend.enums;

public enum DomaineAgent {
    VOIRIE("Voirie et infrastructures"),
    ECLAIRAGE("Éclairage public"),
    PROPRETE("Propreté et déchets"),
    ESPACES_VERTS("Espaces verts"),
    TRANSPORTS("Transports et mobilité"),
    SECURITE("Sécurité et prévention"),
    URBANISME("Urbanisme"),
    NON_ASSIGNE("Non assigné");
    
    private String libelle;
    
    DomaineAgent(String libelle) {
        this.libelle = libelle;
    }
    
    public String getLibelle() {
        return libelle;
    }
    
    public static DomaineAgent fromString(String text) {
        for (DomaineAgent d : DomaineAgent.values()) {
            if (d.name().equalsIgnoreCase(text)) {
                return d;
            }
        }
        return NON_ASSIGNE;
    }
}