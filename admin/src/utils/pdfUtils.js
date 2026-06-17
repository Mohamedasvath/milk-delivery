import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = {
  primary: [37, 99, 235],      // blue-600
  secondary: [59, 130, 246],   // blue-500
  success: [16, 185, 129],     // emerald-600
  danger: [239, 68, 68],       // red-500
  text: [30, 30, 30],          // slate-900
  lightText: [100, 116, 139],  // slate-500
  lightBg: [241, 245, 250],    // slate-100
};

const fmt = (n) => Number(n || 0).toFixed(2);
const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ─── COMMON HEADER ───────────────────────────────────────────────────────────

const addHeader = (doc, title, subtitle, ownerName, date) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Blue gradient background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, "bold");
  doc.text(title, 15, 18);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(subtitle, 15, 26);

  // Owner and date info
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightText);
  const infoText = `${ownerName} • Generated: ${new Date().toLocaleString("en-IN")}`;
  doc.text(infoText, pageWidth - 15, 18, { align: "right" });

  if (date) {
    doc.text(date, pageWidth - 15, 26, { align: "right" });
  }

  return 45; // Return Y position for next content
};

// ─── COMMON FOOTER ───────────────────────────────────────────────────────────

const addFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightText);
  doc.text(
    `Page ${doc.internal.getNumberOfPages()} of ${doc.internal.getPages().length}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );
};

// ─── SUMMARY SECTION ─────────────────────────────────────────────────────────

const addSummarySection = (doc, yPos, summary, fields) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 30) / fields.length;

  fields.forEach((field, idx) => {
    const x = 15 + idx * boxWidth;

    // Box background
    doc.setFillColor(...COLORS.lightBg);
    doc.rect(x, yPos, boxWidth - 5, 22, "F");
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.rect(x, yPos, boxWidth - 5, 22);

    // Label
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.lightText);
    doc.setFont(undefined, "normal");
    doc.text(field.label, x + 4, yPos + 6);

    // Value
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.setFont(undefined, "bold");
    const value = field.format ? field.format(summary[field.key]) : summary[field.key];
    doc.text(String(value), x + 4, yPos + 16);
  });

  return yPos + 28;
};

// ─── GENERATE DAILY PDF ──────────────────────────────────────────────────────

export const generateDailyPDF = ({ date, ownerName, rows, summary }) => {
  const doc = new jsPDF();

  let yPos = addHeader(doc, "Daily Report", date, ownerName, null);

  // Summary boxes
  const summaryFields = [
    { label: "Total Entries", key: "totalCustomers", format: (v) => v },
    { label: "Total Milk (L)", key: "totalMilk", format: (v) => fmt(v) },
    { label: "Total Revenue", key: "totalAmount", format: (v) => fmtINR(v) },
    { label: "Average Rate (₹/L)", key: "avgRate", format: (v) => `₹${fmt(v)}` },
  ];

  yPos = addSummarySection(doc, yPos - 5, summary, summaryFields);

  // Table data
  const tableData = rows.map((row) => [
    row.customerName,
    fmt(row.morningMilk),
    fmt(row.eveningMilk),
    fmt(row.totalMilk),
    `₹${fmt(row.rate)}`,
    fmtINR(row.amount),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Customer", "Morning (L)", "Evening (L)", "Total (L)", "Rate (₹)", "Amount (₹)"]],
    body: tableData,
    theme: "grid",
    headerStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
      4: { halign: "right" },
      5: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: 15, right: 15 },
    didDrawPage: addFooter,
  });

  doc.save(`Daily_Report_${date}.pdf`);
};

// ─── GENERATE MONTHLY PDF ────────────────────────────────────────────────────

export const generateMonthlyPDF = ({
  month,
  monthName,
  year,
  ownerName,
  customerRows,
  summary,
}) => {
  const doc = new jsPDF();

  let yPos = addHeader(doc, "Monthly Report", `${monthName} ${year}`, ownerName, null);

  // Summary boxes
  const summaryFields = [
    { label: "Total Customers", key: "totalCustomers", format: (v) => v },
    { label: "Total Milk (L)", key: "grandMilk", format: (v) => fmt(v) },
    { label: "Total Revenue", key: "grandAmount", format: (v) => fmtINR(v) },
    { label: "Average Rate (₹/L)", key: "avgRate", format: (v) => `₹${fmt(v)}` },
  ];

  yPos = addSummarySection(doc, yPos - 5, summary, summaryFields);

  // Customer data table
  const tableData = customerRows.map((row) => [
    row.customerName,
    fmt(row.totalMorning),
    fmt(row.totalEvening),
    fmt(row.totalMilk),
    `₹${fmt(row.avgRate)}`,
    fmtINR(row.totalAmount),
    row.daysRecorded,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        "Customer",
        "Morning (L)",
        "Evening (L)",
        "Total Milk (L)",
        "Avg Rate (₹)",
        "Total Amount (₹)",
        "Days",
      ],
    ],
    body: tableData,
    theme: "grid",
    headerStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
      4: { halign: "right" },
      5: { halign: "right", fontStyle: "bold" },
      6: { halign: "center" },
    },
    margin: { left: 15, right: 15 },
    didDrawPage: addFooter,
  });

  doc.save(`Monthly_Report_${monthName.toLowerCase()}_${year}.pdf`);
};

// ─── GENERATE YEARLY PDF ─────────────────────────────────────────────────────

export const generateYearlyPDF = ({
  year,
  ownerName,
  months,
  customerRows,
  summary,
}) => {
  const doc = new jsPDF("p", "mm", "a4");

  let yPos = addHeader(doc, "Yearly Report", `Year ${year}`, ownerName, null);

  // Summary boxes
  const summaryFields = [
    { label: "Total Customers", key: "totalCustomers", format: (v) => v },
    { label: "Total Milk (L)", key: "grandMilk", format: (v) => fmt(v) },
    { label: "Total Revenue", key: "grandAmount", format: (v) => fmtINR(v) },
  ];

  yPos = addSummarySection(doc, yPos - 5, summary, summaryFields);

  // Monthly breakdown table
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Monthly Breakdown", 15, yPos);
  yPos += 8;

  const monthTableData = months.map((m) => [
    m.month,
    fmt(m.milk),
    fmtINR(m.amount),
    `₹${fmt(m.avgRate)}`,
    m.entries,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Month", "Milk (L)", "Revenue (₹)", "Avg Rate (₹)", "Entries"]],
    body: monthTableData,
    theme: "grid",
    headerStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "center" },
    },
    margin: { left: 15, right: 15 },
  });

  // Check if we need a new page for customer data
  if (doc.lastAutoTable.finalY > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Customer data table
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Top Customers by Revenue", 15, yPos);
  yPos += 8;

  const customerTableData = customerRows.map((row) => [
    row.customerName,
    fmt(row.totalMilk),
    `₹${fmt(row.avgRate)}`,
    fmtINR(row.totalAmount),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Customer", "Total Milk (L)", "Avg Rate (₹)", "Total Amount (₹)"]],
    body: customerTableData,
    theme: "grid",
    headerStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: 15, right: 15 },
    didDrawPage: addFooter,
  });

  doc.save(`Yearly_Report_${year}.pdf`);
};

// ─── GENERATE DATE RANGE PDF ────────────────────────────────────────────────

export const generateDateRangePDF = ({
  startDate,
  endDate,
  ownerName,
  customerRows,
  summary,
}) => {
  const doc = new jsPDF();

  let yPos = addHeader(
    doc,
    "Date Range Report",
    `${startDate} to ${endDate}`,
    ownerName,
    null
  );

  // Summary boxes
  const summaryFields = [
    { label: "Total Customers", key: "totalCustomers", format: (v) => v },
    { label: "Total Milk (L)", key: "totalMilk", format: (v) => fmt(v) },
    { label: "Total Revenue", key: "totalAmount", format: (v) => fmtINR(v) },
    { label: "Entries", key: "entries", format: (v) => v },
  ];

  yPos = addSummarySection(doc, yPos - 5, summary, summaryFields);

  // Customer table
  const tableData = customerRows.map((row) => [
    row.customerName,
    fmt(row.totalMorning),
    fmt(row.totalEvening),
    fmt(row.totalMilk),
    `₹${fmt(row.avgRate)}`,
    fmtINR(row.totalAmount),
    row.daysRecorded,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        "Customer",
        "Morning (L)",
        "Evening (L)",
        "Total (L)",
        "Avg Rate (₹)",
        "Total (₹)",
        "Days",
      ],
    ],
    body: tableData,
    theme: "grid",
    headerStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
      4: { halign: "right" },
      5: { halign: "right", fontStyle: "bold" },
      6: { halign: "center" },
    },
    margin: { left: 15, right: 15 },
    didDrawPage: addFooter,
  });

  doc.save(`DateRange_Report_${startDate}_to_${endDate}.pdf`);
};

// ─── GENERATE YEAR RANGE PDF ────────────────────────────────────────────────

export const generateYearRangePDF = ({
  startYear,
  endYear,
  ownerName,
  yearlyData,
  customerData,
  summary,
}) => {
  const doc = new jsPDF();

  let yPos = addHeader(
    doc,
    "Year Range Report",
    `${startYear} to ${endYear}`,
    ownerName,
    null
  );

  // Summary boxes
  const summaryFields = [
    { label: "Total Customers", key: "totalCustomers", format: (v) => v },
    { label: "Total Milk (L)", key: "grandMilk", format: (v) => fmt(v) },
    { label: "Total Revenue", key: "grandAmount", format: (v) => fmtINR(v) },
  ];

  yPos = addSummarySection(doc, yPos - 5, summary, summaryFields);

  // Yearly data table
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Year-wise Summary", 15, yPos);
  yPos += 8;

  const yearTableData = yearlyData.map((y) => [
    y.year,
    fmt(y.milk),
    fmtINR(y.amount),
    `₹${fmt(y.avgRate)}`,
    y.entries,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Year", "Milk (L)", "Revenue (₹)", "Avg Rate (₹)", "Entries"]],
    body: yearTableData,
    theme: "grid",
    headerStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "center" },
    },
    margin: { left: 15, right: 15 },
  });

  // Check if we need a new page
  if (doc.lastAutoTable.finalY > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Top customers
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Top Customers", 15, yPos);
  yPos += 8;

  const customerTableData = customerData.map((c) => [
    c.customerName,
    fmt(c.totalMilk),
    `₹${fmt(c.avgRate)}`,
    fmtINR(c.totalAmount),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Customer", "Total Milk (L)", "Avg Rate (₹)", "Total Amount (₹)"]],
    body: customerTableData,
    theme: "grid",
    headerStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: 15, right: 15 },
    didDrawPage: addFooter,
  });

  doc.save(`YearRange_Report_${startYear}_to_${endYear}.pdf`);
};