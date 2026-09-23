import { memo } from "react";
import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { useCalendarTokens } from "../constants/calendarTokens";
import { getShiftVisual } from "../constants/shiftColors";
import type { RosterMonthStats } from "../types/roster.types";

interface StatDef {
  key: keyof RosterMonthStats;
  label: string;
  hint: string;
  /** Shift code whose palette hue this stat borrows, or null for the accent. */
  code: string | null;
}

const STATS: StatDef[] = [
  { key: "working", label: "Working", hint: "Days with an assigned shift", code: "G" },
  { key: "weekOff", label: "Week offs", hint: "Rostered week offs", code: "W" },
  { key: "leave", label: "Leave", hint: "Approved leave days", code: "L" },
  { key: "holiday", label: "Holidays", hint: "Public holidays", code: "H" },
  { key: "compOff", label: "Comp offs", hint: "Compensatory offs", code: "C" },
  {
    key: "activities",
    label: "Activities",
    hint: "Activities assigned across the period",
    code: null,
  },
];

/**
 * Month roll-up. Purely a projection of the roster already in the cache —
 * no extra request, no extra state.
 */
const RosterStatsStripBase = ({ stats }: { stats: RosterMonthStats }) => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      rowGap={0.75}
      columnGap={0.75}
      sx={{ mb: 1.5 }}
    >
      {STATS.map(({ key, label, hint, code }) => {
        const value = stats[key];
        const hue = code ? getShiftVisual(code, t.isDark).accent : t.accent;
        const isZero = value === 0;

        return (
          <Tooltip key={key} title={hint} arrow enterDelay={400}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                flex: { xs: "1 1 30%", sm: "0 1 auto" },
                minWidth: 0,
                height: 30,
                px: 1.125,
                borderRadius: `${t.radiusSm + 2}px`,
                border: `1px solid ${t.grid}`,
                bgcolor: t.surface,
                opacity: isZero ? 0.55 : 1,
                transition: "opacity .16s ease, border-color .16s ease",
                "&:hover": { borderColor: t.gridStrong, opacity: 1 },
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "2px",
                  bgcolor: hue,
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: t.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {value}
              </Typography>
              <Typography
                noWrap
                sx={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: t.textMuted,
                  letterSpacing: "0.01em",
                }}
              >
                {label}
              </Typography>
            </Stack>
          </Tooltip>
        );
      })}
    </Stack>
  );
};

export default memo(RosterStatsStripBase);
