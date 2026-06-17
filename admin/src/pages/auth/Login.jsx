import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginOwner } from "../../api/authApi";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, ArrowRight, Milk, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ownerData, setOwnerData] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await loginOwner({ phone, pin });
      const { token, owner } = res.data;

      if (token && owner) {
        setOwnerData({ ...owner, token });
        toast.success("Identity verified successfully!");
      } else {
        toast.error("Invalid response from server");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (ownerData?.token) {
      localStorage.setItem("token", ownerData.token);
      const finalId = ownerData.ownerId || ownerData._id || ownerData.id;
      if (finalId) {
        localStorage.setItem("ownerId", finalId);
        window.location.href = "/dashboard";
      } else {
        toast.error("Error: Owner ID missing.");
      }
    } else {
      toast.error("Session expired.");
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-white font-sans antialiased overflow-hidden relative">
      <Toaster position="top-right" />

      <div className="w-full flex flex-col md:flex-row min-h-screen">
        {/* LEFT PANEL */}
        <div className="w-full md:w-1/2 bg-blue-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative min-h-[40vh] md:min-h-screen z-20">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://s7g10.scene7.com/is/image/tetrapak/splash-milk?wid=600&hei=338&fmt=jpg&resMode=sharp2&qlt=85,0&op_usm=1.75,0.3,2,0')" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/80 to-[#1E40AF]/80" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Milk className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter leading-none">MilkMan</h2>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-[0.2em] mt-1">ERP Enterprise</p>
            </div>
          </div>
          <div className="relative z-10 my-auto max-w-lg">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
              Fresh Farm Milk, <br />
              <span className="text-cyan-300">Managed Smartly.</span>
            </h3>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-1/2 bg-[#F8FAFC] p-6 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            {!ownerData ? (
              <motion.form key="login-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleLogin} className="space-y-6 w-full max-w-md mx-auto">
                <div className="space-y-2">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Login</h1>
                  <p className="text-sm text-slate-400 font-medium">Enter your credentials to access the system.</p>
                </div>
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400"><Phone size={18} /></div>
                    <input type="text" required maxLength={10} placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none transition-all shadow-sm" />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400"><Lock size={18} /></div>
                    <input type={showPin ? "text" : "password"} required placeholder="Security PIN" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none transition-all shadow-sm" />
                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-4 flex items-center text-slate-400">
                      {showPin ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-black text-xs uppercase shadow-lg transition-all hover:opacity-90">
                  {loading ? <RefreshCw className="animate-spin mx-auto" /> : "Verify Identity"}
                </button>
                <div className="text-center mt-6">
                  <p className="text-xs font-medium text-slate-500">
                    Don't have an account? <button type="button" onClick={() => navigate("/signup")} className="text-blue-600 font-black hover:underline">Create one now</button>
                  </p>
                </div>
              </motion.form>
            ) : (
              <motion.div key="confirm-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md mx-auto text-center space-y-8">
                <h2 className="text-3xl font-black text-slate-900">Session Validated</h2>
                <div className="p-8 rounded-3xl bg-white border border-slate-100 flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-3xl">
                    {ownerData.name?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-xl font-black text-slate-800">{ownerData.name}</h4>
                  <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">Authorized Access</div>
                </div>
                <button onClick={handleContinue} className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2">
                  Enter Dashboard <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}