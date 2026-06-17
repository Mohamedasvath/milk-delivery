import { motion } from "framer-motion";

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Milk Loading Container */}
      <div className="relative flex flex-col items-center">
        <motion.img
          src="https://png.pngtree.com/png-clipart/20230102/original/pngtree-dairy-food-logo-milk-yoghurt-and-lecho-farm-badges-design-with-png-image_8856117.png"
          alt="Logo"
          className="w-32 h-32 mt-10 "
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Milk Loading Bar */}
        <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
        
        {/* Loading Text */}
        <motion.p 
          className="mt-3 text-xs font-bold text-slate-400 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading Milk...
        </motion.p>
      </div>

      <motion.h1
        className="mt-8 text-4xl font-black text-slate-800 tracking-tight"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
      
      </motion.h1>
    </motion.div>
  );
}