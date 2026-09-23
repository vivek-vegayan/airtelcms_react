
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
// import { EmployeeExportDoc } from "../components/export/EmployeeExportDoc";
import React from "react";
import { EmployeeExportDoc } from "../components/export/EmployeeExportDoc";

export type ExportFormat = "excel" | "pdf" | "csv";

interface ExportConfig {
  format: ExportFormat;
  rows: Record<string, any>[];
  selectedColumns: string[];
  orientation?: "landscape" | "portrait";
}

// Maps display column labels (from ExportPanel) → actual data keys
export const COLUMN_KEY_MAP: Record<string, string> = {
  "OLM ID": "olmId",
  "Employee Name": "employeeName",
  "Email ID": "emailId",
  "Mobile No": "mobileNo",
  "Employment Type": "employmentType",
  "Designation": "designation",
  "Job Level": "jobLevel",
  "Office Location": "officeLocation",
  "Device Vendor": "deviceVendorCapability",
  "Date of Joining": "dateOfJoining",
  "Role Code": "roleCode",
};

export const useExport = () => {
  const exportData = async ({
    format,
    rows,
    selectedColumns,
    orientation = "landscape",
  }: ExportConfig) => {
    // Map display labels → data keys, filter only visible keys
    const keys = selectedColumns
      .map((col) => COLUMN_KEY_MAP[col])
      .filter(Boolean);

    const headers = selectedColumns.filter((col) => COLUMN_KEY_MAP[col]);

    if (format === "excel") {
      await exportExcel(rows, keys, headers);
    } else if (format === "csv") {
      exportCsv(rows, keys, headers);
    } else if (format === "pdf") {
      await exportPdf(rows, keys, headers, orientation);
    }
  };

  return { exportData };
};

/* ── Excel ── */
async function exportExcel(
  rows: Record<string, any>[],
  keys: string[],
  headers: string[]
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Employees");

  // Header row with Airtel red background
  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFED1C24" }, // Airtel red
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    };
  });
  headerRow.height = 22;

  // Data rows with alternating fill
  rows.forEach((row, idx) => {
    const values = keys.map((k) => row[k] ?? "");
    const dataRow = ws.addRow(values);
    dataRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFFFFFFF" : "FFF7F7F7" },
      };
      cell.font = { size: 10 };
      cell.alignment = { vertical: "middle" };
    });
    dataRow.height = 18;
  });

  // Auto column widths
  ws.columns.forEach((col, i) => {
    const maxLen = Math.max(
      headers[i]?.length ?? 10,
      ...rows.map((r) => String(keys[i] ? r[keys[i]] ?? "" : "").length)
    );
    col.width = Math.min(Math.max(maxLen + 4, 12), 40);
  });

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf]), `employees_${Date.now()}.xlsx`);
}

/* ── CSV ── */
function exportCsv(
  rows: Record<string, any>[],
  keys: string[],
  headers: string[]
) {
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      keys
        .map((k) => {
          const v = row[k] ?? "";
          return String(v).includes(",") ? `"${v}"` : v;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  saveAs(blob, `employees_${Date.now()}.csv`);
}

/* ── PDF ── */
async function exportPdf(
  rows: Record<string, any>[],
  keys: string[],
  headers: string[],
  orientation: "landscape" | "portrait"
) {
  const doc = React.createElement(EmployeeExportDoc, {
    rows,
    keys,
    headers,
    orientation,
  });
  const blob = await pdf(doc).toBlob();
  saveAs(blob, `employees_${Date.now()}.pdf`);
}