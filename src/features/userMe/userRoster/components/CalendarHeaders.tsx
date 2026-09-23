import { memo } from "react";
import type { HeaderProps } from "react-big-calendar";
import { Box, Stack, Typography } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { toDateKey, useRosterCalendar } from "../context/RosterCalendarContext";
import { ALL_DAY_ROW_H } from "../styles/calendarSx";

/**
 * Column heading for the Week and Day views.
 *
 * rbc's stock heading is a single flat string ("16 Sun") sized by the
 * weekday-header rules meant for the Month grid, which is what left it
 * cramped and clipped. This gives the time views their own two-line
 * heading — weekday over date — with the same today/holiday/busy language
 * the Month cells use, so the two views read as one product.
 */
const TimeViewHeaderBase = ({ date }: HeaderProps) => {
  const { dayMeta, selectedKey, todayKey, tokens } = useRosterCalendar();

  const key = toDateKey(date);
  const meta = dayMeta.get(key);
  const isToday = key === todayKey;
  const isSelected = key === selectedKey;
  const weekday = date.getDay();
  const isWeekend = weekday === 0 || weekday === 6;

  return (
    <Stack
      alignItems="center"
      spacing={0.25}
      sx={{ py: 0.75, px: 0.5, minWidth: 0 }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
          color: isToday
            ? tokens.accent
            : isWeekend
              ? tokens.textFaint
              : tokens.textMuted,
        }}
      >
        {date.toLocaleDateString(undefined, { weekday: "short" })}
      </Typography>

      <Box
        component="span"
        aria-current={isToday ? "date" : undefined}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 26,
          height: 26,
          px: 0.625,
          borderRadius: "999px",
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: isToday
            ? tokens.accentContrast
            : meta?.isHoliday
              ? tokens.holiday
              : tokens.text,
          bgcolor: isToday ? tokens.accent : "transparent",
          border:
            isSelected && !isToday ? `1.5px solid ${tokens.accent}` : "none",
          transition: "background-color .16s ease, color .16s ease",
        }}
      >
        {date.getDate()}
      </Box>

      {/* Reserved strip: keeps every column the same height whether or not
          the day carries indicators, so the header row never jitters. */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.375}
        sx={{ height: 11 }}
      >
        {meta?.isHoliday && (
          <Box
            sx={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              bgcolor: tokens.holiday,
            }}
          />
        )}
        {meta?.isBusy && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              gap: "1px",
              color: tokens.busy,
              fontSize: 9,
              fontWeight: 800,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <BoltRoundedIcon sx={{ fontSize: 9 }} />
            {meta.assignActCount}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

export const TimeViewHeader = memo(TimeViewHeaderBase);

/**
 * The corner above the time gutter. It spans both header bands, so the
 * label sits in a box exactly as tall as the all-day row it names —
 * bottom-aligned, it lines up with that row rather than floating between
 * the two.
 */
const TimeGutterHeaderBase = () => {
  const { tokens } = useRosterCalendar();

  return (
    <Box
      sx={{
        height: ALL_DAY_ROW_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        // rbc gives this corner the `rbc-label` class, which already carries
        // the gutter's 8px side padding — adding more here squeezed the text
        // past the corner's JS-measured width and clipped it.
        px: 0,
        overflow: "hidden",
      }}
    >
      <Typography
        sx={{
          // Sentence case, no tracking: "ALL DAY" uppercased with letter
          // spacing is wider than the gutter, which is only as wide as
          // "12 PM" needs.
          fontSize: 9.5,
          fontWeight: 600,
          lineHeight: 1,
          color: tokens.textFaint,
          whiteSpace: "nowrap",
        }}
      >
        All day
      </Typography>
    </Box>
  );
};

export const TimeGutterHeader = memo(TimeGutterHeaderBase);
