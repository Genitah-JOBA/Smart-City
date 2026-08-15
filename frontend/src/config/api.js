// URL de base de l'API backend.
// Fournie par la variable d'environnement Vite VITE_API_URL
// (voir .env.development / .env.prod).
//
// - En dev : "http://localhost:8081" (backend local).
// - En prod (VPS Docker) : laisser VIDE => les appels deviennent relatifs
//   (ex. "/api/...") et nginx les redirige vers le backend (reverse-proxy).
//   Idéal quand le domaine public n'est pas encore connu.
// - Backend sur un autre domaine : mettre l'URL complète (https://api.exemple.mg).
//
// On utilise `??` (et non `||`) pour qu'une chaîne VIDE reste vide (mode relatif)
// et ne soit pas remplacée par le repli local.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";
