import { useI18n } from "../context/AppContext";

/**
 * Écran de chargement plein page, réutilisable sur toute l'app.
 * S'adapte au thème clair/sombre (le fond bg-[#0f0f1a] est remappé en clair).
 */
export default function Loading() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <div className="relative flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute top-0 w-16 h-16 flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full animate-ping opacity-75"></div>
        </div>
        <p className="text-blue-400/70 mt-5 text-xs font-semibold tracking-[0.3em] uppercase animate-pulse">
          {t("common.loading")}
        </p>
      </div>
    </div>
  );
}
