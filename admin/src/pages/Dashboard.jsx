import { useEffect, useState } from "react";
import { Milk, IndianRupee, Users, UserCheck, RefreshCcw, AlertCircle, BarChart3, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { getDashboardData } from "../api/reportAPi";
import StatCard from "../components/dashboard/StatCard";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError("");

     const response = await getDashboardData();

console.log("Dashboard Response:", response);

setData(
  response?.data?.data ||
  response?.data ||
  response
);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  if (loading) return <div className="flex h-[400px] items-center justify-center"><RefreshCcw className="animate-spin text-blue-600" size={32} /></div>;

  // Chart Data preparation (Assuming backend provides or we simulate trend)
  const chartData = [
  { name: 'Milk (L)', value: data?.today?.milk || 0 },
  { name: 'Revenue (₹)', value: (data?.today?.amount || 0) / 10 },
];

  return (
    <div className="w-full min-h-screen px-8 py-8 bg-slate-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-600 font-medium">Overview of your daily dairy operations.</p>
        </div>
        <button onClick={() => loadDashboard(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg">
          <RefreshCcw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Updating..." : "Refresh Stats"}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Primary Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
  title="Today Milk"
  value={`${Number(data?.today?.milk || 0).toFixed(1)} L`}
  icon={Milk}
/>

<StatCard
  title="Today Revenue"
  value={`₹${Number(data?.today?.amount || 0).toFixed(2)}`}
  icon={IndianRupee}
/>
        <StatCard title="Total Customers" value={data?.totalCustomers || 0} icon={Users} />
        <StatCard title="Active Customers" value={data?.activeCustomers || 0} icon={UserCheck} />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold">
            <BarChart3 className="text-blue-600" /> Daily Production Overview
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-blue-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between">
          <div>
            <TrendingUp size={40} className="mb-4 text-blue-300" />
            <h3 className="text-xl font-bold">Efficiency Insight</h3>
            <p className="text-blue-200 mt-2 text-sm">
              Keep monitoring your daily entries to maintain consistent supply chain performance.
            </p>
          </div>
          <div className="mt-6 p-4 bg-blue-800/50 rounded-2xl text-center">
            <span className="text-3xl font-black">{data?.activeCustomers}</span>
            <p className="text-blue-300 text-xs uppercase font-bold">Active Farmers Today</p>
          </div>
        </div>
      </div>
    </div>
  );
}