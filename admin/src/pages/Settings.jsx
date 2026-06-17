import { useState } from "react";
import { Building, Globe, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getText } from "../utils/translations";

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState("business");
  const lang = settings.language;
  const isDark = settings.theme === 'dark';

  return (
    <div className={`p-8 min-h-screen transition-colors ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <h1 className={`text-3xl font-black mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {getText("settings", lang)}
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          {[
            { id: "business", label: getText("business", lang), icon: Building },
            { id: "prefs", label: getText("prefs", lang), icon: Globe },
            { id: "security", label: getText("security", lang), icon: Shield }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full p-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${
                activeTab === item.id ? "bg-blue-600 text-white shadow-lg" : isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-600"
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`flex-1 p-8 rounded-3xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
          {activeTab === "business" && (
            <section className="space-y-4">
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{getText("dairyDetails", lang)}</h2>
              <input placeholder={getText("dairyName", lang)} value={settings.dairyName} onChange={(e) => updateSettings({dairyName: e.target.value})} className={`w-full p-4 rounded-2xl border ${isDark ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-50'}`} />
              <input placeholder={getText("ownerName", lang)} value={settings.ownerName} onChange={(e) => updateSettings({ownerName: e.target.value})} className={`w-full p-4 rounded-2xl border ${isDark ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-50'}`} />
              <input placeholder={getText("phone", lang)} value={settings.phone} onChange={(e) => updateSettings({phone: e.target.value})} className={`w-full p-4 rounded-2xl border ${isDark ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-50'}`} />
            </section>
          )}

          {activeTab === "prefs" && (
            <section className="space-y-6">
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{getText("prefs", lang)}</h2>
              <div className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Dark Mode</span>
                <button onClick={() => updateSettings({theme: isDark ? 'light' : 'dark'})} className={`w-12 h-6 rounded-full transition-all ${isDark ? 'bg-blue-600' : 'bg-slate-300'}`} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase">{getText("language", lang)}</p>
                <div className="flex gap-4">
                  <button onClick={() => updateSettings({language: 'en'})} className={`p-4 rounded-2xl flex-1 font-bold ${settings.language === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>English</button>
                  <button onClick={() => updateSettings({language: 'ta'})} className={`p-4 rounded-2xl flex-1 font-bold ${settings.language === 'ta' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>தமிழ்</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === "security" && (
            <section className="space-y-6">
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{getText("security", lang)}</h2>
              <button onClick={() => navigate("/forgot-pin")} className="w-full p-4 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2">
                <Shield size={18} /> Reset PIN
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}