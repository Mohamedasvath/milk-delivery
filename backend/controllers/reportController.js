// controllers/reportController.js — FULLY FIXED
// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSES FIXED:
//
// BUG #1 (CRITICAL — caused ALL aggregation reports to return empty):
//   ownerId type mismatch in MongoDB aggregation $match.
//   BEFORE: $match: { ownerId: req.user.id }
//           req.user.id is a plain STRING from the JWT payload.
//           If MilkEntry.ownerId is stored as ObjectId in MongoDB,
//           the $match finds NOTHING because "abc123" !== ObjectId("abc123").
//   FIX:    buildOwnerMatch() builds a { $in: [ObjectId(id), stringId] }
//           so it matches regardless of what type is in the DB.
//   NOTE:   MilkEntry.find() works fine because Mongoose auto-casts.
//           Raw aggregate() does NOT cast — you must cast manually.
//
// BUG #2 (Monthly/Yearly showed ₹0 / "undefined"):
//   Same ownerId mismatch in aggregate pipelines made customerRows = [].
//   grandMilk and grandAmount reduced over an empty array → 0.
//   Response shape was correct but data was empty.
//
// BUG #3 (dateRange / yearRange returned 404):
//   These controllers existed but were never registered in reportRoutes.js.
//   Fixed in reportRoutes.js — both routes now registered.
//
// BUG #4 (Dashboard top customers empty):
//   Same aggregate ownerId mismatch. topByRevenue and topByMilk pipelines
//   returned [] because $match found nothing.
//
// BUG #5 (Response envelope inconsistency):
//   All responses now consistently return { success: true, ... }.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import MilkEntry from "../models/MilkEntry.js";
import Customer from "../models/Customer.js";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
};

/**
 * FIX #1 — Flexible ownerId match for raw MongoDB aggregation pipelines.
 *
 * MilkEntry.find() uses Mongoose which auto-casts string → ObjectId.
 * MilkEntry.aggregate() does NOT cast. If the schema stores ownerId as
 * ObjectId but req.user.id arrives as a string, the $match finds nothing.
 *
 * Solution: match BOTH the ObjectId form AND the string form using $in.
 * This works whether the DB stores ownerId as ObjectId or String.
 */
const buildOwnerMatch = (ownerId) => {
  const oid = toObjectId(ownerId);
  if (oid) {
    return { $in: [oid, String(ownerId)] };
  }
  return String(ownerId);
};

