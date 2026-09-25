import dayjs from "dayjs";
import { saveAs } from "file-saver";
import type { Cell } from "exceljs";
import { isFutureDate } from "./dateUtils";
import type { UserRoster } from "../types/monthlyRoster.type";

export interface ShiftOption {
  shiftId: number;
  shiftRange: string;
}

/** One cell whose uploaded shift differs from the current roster. */
export interface RosterImportChange {
  userId: number;
  olmid: string;
  employeeName: string;
  date: string;
  fromShift: string;
  toShift: string;
  shiftId: number;
}

export interface RosterImportIssue {
  row: number;
  column: string;
  message: string;
}

export interface RosterImportParseResult {
  changes: RosterImportChange[];
  issues: RosterImportIssue[];
  /** Cells that matched the current roster (or were blank) and were skipped. */
  unchangedCount: number;
}

const SHEET_NAME = "Roster";
const INFO_HEADERS = ["User ID", "OLM ID", "Employee Name", "Job Level"];
const FIRST_DATE_COL = INFO_HEADERS.length + 1;
/** One calendar month (31 days) plus slack for a week spanning two months. */
const MAX_RANGE_DAYS = 37;

const normalize = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();

/* ═══════════════════════════ Template ═══════════════════════════════════ */

/**
 * Template = the current roster for the selected range, pre-filled, with a
 * dropdown of valid shifts on every editable (future) date cell. Users change
 * only the cells they want and upload it back; unchanged cells are ignored.
 */
export async function downloadRosterTemplate({
  users,
  dates,
  shiftOptions,
}: {
  users: UserRoster[];
  dates: string[];
  shiftOptions: ShiftOption[];
}) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  // Added first so Excel opens on the grid.
  const ws = wb.addWorksheet(SHEET_NAME, {
    views: [{ state: "frozen", xSplit: INFO_HEADERS.length, ySplit: 1 }],
  });

  /* ── Instructions ─────────────────────────────────────────────────── */
  const help = wb.addWorksheet("Instructions");
  help.getColumn(1).width = 110;
  [
    "Roster Import – How to use",
    "",
    `1. Go to the "${SHEET_NAME}" sheet. It is pre-filled with the current roster (empty if the roster isn't generated yet).`,
    "2. Fill or change the cells you want to update, picking a shift from the dropdown.",
    "3. Leave a cell as it is (or blank) to keep the current shift.",
    "4. Grey columns are today or past dates – they cannot be changed and are ignored if unchanged.",
    "5. Do not edit the User ID / OLM ID columns, the date headers, or add new rows.",
    "6. Save the file and upload it from Roster View → Import. You'll see a preview before anything is saved.",
  ].forEach((line, i) => {
    const cell = help.getCell(i + 1, 1);
    cell.value = line;
    if (i === 0) cell.font = { bold: true, size: 14 };
  });

  /* ── Valid shifts (hidden, drives the dropdown) ───────────────────── */
  const shiftSheet = wb.addWorksheet("Shifts", { state: "hidden" });
  shiftOptions.forEach((s, i) => {
    shiftSheet.getCell(i + 1, 1).value = s.shiftRange;
  });

  /* ── Roster grid ──────────────────────────────────────────────────── */
  const header = ws.addRow([
    ...INFO_HEADERS,
    ...dates.map((d) => `${d}\n${dayjs(d).format("ddd")}`),
  ]);
  header.height = 32;
  header.eachCell((cell, col) => {
    const editable = col >= FIRST_DATE_COL && isFutureDate(dates[col - FIRST_DATE_COL]);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: col < FIRST_DATE_COL || editable ? "FFED1C24" : "FF9CA3AF" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  const listFormula = `Shifts!$A$1:$A$${Math.max(shiftOptions.length, 1)}`;
  const editableCols = dates.map((d) => isFutureDate(d));

  users.forEach((u) => {
    const row = ws.addRow([
      u.userId,
      u.olmid ?? "",
      u.employeeName ?? "",
      u.jobLevel ?? "",
      ...dates.map((d) => u.roster?.[d]?.shiftDisplay?.trim() ?? ""),
    ]);
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.font = { size: 10 };
      if (col < FIRST_DATE_COL) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
        return;
      }
      cell.alignment = { horizontal: "center" };
      if (!editableCols[col - FIRST_DATE_COL]) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
        cell.font = { size: 10, color: { argb: "FF9CA3AF" } };
        return;
      }
      if (shiftOptions.length) {
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [listFormula],
          showErrorMessage: true,
          errorStyle: "stop",
          errorTitle: "Invalid shift",
          error: "Pick a shift from the dropdown list.",
        };
      }
    });
  });

  ws.getColumn(1).width = 10;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 26;
  ws.getColumn(4).width = 11;
  const widest = Math.max(12, ...shiftOptions.map((s) => s.shiftRange.length));
  dates.forEach((_, i) => {
    ws.getColumn(FIRST_DATE_COL + i).width = Math.min(widest + 2, 28);
  });

  const buf = await wb.xlsx.writeBuffer();
  const range = dates.length ? `${dates[0]}_to_${dates[dates.length - 1]}` : "roster";
  saveAs(new Blob([buf]), `Roster_Import_Template_${range}.xlsx`);
}

/* ═══════════════════════════ Parsing ════════════════════════════════════ */

