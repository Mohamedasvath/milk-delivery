import { useEffect, useState } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../api/customerApi";
import { Trash2, Edit2, Plus, User, Search, Save, X, Users, CheckCircle2, AlertCircle, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", status: "active" });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { 
    loadCustomers(); 
  }, []);

  useEffect(() => {
    let result = customers;
    
    if (searchQuery.trim() !== "") {
      result = result.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter);
    }
    
    setFilteredCustomers(result);
  }, [searchQuery, statusFilter, customers]);

  const loadCustomers = async () => {
    const ownerId = localStorage.getItem("ownerId");
    if (!ownerId || ownerId === "undefined") {
      toast.error("Session expired. Please login again.");
      return;
    }
    try {
      setIsLoading(true);
      const data = await getCustomers(ownerId);
      const dataArray = Array.isArray(data) ? data : [];
      setCustomers(dataArray);
      setFilteredCustomers(dataArray);
    } catch (err) { 
      toast.error("Could not load customers list"); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Please enter a name");

    const ownerId = localStorage.getItem("ownerId");
    if (!ownerId || ownerId === "undefined") {
      return toast.error("Please login again to continue.");
    }

    try {
      const payload = { 
        name: formData.name.trim(), 
        status: formData.status || "active", 
        ownerId 
      };

      if (editingId) {
        await updateCustomer(editingId, payload);
        toast.success("Customer profile updated!");
      } else {
        await createCustomer(payload);
        toast.success("New customer added successfully!");
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", status: "active" });
      await loadCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        const ownerId = localStorage.getItem("ownerId");
        await deleteCustomer(id, ownerId);
        toast.success("Customer deleted");
        await loadCustomers();
      } catch (err) {
        toast.error("Failed to delete customer");
      }
    }
  };

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === "active").length,
    inactive: customers.filter(c => c.status === "inactive").length,
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 text-slate-900 font-sans min-h-screen bg-slate-50/50">
      
      {/* SIMPLE HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your daily client listings and status flags.</p>
        </div>
        
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: "", status: "active" }); setIsModalOpen(true); }} 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors">
          <Plus size={18} /> Add New Customer
        </button>
      </div>

      {/* QUICK ANALYTICS CARD COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Customers", val: stats.total, text: "text-blue-600", bg: "bg-blue-50/60 border-blue-100", icon: <Users size={18} /> },
          { label: "Active Deliveries", val: stats.active, text: "text-emerald-600", bg: "bg-emerald-50/60 border-emerald-100", icon: <CheckCircle2 size={18} /> },
          { label: "On Hold", val: stats.inactive, text: "text-amber-600", bg: "bg-amber-50/60 border-amber-100", icon: <AlertCircle size={18} /> },
        ].map((item, idx) => (
          <div key={idx} className={`p-4 border rounded-xl ${item.bg} flex items-center justify-between shadow-sm`}>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
              <h3 className={`text-2xl font-bold ${item.text}`}>{item.val}</h3>
            </div>
            <div className={`p-2.5 rounded-lg bg-white ${item.text} border border-neutral-100`}>{item.icon}</div>
          </div>
        ))}
      </div>

      {/* FILTERS & LIVE SEARCH ROW */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1">
          <Search className="text-slate-400 shrink-0" size={16} />
          <input 
            type="text" 
            placeholder="Search customer by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"
          />
          {searchQuery && <X size={16} className="text-slate-400 cursor-pointer" onClick={() => setSearchQuery("")} />}
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-w-[150px]">
          <Filter size={14} className="text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">On Hold</option>
          </select>
        </div>
      </div>

      {/* CORE DATA DISPLAY TABLE / CARDS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* DESKTOP MATRIX TABLE VIEWPORTS */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="p-4 text-xs font-bold uppercase tracking-wider pl-6">Customer Name</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider">Delivery Status</th>
                <th className="p-4 text-right text-xs font-bold uppercase tracking-wider pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="3" className="p-10 text-center text-sm text-slate-400 font-medium">Loading records, please wait...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="3" className="p-10 text-center text-sm text-slate-400 font-medium">No customers found.</td></tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                        <User size={15} />
                      </div>
                      <span className="font-semibold text-slate-800">{c.name}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {c.status === 'active' ? 'Active' : 'On Hold'}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingId(c._id); setFormData({ name: c.name, status: c.status }); setIsModalOpen(true); }} className="p-1.5 text-slate-500 bg-slate-50 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200/60"><Edit2 size={13}/></button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 text-slate-400 bg-slate-50 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-200/60"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE LAYOUT CARDS */}
        <div className="block md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400 font-medium">Loading records, please wait...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 font-medium">No customers found.</div>
          ) : (
            <div className="p-3 space-y-2.5">
              {filteredCustomers.map((c) => (
                <div key={c._id} className="p-3.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <User size={15} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-slate-800 text-sm">{c.name}</h4>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-px rounded-md ${c.status === 'active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                        {c.status === 'active' ? 'Active' : 'On Hold'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 pl-2">
                    <button onClick={() => { setEditingId(c._id); setFormData({ name: c.name, status: c.status }); setIsModalOpen(true); }} className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-md"><Edit2 size={13}/></button>
                    <button onClick={() => handleDelete(c._id)} className="p-2 text-red-600 bg-red-50 rounded-md"><Trash2 size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CLEAN BACKDROP MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1, transition: { duration: 0.2 } }} 
              exit={{ scale: 0.98, opacity: 0 }} 
              className="bg-white border border-slate-200 rounded-xl p-5 max-w-sm w-full z-10 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">{editingId ? "Edit Customer Details" : "Add New Customer"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X size={16}/></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Customer Name</label>
                  <input 
                    required 
                    type="text"
                    placeholder="Enter full name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full p-2.5 text-sm font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Delivery Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full p-2.5 text-sm font-semibold rounded-lg bg-slate-50 border border-slate-200 text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="active">Active (Deliver Daily)</option>
                    <option value="inactive">On Hold (Stop Delivery)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/10"
                  >
                    <Save size={14} /> Save Customer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}