import { useMemo } from "react";
import { alpha, type Theme } from "@mui/material/styles";
import { useTabColorTokens } from "../../../../style/theme";

/**
 * `useTabColorTokens` is a pure function of `theme` despite its name (its
 * own docblock says so, and `getNotifTokens` aliases it for the same
 * reason). Aliasing keeps the rules-of-hooks lint honest when it is called
 * from inside a `useMemo` factory.
 */
const getTabColorTokens = useTabColorTokens;

/**
 * Design tokens for the roster calendar.
 *
 * Everything the calendar paints resolves through here, derived from the
 * app-wide semantic tokens (`useTabColorTokens`) so the surface hierarchy,
 * borders and accent always track `palette.mode` **and** the user's chosen
 * brand color. The previous implementation hardcoded light-mode hexes
 * (`#e3f2fd` today, `#f5f5f5` hover, a white loading scrim) directly in the
 * component, which is why dark mode looked broken.
 *
 * Dark values are deliberately layered greys-with-blue, not pure black, and
 * accents are alpha tints rather than glows — enterprise/NOC, not neon.
 */
export interface CalendarTokens {
  isDark: boolean;

  /* Surfaces — three steps: page < card < raised chrome */
  surface: string;
  surfaceSubtle: string;
  surfaceHeader: string;
  surfaceRaised: string;

  /* Lines */
  grid: string;
  gridStrong: string;

  /* Text */
  text: string;
  textMuted: string;
  textFaint: string;

  /* Day-cell states */
  weekendBg: string;
  offRangeBg: string;
  offRangeText: string;
  todayBg: string;
  selectedBg: string;
  holidayBg: string;
  hoverBg: string;

  /* Accents */
  accent: string;
  accentContrast: string;
  accentSoft: string;
  accentBorder: string;
  busy: string;
  available: string;
  holiday: string;

  /* Shape + elevation */
  radius: number;
  radiusSm: number;
  shadowCard: string;
  shadowPop: string;
}

/**
 * Memoised on `theme` so the token object keeps a stable identity between
 * renders — the calendar's context value and its compiled `sx` both key off
 * it, and a fresh object every render would re-run both for nothing.
 */
export function useCalendarTokens(theme: Theme): CalendarTokens {
  return useMemo(() => buildCalendarTokens(theme), [theme]);
}

function buildCalendarTokens(theme: Theme): CalendarTokens {
  const tk = getTabColorTokens(theme);
  const isDark = tk.isDark;
  const accent = tk.accent;

  return {
    isDark,

    surface: tk.surface,
    surfaceSubtle: isDark ? "#0F1826" : "#F8FAFC",
    surfaceHeader: isDark ? "#18222F" : "#F7F9FC",
    surfaceRaised: isDark ? "#1A2436" : "#FFFFFF",

    grid: isDark ? "rgba(255,255,255,0.07)" : "rgba(13,27,42,0.08)",
    gridStrong: isDark ? "rgba(255,255,255,0.13)" : "rgba(13,27,42,0.14)",

    text: tk.textPrimary,
    textMuted: tk.textSecondary,
    textFaint: tk.textDim,

    // Weekends read as a faint recess, never as a different colour family.
    // Perceptible against a white column but still a recess, not a colour.
    // 2.4% only read at all where it composited over the tinted header, so
    // weekends looked shaded in the Week heading and plain in the grid.
    weekendBg: isDark ? "rgba(255,255,255,0.035)" : "rgba(13,27,42,0.04)",
    offRangeBg: isDark ? "rgba(0,0,0,0.22)" : "rgba(13,27,42,0.035)",
    offRangeText: isDark ? "rgba(232,237,245,0.26)" : "rgba(13,27,42,0.3)",
    todayBg: alpha(accent, isDark ? 0.11 : 0.06),
    selectedBg: alpha(accent, isDark ? 0.2 : 0.1),
    holidayBg: alpha(theme.palette.error.main, isDark ? 0.11 : 0.06),
    hoverBg: isDark ? "rgba(255,255,255,0.045)" : "rgba(13,27,42,0.035)",

    accent,
    accentContrast: theme.palette.primary.contrastText,
    accentSoft: tk.accentDim,
    accentBorder: tk.accentBorder,
    busy: theme.palette.warning.main,
    available: theme.palette.success.main,
    holiday: theme.palette.error.main,

    radius: 12,
    radiusSm: 6,
    shadowCard: tk.shadowCard,
    shadowPop: tk.shadowElevated,
  };
}