function cellText(cell: Cell): string {
  const v = cell.value;
  if (v == null) return "";
  if (v instanceof Date) return dayjs(v).format("YYYY-MM-DD");
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return v.result == null ? "" : String(v.result);
    if ("text" in v) return String(v.text);
  }
  return String(v);
}

/** Read the date from a header cell ("2026-09-01\nTue", or a real Excel date). */
function headerDate(cell: Cell): string | null {
  if (cell.value instanceof Date) return dayjs(cell.value).format("YYYY-MM-DD");
  const m = cellText(cell).match(/\d{4}-\d{2}-\d{2}/);
  return m && dayjs(m[0]).format("YYYY-MM-DD") === m[0] ? m[0] : null;
}

/**
 * Parse an uploaded template. The file's own date headers decide which roster
 * period it targets (this week, next month, …); `loadRoster` fetches the
 * current roster for exactly that range, so the upload doesn't depend on
 * what's on screen. Only cells that differ from that roster become changes;
 * anything that can't be applied (unknown employee/shift, past date) is
 * reported as an issue instead of being sent.
 */
export async function parseRosterImportFile(
  file: File,
  {
    shiftOptions,
    loadRoster,
  }: {
    shiftOptions: ShiftOption[];
    /** Throws (with a user-facing message) if no roster exists for the range. */
    loadRoster: (startDate: string, endDate: string) => Promise<UserRoster[]>;
  },
): Promise<RosterImportParseResult & { startDate: string; endDate: string }> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());

  const ws = wb.getWorksheet(SHEET_NAME) ?? wb.worksheets.find((s) => s.state !== "hidden");
  if (!ws) throw new Error("The file has no roster sheet.");

  const headerRow = ws.getRow(1);
  if (normalize(cellText(headerRow.getCell(1))) !== "user id") {
    throw new Error(
      'This doesn\'t look like the roster template (expected "User ID" in cell A1). Download the template and try again.',
    );
  }

  const issues: RosterImportIssue[] = [];
  const changes: RosterImportChange[] = [];
  let unchangedCount = 0;

  // Map each date column once; bad headers are reported once, not per row.
  const dateCols: { col: number; date: string }[] = [];
  const seenDates = new Set<string>();
  for (let col = FIRST_DATE_COL; col <= headerRow.cellCount; col++) {
    const label = cellText(headerRow.getCell(col)).split("\n")[0].trim();
    if (!label) continue;
    const date = headerDate(headerRow.getCell(col));
    if (!date) {
      issues.push({ row: 1, column: label, message: "Header is not a date (YYYY-MM-DD)." });
    } else if (seenDates.has(date)) {
      issues.push({ row: 1, column: date, message: "Date column appears more than once; duplicate ignored." });
    } else {
      seenDates.add(date);
      dateCols.push({ col, date });
    }
  }

  if (!dateCols.length) throw new Error("No date columns found in the header row.");
  const sorted = [...seenDates].sort();
  const startDate = sorted[0];
  const endDate = sorted[sorted.length - 1];
  if (dayjs(endDate).diff(dayjs(startDate), "day") > MAX_RANGE_DAYS) {
    throw new Error(
      `The file covers ${startDate} to ${endDate}. Import at most one month at a time – download a fresh template for the month you need.`,
    );
  }

  const users = await loadRoster(startDate, endDate);
  const shiftByName = new Map(shiftOptions.map((s) => [normalize(s.shiftRange), s]));
  const userById = new Map(users.map((u) => [String(u.userId), u]));
  const userByOlm = new Map(users.map((u) => [normalize(u.olmid ?? ""), u]));

  const seenUsers = new Set<number>();

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const idText = cellText(row.getCell(1)).trim();
    const olmText = cellText(row.getCell(2)).trim();
    if (!idText && !olmText) return;

    const user = userById.get(idText) ?? userByOlm.get(normalize(olmText));
    if (!user) {
      issues.push({
        row: rowNumber,
        column: "User ID",
        message: `Employee ${idText || olmText} is not in the selected Domain / Sub Domain roster.`,
      });
      return;
    }
    if (seenUsers.has(user.userId)) {
      issues.push({ row: rowNumber, column: "User ID", message: `${user.olmid} appears more than once; row skipped.` });
      return;
    }
    seenUsers.add(user.userId);

    for (const { col, date } of dateCols) {
      const value = cellText(row.getCell(col)).trim();
      const current = user.roster?.[date];
      const currentDisplay = current?.shiftDisplay?.trim() ?? "";

      if (!value || normalize(value) === normalize(currentDisplay)) {
        unchangedCount++;
        continue;
      }
      if (!isFutureDate(date)) {
        issues.push({ row: rowNumber, column: date, message: `${user.olmid}: today and past dates can't be changed.` });
        continue;
      }
      const shift = shiftByName.get(normalize(value));
      if (!shift) {
        issues.push({ row: rowNumber, column: date, message: `${user.olmid}: "${value}" is not a valid shift.` });
        continue;
      }
      changes.push({
        userId: user.userId,
        olmid: user.olmid,
        employeeName: user.employeeName,
        date,
        fromShift: currentDisplay || "—",
        toShift: shift.shiftRange,
        shiftId: shift.shiftId,
      });
    }
  });

  return { changes, issues, unchangedCount, startDate, endDate };
}
