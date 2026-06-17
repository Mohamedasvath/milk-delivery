// src/utils/pdfUtils.js
// Requires: jspdf, jspdf-autotable
// npm install jspdf jspdf-autotable

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_BLUE  = [37, 99, 235];   // #2563eb
const BRAND_LIGHT = [239, 246, 255]; // #eff6ff
const DARK        = [15, 23, 42];    // #0f172a
const GRAY        = [100, 116, 139]; // #64748b
const WHITE       = [255, 255, 255];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// ─── shared helpers ──────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toFixed(2);
const fmtINR = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtL   = (n) => `${Number(n || 0).toFixed(2)} L`;
const stamp  = () => new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function drawHeader(doc, title, subtitle, ownerName) {
  const W = doc.internal.pageSize.getWidth();

  // Blue banner
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, W, 36, "F");

  // Logo circle placeholder
  doc.setFillColor(...WHITE);
  doc.circle(18, 18, 10, "F");
  doc.setTextColor(...BRAND_BLUE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("🥛", 14, 20);

  // Title
  doc.setTextColor(...WHITE);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Milk Management System", 33, 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${title}  |  ${subtitle}`, 33, 21);

  if (ownerName) {
    doc.setFontSize(8);
    doc.text(`Owner: ${ownerName}`, 33, 29);
  }

  // Generated at — right side
  doc.setFontSize(7);
  doc.setTextColor(200, 220, 255);
  doc.text(`Generated: ${stamp()}`, W - 8, 31, { align: "right" });

  return 44; // y cursor after header
}

function drawSummaryBox(doc, y, items) {
  const W    = doc.internal.pageSize.getWidth();
  const cols = items.length;
  const boxW = (W - 16) / cols;

  doc.setFillColor(...BRAND_LIGHT);
  doc.roundedRect(8, y, W - 16, 22, 3, 3, "F");

  items.forEach((item, i) => {
    const x = 8 + i * boxW + boxW / 2;
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(item.label, x, y + 7, { align: "center" });

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(item.value, x, y + 17, { align: "center" });
  });

  return y + 28;
}

function addPageNumbers(doc) {
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`Page ${i} of ${total}`, W / 2, H - 6, { align: "center" });
    doc.setTextColor(...BRAND_BLUE);
    doc.text("Milk Management System", 10, H - 6);
  }
}

function grandTotalFooter(doc, items) {
  const W = doc.internal.pageSize.getWidth();
  const y = doc.lastAutoTable.finalY + 6;

  doc.setFillColor(...BRAND_BLUE);
  doc.roundedRect(8, y, W - 16, 18, 3, 3, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", 15, y + 7);

  items.forEach((item, i) => {
    const x = W - 16 - i * 60;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(item.label, x, y + 6, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(item.value, x, y + 14, { align: "right" });
  });
}

// ─── DAILY PDF ───────────────────────────────────────────────────────────────

export function generateDailyPDF({ date, ownerName, rows, summary }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  let y = drawHeader(doc, "Daily Report", date, ownerName);

  y = drawSummaryBox(doc, y, [
    { label: "Total Customers",   value: String(summary.totalCustomers) },
    { label: "Total Milk",        value: fmtL(summary.totalMilk)        },
    { label: "Total Revenue",     value: fmtINR(summary.totalAmount)    },
    { label: "Average Rate",      value: `Rs. ${fmt(summary.avgRate)}/L` },
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 8, right: 8 },
    head: [["#", "Customer Name", "Morning (L)", "Evening (L)", "Total (L)", "Rate (Rs.)", "Amount (Rs.)"]],
    body: rows.map((r, i) => [
      i + 1,
      r.customerName,
      fmt(r.morningMilk),
      fmt(r.eveningMilk),
      fmt(r.totalMilk),
      fmt(r.rate),
      fmt(r.amount),
    ]),
    headStyles: {
      fillColor: BRAND_BLUE,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: BRAND_LIGHT },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right", fontStyle: "bold" },
      5: { halign: "right" },
      6: { halign: "right", fontStyle: "bold" },
    },
    didDrawPage: (data) => {
      drawHeader(doc, "Daily Report", date, ownerName);
    },
  });

  grandTotalFooter(doc, [
    { label: "Total Revenue", value: fmtINR(summary.totalAmount) },
    { label: "Total Milk",    value: fmtL(summary.totalMilk)     },
  ]);

  addPageNumbers(doc);
  doc.save(`Daily_Report_${date}.pdf`);
}

