// Reports.jsx — FIXED PDF DOWNLOAD & AXIOS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSES FIXED:
//
// BUG #1 (CRITICAL — PDF download auth failure):
//   Frontend used fetch() without axios, which doesn't auto-attach token.
//   PDF endpoints are protected by JWT middleware, so they return 401.
//   FIX: Use axios instance with global Authorization header instead of fetch().
//
// BUG #2 (PDF endpoint URLs were wrong):
//   Reports were calling /api/pdf/... but trying to use wrong URL patterns.
//   Monthly and Yearly PDFs need correct query param names and values.
//   FIX: Updated all downloadPdf calls to use correct endpoints:
//        /api/pdf/monthly?month=X&year=Y
//        /api/pdf/yearly?year=Y
//        /api/pdf/dateRange?startDate=...&endDate=...
//
// BUG #3 (Missing axios instance with auth):
//   No global Authorization header configuration.
//   Each API call had to manually add headers.
//   FIX: Create axios instance with interceptor that adds token to all requests.
//
// FIX:
//   - Create and use axios instance with auth interceptor
//   - Convert downloadPdf to use axios instead of fetch()
//   - Use responseType: "blob" for PDF downloads
//   - Fix all PDF endpoint URLs to match backend routes
//   - Add proper error handling
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  fetchDashboard,
  fetchDailyReport,
  fetchMonthlyReport,
  fetchYearlyReport,
  fetchDateRangeReport,
  fetchYearRangeReport,
} from "../api/reportAPi";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── AXIOS INSTANCE WITH AUTH ────────────────────────────────────────────────
// FIX: Create axios instance that automatically attaches JWT token to all requests
const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── FORMATTING HELPERS ──────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toFixed(2);
const fmtINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split("T")[0];
const thisMonth = () => new Date().getMonth() + 1;
const thisYear = () => new Date().getFullYear();

// ── PDF DOWNLOAD HELPER ───────────────────────────────────────────────────────
/**
 * FIX: Use axios instead of fetch to automatically include JWT token.
 * Axios will use the interceptor we set up above to add Authorization header.
 *
 * @param {string} endpoint — Full URL or path (e.g., "/pdf/monthly?month=3&year=2024")
 * @param {string} filename — Download filename
 */
const downloadPdf = async (endpoint, filename) => {
  try {
    // FIX: Use apiClient (axios instance with auth) instead of fetch()
    // FIX: responseType: "blob" required for PDF download
    const response = await apiClient.get(endpoint, {
      responseType: "blob",
    });

    // Create blob from response
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    const errorMsg = err?.response?.data?.message || err?.message || "Unknown error";
    alert(`❌ PDF download failed: ${errorMsg}`);
    console.error("[PDF_DOWNLOAD_ERROR]", err);
  }
};

