import { useState } from "react";
import { createOwner } from "../../api/authApi";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, User, Milk, ArrowRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pin: "",
  });

  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await createOwner(form);
      toast.success("Account created successfully! 🥛");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-white font-sans antialiased overflow-hidden relative">
      <Toaster position="top-right" />
      <div className="w-full flex flex-col md:flex-row min-h-screen">
        
        {/* ================= LEFT PANEL: Image & Branding ================= */}
        <div className="w-full md:w-1/2 bg-blue-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative min-h-[40vh] md:min-h-screen z-20">
          <div 
            className="absolute inset-1 bg-cover bg-center" 
            style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1683121595979-870ded53a3c8?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }} 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/80 to-[#1E40AF]/80" />

          <div className="absolute top-0 bottom-0 right-[-1px] w-[120px] hidden md:block pointer-events-none fill-white">
            <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <path d="M100,0 C40,20 60,50 30,70 C10,85 40,100 100,100 Z" fill="#F8FAFC" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Milk className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter leading-none">MilkMan</h2>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-[0.2em] mt-1">ERP Enterprise</p>
            </div>
          </div>

          <div className="relative z-10 my-auto max-w-lg pt-12 md:pt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Fresh Farm Milk, <br />
                <span className="text-cyan-300">Managed Smartly.</span>
              </h3>
              <p className="text-sm text-blue-100/80 font-medium max-w-sm leading-relaxed">
                Streamline your daily milk collection, automated billing, and distribution records in one secure portal.
              </p>
            </motion.div>
          </div>

          <div className="relative z-10 text-[10px] text-blue-200/50 font-bold tracking-widest uppercase hidden md:block">
            Powered by Mohamed Asvath • Secured Terminal Node
          </div>
        </div>

        {/* ================= RIGHT PANEL: Interactive Signup Form ================= */}
        <div className="w-full md:w-1/2 bg-[#F8FAFC] p-6 sm:p-12 lg:p-16 xl:p-24 flex flex-col justify-center relative z-10 min-h-[60vh] md:min-h-screen">
          <motion.form
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            onSubmit={handleSubmit}
            className="space-y-6 w-full max-w-md mx-auto"
          >
            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Create Account</h1>
              <p className="text-sm text-slate-400 font-medium">Start managing your milk business</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Owner Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2563EB] transition-colors"><User size={18} /></div>
                  <input type="text" name="name" required placeholder="Enter owner name" value={form.name} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2563EB] transition-colors"><Phone size={18} /></div>
                  <input type="text" name="phone" required maxLength={10} placeholder="Enter 10-digit mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Create PIN</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2563EB] transition-colors"><Lock size={18} /></div>
                  <input type={showPin ? "text" : "password"} name="pin" required placeholder="••••" value={form.pin} onChange={handleChange} className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold tracking-widest text-slate-800 placeholder-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm" />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-slate-600 transition-colors outline-none">
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs tracking-widest uppercase shadow-[0_10px_25px_rgba(16,185,129,0.15)] transition-all flex items-center justify-center gap-2 group active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none outline-none">
              {loading ? "Creating Account..." : "Create Account"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            <p className="text-center text-xs text-slate-500 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-[#2563EB] font-bold hover:underline">Login</Link>
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}