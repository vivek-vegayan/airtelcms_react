import type {
  FutureWeekRow,
  NormalisedEmployee,
  ShiftCode,
  DayColumn,
} from "../types/Futureweek.types";
import { API_TO_SHIFT, DAY_KEYS, DOW_LONG, DOW_SHORT } from "./Shiftconstants";

export function normaliseRows(rows: FutureWeekRow[]): NormalisedEmployee[] {
  return rows.map((row) => ({
    rowKey: row.futureId,
    futureId: row.futureId,
    employeeName: row.employeeName,
    olmid: row.olmid,
    jobLevel: row.jobLevel,
    roleCode: row.roleCode,
    userId: row.userId ?? row.futureId,
    shifts: DAY_KEYS.map((k) => {
      const raw = row[k as keyof FutureWeekRow] as string;
      return API_TO_SHIFT[raw] ?? "G";
    }) as ShiftCode[],
  }));
}

// ─── Build the 7 day-column descriptors ──────────────────────────────────────
// FIX: buildDayColumns takes no arguments — isoYear/isoWeek are not used
// for column labels (they are Mon–Sun regardless of week).

export function buildDayColumns(): DayColumn[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    shortLabel: DOW_SHORT[i],
    longLabel: DOW_LONG[i],
    isWeekend: i === 5 || i === 6,
    isWeekendStart: i === 5,
  }));
}

// ─── Per-employee shift summary ───────────────────────────────────────────────

export interface ShiftSummary {
  work: number;
  night: number;
  off: number;
}

export function shiftSummary(shifts: ShiftCode[]): ShiftSummary {
  let work = 0, night = 0, off = 0;
  for (const s of shifts) {
    if (s === "OFF" || s === "WO") off++;
    else {
      work++;
      if (s === "N") night++;
    }
  }
  return { work, night, off };
}

// ─── Per-column distribution count ───────────────────────────────────────────
// FIX: accept optional pendingCells overlay so distribution reflects
// unsaved edits in the header mini-bars.

export type PendingCellsMap = Record<string, ShiftCode>;

export function colDistribution(
  employees: NormalisedEmployee[],
  dayIndex: number,
  pendingCells?: PendingCellsMap,
): Partial<Record<ShiftCode, number>> {
  const counts: Partial<Record<ShiftCode, number>> = {};
  for (const emp of employees) {
    const key = `${emp.futureId}:${dayIndex}`;
    const code = (pendingCells?.[key] ?? emp.shifts[dayIndex]) as ShiftCode;
    if (code) counts[code] = (counts[code] ?? 0) + 1;
  }
  return counts;
}

// ─── ISO week label ───────────────────────────────────────────────────────────

export function isoWeekLabel(isoYear: number, isoWeek: number): string {
  return `ISO ${isoYear} · Week ${isoWeek}`;
}

// ─── Initials from full name ──────────────────────────────────────────────────

export function nameInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}