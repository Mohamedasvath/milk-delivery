// controllers/pdfController.js — FULLY FIXED
// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSES FIXED:
//
// BUG #1 (CRITICAL — corrupted PDF files):
//   Missing imports: PDFDocument not imported.
//   Missing constants: MONTH_NAMES, TABLE_LEFT, TABLE_WIDTH, ROW_H undefined.
//   Missing helper functions: fmt(), formatDate(), drawRow(), drawTotalsRow().
//   Result: Code would not run at all.
//
// BUG #2 (Data leakage — all users' data in one PDF):
//   No ownerId filtering in MongoDB queries.
//   monthlyPdf and yearlyPdf fetched ALL entries, not just req.user.id's entries.
//   Fixed: Added .find({ ownerId: req.user.id, ... })
//
// BUG #3 (Auth failure):
//   JWT not extracted properly (see authMiddleware.js).
//   Fixed in authMiddleware.js — now req.user.id is reliably set.
//
// FIX:
//   - Import PDFKit and all dependencies
//   - Define all constants (MONTH_NAMES, TABLE_LEFT, TABLE_WIDTH, ROW_H)
//   - Implement all helper functions (fmt, formatDate, drawRow, drawTotalsRow)
//   - Filter all MongoDB queries by req.user.id (ownerId)
//   - Add proper error handling with res.headersSent check
// ─────────────────────────────────────────────────────────────────────────────

import PDFDocument from "pdfkit";
import MilkEntry from "../models/MilkEntry.js";
import Customer from "../models/Customer.js";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const TABLE_LEFT = 40;
const TABLE_WIDTH = 535; // A4 width minus margins
const ROW_H = 20;

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Format a number to 2 decimal places.
 * Example: fmt(123.456) → "123.46"
 */
const fmt = (n) => {
  if (n === null || n === undefined) return "0.00";
  return Number(n).toFixed(2);
};

/**
 * Format a Date object to DD/MM/YYYY.
 * Example: formatDate(new Date("2024-01-15")) → "15/01/2024"
 */
const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Draw a table row with the given cells.
 * @param {PDFDocument} doc — PDF document
 * @param {number} y — Y position on page
 * @param {array} cols — Column text values
 * @param {boolean} isHeader — If true, use header styling
 * @param {boolean} isEven — For alternating row backgrounds
 * @returns {number} New Y position after drawing row
 */
const drawRow = (doc, y, cols, isHeader = false, isEven = false) => {
  const bg = isHeader ? "#1a3c5e" : isEven ? "#f4f7fb" : "#ffffff";
  const textColor = isHeader ? "#ffffff" : "#2d3748";
  const fontName = isHeader ? "Helvetica-Bold" : "Helvetica";
  const fontSize = 9;

  // Draw background
  doc.rect(TABLE_LEFT, y, TABLE_WIDTH, ROW_H).fill(bg).stroke("#dde3ea");

  // Draw text
  doc.font(fontName).fontSize(fontSize).fillColor(textColor);

  const colWidths = [100, 120, 90, 90, 135];
  let x = TABLE_LEFT + 6;

  cols.forEach((text, i) => {
    const width = colWidths[i] || 100;
    doc.text(String(text), x, y + 7, {
      width: width - 8,
      align: i === 0 ? "left" : "right",
      lineBreak: false,
    });
    x += width;
  });

  return y + ROW_H;
};

/**
 * Draw a totals row (usually at the end of a table).
 * @param {PDFDocument} doc — PDF document
 * @param {number} y — Y position on page
 * @param {array} cols — Column text values
 * @returns {number} New Y position after drawing row
 */
const drawTotalsRow = (doc, y, cols) => {
  doc.rect(TABLE_LEFT, y, TABLE_WIDTH, 26).fill("#1a3c5e").stroke("#1a3c5e");
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#ffffff");

  const colWidths = [100, 120, 90, 90, 135];
  let x = TABLE_LEFT + 6;

  cols.forEach((text, i) => {
    const width = colWidths[i] || 100;
    doc.text(String(text), x, y + 8, {
      width: width - 8,
      align: i === 0 ? "left" : "right",
      lineBreak: false,
    });
    x += width;
  });

  return y + 26;
};

