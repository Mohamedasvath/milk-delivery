import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useApp } from "../context/AppContext";

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  // FIX: Destructure 'settings' correctly from context
  const { settings } = useApp();
  const { language, theme } = settings;

  return (
    <div
      className={`h-screen w-full flex overflow-hidden transition-all duration-300 ${
        theme === "dark"
          ? "bg-slate-900 text-white"
          : "bg-[#f8fafc] text-slate-900"
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        lang={language}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Navbar
          lang={language}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
            theme === "dark"
              ? "bg-slate-900 text-white"
              : "bg-[#f8fafc] text-slate-900"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}