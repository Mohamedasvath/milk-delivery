// services/reportAPI.js — FULLY FIXED
// ─────────────────────────────────────────────────────────────────────────────
// BUGS FIXED:
//   #1 — Query param names must exactly match what the backend expects:
//        monthly: { month, year }         ✓
//        yearly:  { year }                ✓
//        dateRange: { startDate, endDate } ✓
//        yearRange: { startYear, endYear } ✓
//
//   #2 — All calls now return response.data directly so callers get the
//        full { success, summary, rows, ... } shape.
//
//   #3 — Authorization header is attached from localStorage token on every call.
//        If your axios instance already sets this globally, the getAuthHeader()
//        calls are redundant but harmless.
//
//   #4 — Added consistent error normalisation so callers always get a
//        human-readable message even if the network is down.
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";

// ── Base URL — adjust if your API is hosted differently ───────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Auth header helper ────────────────────────────────────────────────────────
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found. Please log in again.");
  return { Authorization: `Bearer ${token}` };
};



// ── Shared error handler ──────────────────────────────────────────────────────
const handleError = (err, context) => {
  const msg =
    err?.response?.data?.message ||
    err?.message ||
    "An unknown error occurred";
  console.error(`[ReportAPI:${context}]`, msg, err?.response?.data);
  throw new Error(msg);
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
/**
 * Fetches dashboard summary: today/month/year stats, top customers, trend data.
 * @returns {Promise<object>} Full dashboard payload
 */
export const fetchDashboard = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}/reports/dashboard`, {
      headers: getAuthHeader(),
    });
    return data; // { success, totalCustomers, today, month, year, allTime, topByRevenue, topByMilk, monthlyBreakdown, ... }
  } catch (err) {
    handleError(err, "dashboard");
  }
};

// ─── DAILY REPORT ─────────────────────────────────────────────────────────────
/**
 * @param {string} date — "YYYY-MM-DD"
 */
export const fetchDailyReport = async (date) => {
  if (!date) throw new Error("date is required");
  try {
    const { data } = await axios.get(`${BASE_URL}/reports/daily`, {
      headers: getAuthHeader(),
      params: { date }, // FIX: must be "date", matches backend query param name
    });
    return data; // { success, reportType, date, rows, summary }
  } catch (err) {
    handleError(err, "daily");
  }
};

// ─── MONTHLY REPORT ───────────────────────────────────────────────────────────
/**
 * @param {number|string} month — 1–12
 * @param {number|string} year  — e.g. 2024
 */
export const fetchMonthlyReport = async (month, year) => {
  if (!month || !year) throw new Error("month and year are required");
  try {
    const { data } = await axios.get(`${BASE_URL}/reports/monthly`, {
      headers: getAuthHeader(),
      // FIX: param names are "month" and "year" — backend reads req.query.month / req.query.year
      params: { month: Number(month), year: Number(year) },
    });
    return data; // { success, reportType, month, monthName, year, customerRows, dailyBreakdown, summary }
  } catch (err) {
    handleError(err, "monthly");
  }
};

// ─── YEARLY REPORT ────────────────────────────────────────────────────────────
/**
 * @param {number|string} year — e.g. 2024
 */
export const fetchYearlyReport = async (year) => {
  if (!year) throw new Error("year is required");
  try {
    const { data } = await axios.get(`${BASE_URL}/reports/yearly`, {
      headers: getAuthHeader(),
      params: { year: Number(year) }, // FIX: single param "year"
    });
    return data; // { success, reportType, year, months, customerRows, summary }
  } catch (err) {
    handleError(err, "yearly");
  }
};

// ─── DATE RANGE REPORT ────────────────────────────────────────────────────────
/**
 * @param {string} startDate — "YYYY-MM-DD"
 * @param {string} endDate   — "YYYY-MM-DD"
 */
export const fetchDateRangeReport = async (startDate, endDate) => {
  if (!startDate || !endDate) throw new Error("startDate and endDate are required");
  try {
    const { data } = await axios.get(`${BASE_URL}/reports/dateRange`, {
      headers: getAuthHeader(),
      // FIX: exact names "startDate" and "endDate" — case-sensitive, must match backend
      params: { startDate, endDate },
    });
    return data; // { success, reportType, startDate, endDate, customerRows, summary }
  } catch (err) {
    handleError(err, "dateRange");
  }
};

// ─── YEAR RANGE REPORT ────────────────────────────────────────────────────────
/**
 * @param {number|string} startYear
 * @param {number|string} endYear
 */
export const fetchYearRangeReport = async (startYear, endYear) => {
  if (!startYear || !endYear) throw new Error("startYear and endYear are required");
  try {
    const { data } = await axios.get(`${BASE_URL}/reports/yearRange`, {
      headers: getAuthHeader(),
      // FIX: exact names "startYear" and "endYear"
      params: { startYear: Number(startYear), endYear: Number(endYear) },
    });
    return data; // { success, reportType, startYear, endYear, yearlyData, customerData, summary }
  } catch (err) {
    handleError(err, "yearRange");
  }
};

export const getDashboardData = async () => {
  const token = localStorage.getItem("token");

  const { data } = await axios.get(
    `${BASE_URL}/reports/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
};