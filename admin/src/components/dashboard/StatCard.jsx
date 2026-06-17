import { motion } from "framer-motion";

export default function StatCard({ title, value, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.05)" }}
      className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm flex items-center justify-between"
    >
      <div className="flex flex-col justify-center">
        <p className="text-slate-500 text-[15px] font-medium mb-1.5">
          {title}
        </p>
        <h2 className="text-[32px] font-bold text-slate-800 leading-none">
          {value}
        </h2>
      </div>

      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Icon className="text-blue-600" size={26} strokeWidth={2} />
      </div>
    </motion.div>
  );
}