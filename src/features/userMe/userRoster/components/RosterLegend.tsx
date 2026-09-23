import { memo } from "react";
import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { useCalendarTokens } from "../constants/calendarTokens";
import { LEGEND_CODES, getShiftVisual } from "../constants/shiftColors";

/**
 * Two-part legend: the shift codes that appear inside cells, then the
 * calendar's own day states. Previously only the shift codes were listed,
 * so "why is that cell tinted?" had no answer anywhere in the UI.
 */
const RosterLegendBase = () => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);

  const dayStates = [
    { label: "Today", swatch: t.accent, hint: "The current date" },
    {
      label: "Selected",
      swatch: "transparent",
      ring: t.accent,
      hint: "The day you last clicked",
    },
    { label: "Holiday", swatch: t.holiday, hint: "Public holiday" },
    { label: "Busy", swatch: t.busy, hint: "Has activities assigned" },
  ];

  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      rowGap={0.75}
      columnGap={{ xs: 1, sm: 1.5 }}
      sx={{
        mt: 1.5,
        pt: 1.5,
        borderTop: `1px solid ${t.grid}`,
      }}
    >
      <Typography
        sx={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: t.textFaint,
          mr: 0.25,
        }}
      >
        Shifts
      </Typography>

      {LEGEND_CODES.map((code) => {
        const v = getShiftVisual(code, t.isDark);
        return (
          <Tooltip
            key={code}
            arrow
            enterDelay={400}
            title={v.time && v.time !== "—" ? `${v.label} · ${v.time}` : v.label}
          >
            <Stack direction="row" alignItems="center" spacing={0.625}>
              <Box
                sx={{
                  minWidth: 20,
                  height: 16,
                  px: 0.5,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  bgcolor: v.bg,
                  border: `1px solid ${v.border}`,
                  color: v.fg,
                  fontSize: 9,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {code}
              </Box>
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: t.textMuted,
                  lineHeight: 1,
                  display: { xs: "none", md: "block" },
                }}
              >
                {v.label}
              </Typography>
            </Stack>
          </Tooltip>
        );
      })}

      <Box
        sx={{
          width: "1px",
          height: 14,
          bgcolor: t.grid,
          display: { xs: "none", sm: "block" },
          mx: 0.5,
        }}
      />

      <Typography
        sx={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: t.textFaint,
          mr: 0.25,
        }}
      >
        Days
      </Typography>

      {dayStates.map(({ label, swatch, ring, hint }) => (
        <Tooltip key={label} title={hint} arrow enterDelay={400}>
          <Stack direction="row" alignItems="center" spacing={0.625}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: ring ? "3px" : "50%",
                bgcolor: swatch,
                border: ring ? `1.5px solid ${ring}` : "none",
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 10.5, color: t.textMuted, lineHeight: 1 }}>
              {label}
            </Typography>
          </Stack>
        </Tooltip>
      ))}
    </Stack>
  );
};

export default memo(RosterLegendBase);
