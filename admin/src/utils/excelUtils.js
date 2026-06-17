import * as XLSX from "xlsx";

const fmt = (n) => Number(n || 0).toFixed(2);
const fmtINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ─── COMMON WORKBOOK SETUP ───────────────────────────────────────────────────

const createWorkbook = () => {
  return XLSX.utils.book_new();
};

const addStyleSheet = (workbook) => {
  const sheet = XLSX.utils.aoa_to_sheet([]);
  sheet["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
  return sheet;
};

const setCellStyle = (cell, style) => {
  if (!cell) return;
  cell.s = style;
};

// ─── EXPORT DAILY EXCEL ──────────────────────────────────────────────────────

export const exportDailyExcel = ({ date, ownerName, rows, summary }) => {
  const wb = createWorkbook();

  // Summary sheet
  const summaryData = [
    ["Daily Report", date],
    ["Owner", ownerName],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ["Summary"],
    ["Total Entries", summary.totalCustomers],
    ["Total Milk (L)", fmt(summary.totalMilk)],
    ["Total Revenue (₹)", fmt(summary.totalAmount)],
    ["Average Rate (₹/L)", fmt(summary.avgRate)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 20 }];

  // Detail sheet
  const detailData = [
    ["Customer", "Morning (L)", "Evening (L)", "Total (L)", "Rate (₹/L)", "Amount (₹)"],
    ...rows.map((r) => [
      r.customerName,
      fmt(r.morningMilk),
      fmt(r.eveningMilk),
      fmt(r.totalMilk),
      fmt(r.rate),
      fmt(r.amount),
    ]),
    [],
    [
      "TOTAL",
      "",
      "",
      fmt(summary.totalMilk),
      fmt(summary.avgRate),
      fmt(summary.totalAmount),
    ],
  ];

  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  detailSheet["!cols"] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
  ];

  // Freeze header row
  detailSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, detailSheet, "Details");

  XLSX.writeFile(wb, `Daily_Report_${date}.xlsx`);
};

// ─── EXPORT MONTHLY EXCEL ────────────────────────────────────────────────────

export const exportMonthlyExcel = ({
  monthName,
  year,
  ownerName,
  customerRows,
  summary,
}) => {
  const wb = createWorkbook();

  // Summary sheet
  const summaryData = [
    ["Monthly Report", `${monthName} ${year}`],
    ["Owner", ownerName],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ["Summary"],
    ["Total Customers", summary.totalCustomers],
    ["Total Milk (L)", fmt(summary.grandMilk)],
    ["Total Revenue (₹)", fmt(summary.grandAmount)],
    ["Average Rate (₹/L)", fmt(summary.avgRate)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 20 }];

  // Customer data sheet
  const customerData = [
    [
      "Customer",
      "Morning (L)",
      "Evening (L)",
      "Total Milk (L)",
      "Avg Rate (₹)",
      "Total Amount (₹)",
      "Days Recorded",
    ],
    ...customerRows.map((r) => [
      r.customerName,
      fmt(r.totalMorning),
      fmt(r.totalEvening),
      fmt(r.totalMilk),
      fmt(r.avgRate),
      fmt(r.totalAmount),
      r.daysRecorded,
    ]),
    [],
    [
      "TOTAL",
      "",
      "",
      fmt(summary.grandMilk),
      fmt(summary.avgRate),
      fmt(summary.grandAmount),
      "",
    ],
  ];

  const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
  customerSheet["!cols"] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
  ];
  customerSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, customerSheet, "Customers");

  XLSX.writeFile(wb, `Monthly_Report_${monthName.toLowerCase()}_${year}.xlsx`);
};

// ─── EXPORT YEARLY EXCEL ─────────────────────────────────────────────────────

export const exportYearlyExcel = ({
  year,
  ownerName,
  months,
  customerRows,
  summary,
}) => {
  const wb = createWorkbook();

  // Summary sheet
  const summaryData = [
    ["Yearly Report", year],
    ["Owner", ownerName],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ["Summary"],
    ["Total Customers", summary.totalCustomers],
    ["Total Milk (L)", fmt(summary.grandMilk)],
    ["Total Revenue (₹)", fmt(summary.grandAmount)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 20 }];

  // Monthly breakdown sheet
  const monthlyData = [
    ["Month", "Milk (L)", "Revenue (₹)", "Avg Rate (₹)", "Entries"],
    ...months.map((m) => [
      m.month,
      fmt(m.milk),
      fmt(m.amount),
      fmt(m.avgRate),
      m.entries,
    ]),
    [],
    [
      "TOTAL",
      fmt(summary.grandMilk),
      fmt(summary.grandAmount),
      "",
      months.reduce((s, m) => s + m.entries, 0),
    ],
  ];

  const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
  monthlySheet["!cols"] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
  ];
  monthlySheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Customer data sheet
  const customerData = [
    ["Customer", "Total Milk (L)", "Avg Rate (₹)", "Total Amount (₹)"],
    ...customerRows.map((r) => [
      r.customerName,
      fmt(r.totalMilk),
      fmt(r.avgRate),
      fmt(r.totalAmount),
    ]),
    [],
    [
      "TOTAL",
      fmt(summary.grandMilk),
      "",
      fmt(summary.grandAmount),
    ],
  ];

  const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
  customerSheet["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
  ];
  customerSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, monthlySheet, "Monthly");
  XLSX.utils.book_append_sheet(wb, customerSheet, "Customers");

  XLSX.writeFile(wb, `Yearly_Report_${year}.xlsx`);
};

