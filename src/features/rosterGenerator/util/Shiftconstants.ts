import type { ShiftCode } from "../types/Futureweek.types";

// ─── Day column helpers ───────────────────────────────────────────────────────

export const DOW_SHORT = [
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
] as const;

export const DOW_LONG = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

// Lower-case "w" to match FutureWeekRow's actual (Jackson-mangled) keys —
// see the note on that type.
export const DAY_KEYS = [
  "w7D1", "w7D2", "w7D3", "w7D4", "w7D5", "w7D6", "w7D7",
] as const;

// ─── Shift display order ──────────────────────────────────────────────────────

export const SHIFT_DISPLAY_ORDER: ShiftCode[] = [
  "A", "B", "G", "LG", "N", "H", "WO", "OFF",
];

// ─── Mapping: raw API value → normalised ShiftCode ───────────────────────────

export const API_TO_SHIFT: Record<string, ShiftCode> = {
  A: "A", B: "B", G: "G", LG: "LG", N: "N", H: "H", WO: "WO", OFF: "OFF",
};

export const SHIFT_TO_API: Record<ShiftCode, string> = {
  A: "A", B: "B", G: "G", LG: "LG", N: "N", H: "H", WO: "WO", OFF: "OFF",
};

// ─── Shift colour tokens ──────────────────────────────────────────────────────

export interface ShiftTokens {
  label: string;
  solid: string;
  bgLight: string;
  bgDark: string;
  fgLight: string;
  fgDark: string;
  borderLight: string;
  borderDark: string;
}

export const SHIFT_COLORS: Record<ShiftCode, ShiftTokens> = {
  A: {
    label: "Alpha",
    solid: "#6B21A8",
    bgLight: "#F5F3FF", bgDark: "#2D1B69",
    fgLight: "#6B21A8", fgDark: "#C4B5FD",
    borderLight: "#C4B5FD", borderDark: "#7C3AED",
  },
  B: {
    label: "Bravo",
    solid: "#155E75",
    bgLight: "#ECFEFF", bgDark: "#164E63",
    fgLight: "#155E75", fgDark: "#67E8F9",
    borderLight: "#67E8F9", borderDark: "#0891B2",
  },
  G: {
    label: "Golf",
    solid: "#1D4ED8",
    bgLight: "#EFF6FF", bgDark: "#1E3A8A",
    fgLight: "#1D4ED8", fgDark: "#93C5FD",
    borderLight: "#93C5FD", borderDark: "#3B82F6",
  },
  LG: {
    label: "Lima Golf",
    solid: "#065F46",
    bgLight: "#ECFDF5", bgDark: "#064E3B",
    fgLight: "#065F46", fgDark: "#6EE7B7",
    borderLight: "#6EE7B7", borderDark: "#10B981",
  },
  N: {
    label: "Night",
    solid: "#3730A3",
    bgLight: "#EEF2FF", bgDark: "#1E1B4B",
    fgLight: "#3730A3", fgDark: "#818CF8",
    borderLight: "#818CF8", borderDark: "#6366F1",
  },
  H: {
    label: "Holiday",
    solid: "#C2410C",
    bgLight: "#FFF7ED", bgDark: "#431407",
    fgLight: "#C2410C", fgDark: "#FDBA74",
    borderLight: "#FDBA74", borderDark: "#EA580C",
  },
  WO: {
    label: "Week Off",
    solid: "#475569",
    bgLight: "#F8FAFC", bgDark: "#1E293B",
    fgLight: "#475569", fgDark: "#94A3B8",
    borderLight: "#CBD5E1", borderDark: "#475569",
  },
  OFF: {
    label: "Off Day",
    solid: "#B91C1C",
    bgLight: "#FEF2F2", bgDark: "#450A0A",
    fgLight: "#B91C1C", fgDark: "#FCA5A5",
    borderLight: "#FCA5A5", borderDark: "#DC2626",
  },
};

// ─── Level colour tokens ──────────────────────────────────────────────────────

export interface LevelTokens {
  bg: string;
  text: string;
  solid: string;
}

export const LEVEL_COLORS: Record<string, LevelTokens> = {
  L1: { bg: "#F0FDF4", text: "#166534", solid: "#22C55E" },
  L2: { bg: "#EFF6FF", text: "#1E40AF", solid: "#3B82F6" },
  L3: { bg: "#FFF7ED", text: "#9A3412", solid: "#F97316" },
  L4: { bg: "#FDF4FF", text: "#6B21A8", solid: "#A855F7" },
};

// ─── Monospace font stack ─────────────────────────────────────────────────────

export const MONO =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";