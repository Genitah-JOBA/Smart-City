import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, motDePasse }),
      });

      if (!response.ok) {
        throw new Error("Email ou mot de passe incorrect");
      }

      const token = await response.text();

      // Sauvegarde du token dans le localStorage
      localStorage.setItem("token", token);

      setMessage("Connexion réussie !");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600"
        >
          Se connecter
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Inscrivez-vous ici
          </Link>
        </p>

        {message && (
          <p className="mt-4 text-center text-red-500">{message}</p>
        )}
      </form>
    </div>
  );
}