import { useMemo } from "react";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import dayjs from "dayjs";
import { useTabColorTokens } from "../../../style/theme";
import { authStorage } from "../../../app/store/auth.storage";

/* ══════════════ Status tones ══════════════
 * Every slot cell / chip / legend on these screens resolves to one of these
 * five buckets. Colours come from the app theme (success / warning / error),
 * so they follow light-dark mode instead of a hardcoded palette.
 */

export type SlotStatus = "available" | "low" | "full" | "holiday" | "neutral";

export interface SlotTone {
  color: string;
  bg: string;
  border: string;
}

// The theme has no violet; holiday/freeze needs a hue distinct from the
// red/amber/green capacity scale.
const HOLIDAY = { light: "#6D4BC2", dark: "#B9A3F0" };

export function useSlotTones(): Record<SlotStatus, SlotTone> {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  return useMemo(() => {
    const { isDark } = colors;
    const tone = (main: string, text: string): SlotTone => ({
      color: text,
      bg: alpha(main, isDark ? 0.2 : 0.12),
      border: alpha(main, isDark ? 0.42 : 0.3),
    });
    const holiday = isDark ? HOLIDAY.dark : HOLIDAY.light;
    const p = theme.palette;

    return {
      available: tone(p.success.main, isDark ? p.success.light : p.success.dark),
      low: tone(p.warning.main, colors.warning),
      full: tone(p.error.main, isDark ? p.error.light : p.error.dark),
      holiday: tone(holiday, holiday),
      neutral: { color: colors.textSecondary, bg: colors.surface2, border: colors.border },
    };
  }, [theme, colors]);
}

/* ══════════════ Filter bar ══════════════
 * Same glass container as the CRQ analytics filter bar so all tabs under
 * /analytics read as one module.
 */

export const getFilterBarSx = (theme: Theme) => ({
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  gap: 2,
  p: "14px 18px",
  borderRadius: "14px",
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
      : "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.palette.mode === "dark" ? "0 8px 28px rgba(0,0,0,0.4)" : "0 8px 28px rgba(16,40,70,0.06)",
});

/** Role used by <OrgHierarchyFilters> to decide which pickers this user sees. */
export const getRoleName = () => authStorage.getUser()?.roleCode ?? "TEAM_MEMBER";

/* ══════════════ Dates ══════════════
 * The views keep dates as "YYYY-MM-DD" strings (what the API takes); these
 * bridge them to the MUI DatePicker's Dayjs values.
 */

export const toDayjs = (value: string) => (value ? dayjs(value) : null);
export const fromDayjs = (value: dayjs.Dayjs | null) => (value?.isValid() ? value.format("YYYY-MM-DD") : "");
