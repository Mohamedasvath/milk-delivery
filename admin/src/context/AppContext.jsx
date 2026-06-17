import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const ownerId = localStorage.getItem("ownerId") || "guest";
    const saved = localStorage.getItem(`settings_${ownerId}`);
    return saved ? JSON.parse(saved) : { dairyName: "", ownerName: "", phone: "", language: "en", theme: "light" };
  });

 useEffect(() => {
  document.body.className =
    settings.theme === "dark"
      ? "bg-slate-900 text-white"
      : "bg-slate-50 text-slate-900"; 
}, [settings.theme]);

  const updateSettings = (newSettings) => {
    const ownerId = localStorage.getItem("ownerId") || "guest";
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(`settings_${ownerId}`, JSON.stringify(updated));
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);