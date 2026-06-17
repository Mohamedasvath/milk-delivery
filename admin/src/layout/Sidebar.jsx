import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Milk,
  FileText,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({
  lang = "en",
  isMobileOpen,
  setIsMobileOpen,
}) {
  const [showLogout, setShowLogout] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const menus = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      id: "customers",
      name: "Customers",
      icon: Users,
      path: "/customers",
    },
    {
      id: "milk-entry",
      name: "Milk Entry",
      icon: Milk,
      path: "/milk-entry",
    },
    {
      id: "reports",
      name: "Reports",
      icon: FileText,
      path: "/reports",
    },
    {
      id: "settings",
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between py-6 pl-4 pr-0 bg-[#1a44b8]">
      <div>
        <div className="flex items-center justify-between pl-4 pr-5 py-4 mb-10">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
              <img src="https://png.pngtree.com/png-clipart/20230102/original/pngtree-dairy-food-logo-milk-yoghurt-and-lecho-farm-badges-design-with-png-image_8856117.png" className="text-[#1a44b8] w-9 h-9" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white">
                MilkMan
              </h1>
              <p className="text-[10px] text-blue-200 uppercase">
                Milk Shop
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 rounded-xl bg-white/10 text-white"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-2">
          {menus.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-l-2xl font-black uppercase text-[11px] tracking-[0.1em] transition-all ${
                location.pathname === item.path
                  ? "bg-[#f8fafc] text-[#1a44b8]"
                  : "text-blue-100 hover:bg-white/5"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}

          <button
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-4 px-6 py-4 text-red-200 hover:bg-red-500/20 rounded-l-2xl font-black uppercase text-[11px]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </div>

      <div className="pt-4 px-4 border-t border-white/10 mr-4 flex items-center justify-between text-emerald-400">
        <span className="text-[9px] uppercase">
          Build By
        </span>

        <span className="text-[10px] font-black uppercase flex items-center gap-2 text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
         Mohamed Asvath
        </span>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {showLogout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowLogout(false)}
            />

            <motion.div className="bg-white p-8 rounded-3xl z-10">
              <h2 className="text-xl font-bold mb-6">
                Logout?
              </h2>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="px-5 py-3 border rounded-xl"
                >
                  Cancel
                </button>

                <button
                  onClick={handleLogout}
                  className="px-5 py-3 bg-[#1a44b8] text-white rounded-xl"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <aside className="hidden md:block w-[280px] h-screen sticky top-0 bg-[#1a44b8] z-30">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-[#1a44b8] md:hidden"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}