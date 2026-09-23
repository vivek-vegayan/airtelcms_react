// ─────────────────────────────────────────────────────────
// utils/goldenSet.utils.ts
// ─────────────────────────────────────────────────────────
import type {
  GoldenSetApiRow,
  GoldenSetEmployee,
  RowSummary,
} from "../types/goldenSet.types";

/** Shift codes present in the API response */
export const SHIFT_CODES = ["A", "B", "G", "LG", "N", "WO"] as const;
export type ShiftCode = (typeof SHIFT_CODES)[number];

export const DOW_SHORT = ["M", "T", "W", "T", "F", "S", "S"] as const;
export const DOW_LONG = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
] as const;

/** Shift color tokens — covers both API codes (incl. WO) and legacy codes */
export const SHIFT_META: Record<
  string,
  { bg: string; bgDark: string; text: string; textDark: string; solid: string; label: string }
> = {
  A:   { bg: "#FFF9E6", bgDark: "rgba(245,158,11,0.15)",  text: "#92400E", textDark: "#FBBF24", solid: "#F59E0B", label: "Alpha"    },
  B:   { bg: "#EFF6FF", bgDark: "rgba(37,99,235,0.15)",   text: "#1E40AF", textDark: "#93C5FD", solid: "#3B82F6", label: "Bravo"    },
  G:   { bg: "#F8FAFC", bgDark: "rgba(100,116,139,0.15)", text: "#475569", textDark: "#E2E8F0", solid: "#64748B", label: "Golf"     },
  LG:  { bg: "#ECFDF5", bgDark: "rgba(16,185,129,0.15)",  text: "#065F46", textDark: "#34D399", solid: "#10B981", label: "Lima Golf"},
  N:   { bg: "#EEF2FF", bgDark: "rgba(79,70,229,0.15)",   text: "#3730A3", textDark: "#A5B4FC", solid: "#6366F1", label: "Night"    },
  WO:  { bg: "#FFF5F5", bgDark: "rgba(239,68,68,0.15)",   text: "#9B1C1C", textDark: "#FCA5A5", solid: "#EF4444", label: "Week Off" },
  OFF: { bg: "#FFF5F5", bgDark: "rgba(239,68,68,0.15)",   text: "#9B1C1C", textDark: "#FCA5A5", solid: "#EF4444", label: "Off Day"  },
};

export const LEVEL_META: Record<string, { bg: string; text: string; solid: string }> = {
  L1: { bg: "#F0FDF4", text: "#166534", solid: "#22C55E" },
  L2: { bg: "#EFF6FF", text: "#1E40AF", solid: "#3B82F6" },
  L3: { bg: "#FFF7ED", text: "#9A3412", solid: "#F97316" },
  L4: { bg: "#FDF4FF", text: "#6B21A8", solid: "#A855F7" },
};

export const MONO =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

// ── Normalise API row → GoldenSetEmployee ──────────────────
export function normaliseRow(row: GoldenSetApiRow): GoldenSetEmployee {
  const shifts: string[] = [];
  for (let w = 1; w <= 6; w++) {
    for (let d = 1; d <= 7; d++) {
      const key = `W${w}D${d}` as keyof GoldenSetApiRow;
      shifts.push((row[key] as string) ?? "WO");
    }
  }
  return {
    prefId: row.prefId,
    olmid: row.olmid,
    name: row.employeeName,
    role: row.employeeRoll,
    level: row.employeeLevel,
    shifts,
  };
}

// ── Per-row summary ────────────────────────────────────────
export function summarise(shifts: string[]): RowSummary {
  const off = shifts.filter((s) => s === "WO" || s === "OFF").length;
  const night = shifts.filter((s) => s === "N").length;
  const work = shifts.length - off;
  return { work, off, night, loadPct: Math.round((work / shifts.length) * 100) };
}

// ── Column totals (by shift code) ─────────────────────────
export function colTotals(
  emps: GoldenSetEmployee[],
  colIndex: number
): Record<string, number> {
  const counts: Record<string, number> = {};
  SHIFT_CODES.forEach((c) => (counts[c] = 0));
  emps.forEach((e) => {
    const code = e.shifts[colIndex];
    if (code) counts[code] = (counts[code] ?? 0) + 1;
  });
  return counts;
}

// ── Span totals ────────────────────────────────────────────
export function spanTotals(
  emps: GoldenSetEmployee[],
  from: number,
  len: number
): Record<string, number> {
  const counts: Record<string, number> = {};
  SHIFT_CODES.forEach((c) => (counts[c] = 0));
  emps.forEach((e) => {
    e.shifts.slice(from, from + len).forEach((code) => {
      if (code) counts[code] = (counts[code] ?? 0) + 1;
    });
  });
  return counts;
}

export function workingCount(counts: Record<string, number>): number {
  return Object.entries(counts)
    .filter(([k]) => k !== "WO" && k !== "OFF")
    .reduce((s, [, v]) => s + v, 0);
}

// ── Initials ───────────────────────────────────────────────
export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}