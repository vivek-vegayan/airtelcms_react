/** Splits a DB shift string like "A (8 AM - 5 PM)" into a short code + time
 *  range, so compact UI (chips, dropdown rows) can show the code prominently
 *  and the range as secondary text instead of one long unbroken label.
 *  Shifts with no parenthetical (e.g. "WO") return a null range. */
export interface ParsedShift {
  code: string;
  range: string | null;
}

export function parseShift(shift: string): ParsedShift {
  const match = shift.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { code: shift.trim(), range: null };
  return { code: match[1].trim(), range: match[2].trim() };
}

// ─── Time-of-day color coding ──────────────────────────────────────────────
// The standard roster/scheduling convention: warm colors for daylight hours,
// cool/dark for night, neutral for an off day — so a shift's color alone
// tells you roughly when it falls, before reading the label. Colors are
// pulled from the app's own theme (src/style/theme.ts) rather than a
// separate hardcoded palette, so a shift chip automatically follows dark
// mode and the user's selected brand accent (Header's theme-color swatch)
// exactly like every other themed surface in the app.

import { darken, type Theme } from "@mui/material/styles";

export type ShiftBucket = "morning" | "afternoon" | "evening" | "night" | "off";

function startHour24(range: string): number | null {
  const m = range.match(/(\d{1,2})(?:[:.]\d{2})?\s*(AM|PM)/i);
  if (!m) return null;
  const hour12 = parseInt(m[1], 10) % 12;
  return /PM/i.test(m[2]) ? hour12 + 12 : hour12;
}

export function shiftBucket(range: string | null): ShiftBucket {
  if (!range) return "off";
  const hour = startHour24(range);
  if (hour === null) return "off";
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/** Maps a shift's time bucket onto the app theme's own palette:
 *  warning (amber) for morning, info (blue) for afternoon, the brand
 *  primary for evening, a darkened primary for night, and the standard
 *  disabled/muted tone for an off day — no colors outside theme.palette. */
export function shiftColor(range: string | null, theme: Theme): string {
  switch (shiftBucket(range)) {
    case "morning":
      return theme.palette.warning.main;
    case "afternoon":
      return theme.palette.info.main;
    case "evening":
      return theme.palette.primary.main;
    case "night":
      return darken(theme.palette.primary.main, 0.35);
    case "off":
    default:
      return theme.palette.text.disabled;
  }
}
