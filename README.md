# SmartCity — Plateforme citoyenne de signalement

Application web de **signalement des problèmes urbains** pour Antananarivo (Madagascar).
Les citoyens signalent les incidents (voirie, éclairage, déchets, eau, sécurité…), les
**agents municipaux** les prennent en charge et les résolvent, et les **administrateurs**
supervisent, assignent (avec aide de l'IA) et gèrent les utilisateurs.

Interface **multilingue** (Français 🇫🇷 · Malagasy 🇲🇬 · Anglais 🇬🇧), **thème clair/sombre**,
**responsive** (mobile → grand écran/TV).

---

## Fonctionnalités

### itoyen
- Créer un signalement : titre, description, **catégorie**, **photos** (caméra, galerie, URL), **localisation GPS**.
- Géolocalisation avec **rattachement au quartier** (gazetteer local + OpenStreetMap, sans API payante).
- Fil des signalements, carte interactive (Leaflet), commentaires, partage.
- Suivi de ses propres signalements et de leur statut.
- Profil : édition, changement de mot de passe, **suppression du compte**.

### gent
- Tableau de bord des signalements **assignés**.
- **Prise en charge** et **résolution** avec preuves (photos avant/après).
- Vue « **IA — dangerosité** » qui trie les signalements par urgence.
- Détail avec **carte de localisation** + bouton **Itinéraire** (ouvre Maps).

### Administrateur
- Vue d'ensemble (statistiques, signalements urgents).
- **Assignation** des signalements aux agents, avec **suggestions IA** (par domaine / ville / disponibilité).
- Gestion des **utilisateurs** et de tous les signalements.

### Comptes & sécurité
- Authentification **JWT**, mots de passe **BCrypt**.
- **Vérification de l'email** à l'inscription (code à 6 chiffres).
- **Mot de passe oublié** (lien de réinitialisation par email).
- Rôles : `CITIZEN`, `AGENT`, `ADMIN`.
- **Notifications** in-app et **messagerie** intégrée (chat flottant).

---

## Stack technique

| Couche | Technologies |
|--------|--------------|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router 7, Leaflet / React-Leaflet, Lucide Icons |
| **Backend** | Spring Boot 3.2 (Java 21), Spring Security + JWT (jjwt), Spring Data JPA, Spring Mail, Lombok |
| **Base de données** | PostgreSQL |
| **Email** | API HTTP Brevo (transactionnel) |
| **Conteneurisation** | Docker (backend + frontend nginx) |
| **Hébergement** | Supabase (DB) · Render (backend) · Vercel (frontend) — ou VPS via Docker Compose |

---

## Structure du projet

```
SmartCity/
├── backend/                     # API Spring Boot
│   ├── src/main/java/com/smartcity/backend/
│   │   ├── controller/          # Auth, Signalement, Message, Notification, Assignation, Geocoding…
│   │   ├── model/               # Utilisateur, Signalement, Message, Notification, EmailVerification…
│   │   ├── repository/          # Spring Data JPA
│   │   ├── service/             # EmailService (Brevo), Geocoding…
│   │   └── security/            # SecurityConfig, JwtFilter, JwtUtil
│   ├── src/main/resources/
│   │   ├── application.properties          # profil dev
│   │   └── application-prod.properties      # profil prod (variables d'env)
│   └── Dockerfile
├── frontend/                    # SPA React + Vite
│   ├── src/
│   │   ├── config/api.js         # URL de l'API (VITE_API_URL)
│   │   ├── context/AppContext.jsx# thème + i18n (FR/MG/EN)
│   │   ├── components/           # MessageBox…
│   │   ├── Auth.jsx, Signaler.jsx, Signalements.jsx, Carte.jsx, Profil.jsx…
│   │   ├── Agent*.jsx, Admin*.jsx, AssignationIA.jsx, UsersManagement.jsx
│   │   └── Navbar.jsx, FloatingChat.jsx, ResetPassword.jsx
│   ├── .env.development / .env.prod
│   ├── vercel.json / Dockerfile / nginx.conf
├── docker-compose.yml           # déploiement tout-en-un (VPS)
├── DEPLOY.md                    # guide de déploiement détaillé
└── README.md
```

---

## Démarrage en local

### Prérequis
- **Java 21** + Maven (le wrapper `./mvnw` est inclus)
- **Node.js 20+**
- **PostgreSQL** (local) — ou utiliser Docker Compose (voir plus bas)

### 1) Base de données
Crée une base PostgreSQL nommée `City` (les tables sont créées automatiquement au 1er démarrage
via `spring.jpa.hibernate.ddl-auto=update`).

### 2) Backend
```bash
cd backend
# renseigne les identifiants BD dans src/main/resources/application.properties
# (ou via variables d'environnement, voir ci-dessous)
./mvnw spring-boot:run
```
L'API démarre sur **http://localhost:8081**.

### 3) Frontend
```bash
cd frontend
npm install
npm run dev
```
Le site démarre sur **http://localhost:5173** (le fichier `.env.development` pointe déjà l'API sur `http://localhost:8081`).

### Alternative : tout en Docker (VPS ou local)
```bash
cp .env.example .env      # renseigne au minimum POSTGRES_PASSWORD
docker compose up -d --build
```
Postgres + backend + frontend (nginx) démarrent ensemble ; le site est servi sur le port **80**.

---

## 🔧 Variables d'environnement

### Backend (profil `prod` — Render / Docker)
| Variable | Description |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | URL JDBC PostgreSQL (ex. `jdbc:postgresql://host:5432/postgres?sslmode=require`) |
| `SPRING_DATASOURCE_USERNAME` | utilisateur BD |
| `SPRING_DATASOURCE_PASSWORD` | mot de passe BD |
| `APP_CORS_ALLOWED_ORIGINS` | origine(s) du frontend autorisée(s) (ex. `https://*.vercel.app`) |
| `APP_FRONTEND_URL` | URL publique du frontend (liens dans les emails) |
| `BREVO_API_KEY` | clé API Brevo (envoi d'emails) |
| `BREVO_SENDER_EMAIL` | expéditeur vérifié dans Brevo |
| `PORT` | fourni automatiquement par Render (repli `8081`) |

### Frontend (Vite)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL complète du backend (ex. `https://mon-backend.onrender.com`). Vide = appels relatifs (`/api`) via reverse-proxy. |

---

## 🔌 Principaux endpoints API

Base : `/api`

| Méthode | Chemin | Rôle |
|---------|--------|------|
| POST | `/auth/register` | Inscription (email vérifié requis) |
| POST | `/auth/login` | Connexion (renvoie un JWT) |
| POST | `/auth/send-verification-code` | Envoi du code de vérification email |
| POST | `/auth/verify-code` | Validation du code |
| POST | `/auth/forgot-password` | Demande de réinitialisation |
| POST | `/auth/reset-password` | Réinitialisation via token |
| GET  | `/auth/me` | Profil de l'utilisateur connecté |
| PUT  | `/auth/update-profile` | Mise à jour du profil |
| POST | `/auth/change-password` | Changement de mot de passe |
| DELETE | `/auth/delete-account` | Suppression du compte |
| GET/POST | `/signalements` | Liste / création de signalements |
| … | `/messages`, `/notifications`, `/assignations`, `/geocoding` | messagerie, notifications, assignation, géocodage |

> Toutes les routes sauf `login`, `register` et les endpoints de vérification/réinitialisation
> nécessitent un header `Authorization: Bearer <token>`.

---

## Créer un administrateur

Le formulaire d'inscription ne propose que **Citoyen / Agent**. Pour créer un admin, insère-le
directement en base (mot de passe hashé en BCrypt via `pgcrypto`) :

```sql
create extension if not exists pgcrypto;

insert into utilisateurs (nom, email, mot_de_passe, role, date_creation)
values ('Admin', 'admin@exemple.com',
        crypt('MON_MOT_DE_PASSE', gen_salt('bf', 10)), 'ADMIN', now());
```

---

## Internationalisation & thème
- **Langues** : FR (défaut), MG, EN — gérées via `src/context/AppContext.jsx` (dictionnaire à clés plates, `t("clef")`).
- **Thème** : clair / sombre, piloté par une classe sur `<html>` + surcharges CSS (`src/index.css`).
- Les préférences sont mémorisées dans `localStorage`.

---

## Déploiement

Voir **[DEPLOY.md](DEPLOY.md)** pour le guide complet (Supabase + Render + Vercel, ou VPS Docker).

Ordre recommandé : **Supabase (BD) → Render (backend) → Vercel (frontend)**, chaque étape
fournissant une valeur nécessaire à la suivante (URL BD → URL backend → CORS).

---

## Sécurité
- Aucun secret ne doit être committé : ils passent **uniquement** par les variables d'environnement (Render/Vercel) ou le fichier `.env` local (ignoré par git).
- Les mots de passe sont stockés hashés (**BCrypt**), l'authentification repose sur des **JWT**.

---

## Licence
Projet académique / éducatif. Adapter la licence selon vos besoins.