// ─── MONTHLY PDF ─────────────────────────────────────────────────────────────

export function generateMonthlyPDF({ month, monthName, year, ownerName, customerRows, summary }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const title = `Monthly Report — ${monthName} ${year}`;

  let y = drawHeader(doc, "Monthly Report", `${monthName} ${year}`, ownerName);

  y = drawSummaryBox(doc, y, [
    { label: "Total Customers",    value: String(summary.totalCustomers) },
    { label: "Total Milk",         value: fmtL(summary.grandMilk)        },
    { label: "Total Revenue",      value: fmtINR(summary.grandAmount)    },
    { label: "Average Rate",       value: `Rs. ${fmt(summary.avgRate)}/L` },
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 8, right: 8 },
    head: [["#", "Customer Name", "Morning (L)", "Evening (L)", "Total Milk (L)", "Avg Rate (Rs.)", "Monthly Amount (Rs.)", "Days"]],
    body: customerRows.map((r, i) => [
      i + 1,
      r.customerName,
      fmt(r.totalMorning),
      fmt(r.totalEvening),
      fmt(r.totalMilk),
      fmt(r.avgRate),
      fmt(r.totalAmount),
      r.daysRecorded,
    ]),
    headStyles: { fillColor: BRAND_BLUE, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: BRAND_LIGHT },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right", fontStyle: "bold" },
      5: { halign: "right" },
      6: { halign: "right", fontStyle: "bold" },
      7: { halign: "center" },
    },
    didDrawPage: () => drawHeader(doc, "Monthly Report", `${monthName} ${year}`, ownerName),
  });

  grandTotalFooter(doc, [
    { label: "Total Revenue",  value: fmtINR(summary.grandAmount) },
    { label: "Total Milk",     value: fmtL(summary.grandMilk)     },
    { label: "Customers",      value: String(summary.totalCustomers) },
  ]);

  addPageNumbers(doc);
  doc.save(`Monthly_Report_${monthName}_${year}.pdf`);
}

// ─── YEARLY PDF ──────────────────────────────────────────────────────────────

export function generateYearlyPDF({ year, ownerName, months, customerRows, summary }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  let y = drawHeader(doc, "Yearly Report", String(year), ownerName);

  y = drawSummaryBox(doc, y, [
    { label: "Total Customers",  value: String(summary.totalCustomers) },
    { label: "Total Milk",       value: fmtL(summary.grandMilk)        },
    { label: "Total Revenue",    value: fmtINR(summary.grandAmount)    },
  ]);

  // Monthly breakdown table
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Monthly Breakdown", 10, y + 5);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 8, right: 8 },
    head: [["Month", "Total Milk (L)", "Revenue (Rs.)", "Avg Rate (Rs.)", "Entries"]],
    body: months.map((m) => [
      m.month,
      m.milk > 0 ? fmt(m.milk)   : "—",
      m.milk > 0 ? fmt(m.amount) : "—",
      m.milk > 0 ? fmt(m.avgRate): "—",
      m.milk > 0 ? m.entries     : "—",
    ]),
    headStyles: { fillColor: BRAND_BLUE, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: BRAND_LIGHT },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" },
      2: { halign: "right", fontStyle: "bold" },
      3: { halign: "right" },
      4: { halign: "center" },
    },
    didDrawPage: () => drawHeader(doc, "Yearly Report", String(year), ownerName),
  });

  grandTotalFooter(doc, [
    { label: "Total Revenue", value: fmtINR(summary.grandAmount) },
    { label: "Total Milk",    value: fmtL(summary.grandMilk)     },
  ]);

  // Customer breakdown on a new page
  doc.addPage();
  let y2 = drawHeader(doc, "Yearly Report — Customer Breakdown", String(year), ownerName);

  autoTable(doc, {
    startY: y2 + 4,
    margin: { left: 8, right: 8 },
    head: [["#", "Customer Name", "Total Milk (L)", "Avg Rate (Rs.)", "Total Amount (Rs.)"]],
    body: customerRows.map((r, i) => [
      i + 1,
      r.customerName,
      fmt(r.totalMilk),
      fmt(r.avgRate),
      fmt(r.totalAmount),
    ]),
    headStyles: { fillColor: BRAND_BLUE, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: BRAND_LIGHT },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      2: { halign: "right", fontStyle: "bold" },
      3: { halign: "right" },
      4: { halign: "right", fontStyle: "bold" },
    },
  });

  addPageNumbers(doc);
  doc.save(`Yearly_Report_${year}.pdf`);
}