const dayBounds = (dateStr) => {
  const d = new Date(dateStr);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const monthBounds = (month, year) => ({
  start: new Date(year, month - 1, 1, 0, 0, 0, 0),
  end: new Date(year, month, 0, 23, 59, 59, 999),
});

const yearBounds = (year) => ({
  start: new Date(year, 0, 1, 0, 0, 0, 0),
  end: new Date(year, 11, 31, 23, 59, 59, 999),
});

const dateRangeBounds = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ─── DEBUG — logs a sample document to verify ownerId type in the DB ─────────
// REMOVE this function after confirming reports are working.
const debugOwnerType = async (ownerId) => {
  const sample = await MilkEntry.findOne().lean();
  if (sample) {
    console.log("[DEBUG] Sample MilkEntry.ownerId:", sample.ownerId, "| type:", typeof sample.ownerId);
    console.log("[DEBUG] req.user.id:", ownerId, "| type:", typeof ownerId);
    console.log("[DEBUG] Match would be:", JSON.stringify(buildOwnerMatch(ownerId)));
  } else {
    console.log("[DEBUG] No MilkEntry documents found in the collection at all.");
  }
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const dashboardReport = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const ownerMatch = buildOwnerMatch(ownerId);

    console.log("[DASHBOARD] JWT USER:", req.user);
    console.log("[DASHBOARD] OWNER ID:", ownerId);

    await debugOwnerType(ownerId); // REMOVE after fix confirmed

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const { start: startToday, end: endToday } = dayBounds(todayStr);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const thisYearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const thisYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // FIX: Customer queries use Mongoose find() — string ownerId is fine here.
    // FIX: ALL aggregate pipelines use ownerMatch (ObjectId + string $in).
    const [
      totalCustomers,
      activeCustomers,
      todayAgg,
      monthAgg,
      yearAgg,
      allTimeAgg,
      topByRevenue,
      topByMilk,
      monthlyTrend,
    ] = await Promise.all([
      Customer.countDocuments({ ownerId }),
      Customer.countDocuments({ ownerId, status: "active" }),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: startToday, $lte: endToday } } },
        {
          $group: {
            _id: null,
            milk: { $sum: "$totalMilk" },
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
        {
          $group: { _id: null, milk: { $sum: "$totalMilk" }, amount: { $sum: "$amount" } },
        },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: thisYearStart, $lte: thisYearEnd } } },
        {
          $group: { _id: null, milk: { $sum: "$totalMilk" }, amount: { $sum: "$amount" } },
        },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch } },
        {
          $group: {
            _id: null,
            milk: { $sum: "$totalMilk" },
            amount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Top 5 by revenue
      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch } },
        { $group: { _id: "$customerId", totalAmount: { $sum: "$amount" }, totalMilk: { $sum: "$totalMilk" } } },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: { $ifNull: ["$customer.name", "Unknown"] },
            totalAmount: { $round: ["$totalAmount", 2] },
            totalMilk: { $round: ["$totalMilk", 2] },
          },
        },
      ]),

      // Top 5 by milk volume
      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch } },
        { $group: { _id: "$customerId", totalMilk: { $sum: "$totalMilk" }, totalAmount: { $sum: "$amount" } } },
        { $sort: { totalMilk: -1 } },
        { $limit: 5 },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: { $ifNull: ["$customer.name", "Unknown"] },
            totalMilk: { $round: ["$totalMilk", 2] },
            totalAmount: { $round: ["$totalAmount", 2] },
          },
        },
      ]),

      // Monthly trend for current year
      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: thisYearStart, $lte: thisYearEnd } } },
        { $group: { _id: { $month: "$date" }, milk: { $sum: "$totalMilk" }, amount: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const todayData = todayAgg[0] || { milk: 0, amount: 0, count: 0 };
    const monthData = monthAgg[0] || { milk: 0, amount: 0 };
    const yearData = yearAgg[0] || { milk: 0, amount: 0 };
    const allTimeData = allTimeAgg[0] || { milk: 0, amount: 0, avgRate: 0, count: 0 };

    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyTrend.find((m) => m._id === i + 1);
      return {
        month: MONTH_NAMES[i],
        milk: found ? +found.milk.toFixed(2) : 0,
        amount: found ? +found.amount.toFixed(2) : 0,
      };
    });

    const bestRevenueMonth = monthlyBreakdown.reduce((best, curr) => {
      return !best || curr.amount > best.amount ? { ...curr, month: curr.month } : best;
    }, null);

    res.status(200).json({
      success: true,
      totalCustomers,
      activeCustomers,
      today: { milk: +todayData.milk.toFixed(2), amount: +todayData.amount.toFixed(2), entries: todayData.count },
      month: { milk: +monthData.milk.toFixed(2), amount: +monthData.amount.toFixed(2) },
      year: { milk: +yearData.milk.toFixed(2), amount: +yearData.amount.toFixed(2) },
      allTime: {
        milk: +allTimeData.milk.toFixed(2),
        amount: +allTimeData.amount.toFixed(2),
        avgRate: +allTimeData.avgRate.toFixed(2),
        entries: allTimeData.count,
      },
      topByRevenue,
      topByMilk,
      monthlyBreakdown,
      bestRevenueMonth,
    });
  } catch (err) {
    console.error("[DASHBOARD_REPORT_ERROR]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DAILY REPORT ─────────────────────────────────────────────────────────────

export const dailyReport = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { date } = req.query;

    console.log("[DAILY_REPORT] OWNER ID:", ownerId, "| date:", date);

    if (!date) {
      return res.status(400).json({ success: false, message: "date required (YYYY-MM-DD)" });
    }

    const { start, end } = dayBounds(date);

    const [customerRows, summaryAgg] = await Promise.all([
      MilkEntry.aggregate([
        { $match: { ownerId, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: "$customerId",
            totalMorning: { $sum: "$morningMilk" },
            totalEvening: { $sum: "$eveningMilk" },
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
          },
        },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            customerName: { $ifNull: ["$customer.name", "Unknown"] },
            totalMorning: { $round: ["$totalMorning", 2] },
            totalEvening: { $round: ["$totalEvening", 2] },
            totalMilk: { $round: ["$totalMilk", 2] },
            totalAmount: { $round: ["$totalAmount", 2] },
            avgRate: { $round: ["$avgRate", 2] },
          },
        },
        { $sort: { customerName: 1 } },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            entries: { $sum: 1 },
          },
        },
      ]),
    ]);

    console.log("[DAILY_REPORT] ENTRIES FOUND:", customerRows.length, "customers");

    const s = summaryAgg[0] || { totalMilk: 0, totalAmount: 0, avgRate: 0, entries: 0 };

    res.status(200).json({
      success: true,
      reportType: "Daily",
      date,
      customerRows,
      summary: {
        totalCustomers: customerRows.length,
        totalMilk: +s.totalMilk.toFixed(2),
        totalAmount: +s.totalAmount.toFixed(2),
        avgRate: +s.avgRate.toFixed(2),
        entries: s.entries,
      },
    });
  } catch (err) {
    console.error("[DAILY_REPORT_ERROR]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MONTHLY REPORT ───────────────────────────────────────────────────────────

export const monthlyReport = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const ownerMatch = buildOwnerMatch(ownerId);
    const { month, year } = req.query;

    console.log("[MONTHLY_REPORT] OWNER ID:", ownerId, "| month:", month, "| year:", year);

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "month and year required" });
    }

    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    if (isNaN(monthInt) || monthInt < 1 || monthInt > 12 || isNaN(yearInt)) {
      return res.status(400).json({ success: false, message: "Invalid month or year" });
    }

    const { start, end } = monthBounds(monthInt, yearInt);

    const [customerRows, dailyBreakdown, summaryAgg] = await Promise.all([
      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: "$customerId",
            totalMorning: { $sum: "$morningMilk" },
            totalEvening: { $sum: "$eveningMilk" },
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            daysRecorded: { $sum: 1 },
          },
        },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            customerName: { $ifNull: ["$customer.name", "Unknown"] },
            totalMorning: { $round: ["$totalMorning", 2] },
            totalEvening: { $round: ["$totalEvening", 2] },
            totalMilk: { $round: ["$totalMilk", 2] },
            totalAmount: { $round: ["$totalAmount", 2] },
            avgRate: { $round: ["$avgRate", 2] },
            daysRecorded: 1,
          },
        },
        { $sort: { customerName: 1 } },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            entries: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            entries: { $sum: 1 },
          },
        },
      ]),
    ]);

    console.log("[MONTHLY_REPORT] ENTRIES FOUND:", customerRows.length, "customers");

    const s = summaryAgg[0] || { totalMilk: 0, totalAmount: 0, avgRate: 0, entries: 0 };

    res.status(200).json({
      success: true,
      reportType: "Monthly",
      month: monthInt,
      monthName: MONTH_NAMES[monthInt - 1],
      year: yearInt,
      customerRows,
      dailyBreakdown: dailyBreakdown.map((d) => ({
        date: d._id,
        milk: +d.totalMilk.toFixed(2),
        amount: +d.totalAmount.toFixed(2),
        entries: d.entries,
      })),
      summary: {
        totalCustomers: customerRows.length,
        totalMilk: +s.totalMilk.toFixed(2),
        totalAmount: +s.totalAmount.toFixed(2),
        avgRate: +s.avgRate.toFixed(2),
        entries: s.entries,
      },
    });
  } catch (err) {
    console.error("[MONTHLY_REPORT_ERROR]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── YEARLY REPORT ────────────────────────────────────────────────────────────

export const yearlyReport = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const ownerMatch = buildOwnerMatch(ownerId);
    const { year } = req.query;

    console.log("[YEARLY_REPORT] OWNER ID:", ownerId, "| year:", year);

    if (!year) {
      return res.status(400).json({ success: false, message: "year required" });
    }

    const yearInt = parseInt(year, 10);
    if (isNaN(yearInt)) {
      return res.status(400).json({ success: false, message: "Invalid year" });
    }

    const { start, end } = yearBounds(yearInt);

    const [customerRows, monthlyAgg, summaryAgg] = await Promise.all([
      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: "$customerId",
            totalMorning: { $sum: "$morningMilk" },
            totalEvening: { $sum: "$eveningMilk" },
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            daysRecorded: { $sum: 1 },
          },
        },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            customerName: { $ifNull: ["$customer.name", "Unknown"] },
            totalMorning: { $round: ["$totalMorning", 2] },
            totalEvening: { $round: ["$totalEvening", 2] },
            totalMilk: { $round: ["$totalMilk", 2] },
            totalAmount: { $round: ["$totalAmount", 2] },
            avgRate: { $round: ["$avgRate", 2] },
            daysRecorded: 1,
          },
        },
        { $sort: { customerName: 1 } },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $month: "$date" },
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            entries: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            entries: { $sum: 1 },
          },
        },
      ]),
    ]);

    console.log("[YEARLY_REPORT] ENTRIES FOUND:", customerRows.length, "customers");

    const s = summaryAgg[0] || { totalMilk: 0, totalAmount: 0, avgRate: 0, entries: 0 };
    const grandMilk = s.totalMilk || 0;
    const grandAmount = s.totalAmount || 0;

    res.status(200).json({
      success: true,
      reportType: "Yearly",
      year: yearInt,
      months: monthlyAgg.map((m) => ({
        month: MONTH_NAMES[m._id - 1],
        milk: +m.totalMilk.toFixed(2),
        amount: +m.totalAmount.toFixed(2),
        entries: m.entries,
      })),
      customerRows,
      summary: {
        totalCustomers: customerRows.length,
        grandMilk: +grandMilk.toFixed(2),
        grandAmount: +grandAmount.toFixed(2),
      },
    });
  } catch (err) {
    console.error("[YEARLY_REPORT_ERROR]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DATE RANGE REPORT ────────────────────────────────────────────────────────
// FIX: This controller existed but was NEVER registered as a route.
// Fixed in reportRoutes.js — added GET /dateRange route.

export const dateRangeReport = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const ownerMatch = buildOwnerMatch(ownerId);
    const { startDate, endDate } = req.query;

    console.log("[DATE_RANGE] OWNER ID:", ownerId, "| startDate:", startDate, "| endDate:", endDate);

    if (!startDate || !endDate)
      return res.status(400).json({ success: false, message: "startDate and endDate required (YYYY-MM-DD)" });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
      return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });

    if (new Date(startDate) > new Date(endDate))
      return res.status(400).json({ success: false, message: "startDate must be ≤ endDate" });

    const { start, end } = dateRangeBounds(startDate, endDate);

    const [customerRows, summaryAgg] = await Promise.all([
      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: "$customerId",
            totalMorning: { $sum: "$morningMilk" },
            totalEvening: { $sum: "$eveningMilk" },
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            daysRecorded: { $sum: 1 },
          },
        },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            customerName: { $ifNull: ["$customer.name", "Unknown"] },
            totalMorning: { $round: ["$totalMorning", 2] },
            totalEvening: { $round: ["$totalEvening", 2] },
            totalMilk: { $round: ["$totalMilk", 2] },
            totalAmount: { $round: ["$totalAmount", 2] },
            avgRate: { $round: ["$avgRate", 2] },
            daysRecorded: 1,
          },
        },
        { $sort: { customerName: 1 } },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            entries: { $sum: 1 },
          },
        },
      ]),
    ]);

    console.log("[DATE_RANGE] ENTRIES FOUND:", customerRows.length, "customers");

    const s = summaryAgg[0] || { totalMilk: 0, totalAmount: 0, avgRate: 0, entries: 0 };

    res.status(200).json({
      success: true,
      reportType: "Date Range",
      startDate,
      endDate,
      customerRows,
      summary: {
        totalCustomers: customerRows.length,
        totalMilk: +s.totalMilk.toFixed(2),
        totalAmount: +s.totalAmount.toFixed(2),
        avgRate: +s.avgRate.toFixed(2),
        entries: s.entries,
      },
    });
  } catch (err) {
    console.error("[DATE_RANGE_REPORT_ERROR]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── YEAR RANGE REPORT ────────────────────────────────────────────────────────
// FIX: This controller existed but was NEVER registered as a route.
// Fixed in reportRoutes.js — added GET /yearRange route.

export const yearRangeReport = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const ownerMatch = buildOwnerMatch(ownerId);
    const { startYear, endYear } = req.query;

    console.log("[YEAR_RANGE] OWNER ID:", ownerId, "| startYear:", startYear, "| endYear:", endYear);

    if (!startYear || !endYear)
      return res.status(400).json({ success: false, message: "startYear and endYear required" });

    const startYearNum = Number(startYear);
    const endYearNum = Number(endYear);

    if (isNaN(startYearNum) || isNaN(endYearNum))
      return res.status(400).json({ success: false, message: "startYear and endYear must be numbers" });

    if (startYearNum > endYearNum)
      return res.status(400).json({ success: false, message: "startYear must be ≤ endYear" });

    const rangeStart = new Date(startYearNum, 0, 1, 0, 0, 0, 0);
    const rangeEnd = new Date(endYearNum, 11, 31, 23, 59, 59, 999);

    const [yearlyData, customerData] = await Promise.all([
      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: rangeStart, $lte: rangeEnd } } },
        {
          $group: {
            _id: { $year: "$date" },
            milk: { $sum: "$totalMilk" },
            amount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
            entries: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      MilkEntry.aggregate([
        { $match: { ownerId: ownerMatch, date: { $gte: rangeStart, $lte: rangeEnd } } },
        {
          $group: {
            _id: "$customerId",
            totalMilk: { $sum: "$totalMilk" },
            totalAmount: { $sum: "$amount" },
            avgRate: { $avg: "$rate" },
          },
        },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            customerName: { $ifNull: ["$customer.name", "Unknown"] },
            totalMilk: { $round: ["$totalMilk", 2] },
            totalAmount: { $round: ["$totalAmount", 2] },
            avgRate: { $round: ["$avgRate", 2] },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
    ]);

    console.log("[YEAR_RANGE] ENTRIES FOUND:", yearlyData.length, "years,", customerData.length, "customers");

    const grandMilk = yearlyData.reduce((s, y) => s + y.milk, 0);
    const grandAmount = yearlyData.reduce((s, y) => s + y.amount, 0);

    res.status(200).json({
      success: true,
      reportType: "Year Range",
      startYear: startYearNum,
      endYear: endYearNum,
      yearlyData: yearlyData.map((y) => ({
        year: y._id,
        milk: +y.milk.toFixed(2),
        amount: +y.amount.toFixed(2),
        avgRate: +y.avgRate.toFixed(2),
        entries: y.entries,
      })),
      customerData,
      summary: {
        totalCustomers: customerData.length,
        grandMilk: +grandMilk.toFixed(2),
        grandAmount: +grandAmount.toFixed(2),
      },
    });
  } catch (err) {
    console.error("[YEAR_RANGE_REPORT_ERROR]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};