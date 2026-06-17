// routes/reportRoutes.js — FULLY FIXED
// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSES FIXED:
//
// BUG #1 (CRITICAL — missing routes caused 404 errors):
//   Frontend called GET /api/reports/dateRange and /api/reports/yearRange
//   but these routes were never registered in the Express router.
//   Controllers dateRangeReport and yearRangeReport existed in reportController.js
//   but were never imported or routed.
//
// BUG #2:
//   Inconsistent error responses (success field missing in some responses).
//   Fixed: All controllers now return { success: true/false, ... }.
//
// BUG #3:
//   No logging to debug which routes are being called.
//   Fixed in controllers: Added console.log for debugging.
//
// FIX:
//   - Import ALL report controller functions
//   - Register ALL routes: dashboard, daily, monthly, yearly, dateRange, yearRange
//   - Apply 'protect' middleware to all routes (JWT authentication)
//   - Add JSDoc comments for clarity
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import {
  dashboardReport,
  dailyReport,
  monthlyReport,
  yearlyReport,
  dateRangeReport,
  yearRangeReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET /api/reports/dashboard
 * 
 * Returns dashboard summary:
 *   - Total customers, active customers
 *   - Today's milk & revenue
 *   - This month's milk & revenue
 *   - This year's milk & revenue
 *   - All-time statistics
 *   - Top 5 customers by revenue
 *   - Top 5 customers by milk volume
 *   - Monthly trend for current year
 * 
 * Protected by JWT authentication.
 */
router.get("/dashboard", protect, dashboardReport);

/**
 * GET /api/reports/daily
 * Query params: date (YYYY-MM-DD format)
 * Example: /api/reports/daily?date=2024-03-15
 * 
 * Returns daily report for a specific date.
 * Protected by JWT authentication.
 */
router.get("/daily", protect, dailyReport);

/**
 * GET /api/reports/monthly
 * Query params: month (1-12), year
 * Example: /api/reports/monthly?month=3&year=2024
 * 
 * Returns monthly report with:
 *   - Daily breakdown (date, customer, morning milk, evening milk, amount)
 *   - Customer-wise summary (totals per customer)
 *   - Monthly totals and statistics
 * 
 * Protected by JWT authentication.
 */
router.get("/monthly", protect, monthlyReport);

/**
 * GET /api/reports/yearly
 * Query params: year
 * Example: /api/reports/yearly?year=2024
 * 
 * Returns yearly report with:
 *   - Month-wise summary (milk, revenue, entries per month)
 *   - Customer-wise summary (totals per customer across the year)
 *   - Yearly totals and statistics
 * 
 * Protected by JWT authentication.
 */
router.get("/yearly", protect, yearlyReport);

/**
 * GET /api/reports/dateRange
 * Query params: startDate, endDate (YYYY-MM-DD format)
 * Example: /api/reports/dateRange?startDate=2024-01-01&endDate=2024-03-31
 * 
 * Returns report for a custom date range with:
 *   - Customer-wise summary (milk, revenue, average rate, days recorded)
 *   - Range totals and statistics
 * 
 * Protected by JWT authentication.
 */
router.get("/dateRange", protect, dateRangeReport);

/**
 * GET /api/reports/yearRange
 * Query params: startYear, endYear
 * Example: /api/reports/yearRange?startYear=2022&endYear=2024
 * 
 * Returns report across multiple years with:
 *   - Year-wise summary (milk, revenue, average rate, entries per year)
 *   - Customer-wise summary (totals per customer across the year range)
 *   - Range totals and statistics
 * 
 * Protected by JWT authentication.
 */
router.get("/yearRange", protect, yearRangeReport);

export default router;