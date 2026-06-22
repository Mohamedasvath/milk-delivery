import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, AlertCircle, Save, Calendar, Search, Loader2, User, X, Edit2, ChevronRight, Info, Users, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MilkEntries() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchName, setSearchName] = useState("");
  const [searchRate, setSearchRate] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingId, setIsSavingId] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState({ name: "Dairy Owner", email: "" });

  // Mobile UI Management States
  const [currentTab, setCurrentTab] = useState("list");
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Separate edit tracking state
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  useEffect(() => {
    const storedName = localStorage.getItem("ownerName") || "Milk Man";
    const storedEmail = localStorage.getItem("ownerEmail") || "";
    setOwnerInfo({ name: storedName, email: storedEmail });

    loadDailySheet();
  }, [date]);

  const loadDailySheet = async () => {
    const ownerId = localStorage.getItem("ownerId");
    if (!ownerId || ownerId === "undefined") {
      return toast.error("Authentication missing. Please login again.");
    }

    try {
      setIsLoading(true);
      let baseEndpoint = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;
      const targetUrl = `${baseEndpoint}/milk-entry/bulk-sheet`;

      const res = await axios.get(targetUrl, {
        params: { ownerId, date }
      });

      if (Array.isArray(res.data)) {
        setSheetData(res.data);
      } else {
        setSheetData([]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load list. Check connection.");
      setSheetData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (customerId, field, value) => {
    setSheetData(prev =>
      prev.map(item =>
        item.customerId === customerId
          ? { ...item, [field]: value }
          : item
      )
    );

    setSelectedFarmer(prev =>
      prev?.customerId === customerId
        ? { ...prev, [field]: value }
        : prev
    );
  };

  const saveSingleRow = async (row) => {
    const ownerId = localStorage.getItem("ownerId");
    if (!ownerId) return toast.error("Session expired.");

    setIsSavingId(row.customerId);

    const payload = {
      ownerId,
      customerId: row.customerId,
      date: date,
      morningMilk: Number(row.morningMilk) || 0,
      eveningMilk: Number(row.eveningMilk) || 0,
      rate: Number(row.rate) || 40
    };

    try {
      let baseRoute = API_BASE.endsWith("/api") ? `${API_BASE}/milk-entry` : `${API_BASE}/api/milk-entry`;

      if (row.entryId) {
        await axios.put(`${baseRoute}/${row.entryId}`, payload);
        toast.success(`Updated: ${row.name}`);
      } else {
        const res = await axios.post(baseRoute, payload);
        setSheetData(prev =>
          prev.map(item =>
            item.customerId === row.customerId
              ? { ...item, entryId: res.data._id, isSaved: true }
              : item
          )
        );
        toast.success(`Saved: ${row.name}`);
      }

      setSheetData(prev =>
        prev.map(item =>
          item.customerId === row.customerId ? { ...item, isSaved: true } : item
        )
      );

      setEditingCustomerId(null);
      setSelectedFarmer(null);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save data.");
    } finally {
      setIsSavingId(null);
    }
  };

  const toggleEditStatus = (customerId) => {
    setEditingCustomerId(customerId);
    setSheetData(prev =>
      prev.map(item =>
        item.customerId === customerId ? { ...item, isSaved: false } : item
      )
    );
  };

  const filteredSheet = sheetData.filter(item => {
    const nameQuery = searchName.toLowerCase().trim();
    const rateQuery = searchRate.toLowerCase().trim();

    const matchesName = nameQuery ? item.name?.toLowerCase().includes(nameQuery) : true;
    const matchesRate = rateQuery ? item.rate?.toString() === rateQuery : true;

    return matchesName && matchesRate;
  });

  // ── UPDATED METRICS: now also tracks morning & evening totals separately ──
  const metrics = filteredSheet.reduce((acc, curr) => {
    const morning = Number(curr.morningMilk) || 0;
    const evening = Number(curr.eveningMilk) || 0;
    const rate = Number(curr.rate) || 0;
    const totalMilk = morning + evening;

    acc.totalMilk += totalMilk;
    acc.totalAmount += totalMilk * rate;
    acc.totalMorning += morning;
    acc.totalEvening += evening;
    if (curr.isSaved) acc.savedCount += 1;

    return acc;
  }, { totalMilk: 0, totalAmount: 0, totalMorning: 0, totalEvening: 0, savedCount: 0 });

  const remainingCount = filteredSheet.length - metrics.savedCount;
  const displayTodayRate = filteredSheet.length > 0 ? (Number(filteredSheet[0]?.rate) || 40) : 40;

  return (
    <div className="p-3 md:p-10 max-w-7xl mx-auto space-y-4 md:space-y-6 text-slate-900 font-sans antialiased bg-[#fafafa] min-h-screen pb-24 md:pb-10">

      {/* CLEAN TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1.5 w-full sm:w-auto">
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-600 shrink-0"></span>
            Milk Entries Ledger
          </h1>
          <p className="text-slate-500 text-xs md:text-base">
            Manage daily production logs and customer rates seamlessly.
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs">
            <span>🥛</span>
            <span>Today Milk Rate: ₹{displayTodayRate} / L</span>
          </div>
        </div>

        {/* OWNER INFOCARD */}
        <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-xs self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
              {ownerInfo.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Operator</p>
              <p className="text-xs font-bold text-slate-800 tracking-tight">{ownerInfo.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL REMAINING DATA NOTIFICATION BANNER */}
      {!isLoading && remainingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h5 className="text-sm font-bold text-amber-900">Unsaved Entries Remaining!</h5>
              <p className="text-xs text-amber-700 font-medium mt-0.5">
                <span className="font-bold underline text-amber-950">{remainingCount} farmer{remainingCount > 1 ? "s" : ""}</span> still have unsaved entries for today. Please review and save.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL CALENDAR BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xs">
        <div className="text-xs font-semibold text-slate-500 text-center sm:text-left">
          Viewing ledger log entries for:
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-md focus-within:ring-2 focus-within:ring-blue-600/10 focus-within:border-blue-600 transition-all w-full sm:w-auto justify-center">
          <Calendar size={14} className="text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-xs font-bold outline-none text-slate-800 cursor-pointer"
          />
        </div>
      </div>

      {/* MOBILE INTERFACE TAB CONTROLLER */}
      <div className="flex md:hidden bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setCurrentTab("list")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            currentTab === "list" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} />
          Farmers List ({filteredSheet.length})
        </button>
        <button
          onClick={() => setCurrentTab("metrics")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            currentTab === "metrics" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 size={16} />
          Analytics Dashboard
        </button>
      </div>

      {/* ── METRIC PERFORMANCE SECTION (7 cards: 4 original + 3 new) ── */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${currentTab === "metrics" ? "grid" : "hidden md:grid"}`}>

        {/* ── Original 4 cards ── */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Milk Logs</p>
          <h3 className="text-base sm:text-2xl font-bold text-slate-800 mt-1">{filteredSheet.length} Farmers</h3>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status Sync</p>
          <h3 className="text-base sm:text-2xl font-bold text-slate-800 mt-1">{metrics.savedCount} / {filteredSheet.length} Saved</h3>
        </div>
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Today's Milk</p>
          <h3 className="text-base sm:text-2xl font-extrabold text-blue-700 mt-1">{metrics.totalMilk.toFixed(1)} <span className="text-xs font-medium">L</span></h3>
        </div>
        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Total Revenue</p>
          <h3 className="text-base sm:text-2xl font-extrabold text-emerald-700 mt-1">₹{metrics.totalAmount.toLocaleString("en-IN")}</h3>
        </div>

        {/* ── 3 NEW cards: Morning, Evening, Today's Calculated Amount ── */}
        <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
          <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">☀️ Morning Total</p>
          <h3 className="text-base sm:text-2xl font-extrabold text-orange-600 mt-1">{metrics.totalMorning.toFixed(1)} <span className="text-xs font-medium">L</span></h3>
        </div>
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
          <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">🌙 Evening Total</p>
          <h3 className="text-base sm:text-2xl font-extrabold text-indigo-600 mt-1">{metrics.totalEvening.toFixed(1)} <span className="text-xs font-medium">L</span></h3>
        </div>
        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl col-span-2 md:col-span-2">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">💰 Today's Calculated Amount</p>
          <h3 className="text-base sm:text-2xl font-extrabold text-amber-700 mt-1">₹{metrics.totalAmount.toLocaleString("en-IN")}</h3>
          <p className="text-[10px] text-amber-500 mt-1">{metrics.totalMorning.toFixed(1)}L (M) + {metrics.totalEvening.toFixed(1)}L (E) = {metrics.totalMilk.toFixed(1)}L total</p>
        </div>

      </div>

      {/* FILTER SYSTEM PANEL */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${currentTab === "list" ? "grid" : "hidden md:grid"}`}>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-600/10 focus-within:border-blue-600 transition-all shadow-xs">
          <Search className="text-slate-400 shrink-0" size={16} />
          <input
            type="text"
            placeholder="Search Farmer name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full text-xs outline-none bg-transparent text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-600/10 focus-within:border-blue-600 transition-all shadow-xs">
          <span className="text-slate-400 font-bold text-xs px-0.5">₹</span>
          <input
            type="number"
            placeholder="Search by rate value (e.g. 40)..."
            value={searchRate}
            onChange={(e) => setSearchRate(e.target.value)}
            className="w-full text-xs outline-none bg-transparent text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* CORE DATA LEDGER CONTAINER */}
      <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs ${currentTab === "list" ? "block" : "hidden md:block"}`}>

        {/* DESKTOP HEADER SPECIFICATION */}
        <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50 px-6 py-4 border-b border-slate-200 text-xs font-bold tracking-wider text-slate-500 uppercase">
          <div className="col-span-3">Farmer Details</div>
          <div className="col-span-2 text-center">Morning (L)</div>
          <div className="col-span-2 text-center">Evening (L)</div>
          <div className="col-span-2 text-center">Rate (₹)</div>
          <div className="col-span-1 text-center">Total (₹)</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="font-medium">Syncing dairy core database...</span>
          </div>
        ) : filteredSheet.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-2">
            <AlertCircle size={28} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No matching ledger entries found</p>
          </div>
        ) : (
          <div>
            {/* COMPACT & RESPONSIVE MOBILE ACCORDION CARD LIST */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredSheet.map((row) => {
                const rowTotalMilk = (Number(row.morningMilk) || 0) + (Number(row.eveningMilk) || 0);
                const rowTotalAmount = rowTotalMilk * (Number(row.rate) || 40);

                return (
                  <div
                    key={row.customerId}
                    className={`p-3.5 flex items-center justify-between active:bg-slate-50 transition-colors ${
                      row.isSaved ? "bg-emerald-50/10" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
                        row.isSaved ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {row.name ? row.name.charAt(0).toUpperCase() : <User size={14} />}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{row.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          M: {row.morningMilk || 0}L | E: {row.eveningMilk || 0}L
                        </p>
                        <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                          Total: ₹{rowTotalAmount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {row.isSaved ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Saved</span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Pending</span>
                      )}

                      <button
                        onClick={() => setSelectedFarmer(row)}
                        className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-500 border border-slate-200 transition-all cursor-pointer h-9 w-9 flex items-center justify-center"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FULL WEB EXPERIENCE TABLE GRID */}
            <div className="hidden md:block divide-y divide-slate-100">
              {filteredSheet.map((row) => {
                const rowTotalMilk = (Number(row.morningMilk) || 0) + (Number(row.eveningMilk) || 0);
                const rowTotalAmount = rowTotalMilk * (Number(row.rate) || 40);

                return (
                  <div key={row.customerId} className={`px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors ${row.isSaved ? "bg-emerald-50/5" : "bg-white"}`}>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center text-sm font-bold">
                        {row.name ? row.name.charAt(0).toUpperCase() : <User size={14} />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{row.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {row.customerId?.substring(18).toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number" step="any" placeholder="0.0" value={row.morningMilk || ""}
                        disabled={row.isSaved && editingCustomerId !== row.customerId}
                        onChange={(e) => handleInputChange(row.customerId, "morningMilk", e.target.value)}
                        className="w-full px-2 py-1.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-center outline-none focus:bg-white focus:border-blue-600 disabled:opacity-60"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number" step="any" placeholder="0.0" value={row.eveningMilk || ""}
                        disabled={row.isSaved && editingCustomerId !== row.customerId}
                        onChange={(e) => handleInputChange(row.customerId, "eveningMilk", e.target.value)}
                        className="w-full px-2 py-1.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-center outline-none focus:bg-white focus:border-blue-600 disabled:opacity-60"
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number" placeholder="40" value={row.rate || ""}
                          disabled={row.isSaved && editingCustomerId !== row.customerId}
                          onChange={(e) => handleInputChange(row.customerId, "rate", e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-center outline-none focus:bg-white focus:border-blue-600 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 text-center text-sm font-bold text-slate-700">
                      ₹{rowTotalAmount}
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                      {row.isSaved && editingCustomerId !== row.customerId ? (
                        <button
                          onClick={() => {
                            setEditingCustomerId(row.customerId);
                            toggleEditStatus(row.customerId);
                          }}
                          className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit2 size={12} />
                          Update
                        </button>
                      ) : (
                        <button
                          disabled={isSavingId === row.customerId} onClick={() => saveSingleRow(row)}
                          className="bg-slate-900 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {isSavingId === row.customerId ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM MODAL */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 transition-all">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 px-5 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  {selectedFarmer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{selectedFarmer.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedFarmer.isSaved && editingCustomerId !== selectedFarmer.customerId
                      ? "Entry saved — click Update Fields to edit"
                      : "Edit milk entry details below"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFarmer(null);
                  setEditingCustomerId(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {selectedFarmer.isSaved && editingCustomerId !== selectedFarmer.customerId ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={11} />
                    Saved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                    <Edit2 size={11} />
                    Editing
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Morning Liters</label>
                <input
                  type="number" step="any" placeholder="0.0"
                  disabled={selectedFarmer.isSaved && editingCustomerId !== selectedFarmer.customerId}
                  value={selectedFarmer.morningMilk || ""}
                  onChange={(e) => handleInputChange(selectedFarmer.customerId, "morningMilk", e.target.value)}
                  className="w-full h-12 px-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none text-center focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Evening Liters</label>
                <input
                  type="number" step="any" placeholder="0.0"
                  disabled={selectedFarmer.isSaved && editingCustomerId !== selectedFarmer.customerId}
                  value={selectedFarmer.eveningMilk || ""}
                  onChange={(e) => handleInputChange(selectedFarmer.customerId, "eveningMilk", e.target.value)}
                  className="w-full h-12 px-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none text-center focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Price Per Liter</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-bold text-slate-400 pointer-events-none">₹</span>
                  <input
                    type="number" placeholder="40"
                    disabled={selectedFarmer.isSaved && editingCustomerId !== selectedFarmer.customerId}
                    value={selectedFarmer.rate || ""}
                    onChange={(e) => handleInputChange(selectedFarmer.customerId, "rate", e.target.value)}
                    className="w-full h-12 pl-8 pr-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none text-center focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              {/* Estimated Amount Summary */}
              <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-3.5 rounded-xl text-xs">
                <span className="text-blue-600 font-semibold">Estimated Amount</span>
                <span className="font-extrabold text-blue-800 text-base">
                  ₹{((Number(selectedFarmer.morningMilk) || 0) + (Number(selectedFarmer.eveningMilk) || 0)) * (Number(selectedFarmer.rate) || 40)}
                </span>
              </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="px-5 py-4 border-t border-slate-100 bg-white shrink-0">
              {selectedFarmer.isSaved && editingCustomerId !== selectedFarmer.customerId ? (
                <button
                  onClick={() => {
                    setEditingCustomerId(selectedFarmer.customerId);
                    setSelectedFarmer(prev => ({ ...prev, isSaved: false }));
                    setSheetData(prev =>
                      prev.map(item =>
                        item.customerId === selectedFarmer.customerId
                          ? { ...item, isSaved: false }
                          : item
                      )
                    );
                  }}
                  className="w-full h-12 border-2 border-blue-600 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                >
                  <Edit2 size={15} />
                  Update Fields
                </button>
              ) : (
                <button
                  disabled={isSavingId === selectedFarmer.customerId}
                  onClick={() => saveSingleRow(selectedFarmer)}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm cursor-pointer"
                >
                  {isSavingId === selectedFarmer.customerId
                    ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                    : <><Save size={15} /> Save Ledger Entry</>
                  }
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}