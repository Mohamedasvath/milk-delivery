// src/utils/excelUtils.js
// npm install xlsx
import * as XLSX from "xlsx";

const fmt = (n) => +Number(n || 0).toFixed(2);

// ─── DAILY EXCEL ─────────────────────────────────────────────────────────────

export function exportDailyExcel({ date, ownerName, rows, summary }) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Milk Management System — Daily Report"],
    [`Date: ${date}`],
    [`Owner: ${ownerName}`],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [],
    ["Total Customers", summary.totalCustomers],
    ["Total Milk (L)",  fmt(summary.totalMilk)],
    ["Total Revenue",   fmt(summary.totalAmount)],
    ["Average Rate",    fmt(summary.avgRate)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Entries sheet
  const headers = ["#", "Customer Name", "Morning (L)", "Evening (L)", "Total Milk (L)", "Rate (Rs.)", "Amount (Rs.)"];
  const body    = rows.map((r, i) => [
    i + 1, r.customerName,
    fmt(r.morningMilk), fmt(r.eveningMilk),
    fmt(r.totalMilk), fmt(r.rate), fmt(r.amount),
  ]);
  body.push(["", "TOTAL", "", "", fmt(summary.totalMilk), "", fmt(summary.totalAmount)]);

  const wsEntries = XLSX.utils.aoa_to_sheet([headers, ...body]);
  XLSX.utils.book_append_sheet(wb, wsEntries, "Entries");

  XLSX.writeFile(wb, `Daily_Report_${date}.xlsx`);
}

// ─── MONTHLY EXCEL ───────────────────────────────────────────────────────────

export function exportMonthlyExcel({ monthName, year, ownerName, customerRows, summary }) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Milk Management System — Monthly Report"],
    [`Period: ${monthName} ${year}`],
    [`Owner: ${ownerName}`],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [],
    ["Total Customers", summary.totalCustomers],
    ["Total Milk (L)",  fmt(summary.grandMilk)],
    ["Total Revenue",   fmt(summary.grandAmount)],
    ["Average Rate",    fmt(summary.avgRate)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

  const headers = ["#", "Customer", "Morning (L)", "Evening (L)", "Total Milk (L)", "Avg Rate", "Amount (Rs.)", "Days"];
  const body    = customerRows.map((r, i) => [
    i + 1, r.customerName,
    fmt(r.totalMorning), fmt(r.totalEvening),
    fmt(r.totalMilk), fmt(r.avgRate),
    fmt(r.totalAmount), r.daysRecorded,
  ]);
  body.push(["", "GRAND TOTAL", "", "", fmt(summary.grandMilk), "", fmt(summary.grandAmount), ""]);

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...body]), "Customer Report");
  XLSX.writeFile(wb, `Monthly_Report_${monthName}_${year}.xlsx`);
}

// ─── YEARLY EXCEL ────────────────────────────────────────────────────────────

export function exportYearlyExcel({ year, ownerName, months, customerRows, summary }) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Milk Management System — Yearly Report"],
    [`Year: ${year}`],
    [`Owner: ${ownerName}`],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [],
    ["Total Customers", summary.totalCustomers],
    ["Total Milk (L)",  fmt(summary.grandMilk)],
    ["Total Revenue",   fmt(summary.grandAmount)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

  const monthHeaders = ["Month", "Total Milk (L)", "Revenue (Rs.)", "Avg Rate", "Entries"];
  const monthBody    = months.map((m) => [m.month, fmt(m.milk), fmt(m.amount), fmt(m.avgRate), m.entries]);
  monthBody.push(["TOTAL", fmt(summary.grandMilk), fmt(summary.grandAmount), "", ""]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([monthHeaders, ...monthBody]), "Monthly Breakdown");

  const custHeaders = ["#", "Customer", "Total Milk (L)", "Avg Rate", "Total Amount (Rs.)"];
  const custBody    = customerRows.map((r, i) => [i + 1, r.customerName, fmt(r.totalMilk), fmt(r.avgRate), fmt(r.totalAmount)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([custHeaders, ...custBody]), "Customer Breakdown");

  XLSX.writeFile(wb, `Yearly_Report_${year}.xlsx`);
}