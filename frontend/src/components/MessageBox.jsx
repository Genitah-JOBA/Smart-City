import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { useI18n } from "../context/AppContext";

/**
 * MessageBox réutilisable — affiche un retour utilisateur (succès / erreur / info)
 * au lieu de laisser l'échec dans la console.
 *
 * Usage :
 *   const [msg, setMsg] = useState(null); // { type: "error"|"success"|"info", text: "..." }
 *   ...catch { setMsg({ type: "error", text: t("...") }); }
 *   <MessageBox message={msg} onClose={() => setMsg(null)} />
 */
export default function MessageBox({ message, onClose }) {
  const { t } = useI18n();
  if (!message) return null;

  const type = message.type || "info";
  const isSuccess = type === "success";
  const isError = type === "error";

  const Icon = isSuccess ? CheckCircle : isError ? AlertTriangle : Info;
  const accent = isSuccess
    ? "bg-emerald-500/20 text-emerald-400"
    : isError
    ? "bg-red-500/20 text-red-400"
    : "bg-blue-500/20 text-blue-400";
  const titleColor = isSuccess ? "text-emerald-400" : isError ? "text-red-400" : "text-blue-400";
  const title = isSuccess ? t("sig.success") : isError ? t("common.error") : t("sig.info");

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full border border-white/10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${accent}`}>
          <Icon className="w-7 h-7" />
        </div>
        <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>{title}</h3>
        <p className="text-white/60 text-sm mb-6 whitespace-pre-line">{message.text}</p>
        <button
          onClick={onClose}
          className={`w-full py-2 rounded-xl font-semibold text-white transition ${
            isSuccess ? "bg-emerald-500/80 hover:bg-emerald-500" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {t("sig.close")}
        </button>
      </div>
    </div>
  );
}
