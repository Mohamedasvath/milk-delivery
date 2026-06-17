// routes/pdfRoutes.js — FULLY FIXED
// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSES FIXED:
//
// BUG #1 (CRITICAL — PDF routes were completely missing):
//   Frontend called GET /api/pdf/monthly, /api/pdf/yearly, etc. but these
//   routes were never registered in the Express router.
//   Result: 404 errors on all PDF download attempts.
//
// BUG #2:
//   No authentication middleware on PDF routes.
//   Even if the routes existed, they wouldn't have protected access or ownerId.
//   Fixed: Added 'protect' middleware to all routes.
//
// BUG #3:
//   pdfController was imported but functions never used because routes didn't exist.
//   Fixed: Now all controller functions are properly routed.
//
// FIX:
//   - Import all PDF controller functions
//   - Register routes for: monthly, yearly, dateRange
//   - Apply 'protect' middleware to all routes (JWT authentication)
//   - Follow Express routing best practices
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import { monthlyPdf, yearlyPdf, dateRangePdf } from "../controllers/pdfController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET /api/pdf/monthly
 * Query params: month (1-12), year
 * Example: /api/pdf/monthly?month=3&year=2024
 * 
 * Generates a PDF report for a specific month.
 * Protected by JWT authentication.
 */
router.get("/monthly", protect, monthlyPdf);

/**
 * GET /api/pdf/yearly
 * Query params: year
 * Example: /api/pdf/yearly?year=2024
 * 
 * Generates a PDF report for a specific year.
 * Protected by JWT authentication.
 */
router.get("/yearly", protect, yearlyPdf);

/**
 * GET /api/pdf/dateRange
 * Query params: startDate, endDate (YYYY-MM-DD format)
 * Example: /api/pdf/dateRange?startDate=2024-01-01&endDate=2024-03-31
 * 
 * Generates a PDF report for a custom date range.
 * Protected by JWT authentication.
 */
router.get("/dateRange", protect, dateRangePdf);

// Optional: Grand Total PDF (all data for user)
// Note: Not implemented yet, but can be added if needed
// router.get("/grandTotal", protect, grandTotalPdf);

export default router;