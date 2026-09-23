import { alpha } from "@mui/material/styles";
import {
  getShiftStyle,
  resolveShiftKeyFromDisplay,
} from "../../../roster/constant/shiftPalette";

export interface ShiftColorTriple {
  background: string;
  color: string;
  border: string;
  /** Human-readable name for the code, e.g. "N" -> "Night". */
  label: string;
}

/**
 * Codes shown in the roster legend — working shifts first, then off/leave
 * statuses. Kept as codes only (no full-word duplicates like "Leave", which
 * is already "L") so the legend, the calendar cells and the weekly/monthly
 * roster views all speak the same language.
 */
export const LEGEND_CODES = [
  "G",
  "LG",
  "A",
  "B",
  "N",
  "W",
  "H",
  "L",
  "C",
] as const;

const toTriple = (code: string): ShiftColorTriple => {
  const style = getShiftStyle(code);
  return {
    background: style.cardBg,
    color: style.textColor,
    border: style.cardBorder,
    label: style.label,
  };
};

// Colors/labels come from the shared palette so a code looks identical here
// and in the scheduler's roster views.
export const shiftColorMap = new Map<string, ShiftColorTriple>(
  LEGEND_CODES.map((code) => [code, toTriple(code)]),
);

const DEFAULT_SHIFT_COLORS: ShiftColorTriple = {
  background: "#F1F5F9",
  color: "#475569",
  border: "#CBD5E1",
  label: "Unassigned",
};

/** Resolve the color triple for a shift display/title (e.g. "N (10 PM - 7 AM)", "WO"). */
export const getShiftColors = (title: string): ShiftColorTriple => {
  const code = resolveShiftKeyFromDisplay(title.split("(")[0].trim());
  return shiftColorMap.get(code) || DEFAULT_SHIFT_COLORS;
};

/**
 * Mode-aware version of the triple above, plus the accent hue and shift
 * time. `ShiftColorTriple` is light-mode only (its hexes are baked light
 * tints) and is consumed by the dashboard, so rather than change it this
 * adds the dark branch alongside — the same tint/border/text recipe the
 * scheduler's Monthly grid uses, so a code reads identically in both
 * surfaces and both themes.
 */
export interface ShiftVisual {
  /** Fill behind the shift pill. */
  bg: string;
  /** Pill border. */
  border: string;
  /** Pill text. */
  fg: string;
  /** Saturated hue for dots, legend swatches and focus rings. */
  accent: string;
  label: string;
  /** Canonical shift window, e.g. "10:00 PM – 7:00 AM" ("—" for off days). */
  time: string;
}

export const getShiftVisual = (code: string, isDark: boolean): ShiftVisual => {
  const style = getShiftStyle(code);

  return {
    bg: isDark ? alpha(style.badgeBg, 0.16) : style.cardBg,
    border: isDark ? alpha(style.badgeBg, 0.34) : style.cardBorder,
    fg: isDark ? style.textColorDark : style.textColor,
    accent: style.badgeBg,
    label: style.label,
    time: style.time,
  };
};

/** Same as above but starting from a display string rather than a code. */
export const getShiftVisualFromTitle = (
  title: string,
  isDark: boolean,
): ShiftVisual =>
  getShiftVisual(resolveShiftKeyFromDisplay(title.split("(")[0].trim()), isDark);
