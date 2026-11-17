import { toast } from "react-toastify";
import { exportRowsToExcel, type ExcelColumn } from "../../crqAnalytics/utils/excelExport";
import type { P1Column } from "../components/P1Table";

const fileSafe = (s: string) =>
  s
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "export";

/** Excel sheet names: at most 31 characters, none of \ / ? * [ ] : */
const sheetSafe = (s: string) => s.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet1";

/**
 * Downloads a card table as .xlsx through the app's shared Excel exporter. Only columns that
 * declare `exportValue` are written, with the raw values (not the rendered cell).
 */
export async function exportP1Table<R>(title: string, columns: readonly P1Column<R>[], rows: readonly R[]) {
  const cols = columns.filter((c) => c.exportValue);
  if (!cols.length || !rows.length) {
    toast.info("Nothing to download for this selection.");
    return;
  }
  const excelColumns: ExcelColumn[] = cols.map((c, i) => ({
    header: c.exportHeader ?? (typeof c.header === "string" ? c.header : c.key),
    key: `c${i}`,
  }));
  const data = rows.map((r) => Object.fromEntries(cols.map((c, i) => [`c${i}`, c.exportValue?.(r) ?? ""])));
  try {
    await exportRowsToExcel(data, excelColumns, sheetSafe(title), fileSafe(title));
  } catch {
    toast.error("Could not create the Excel file.");
  }
}

/** Downloads plain objects (the drill-down CRQ list) with one column per key. */
export async function exportP1Objects(title: string, rows: readonly object[], headers: Record<string, string>) {
  if (!rows.length) {
    toast.info("Nothing to download.");
    return;
  }
  const excelColumns: ExcelColumn[] = Object.entries(headers).map(([key, header]) => ({ key, header }));
  try {
    await exportRowsToExcel([...rows], excelColumns, sheetSafe(title), fileSafe(title));
  } catch {
    toast.error("Could not create the Excel file.");
  }
}
