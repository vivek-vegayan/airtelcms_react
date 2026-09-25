import dayjs from "dayjs";
import { saveAs } from "file-saver";
import {
  SHIFT_COLOR_MAP,
  resolveShiftKeyFromDisplay,
} from "../constant/shiftPalette";
import type { UserRoster } from "../types/monthlyRoster.type";

interface RosterExportOptions {
  users: UserRoster[];
  dates: string[];
  /** "Weekly" / "Monthly" — used in the sheet title and file name. */
  viewLabel: string;
}

const argb = (hex: string) => `FF${hex.replace("#", "").toUpperCase()}`;

const INFO_COLUMNS: { header: string; width: number; value: (u: UserRoster) => string }[] = [
  { header: "Employee Name", width: 26, value: (u) => u.employeeName ?? "" },
  { header: "OLM ID", width: 14, value: (u) => u.olmid ?? "" },
  { header: "Job Level", width: 11, value: (u) => u.jobLevel ?? "" },
  { header: "Mobile No", width: 14, value: (u) => u.mobileNo ?? "" },
  { header: "Office Location", width: 20, value: (u) => u.officeLocation ?? "" },
];

/**
 * Exports the roster grid as shown on screen: one row per employee, one
 * column per date, cells tinted with the same shift palette as the UI, and
 * a daily coverage row at the bottom. exceljs is loaded on demand so the
 * roster page doesn't carry it in its initial bundle.
 */
export async function exportRosterToExcel({
  users,
  dates,
  viewLabel,
}: RosterExportOptions) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`${viewLabel} Roster`, {
    views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
  });

  const totalCols = INFO_COLUMNS.length + dates.length;
  const rangeLabel =
    dates.length > 0
      ? `${dayjs(dates[0]).format("DD MMM YYYY")} – ${dayjs(dates[dates.length - 1]).format("DD MMM YYYY")}`
      : "";

  /* ── Title row ─────────────────────────────────────────────────────── */
  ws.mergeCells(1, 1, 1, totalCols);
  const title = ws.getCell(1, 1);
  title.value = `${viewLabel} Roster · ${rangeLabel}`;
  title.font = { bold: true, size: 13 };
  title.alignment = { vertical: "middle" };
  ws.getRow(1).height = 24;

  /* ── Header row ────────────────────────────────────────────────────── */
  const headerRow = ws.addRow([
    ...INFO_COLUMNS.map((c) => c.header),
    ...dates.map((d) => dayjs(d).format("ddd DD-MMM")),
  ]);
  headerRow.height = 22;
  headerRow.eachCell((cell, col) => {
    const isWeekend =
      col > INFO_COLUMNS.length &&
      [0, 6].includes(dayjs(dates[col - INFO_COLUMNS.length - 1]).day());
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isWeekend ? "FFB3151B" : "FFED1C24" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  /* ── Employee rows ─────────────────────────────────────────────────── */
  const thin = { style: "thin" as const, color: { argb: "FFD9D9D9" } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };

  users.forEach((u) => {
    const row = ws.addRow([
      ...INFO_COLUMNS.map((c) => c.value(u)),
      ...dates.map((d) => u.roster?.[d]?.shiftDisplay?.trim() || "-"),
    ]);
    row.height = 18;
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.border = border;
      cell.font = { size: 10 };
      cell.alignment = { vertical: "middle" };
      if (col <= INFO_COLUMNS.length) return;

      const display = u.roster?.[dates[col - INFO_COLUMNS.length - 1]]?.shiftDisplay;
      const style = display ? SHIFT_COLOR_MAP[resolveShiftKeyFromDisplay(display)] : undefined;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (style) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(style.cardBg) } };
        cell.font = { size: 10, bold: true, color: { argb: argb(style.textColor) } };
      }
    });
  });

  /* ── Coverage row (matches CoverageSummaryRow: excludes W and L) ──── */
  const coverage = dates.map(
    (d) =>
      users.filter((u) => {
        const k = resolveShiftKeyFromDisplay(u.roster?.[d]?.shiftDisplay);
        return k !== "W" && k !== "L";
      }).length,
  );
  const coverageRow = ws.addRow([
    `Coverage (of ${users.length})`,
    ...Array(INFO_COLUMNS.length - 1).fill(""),
    ...coverage,
  ]);
  ws.mergeCells(coverageRow.number, 1, coverageRow.number, INFO_COLUMNS.length);
  coverageRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = border;
  });

  /* ── Column widths ─────────────────────────────────────────────────── */
  INFO_COLUMNS.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width;
  });
  dates.forEach((d, i) => {
    const longest = Math.max(
      10,
      ...users.map((u) => (u.roster?.[d]?.shiftDisplay ?? "").length),
    );
    ws.getColumn(INFO_COLUMNS.length + i + 1).width = Math.min(longest + 2, 28);
  });

  /* ── Legend sheet ──────────────────────────────────────────────────── */
  const legend = wb.addWorksheet("Legend");
  legend.columns = [
    { header: "Code", width: 8 },
    { header: "Shift", width: 16 },
    { header: "Timing", width: 22 },
  ];
  legend.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFED1C24" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });
  Object.entries(SHIFT_COLOR_MAP).forEach(([code, s]) => {
    const row = legend.addRow([code, s.label, s.time]);
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(s.cardBg) } };
    row.getCell(1).font = { bold: true, color: { argb: argb(s.textColor) } };
    row.getCell(1).alignment = { horizontal: "center" };
  });

  const buf = await wb.xlsx.writeBuffer();
  const fileRange = dates.length ? `${dates[0]}_to_${dates[dates.length - 1]}` : "roster";
  saveAs(new Blob([buf]), `${viewLabel}_Roster_${fileRange}.xlsx`);
}
