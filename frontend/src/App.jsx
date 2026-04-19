import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Auth from "./Auth";

// Pages Citoyen
import Signalements from "./Signalements";
import Signaler from "./Signaler";
import MesSignalements from "./MesSignalements";
import Carte from "./Carte";
import Profil from "./Profil";

// Pages Agent
import AgentDashboard from "./AgentDashboard";
import AgentSignalementsAssignes from "./AgentSignalementsAssignes";
import AgentInterventions from "./AgentInterventions";
import AgentProfil from "./AgentProfil";

// Pages Admin
import AdminDashboard from "./AdminDashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));
  const [isLoading, setIsLoading] = useState(true);

  // Écouter les changements dans localStorage (pour la déconnexion)
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
      setUserRole(localStorage.getItem("userRole"));
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Vérifier périodiquement (pour les changements dans la même fenêtre)
    const interval = setInterval(() => {
      const newToken = localStorage.getItem("token");
      const newRole = localStorage.getItem("userRole");
      if (newToken !== token) {
        setToken(newToken);
        setUserRole(newRole);
      }
    }, 100);

    setIsLoading(false);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  // Composant wrapper qui affiche la Navbar si l'utilisateur est connecté
  const ProtectedLayout = ({ children }) => {
    // Vérification en temps réel
    const currentToken = localStorage.getItem("token");
    
    if (!currentToken) {
      return <Navigate to="/auth" replace />;
    }
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  };

  // Redirection basée sur le rôle
  const getDefaultRoute = () => {
    const currentToken = localStorage.getItem("token");
    const currentRole = localStorage.getItem("userRole");
    
    if (!currentToken) return "/auth";
    if (currentRole === "ADMIN") return "/admin/dashboard";
    if (currentRole === "AGENT") return "/agent/signalements-assignes"; // ✅ Changé de /agent/dashboard vers une route qui existe
    return "/signalements";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Routes publiques (sans navbar) */}
        <Route path="/auth" element={<Auth />} />
        
        {/* ========== ROUTES CITOYEN ========== */}
        <Route 
          path="/signalements" 
          element={
            <ProtectedLayout>
              <Signalements />
            </ProtectedLayout>
          } 
        />
        
        <Route 
          path="/signaler" 
          element={
            <ProtectedLayout>
              <Signaler />
            </ProtectedLayout>
          } 
        />
        
        <Route 
          path="/mes-signalements" 
          element={
            <ProtectedLayout>
              <MesSignalements />
            </ProtectedLayout>
          } 
        />
        
        <Route 
          path="/carte" 
          element={
            <ProtectedLayout>
              <Carte />
            </ProtectedLayout>
          } 
        />
        
        <Route 
          path="/profil" 
          element={
            <ProtectedLayout>
              <Profil />
            </ProtectedLayout>
          } 
        />
        
        {/* ========== ROUTES AGENT ========== */}
        <Route 
          path="/agent/dashboard" 
          element={
            <ProtectedLayout>
              <AgentDashboard />
            </ProtectedLayout>
          } 
        />
        
        <Route 
          path="/agent/signalements-assignes" 
          element={
            <ProtectedLayout>
              <AgentSignalementsAssignes />
            </ProtectedLayout>
          } 
        />
        
        <Route 
          path="/agent/interventions" 
          element={
            <ProtectedLayout>
              <AgentInterventions />
            </ProtectedLayout>
          } 
        />
        
        <Route 
          path="/agent/profil" 
          element={
            <ProtectedLayout>
              <AgentProfil />
            </ProtectedLayout>
          } 
        />
        
        <Route 
          path="/agent/signalements-resolus" 
          element={
            <ProtectedLayout>
              <AgentSignalementsAssignes />
            </ProtectedLayout>
          } 
        />
        
        {/* ========== ROUTES ADMIN ========== */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedLayout>
              <AdminDashboard />
            </ProtectedLayout>
          } 
        />
        
        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        
        {/* Route 404 - Page non trouvée */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;