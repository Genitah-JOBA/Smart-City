import { useI18n } from "./context/AppContext";

export default function Carte() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-6">{t("map.title")}</h1>
        <div className="bg-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/70">{t("map.comingSoon")}</p>
          <p className="text-white/50 text-sm mt-2">{t("map.subtitle")}</p>
        </div>
      </div>
    </div>
  );
}