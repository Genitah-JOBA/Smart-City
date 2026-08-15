# Déploiement SmartCity — Supabase + Render + Vercel

| Composant | Service | Ce qui est déployé |
|-----------|---------|--------------------|
| Base de données | **Supabase** | PostgreSQL managé |
| Backend API | **Render** | Spring Boot (Docker, profil `prod`) |
| Frontend | **Vercel** | React/Vite (statique) |

> Frontend et backend sont sur des **domaines différents** → le CORS est géré côté
> backend via la variable `APP_CORS_ALLOWED_ORIGINS`, et le frontend appelle l'API
> via l'URL complète du backend (`VITE_API_URL`).

L'ordre compte : **1) Supabase → 2) Render → 3) Vercel** (chaque étape fournit une
valeur nécessaire à la suivante).

---

## 1) Base de données — Supabase
1. Crée un projet sur https://supabase.com.
2. **Project Settings → Database → Connection string → JDBC**. Tu obtiens :
   - hôte : `db.xxxxxxxx.supabase.co`
   - port : `5432`, base : `postgres`, user : `postgres`, mot de passe : (celui du projet)
3. Note la chaîne JDBC (avec SSL) :
   ```
   jdbc:postgresql://db.xxxxxxxx.supabase.co:5432/postgres?sslmode=require
   ```
   Les tables seront créées automatiquement au 1er démarrage du backend
   (`spring.jpa.hibernate.ddl-auto=update`).

## 2) Backend — Render
1. Pousse le repo sur GitHub (voir tout en bas).
2. Render → **New → Blueprint** et sélectionne le repo : il lit [`render.yaml`](render.yaml)
   (service Docker, `rootDir: backend`).
   *(Alternative sans blueprint : New → Web Service → Docker, Root Directory `backend`.)*
3. Renseigne les variables d'environnement (marquées `sync: false`) :
   | Variable | Valeur |
   |----------|--------|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db.xxxx.supabase.co:5432/postgres?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | `postgres` |
   | `SPRING_DATASOURCE_PASSWORD` | (mot de passe Supabase) |
   | `APP_CORS_ALLOWED_ORIGINS` | `https://TON-PROJET.vercel.app,https://*.vercel.app` |
   | `APP_FRONTEND_URL` | `https://TON-PROJET.vercel.app` |
   | `RESEND_API_KEY` | (nouvelle clé Resend — voir ⚠️) |
   | `GOOGLE_MAPS_API_KEY` | (optionnel, vide = OpenStreetMap) |

   `SPRING_PROFILES_ACTIVE=prod` et le port sont déjà gérés (Render fournit `PORT`).
4. Déploie. Tu obtiens une URL du type `https://smartcity-backend.onrender.com`.
   > ℹ️ Sur le plan gratuit, le service s'endort après inactivité (1er appel lent).

## 3) Frontend — Vercel
1. Vercel → **Add New → Project** → importe le repo.
2. **Root Directory = `frontend`** (Vercel détecte Vite ; [`vercel.json`](frontend/vercel.json)
   gère le build `--mode prod` et le routage SPA).
3. **Settings → Environment Variables** :
   | Variable | Valeur |
   |----------|--------|
   | `VITE_API_URL` | `https://smartcity-backend.onrender.com` (l'URL Render de l'étape 2) |
4. Déploie. Le site est en ligne sur `https://TON-PROJET.vercel.app`.

## 4) Boucler le CORS
Une fois l'URL Vercel connue, vérifie que `APP_CORS_ALLOWED_ORIGINS` (sur Render)
contient bien cette URL, puis redéploie le backend si tu l'as modifiée.

---

## ⚠️ Sécurité — à faire absolument
La clé **Resend** (`re_942…`) était en clair dans `application.properties` (versionné) :
elle est **compromise**. Régénère-la sur resend.com et mets la nouvelle **uniquement**
dans les variables d'env Render (`RESEND_API_KEY`). Ne jamais la remettre dans le code.

## Récapitulatif des URLs
- `VITE_API_URL` (Vercel) = URL **Render** du backend.
- `APP_CORS_ALLOWED_ORIGINS` + `APP_FRONTEND_URL` (Render) = URL **Vercel** du frontend.

## Pré-requis git
Le déploiement lit le code depuis GitHub → il faut **committer et pousser** le repo
(le fichier `.env` local reste ignoré ; les secrets vont dans Render/Vercel).

---

### Alternative : VPS auto-hébergé (Docker)
Les fichiers `docker-compose.yml`, `frontend/Dockerfile` + `nginx.conf` permettent un
déploiement tout-en-un sur un serveur unique (Postgres inclus). Non nécessaire pour le
parcours Supabase/Render/Vercel ci-dessus.
