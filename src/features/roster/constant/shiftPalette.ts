/**
 * Single source of truth for shift colors, labels, times and key resolution.
 * Used by both the Weekly and Monthly roster views so the two stay visually
 * consistent. Was previously duplicated in RosterShiftCell, RosterToolbar,
 * MonthlyRosterMain and ShiftLegend.
 */

export interface ShiftStyle {
  badgeBg: string;
  cardBg: string;
  cardBgDark: string;
  cardBorder: string;
  cardBorderDark: string;
  textColor: string;
  textColorDark: string;
  glowColor: string;
  label: string;
  time: string;
}

export const SHIFT_COLOR_MAP: Record<string, ShiftStyle> = {
  G: {
    badgeBg: "#3B82F6",
    cardBg: "#EEF5FF",
    cardBgDark: "#0c1f3d",
    cardBorder: "#C3D9FE",
    cardBorderDark: "#1d4ed8",
    textColor: "#1E40AF",
    textColorDark: "#93c5fd",
    glowColor: "rgba(59,130,246,.22)",
    label: "General",
    time: "9:30 AM – 6:30 PM",
  },
  LG: {
    badgeBg: "#10B981",
    cardBg: "#EDFBF3",
    cardBgDark: "#022c22",
    cardBorder: "#9DECBF",
    cardBorderDark: "#059669",
    textColor: "#065F46",
    textColorDark: "#6ee7b7",
    glowColor: "rgba(16,185,129,.2)",
    label: "Late General",
    time: "11:00 AM – 8:00 PM",
  },
  B: {
    badgeBg: "#F59E0B",
    cardBg: "#FFF8EE",
    cardBgDark: "#2c1800",
    cardBorder: "#FCD97D",
    cardBorderDark: "#d97706",
    textColor: "#854D0E",
    textColorDark: "#fcd34d",
    glowColor: "rgba(245,158,11,.2)",
    label: "B Shift",
    time: "2:00 PM – 10:00 PM",
  },
  N: {
    badgeBg: "#6366F1",
    cardBg: "#F1F0FF",
    cardBgDark: "#1e1b4b",
    cardBorder: "#C0B8FD",
    cardBorderDark: "#4338ca",
    textColor: "#3730A3",
    textColorDark: "#a5b4fc",
    glowColor: "rgba(99,102,241,.22)",
    label: "Night",
    time: "10:00 PM – 7:00 AM",
  },
  A: {
    badgeBg: "#FBBF24",
    cardBg: "#FFFCEE",
    cardBgDark: "#271e00",
    cardBorder: "#FCE98D",
    cardBorderDark: "#b45309",
    textColor: "#78350F",
    textColorDark: "#fde68a",
    glowColor: "rgba(251,191,36,.2)",
    label: "Afternoon",
    time: "2:00 PM – 10:00 PM",
  },
  L: {
    badgeBg: "#EC4899",
    cardBg: "#FEF0FA",
    cardBgDark: "#3b0a20",
    cardBorder: "#F9C4E8",
    cardBorderDark: "#be185d",
    textColor: "#9D174D",
    textColorDark: "#f9a8d4",
    glowColor: "rgba(236,72,153,.2)",
    label: "Leave",
    time: "—",
  },
  H: {
    badgeBg: "#F43F5E",
    cardBg: "#FFF0F2",
    cardBgDark: "#2d0a0e",
    cardBorder: "#FECDD3",
    cardBorderDark: "#be123c",
    textColor: "#881337",
    textColorDark: "#fda4af",
    glowColor: "rgba(244,63,94,.2)",
    label: "Holiday",
    time: "—",
  },
  C: {
    badgeBg: "#94A3B8",
    cardBg: "#F8FAFC",
    cardBgDark: "#1e293b",
    cardBorder: "#E2E8F0",
    cardBorderDark: "#475569",
    textColor: "#475569",
    textColorDark: "#cbd5e1",
    glowColor: "rgba(148,163,184,.15)",
    label: "Comp Off",
    time: "—",
  },
  NJ: {
    badgeBg: "#F59E0B",
    cardBg: "#FFFBEB",
    cardBgDark: "#292000",
    cardBorder: "#FDE68A",
    cardBorderDark: "#92400e",
    textColor: "#78350F",
    textColorDark: "#fcd34d",
    glowColor: "rgba(245,158,11,.18)",
    label: "New Joinee",
    time: "9:00 AM – 5:00 PM",
  },
  W: {
    badgeBg: "#6B7280",
    cardBg: "#F3F4F6",
    cardBgDark: "#1f2937",
    cardBorder: "#9CA3AF",
    cardBorderDark: "#6B7280",
    textColor: "#4B5563",
    textColorDark: "#D1D5DB",
    glowColor: "rgba(107,114,128,.18)",
    label: "Week Off",
    time: "—",
  },
};

export const getShiftStyle = (key: string): ShiftStyle =>
  SHIFT_COLOR_MAP[key] ?? SHIFT_COLOR_MAP.W;

/**
 * Resolve a shift key from the display string alone.
 * Used for filtering / highlighting and by the Monthly view.
 */
export function resolveShiftKeyFromDisplay(
  shiftDisplay?: string | null,
): string {
  const d = (shiftDisplay ?? "").trim();
  if (!d || /^(wo|week\s*off)\b/i.test(d)) return "W";
  if (/^leave\b/i.test(d)) return "L";
  if (/^new\s*joinee\b/i.test(d)) return "NJ";
  if (/^holiday\b/i.test(d)) return "H";
  if (/^(co|comp\s*off)\b/i.test(d)) return "C";
  // Must run before the first-letter fallback, which would read any
  // "L…" display ("LG (11:00 AM - 8:00 PM)", "Late General") as Leave.
  if (/^(l\s*g|late\s*general)\b/i.test(d)) return "LG";
  return d.charAt(0).toUpperCase();
}

/**
 * Resolve a shift key from a full shift object (also honors `type`).
 * Used by the Weekly shift cells.
 */
export function resolveShiftKeyFromShift(shift: any): string {
  const isOff =
    !shift || shift.shiftDisplay === "WO" || shift.type === "Week Off";
  if (isOff) return "W";
  const isLeave =
    shift?.shiftDisplay?.toLowerCase() === "leave" || shift?.type === "Leave";
  if (isLeave) return "L";
  return resolveShiftKeyFromDisplay(shift?.shiftDisplay);
}

export function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
