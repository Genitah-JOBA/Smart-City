package com.smartcity.backend.dto;

public class EnvoiMessageRequest {
    private String destinataireEmail;
    private String sujet;
    private String contenu;
    private String type;

    public EnvoiMessageRequest() {
    }

    public EnvoiMessageRequest(String destinataireEmail, String sujet, String contenu, String type) {
        this.destinataireEmail = destinataireEmail;
        this.sujet = sujet;
        this.contenu = contenu;
        this.type = type;
    }

    public String getDestinataireEmail() {
        return destinataireEmail;
    }

    public void setDestinataireEmail(String destinataireEmail) {
        this.destinataireEmail = destinataireEmail;
    }

    public String getSujet() {
        return sujet;
    }

    public void setSujet(String sujet) {
        this.sujet = sujet;
    }

    public String getContenu() {
        return contenu;
    }

    public void setContenu(String contenu) {
        this.contenu = contenu;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}