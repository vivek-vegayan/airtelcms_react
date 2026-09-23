import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/** Generic row → .xlsx export, styled to match the rest of the app's exports
 * (Airtel-red header, alternating row fill) — see teamManagement's useExport
 * for the same pattern; kept separate here since that hook is hardcoded to
 * the employee column set. */
export async function exportRowsToExcel<T extends object>(
  rows: T[],
  columns: ExcelColumn[],
  sheetName: string,
  fileNamePrefix: string,
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  ws.addRow(columns.map((c) => c.header));
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFED1C24" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  headerRow.height = 22;

  rows.forEach((row, idx) => {
    const record = row as Record<string, unknown>;
    const dataRow = ws.addRow(columns.map((c) => record[c.key] ?? ""));
    dataRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFFFFFFF" : "FFF7F7F7" } };
      cell.font = { size: 10 };
      cell.alignment = { vertical: "middle" };
    });
    dataRow.height = 18;
  });

  ws.columns.forEach((col, i) => {
    col.width = columns[i]?.width ?? Math.min(Math.max((columns[i]?.header.length ?? 10) + 4, 12), 40);
  });

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf]), `${fileNamePrefix}_${Date.now()}.xlsx`);
}
