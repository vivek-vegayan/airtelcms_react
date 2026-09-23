import type { GoldenSetApiRow } from "../../types/goldenSet.types";
import type { DailyGoldenSetPayload } from "../../api/rosterGenerationApiSlice";
import type { FilterState } from "./RosterFilterDrawer";
import type {
  GoldenSetEmployee,
  ShiftColor,
  ShiftSummary,
} from "./goldenGrid.types";
import { DEFAULT_SHIFT_COLOR, shiftColorMap, TOTAL_COLS } from "./goldenGrid.constants";

export function getShiftColor(code: string): ShiftColor {
  if (!code) return DEFAULT_SHIFT_COLOR;
  return (
    shiftColorMap.get(code) ?? shiftColorMap.get(code[0]) ?? DEFAULT_SHIFT_COLOR
  );
}

export function transformApiRowToEmployee(
  row: GoldenSetApiRow,
): GoldenSetEmployee {
  const shifts: string[] = [];
  for (let week = 1; week <= 6; week++) {
    for (let day = 1; day <= 7; day++) {
      // Lower-case "w" to match the API's actual JSON keys — see the note
      // on GoldenSetApiRow.
      const key = `w${week}D${day}` as keyof GoldenSetApiRow;
      const shiftCode = row[key];
      shifts.push(typeof shiftCode === "string" ? shiftCode : "");
    }
  }
  return {
    prefId: row.prefId,
    name: row.employeeName,
    olmid: row.olmid,
    role: row.employeeRoll,
    level: row.employeeLevel,
    shifts,
  };
}

export function transformApiDataToEmployees(
  apiRows: GoldenSetApiRow[],
): GoldenSetEmployee[] {
  return apiRows.map(transformApiRowToEmployee);
}

export function buildDailyGoldenSetPayload(
  emp: GoldenSetEmployee,
): DailyGoldenSetPayload {
  const fields: Record<string, string> = {};
  for (let w = 1; w <= 6; w++) {
    for (let d = 1; d <= 7; d++) {
      const idx = (w - 1) * 7 + (d - 1);
      const code = emp.shifts[idx] ?? "W";
      // Lower-case "w" — DailyGoldenSetRequestDto's fields (W1D1 etc.)
      // deserialize under the same mangled name (w1D1..w6D7); sending
      // upper-case keys makes Jackson reject the request as an unknown
      // property. See the note on GoldenSetApiRow.
      fields[`w${w}D${d}`] = code;
    }
  }
  return { userId: emp.prefId, ...fields } as DailyGoldenSetPayload;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function summarise(shifts: string[]): ShiftSummary {
  const work = shifts.filter(
    (s) => !["W", "H", "C", "Leave"].includes(s),
  ).length;
  const night = shifts.filter((s) => s === "N").length;
  const off = shifts.filter((s) => ["W", "H", "C"].includes(s)).length;
  const loadPct = Math.round((work / TOTAL_COLS) * 100);
  return { work, night, off, loadPct };
}

export function workingCount(counts: Record<string, number>): number {
  return Object.entries(counts)
    .filter(([k]) => !["W", "H", "C", "Leave"].includes(k))
    .reduce((a, [, v]) => a + v, 0);
}

export function colTotals(
  emps: GoldenSetEmployee[],
  idx: number,
): Record<string, number> {
  const map: Record<string, number> = {};
  emps.forEach((e) => {
    const code = e.shifts[idx] ?? "";
    map[code] = (map[code] ?? 0) + 1;
  });
  return map;
}

export function spanTotals(
  emps: GoldenSetEmployee[],
  from: number,
  to: number,
): Record<string, number> {
  const map: Record<string, number> = {};
  emps.forEach((e) => {
    e.shifts.slice(from, to).forEach((code) => {
      map[code] = (map[code] ?? 0) + 1;
    });
  });
  return map;
}

export const defaultFilter = (): FilterState => ({
  query: "",
  levels: [],
  roles: [],
  shiftCodes: [],
  workRange: [0, TOTAL_COLS],
  nightRange: [0, TOTAL_COLS],
  showHighLoad: false,
  showLowRest: false,
});