// ─── EXPORT DATE RANGE EXCEL ────────────────────────────────────────────────

export const exportDateRangeExcel = ({
  startDate,
  endDate,
  ownerName,
  customerRows,
  summary,
}) => {
  const wb = createWorkbook();

  // Summary sheet
  const summaryData = [
    ["Date Range Report", `${startDate} to ${endDate}`],
    ["Owner", ownerName],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ["Summary"],
    ["Total Customers", summary.totalCustomers],
    ["Total Milk (L)", fmt(summary.totalMilk)],
    ["Total Revenue (₹)", fmt(summary.totalAmount)],
    ["Total Entries", summary.entries],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 20 }];

  // Customer data sheet
  const customerData = [
    [
      "Customer",
      "Morning (L)",
      "Evening (L)",
      "Total (L)",
      "Avg Rate (₹)",
      "Total Amount (₹)",
      "Days Recorded",
    ],
    ...customerRows.map((r) => [
      r.customerName,
      fmt(r.totalMorning),
      fmt(r.totalEvening),
      fmt(r.totalMilk),
      fmt(r.avgRate),
      fmt(r.totalAmount),
      r.daysRecorded,
    ]),
    [],
    [
      "TOTAL",
      "",
      "",
      fmt(summary.totalMilk),
      "",
      fmt(summary.totalAmount),
      "",
    ],
  ];

  const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
  customerSheet["!cols"] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
  ];
  customerSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, customerSheet, "Data");

  XLSX.writeFile(
    wb,
    `DateRange_Report_${startDate}_to_${endDate}.xlsx`
  );
};

// ─── EXPORT YEAR RANGE EXCEL ────────────────────────────────────────────────

export const exportYearRangeExcel = ({
  startYear,
  endYear,
  ownerName,
  yearlyData,
  customerData,
  summary,
}) => {
  const wb = createWorkbook();

  // Summary sheet
  const summaryData = [
    ["Year Range Report", `${startYear} to ${endYear}`],
    ["Owner", ownerName],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ["Summary"],
    ["Total Customers", summary.totalCustomers],
    ["Total Milk (L)", fmt(summary.grandMilk)],
    ["Total Revenue (₹)", fmt(summary.grandAmount)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 20 }];

  // Yearly data sheet
  const yearData = [
    ["Year", "Milk (L)", "Revenue (₹)", "Avg Rate (₹)", "Entries"],
    ...yearlyData.map((y) => [
      y.year,
      fmt(y.milk),
      fmt(y.amount),
      fmt(y.avgRate),
      y.entries,
    ]),
    [],
    [
      "TOTAL",
      fmt(summary.grandMilk),
      fmt(summary.grandAmount),
      "",
      yearlyData.reduce((s, y) => s + y.entries, 0),
    ],
  ];

  const yearSheet = XLSX.utils.aoa_to_sheet(yearData);
  yearSheet["!cols"] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
  ];
  yearSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Top customers sheet
  const topCustomerData = [
    ["Customer", "Total Milk (L)", "Avg Rate (₹)", "Total Amount (₹)"],
    ...customerData.map((c) => [
      c.customerName,
      fmt(c.totalMilk),
      fmt(c.avgRate),
      fmt(c.totalAmount),
    ]),
    [],
    [
      "TOTAL",
      fmt(summary.grandMilk),
      "",
      fmt(summary.grandAmount),
    ],
  ];

  const customerSheet = XLSX.utils.aoa_to_sheet(topCustomerData);
  customerSheet["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
  ];
  customerSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, yearSheet, "Yearly");
  XLSX.utils.book_append_sheet(wb, customerSheet, "Customers");

  XLSX.writeFile(wb, `YearRange_Report_${startYear}_to_${endYear}.xlsx`);
};