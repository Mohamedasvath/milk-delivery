import { useState } from "react";
import { resetPin } from "../../api/authApi";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, ArrowLeft, RefreshCw, Milk } from "lucide-react";

export default function ForgotPin() {
  const [phone, setPhone] = useState("");
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await resetPin({ phone, newPin });
      alert("PIN updated successfully! 🥛");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-white font-sans antialiased overflow-hidden relative">
      <div className="w-full flex flex-col md:flex-row min-h-screen">
        
        {/* ================= LEFT PANEL: Image & Branding ================= */}
        <div className="w-full md:w-1/2 bg-blue-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative min-h-[40vh] md:min-h-screen z-20">
          <div className="absolute inset-1 bg-cover bg-center" style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1683121595979-870ded53a3c8?q=80&w=1025&auto=format&fit=crop')" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/80 to-[#1E40AF]/80" />

          {/* Organic Curve */}
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

          <div className="relative z-10 my-auto max-w-lg">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Security <br /> <span className="text-cyan-300">Recovery</span>
              </h3>
              <p className="text-sm text-blue-100/80 font-medium max-w-sm leading-relaxed">
                Update your security PIN to regain access to your MilkMan ERP portal.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ================= RIGHT PANEL: Reset Form ================= */}
        <div className="w-full md:w-1/2 bg-[#F8FAFC] p-6 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          <motion.form
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            onSubmit={handleReset}
            className="space-y-8 w-full max-w-md mx-auto"
          >
            <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#2563EB] transition-colors text-xs font-black uppercase tracking-widest">
              <ArrowLeft size={16} /> Back to Login
            </Link>

            <div className="space-y-3">
              <h1 className="text-3xl font-black text-slate-900">Reset PIN</h1>
              <p className="text-sm text-slate-400 font-medium">Enter your phone and set a new secure PIN.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-[#2563EB] transition-colors"><Phone size={18} /></div>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="10-digit number"
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">New PIN</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-[#2563EB] transition-colors"><Lock size={18} /></div>
                  <input
                    type={showPin ? "text" : "password"}
                    required
                    placeholder="••••"
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold tracking-widest text-slate-800 placeholder-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
                  />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-slate-600 outline-none">
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase shadow-[0_10px_25px_rgba(16,185,129,0.15)] transition-all flex items-center justify-center gap-2 active:scale-[0.99] hover:shadow-xl outline-none"
            >
              {loading ? <RefreshCw className="animate-spin" /> : "Update Credentials"}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}