// ─── CONTROLLERS ──────────────────────────────────────────────────────────────

/**
 * Generate a monthly PDF report.
 * Query params: month (1-12), year
 * 
 * FIX: Filters by req.user.id (ownerId) to prevent data leakage.
 */
export const monthlyPdf = async (req, res) => {
  try {
    const { month, year } = req.query;
    const ownerId = req.user.id; // FIX: Extract ownerId from JWT

    console.log("[PDF_MONTHLY] OWNER ID:", ownerId, "| month:", month, "| year:", year);

    if (!month || !year) {
      return res.status(400).json({ message: "month and year are required" });
    }

    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    if (isNaN(monthInt) || monthInt < 1 || monthInt > 12 || isNaN(yearInt)) {
      return res.status(400).json({ message: "Invalid month or year" });
    }

    const startDate = new Date(yearInt, monthInt - 1, 1);
    const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);

    // FIX: Filter by ownerId to prevent data leakage
    const entries = await MilkEntry.find({
      ownerId,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("customerId", "name")
      .sort({ date: 1 });

    console.log("[PDF_MONTHLY] Entries found:", entries.length);

    const totalMilk = entries.reduce((s, e) => s + (e.totalMilk || 0), 0);
    const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);

    const monthLabel = MONTH_NAMES[monthInt - 1];

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="monthly-report-${monthLabel}-${yearInt}.pdf"`
    );
    doc.pipe(res);

    const PAGE_W = doc.page.width;

    // ── Header ────────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 70).fill("#1a3c5e");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("MilkMan Dairy", 40, 16);
    doc.fillColor("#a8c4e0").font("Helvetica").fontSize(10).text("Monthly Report", 40, 42);
    doc.fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`${monthLabel} ${yearInt}`, PAGE_W - 200, 26, { width: 160, align: "right" });

    // ── Sub-header band ──────────────────────────────────────────────────
    doc.rect(0, 70, PAGE_W, 28).fill("#2c5f8a");
    doc.fillColor("#ffffff").font("Helvetica").fontSize(10).text(
      `Period: 01/${String(monthInt).padStart(2, "0")}/${yearInt} — ${String(
        new Date(yearInt, monthInt, 0).getDate()
      ).padStart(2, "0")}/${String(monthInt).padStart(2, "0")}/${yearInt}   ·   Generated: ${formatDate(
        new Date()
      )}`,
      40,
      79,
      { width: PAGE_W - 80 }
    );

    let y = 112;

    // ── Summary box ───────────────────────────────────────────────────────
    doc.rect(TABLE_LEFT, y, TABLE_WIDTH, 50).fill("#f0f4f8").stroke("#dde3ea");
    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL ENTRIES", 52, y + 10);
    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(13).text(String(entries.length), 52, y + 22);

    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL MILK", 200, y + 10);
    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(13).text(`${fmt(totalMilk)} L`, 200, y + 22);

    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL REVENUE", 370, y + 10);
    doc.fillColor("#1a3c5e")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(`Rs ${fmt(totalAmount)}`, 370, y + 22);

    y += 64;

    // ── Table header ──────────────────────────────────────────────────────
    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(10).text("Daily Milk Collection", TABLE_LEFT, y);
    y += 14;

    y = drawRow(doc, y, ["Date", "Customer", "Morning (L)", "Evening (L)", "Amount (Rs)"], true);

    // ── Table rows ────────────────────────────────────────────────────────
    if (entries.length === 0) {
      doc.rect(TABLE_LEFT, y, TABLE_WIDTH, 32).fill("#fef9f0").stroke("#dde3ea");
      doc.fillColor("#9b7a4d")
        .font("Helvetica-Oblique")
        .fontSize(9)
        .text("No entries found for this period.", TABLE_LEFT, y + 11, {
          width: TABLE_WIDTH,
          align: "center",
        });
      y += 32;
    } else {
      entries.forEach((entry, idx) => {
        // Page break if needed
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 50;
          y = drawRow(doc, y, ["Date", "Customer", "Morning (L)", "Evening (L)", "Amount (Rs)"], true);
        }

        y = drawRow(
          doc,
          y,
          [
            formatDate(entry.date),
            entry.customerId?.name || "—",
            fmt(entry.morningMilk),
            fmt(entry.eveningMilk),
            `Rs ${fmt(entry.amount)}`,
          ],
          false,
          idx % 2 === 0
        );
      });
    }

    y += 4;
    y = drawTotalsRow(doc, y, ["TOTAL", "", "", `${fmt(totalMilk)} L`, `Rs ${fmt(totalAmount)}`]);

    // ── Footer ────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 38;
    doc.rect(0, footerY, PAGE_W, 38).fill("#1a3c5e");
    doc.fillColor("#a8c4e0").font("Helvetica").fontSize(8.5).text("Generated by MilkMan Dairy", 40, footerY + 13);
    doc.fillColor("#6b9fc4")
      .fontSize(8.5)
      .text(`Printed on ${formatDate(new Date())}`, PAGE_W - 200, footerY + 13, {
        width: 160,
        align: "right",
      });

    doc.end();
  } catch (error) {
    console.error("[PDF_MONTHLY_ERROR]", error);
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Generate a yearly PDF report.
 * Query params: year
 * 
 * FIX: Filters by req.user.id (ownerId) to prevent data leakage.
 */
export const yearlyPdf = async (req, res) => {
  try {
    const { year } = req.query;
    const ownerId = req.user.id; // FIX: Extract ownerId from JWT

    console.log("[PDF_YEARLY] OWNER ID:", ownerId, "| year:", year);

    if (!year) {
      return res.status(400).json({ message: "year is required" });
    }

    const yearInt = parseInt(year, 10);
    if (isNaN(yearInt)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const startDate = new Date(yearInt, 0, 1);
    const endDate = new Date(yearInt, 11, 31, 23, 59, 59, 999);

    // FIX: Filter by ownerId to prevent data leakage
    const entries = await MilkEntry.find({
      ownerId,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("customerId", "name")
      .sort({ date: 1 });

    console.log("[PDF_YEARLY] Entries found:", entries.length);

    const totalMilk = entries.reduce((s, e) => s + (e.totalMilk || 0), 0);
    const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);

    // Build month-wise breakdown
    const monthMap = {};
    entries.forEach((e) => {
      const m = new Date(e.date).getMonth(); // 0-11
      if (!monthMap[m]) monthMap[m] = { milk: 0, amount: 0, entries: 0 };
      monthMap[m].milk += e.totalMilk || 0;
      monthMap[m].amount += e.amount || 0;
      monthMap[m].entries += 1;
    });

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="yearly-report-${yearInt}.pdf"`);
    doc.pipe(res);

    const PAGE_W = doc.page.width;

    // ── Header ────────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 70).fill("#1a3c5e");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("MilkMan Dairy", 40, 16);
    doc.fillColor("#a8c4e0").font("Helvetica").fontSize(10).text("Yearly Report", 40, 42);
    doc.fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(String(yearInt), PAGE_W - 160, 24, { width: 120, align: "right" });

    doc.rect(0, 70, PAGE_W, 28).fill("#2c5f8a");
    doc.fillColor("#ffffff")
      .font("Helvetica")
      .fontSize(10)
      .text(`Jan ${yearInt} — Dec ${yearInt}   ·   Generated: ${formatDate(new Date())}`, 40, 79, {
        width: PAGE_W - 80,
      });

    let y = 112;

    // ── Summary box ───────────────────────────────────────────────────────
    doc.rect(TABLE_LEFT, y, TABLE_WIDTH, 50).fill("#f0f4f8").stroke("#dde3ea");
    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL ENTRIES", 52, y + 10);
    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(13).text(String(entries.length), 52, y + 22);

    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL MILK", 200, y + 10);
    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(13).text(`${fmt(totalMilk)} L`, 200, y + 22);

    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL REVENUE", 370, y + 10);
    doc.fillColor("#1a3c5e")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(`Rs ${fmt(totalAmount)}`, 370, y + 22);

    y += 64;

    // ── Month-wise table ──────────────────────────────────────────────────
    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(10).text("Month-wise Summary", TABLE_LEFT, y);
    y += 14;

    const YCOL_WIDTHS = [140, 125, 125, 145];
    const YCOL_ALIGNS = ["left", "right", "right", "right"];

    const drawYRow = (doc, y, cols, isHeader = false, isEven = false) => {
      const bg = isHeader ? "#1a3c5e" : isEven ? "#f4f7fb" : "#ffffff";
      doc.rect(TABLE_LEFT, y, TABLE_WIDTH, ROW_H).fill(bg).stroke("#dde3ea");
      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor(isHeader ? "#ffffff" : "#2d3748");

      let x = TABLE_LEFT + 6;
      cols.forEach((text, i) => {
        doc.text(String(text), x, y + 7, {
          width: YCOL_WIDTHS[i] - 8,
          align: YCOL_ALIGNS[i],
          lineBreak: false,
        });
        x += YCOL_WIDTHS[i];
      });
      return y + ROW_H;
    };

    y = drawYRow(doc, y, ["Month", "Milk (L)", "Revenue (Rs)", "Entries"], true);

    MONTH_NAMES.forEach((name, idx) => {
      const m = monthMap[idx] || { milk: 0, amount: 0, entries: 0 };
      y = drawYRow(
        doc,
        y,
        [name, fmt(m.milk), `Rs ${fmt(m.amount)}`, String(m.entries)],
        false,
        idx % 2 === 0
      );
    });

    // ── Totals row ────────────────────────────────────────────────────────
    y += 4;
    doc.rect(TABLE_LEFT, y, TABLE_WIDTH, 26).fill("#1a3c5e").stroke("#1a3c5e");
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#ffffff");
    doc.text("TOTAL", TABLE_LEFT + 6, y + 8, {
      width: YCOL_WIDTHS[0] - 8,
      align: "left",
      lineBreak: false,
    });
    doc.text(`${fmt(totalMilk)} L`, TABLE_LEFT + YCOL_WIDTHS[0] + 6, y + 8, {
      width: YCOL_WIDTHS[1] - 8,
      align: "right",
      lineBreak: false,
    });
    doc.text(`Rs ${fmt(totalAmount)}`, TABLE_LEFT + YCOL_WIDTHS[0] + YCOL_WIDTHS[1] + 6, y + 8, {
      width: YCOL_WIDTHS[2] - 8,
      align: "right",
      lineBreak: false,
    });
    doc.text(String(entries.length), TABLE_LEFT + YCOL_WIDTHS[0] + YCOL_WIDTHS[1] + YCOL_WIDTHS[2] + 6, y + 8, {
      width: YCOL_WIDTHS[3] - 8,
      align: "right",
      lineBreak: false,
    });
    y += 30;

    // ── Footer ────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 38;
    doc.rect(0, footerY, PAGE_W, 38).fill("#1a3c5e");
    doc.fillColor("#a8c4e0").font("Helvetica").fontSize(8.5).text("Generated by MilkMan Dairy", 40, footerY + 13);
    doc.fillColor("#6b9fc4")
      .fontSize(8.5)
      .text(`Printed on ${formatDate(new Date())}`, PAGE_W - 200, footerY + 13, {
        width: 160,
        align: "right",
      });

    doc.end();
  } catch (error) {
    console.error("[PDF_YEARLY_ERROR]", error);
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Optional: Generate a date range PDF report.
 * Query params: startDate, endDate (YYYY-MM-DD format)
 * 
 * FIX: Filters by req.user.id (ownerId) to prevent data leakage.
 */
export const dateRangePdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const ownerId = req.user.id;

    console.log("[PDF_DATERANGE] OWNER ID:", ownerId, "| startDate:", startDate, "| endDate:", endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate required (YYYY-MM-DD)" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // FIX: Filter by ownerId
    const entries = await MilkEntry.find({
      ownerId,
      date: { $gte: start, $lte: end },
    })
      .populate("customerId", "name")
      .sort({ date: 1 });

    const totalMilk = entries.reduce((s, e) => s + (e.totalMilk || 0), 0);
    const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="daterange-${startDate}-to-${endDate}.pdf"`
    );
    doc.pipe(res);

    const PAGE_W = doc.page.width;

    // ── Header ────────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 70).fill("#1a3c5e");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("MilkMan Dairy", 40, 16);
    doc.fillColor("#a8c4e0").font("Helvetica").fontSize(10).text("Date Range Report", 40, 42);
    doc.fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`${startDate} → ${endDate}`, PAGE_W - 200, 26, { width: 160, align: "right" });

    doc.rect(0, 70, PAGE_W, 28).fill("#2c5f8a");
    doc.fillColor("#ffffff")
      .font("Helvetica")
      .fontSize(10)
      .text(`Period: ${startDate} to ${endDate}   ·   Generated: ${formatDate(new Date())}`, 40, 79, {
        width: PAGE_W - 80,
      });

    let y = 112;

    // ── Summary box ───────────────────────────────────────────────────────
    doc.rect(TABLE_LEFT, y, TABLE_WIDTH, 50).fill("#f0f4f8").stroke("#dde3ea");
    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL ENTRIES", 52, y + 10);
    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(13).text(String(entries.length), 52, y + 22);

    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL MILK", 200, y + 10);
    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(13).text(`${fmt(totalMilk)} L`, 200, y + 22);

    doc.fillColor("#6b7a8d").font("Helvetica").fontSize(8).text("TOTAL REVENUE", 370, y + 10);
    doc.fillColor("#1a3c5e")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(`Rs ${fmt(totalAmount)}`, 370, y + 22);

    y += 64;

    doc.fillColor("#1a3c5e").font("Helvetica-Bold").fontSize(10).text("Daily Entries", TABLE_LEFT, y);
    y += 14;

    y = drawRow(doc, y, ["Date", "Customer", "Morning (L)", "Evening (L)", "Amount (Rs)"], true);

    if (entries.length === 0) {
      doc.rect(TABLE_LEFT, y, TABLE_WIDTH, 32).fill("#fef9f0").stroke("#dde3ea");
      doc.fillColor("#9b7a4d")
        .font("Helvetica-Oblique")
        .fontSize(9)
        .text("No entries found for this period.", TABLE_LEFT, y + 11, {
          width: TABLE_WIDTH,
          align: "center",
        });
      y += 32;
    } else {
      entries.forEach((entry, idx) => {
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 50;
          y = drawRow(doc, y, ["Date", "Customer", "Morning (L)", "Evening (L)", "Amount (Rs)"], true);
        }

        y = drawRow(
          doc,
          y,
          [
            formatDate(entry.date),
            entry.customerId?.name || "—",
            fmt(entry.morningMilk),
            fmt(entry.eveningMilk),
            `Rs ${fmt(entry.amount)}`,
          ],
          false,
          idx % 2 === 0
        );
      });
    }

    y += 4;
    y = drawTotalsRow(doc, y, ["TOTAL", "", "", `${fmt(totalMilk)} L`, `Rs ${fmt(totalAmount)}`]);

    // ── Footer ────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 38;
    doc.rect(0, footerY, PAGE_W, 38).fill("#1a3c5e");
    doc.fillColor("#a8c4e0").font("Helvetica").fontSize(8.5).text("Generated by MilkMan Dairy", 40, footerY + 13);
    doc.fillColor("#6b9fc4")
      .fontSize(8.5)
      .text(`Printed on ${formatDate(new Date())}`, PAGE_W - 200, footerY + 13, {
        width: 160,
        align: "right",
      });

    doc.end();
  } catch (error) {
    console.error("[PDF_DATERANGE_ERROR]", error);
    if (res.headersSent) {
      res.end();
      return;
    }
    res.status(500).json({ message: error.message });
  }
};