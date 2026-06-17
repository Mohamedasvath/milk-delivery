import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Bell, User, LogOut, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext"; // Make sure this path is correct

export default function Navbar({ isMobileOpen, setIsMobileOpen }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState({ name: "Loading...", initials: "..." });
  const { settings } = useApp();

  useEffect(() => {
    // 1. Try to get name from Context (settings)
    // 2. If not in context, try localStorage 'owner'
    const storedOwner = localStorage.getItem("owner");
    let name = settings?.ownerName;

    if (!name && storedOwner) {
      try {
        const ownerObj = JSON.parse(storedOwner);
        name = ownerObj.name || ownerObj.fullName || storedOwner;
      } catch (e) {
        name = storedOwner;
      }
    }

    const finalName = name || "Admin";

    const initials = finalName
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    setUserData({ name: finalName, initials });
  }, [settings?.ownerName]); // This makes it update instantly when settings change

  const handleLogout = () => {
  // 1. Show the splash screen with custom message
  if (window.showSplash) {
    window.showSplash("Signing Out...");
  }

  // 2. Wait 1.5 seconds for animation to play, then redirect
  setTimeout(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("ownerId");
    window.location.href = "/login";
  }, 1500);
};

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="h-16 px-4 flex items-center justify-between max-w-[1600px] mx-auto">
        
        {/* LEFT: Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsMobileOpen?.(!isMobileOpen)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-slate-100">
              <img 
                src="https://png.pngtree.com/png-clipart/20230102/original/pngtree-dairy-food-logo-milk-yoghurt-and-lecho-farm-badges-design-with-png-image_8856117.png" 
                alt="Logo" 
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-black text-blue-600 text-lg sm:text-xl tracking-tight">
              Milk_Man
            </span>
          </div>
        </div>

        {/* RIGHT: Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* <button className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-all">
            <Bell size={20} />
          </button> */}

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-all border border-transparent"
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {userData.initials}
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-14 z-50 w-56 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2"
                  >
                    <div className="px-3 py-2 border-b border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Account</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{userData.name}</p>
                    </div>
                    
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-xl transition-all">
                      <User size={16} /> My Profile
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-rose-600 hover:bg-rose-50 text-sm font-bold rounded-xl transition-all"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}