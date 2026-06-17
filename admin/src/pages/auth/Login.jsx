import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginOwner } from "../../api/authApi";
import { motion } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, ArrowRight, Milk } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ phone: "", pin: "" });
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginOwner(form);
      const { token, owner } = res.data;
      if (token && owner) {
        localStorage.setItem("token", token);
        localStorage.setItem("ownerId", owner.ownerId || owner._id || owner.id);
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-white font-sans antialiased overflow-hidden relative">
      <Toaster position="top-right" />
      <div className="w-full flex flex-col md:flex-row min-h-screen">
        
        {/* LEFT PANEL: Branding & Imagery */}
        <div className="w-full md:w-1/2 bg-blue-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative min-h-[40vh] md:min-h-screen z-20">
          <div 
            className="absolute inset-1 bg-cover bg-center" 
            style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1683121595979-870ded53a3c8?q=80&w=1025&auto=format&fit=crop')" }} 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/80 to-[#1E40AF]/80" />

          {/* SVG Curve - Matches Signup Page */}
          <div className="absolute top-0 bottom-0 right-[-1px] w-[120px] hidden md:block pointer-events-none fill-white">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
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

          <div className="relative z-10 my-auto max-w-lg pt-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
                Freash MilK, <br />
                <span className="text-cyan-300">Freash Value</span>
              </h3>
            </motion.div>
          </div>
        </div>

        {/* RIGHT PANEL: Login Form */}
        <div className="w-full md:w-1/2 bg-[#F8FAFC] p-6 sm:p-12 lg:p-16 xl:p-24 flex flex-col justify-center relative z-10">
          <motion.form
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLogin}
            className="space-y-6 w-full max-w-md mx-auto"
          >
            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Admin Login</h1>
              <p className="text-sm text-slate-400 font-medium">Verify your identity to continue</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Phone size={18} /></div>
                  <input type="text" name="phone" required maxLength={10} placeholder="Enter phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g, '')})} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Security PIN</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                  <input type={showPin ? "text" : "password"} name="pin" required placeholder="••••" value={form.pin} onChange={handleChange} className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold tracking-widest text-slate-800 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm" />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-slate-600 outline-none">
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black text-xs tracking-widest uppercase shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.99]">
              {loading ? "Verifying..." : "Access Dashboard"}
              <ArrowRight size={16} />
            </button>

            <p className="text-center text-xs text-slate-500 font-medium">
              Don't have an account? <Link to="/signup" className="text-[#2563EB] font-bold hover:underline">Register now</Link>
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}