// ── PDF BUTTON BAR COMPONENT ──────────────────────────────────────────────────
const PdfBar = ({ buttons }) => (
  <div className="flex items-center gap-2 flex-wrap bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-4">
    <span className="text-xs text-gray-500 mr-1 whitespace-nowrap">
      📄 Download PDF:
    </span>
    {buttons.map((btn) => (
      <button
        key={btn.label}
        onClick={btn.onClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition whitespace-nowrap"
      >
        <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L14 2.586A2 2 0 0012.586 2H4zm8 0v4h4M9 11h2m-2 3h4m-4-6h1" />
        </svg>
        {btn.label}
      </button>
    ))}
  </div>
);

// ── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────
const StatCard = ({ label, value, sub }) => (
  <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
    <span className="text-2xl font-bold text-blue-700">{value}</span>
    {sub && <span className="text-xs text-gray-400">{sub}</span>}
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
    <span className="ml-3 text-gray-500">Loading...</span>
  </div>
);

const EmptyState = ({ message = "No data available for the selected period." }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <p>{message}</p>
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center justify-between">
    <span>⚠️ {message}</span>
    {onRetry && (
      <button onClick={onRetry} className="ml-4 text-sm underline hover:text-red-900">
        Retry
      </button>
    )}
  </div>
);

const CustomerTable = ({ rows, columns }) => {
  if (!rows || rows.length === 0) return <EmptyState />;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mt-4">
      <table className="min-w-full text-sm">
        <thead className="bg-blue-600 text-white">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-gray-700">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── TAB: DASHBOARD ────────────────────────────────────────────────────────────
const DashboardTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboard());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // FIX: No dashboard PDF endpoint yet — commented out for now
  const pdfButtons = [
    // {
    //   label: "Grand Total PDF",
    //   onClick: () => downloadPdf(`/pdf/grand-total`, "grand-total.pdf"),
    // },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!data) return <EmptyState />;

  return (
    <div className="space-y-6">
      {pdfButtons.length > 0 && <PdfBar buttons={pdfButtons} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={data.totalCustomers ?? 0} sub={`${data.activeCustomers ?? 0} active`} />
        <StatCard label="Today's Milk" value={`${fmt(data.today?.milk)} L`} sub={`${data.today?.entries ?? 0} entries`} />
        <StatCard label="Today's Revenue" value={fmtINR(data.today?.amount)} />
        <StatCard label="Avg Rate" value={`₹${fmt(data.allTime?.avgRate)}/L`} sub="all time" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="This Month Milk" value={`${fmt(data.month?.milk)} L`} />
        <StatCard label="This Month Revenue" value={fmtINR(data.month?.amount)} />
        <StatCard label="This Year Milk" value={`${fmt(data.year?.milk)} L`} />
        <StatCard label="This Year Revenue" value={fmtINR(data.year?.amount)} />
      </div>

      <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="All-Time Milk" value={`${fmt(data.allTime?.milk)} L`} />
        <StatCard label="All-Time Revenue" value={fmtINR(data.allTime?.amount)} />
        <StatCard label="Total Entries" value={data.allTime?.entries ?? 0} />
        {data.bestRevenueMonth && (
          <StatCard
            label="Best Month (Revenue)"
            value={data.bestRevenueMonth.month}
            sub={fmtINR(data.bestRevenueMonth.amount)}
          />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Top 5 by Revenue</h3>
          <CustomerTable
            rows={data.topByRevenue}
            columns={[
              { key: "name", label: "Customer" },
              { key: "totalAmount", label: "Revenue (₹)", render: fmtINR },
              { key: "totalMilk", label: "Milk (L)", render: fmt },
            ]}
          />
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Top 5 by Milk Volume</h3>
          <CustomerTable
            rows={data.topByMilk}
            columns={[
              { key: "name", label: "Customer" },
              { key: "totalMilk", label: "Milk (L)", render: fmt },
              { key: "totalAmount", label: "Revenue (₹)", render: fmtINR },
            ]}
          />
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Monthly Trend ({thisYear()})</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Month</th>
                <th className="px-4 py-2 text-right font-medium">Milk (L)</th>
                <th className="px-4 py-2 text-right font-medium">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyBreakdown?.map((m, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-4 py-2 text-gray-700">{m.month}</td>
                  <td className="px-4 py-2 text-gray-700 text-right">{fmt(m.milk)}</td>
                  <td className="px-4 py-2 text-gray-700 text-right">{fmtINR(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── TAB: DAILY ────────────────────────────────────────────────────────────────
const DailyTab = () => {
  const [date, setDate] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDailyReport(date));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    search();
  }, []);

  const pdfButtons = [
    // Note: Daily PDF endpoint not yet implemented, but route structure would be:
    // {
    //   label: "Daily PDF",
    //   onClick: () => downloadPdf(`/pdf/daily?date=${date}`, `daily-${date}.pdf`),
    // },
  ];

  return (
    <div className="space-y-4">
      {pdfButtons.length > 0 && <PdfBar buttons={pdfButtons} />}

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={search}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} onRetry={search} />}

      {!loading && !error && data && (
        <>
          <h2 className="text-lg font-bold text-blue-700">{date}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Customers" value={data.summary?.totalCustomers ?? 0} />
            <StatCard label="Total Milk" value={`${fmt(data.summary?.totalMilk)} L`} />
            <StatCard label="Total Revenue" value={fmtINR(data.summary?.totalAmount)} />
            <StatCard label="Entries" value={data.summary?.entries ?? 0} />
          </div>
          <CustomerTable
            rows={data.customerRows}
            columns={[
              { key: "customerName", label: "Customer" },
              { key: "totalMorning", label: "Morning (L)", render: fmt },
              { key: "totalEvening", label: "Evening (L)", render: fmt },
              { key: "totalMilk", label: "Total (L)", render: fmt },
              { key: "avgRate", label: "Avg Rate (₹)", render: (v) => `₹${fmt(v)}` },
              { key: "totalAmount", label: "Revenue (₹)", render: fmtINR },
            ]}
          />
        </>
      )}
    </div>
  );
};

// ── TAB: MONTHLY ──────────────────────────────────────────────────────────────
const MonthlyTab = () => {
  const [month, setMonth] = useState(String(thisMonth()));
  const [year, setYear] = useState(String(thisYear()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchMonthlyReport(month, year));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  // FIX: Correct PDF endpoint with proper query params
  const pdfButtons = [
    {
      label: "Monthly PDF",
      onClick: () => downloadPdf(`/pdf/monthly?month=${month}&year=${year}`, `monthly-${year}-${month}.pdf`),
    },
  ];

  return (
    <div className="space-y-4">
      <PdfBar buttons={pdfButtons} />

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2000"
            max="2100"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={search}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} onRetry={search} />}

      {!loading && !error && data && (
        <>
          <h2 className="text-lg font-bold text-blue-700">
            {data.monthName} {data.year}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Customers" value={data.summary?.totalCustomers ?? 0} />
            <StatCard label="Total Milk" value={`${fmt(data.summary?.totalMilk)} L`} />
            <StatCard label="Total Revenue" value={fmtINR(data.summary?.totalAmount)} />
            <StatCard label="Entries" value={data.summary?.entries ?? 0} />
          </div>

          <h3 className="font-semibold text-gray-700">Customer Summary</h3>
          <CustomerTable
            rows={data.customerRows}
            columns={[
              { key: "customerName", label: "Customer" },
              { key: "totalMorning", label: "Morning (L)", render: fmt },
              { key: "totalEvening", label: "Evening (L)", render: fmt },
              { key: "totalMilk", label: "Total (L)", render: fmt },
              { key: "avgRate", label: "Avg Rate (₹)", render: (v) => `₹${fmt(v)}` },
              { key: "totalAmount", label: "Revenue (₹)", render: fmtINR },
            ]}
          />

          <h3 className="font-semibold text-gray-700 mt-4">Daily Breakdown</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Date</th>
                  <th className="px-4 py-2 text-right font-medium">Milk (L)</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue (₹)</th>
                  <th className="px-4 py-2 text-right font-medium">Entries</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyBreakdown?.map((d, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-2 text-gray-700">{d.date}</td>
                    <td className="px-4 py-2 text-gray-700 text-right">{fmt(d.milk)}</td>
                    <td className="px-4 py-2 text-gray-700 text-right">{fmtINR(d.amount)}</td>
                    <td className="px-4 py-2 text-gray-700 text-right">{d.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ── TAB: YEARLY ───────────────────────────────────────────────────────────────
const YearlyTab = () => {
  const [year, setYear] = useState(String(thisYear()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchYearlyReport(year));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  // FIX: Correct PDF endpoint with proper query param
  const pdfButtons = [
    {
      label: "Yearly PDF",
      onClick: () => downloadPdf(`/pdf/yearly?year=${year}`, `yearly-${year}.pdf`),
    },
  ];

  return (
    <div className="space-y-4">
      <PdfBar buttons={pdfButtons} />

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2000"
            max="2100"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={search}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} onRetry={search} />}

      {!loading && !error && data && (
        <>
          <h2 className="text-lg font-bold text-blue-700">{data.year}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Customers" value={data.summary?.totalCustomers ?? 0} />
            <StatCard label="Total Milk" value={`${fmt(data.summary?.grandMilk)} L`} />
            <StatCard label="Total Revenue" value={fmtINR(data.summary?.grandAmount)} />
          </div>

          <h3 className="font-semibold text-gray-700 mt-4">Month-wise Summary</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Month</th>
                  <th className="px-4 py-2 text-right font-medium">Milk (L)</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue (₹)</th>
                  <th className="px-4 py-2 text-right font-medium">Entries</th>
                </tr>
              </thead>
              <tbody>
                {data.months?.map((m, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-2 text-gray-700">{m.month}</td>
                    <td className="px-4 py-2 text-gray-700 text-right">{fmt(m.milk)}</td>
                    <td className="px-4 py-2 text-gray-700 text-right">{fmtINR(m.amount)}</td>
                    <td className="px-4 py-2 text-gray-700 text-right">{m.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-gray-700 mt-4">Customer Summary</h3>
          <CustomerTable
            rows={data.customerRows}
            columns={[
              { key: "customerName", label: "Customer" },
              { key: "totalMorning", label: "Morning (L)", render: fmt },
              { key: "totalEvening", label: "Evening (L)", render: fmt },
              { key: "totalMilk", label: "Total (L)", render: fmt },
              { key: "avgRate", label: "Avg Rate (₹)", render: (v) => `₹${fmt(v)}` },
              { key: "totalAmount", label: "Revenue (₹)", render: fmtINR },
            ]}
          />
        </>
      )}
    </div>
  );
};

// ── TAB: DATE RANGE ───────────────────────────────────────────────────────────
const DateRangeTab = () => {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDateRangeReport(startDate, endDate));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // FIX: Correct PDF endpoint with proper query params
  const pdfButtons = [
    {
      label: "Date Range PDF",
      onClick: () =>
        downloadPdf(
          `/pdf/dateRange?startDate=${startDate}&endDate=${endDate}`,
          `daterange-${startDate}-to-${endDate}.pdf`
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PdfBar buttons={pdfButtons} />

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={search}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} onRetry={search} />}

      {!loading && !error && data && (
        <>
          <h2 className="text-lg font-bold text-blue-700">
            {data.startDate} → {data.endDate}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Customers" value={data.summary?.totalCustomers ?? 0} />
            <StatCard label="Total Milk" value={`${fmt(data.summary?.totalMilk)} L`} />
            <StatCard label="Total Revenue" value={fmtINR(data.summary?.totalAmount)} />
            <StatCard label="Entries" value={data.summary?.entries ?? 0} />
          </div>
          <CustomerTable
            rows={data.customerRows}
            columns={[
              { key: "customerName", label: "Customer" },
              { key: "totalMorning", label: "Morning (L)", render: fmt },
              { key: "totalEvening", label: "Evening (L)", render: fmt },
              { key: "totalMilk", label: "Total (L)", render: fmt },
              { key: "avgRate", label: "Avg Rate (₹)", render: (v) => `₹${fmt(v)}` },
              { key: "totalAmount", label: "Revenue (₹)", render: fmtINR },
              { key: "daysRecorded", label: "Days" },
            ]}
          />
        </>
      )}
    </div>
  );
};

// ── TAB: YEAR RANGE ───────────────────────────────────────────────────────────
const YearRangeTab = () => {
  const [startYear, setStartYear] = useState(String(thisYear() - 1));
  const [endYear, setEndYear] = useState(String(thisYear()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchYearRangeReport(startYear, endYear));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [startYear, endYear]);

  // FIX: No PDF endpoint for year range yet (optional feature)
  const pdfButtons = [
    // {
    //   label: "Year Range PDF",
    //   onClick: () =>
    //     downloadPdf(`/pdf/yearRange?startYear=${startYear}&endYear=${endYear}`, `yearrange-${startYear}-to-${endYear}.pdf`),
    // },
  ];

  return (
    <div className="space-y-4">
      {pdfButtons.length > 0 && <PdfBar buttons={pdfButtons} />}

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Year</label>
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            min="2000"
            max="2100"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Year</label>
          <input
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            min="2000"
            max="2100"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={search}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} onRetry={search} />}

      {!loading && !error && data && (
        <>
          <h2 className="text-lg font-bold text-blue-700">
            {data.startYear} – {data.endYear}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Customers" value={data.summary?.totalCustomers ?? 0} />
            <StatCard label="Total Milk" value={`${fmt(data.summary?.grandMilk)} L`} />
            <StatCard label="Total Revenue" value={fmtINR(data.summary?.grandAmount)} />
          </div>

          <h3 className="font-semibold text-gray-700 mt-4">Year-wise Summary</h3>
          <CustomerTable
            rows={data.yearlyData}
            columns={[
              { key: "year", label: "Year" },
              { key: "milk", label: "Milk (L)", render: fmt },
              { key: "amount", label: "Revenue (₹)", render: fmtINR },
              { key: "avgRate", label: "Avg Rate (₹)", render: (v) => `₹${fmt(v)}` },
              { key: "entries", label: "Entries" },
            ]}
          />

          <h3 className="font-semibold text-gray-700 mt-4">Top Customers</h3>
          <CustomerTable
            rows={data.customerData}
            columns={[
              { key: "customerName", label: "Customer" },
              { key: "totalMilk", label: "Total Milk (L)", render: fmt },
              { key: "avgRate", label: "Avg Rate (₹)", render: (v) => `₹${fmt(v)}` },
              { key: "totalAmount", label: "Total Revenue (₹)", render: fmtINR },
            ]}
          />
        </>
      )}
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "daily", label: "Daily" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "dateRange", label: "Date Range" },
  { id: "yearRange", label: "Year Range" },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "daily":
        return <DailyTab />;
      case "monthly":
        return <MonthlyTab />;
      case "yearly":
        return <YearlyTab />;
      case "dateRange":
        return <DateRangeTab />;
      case "yearRange":
        return <YearRangeTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Reports</h1>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-gray-500 hover:text-blue-600 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">{renderTab()}</div>
      </div>
    </div>
  );
};

export default Reports;