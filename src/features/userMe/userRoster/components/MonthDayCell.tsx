import { memo } from "react";
import type { DateHeaderProps } from "react-big-calendar";
import { Box, Divider, Tooltip, Typography } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import {
  toDateKey,
  useRosterCalendar,
} from "../context/RosterCalendarContext";
import type { RosterDayMeta } from "../types/roster.types";

const isWeekendDate = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/** Day-level roster summary shown on hover over the date. */
const DaySummary = ({
  dateLabel,
  meta,
}: {
  dateLabel: string;
  meta: RosterDayMeta | undefined;
}) => (
  <Box sx={{ py: 0.25, minWidth: 150 }}>
    <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
      {dateLabel}
    </Typography>

    {meta ? (
      <>
        <Divider sx={{ my: 0.625, borderColor: "rgba(255,255,255,0.16)" }} />
        <Typography sx={{ fontSize: 11, lineHeight: 1.6 }}>
          Shift: {meta.shiftDisplay || meta.label}
        </Typography>
        {meta.workMode && (
          <Typography sx={{ fontSize: 11, lineHeight: 1.6 }}>
            Work mode: {meta.workMode}
          </Typography>
        )}
        <Typography sx={{ fontSize: 11, lineHeight: 1.6 }}>
          Activities: {meta.assignActCount}
        </Typography>
        {meta.availableMins > 0 && (
          <Typography sx={{ fontSize: 11, lineHeight: 1.6 }}>
            Available: {Math.round(meta.availableMins / 60)}h
          </Typography>
        )}
      </>
    ) : (
      <Typography sx={{ fontSize: 11, opacity: 0.8, lineHeight: 1.6 }}>
        No shift rostered
      </Typography>
    )}
  </Box>
);

/**
 * The date number plus the day's at-a-glance indicators: a holiday marker
 * and an activity-count badge for busy days.
 *
 * Clicking it still drills into the Day view, exactly as rbc's stock date
 * link did. Selecting a day is the separate gesture of clicking anywhere
 * else in the cell, which rbc reports through `onSelectSlot`.
 */
const MonthDateHeaderBase = ({
  label,
  date,
  isOffRange,
  onDrillDown,
}: DateHeaderProps) => {
  const { dayMeta, selectedKey, todayKey, tokens } = useRosterCalendar();
  const key = toDateKey(date);
  const meta = dayMeta.get(key);

  const isToday = key === todayKey;
  const isSelected = key === selectedKey;
  const isWeekend = isWeekendDate(date);

  const numberColor = isOffRange
    ? tokens.offRangeText
    : isToday
      ? tokens.accentContrast
      : meta?.isHoliday
        ? tokens.holiday
        : isWeekend
          ? tokens.textMuted
          : tokens.text;

  return (
    <Tooltip
      arrow
      placement="top"
      enterDelay={450}
      enterNextDelay={300}
      title={
        <DaySummary
          dateLabel={date.toLocaleDateString(undefined, {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          meta={meta}
        />
      }
    >
      <Box
        role="button"
        tabIndex={-1}
        onClick={onDrillDown}
        sx={{
          // The event/date layer is pointer-transparent so cell hover works
          // (see calendarSx); this header opts back in — it is a real target.
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0.5,
          px: { xs: 0.5, sm: 0.75 },
          pt: { xs: 0.375, sm: 0.5 },
          pb: 0.25,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Box
          component="span"
          aria-current={isToday ? "date" : undefined}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: { xs: 19, sm: 22 },
            height: { xs: 19, sm: 22 },
            px: 0.5,
            borderRadius: "999px",
            fontSize: { xs: 11, sm: 12 },
            fontWeight: isToday || isSelected ? 700 : 600,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            color: numberColor,
            bgcolor: isToday ? tokens.accent : "transparent",
            border:
              isSelected && !isToday ? `1.5px solid ${tokens.accent}` : "none",
            transition: "background-color .16s ease, color .16s ease",
          }}
        >
          {label}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.375 }}>
          {meta?.isHoliday && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: tokens.holiday,
                flexShrink: 0,
              }}
            />
          )}

          {meta?.isBusy && (
            <>
              <Box
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  alignItems: "center",
                  gap: "1px",
                  height: 16,
                  px: 0.5,
                  borderRadius: "999px",
                  bgcolor: tokens.isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(13,27,42,0.05)",
                  border: `1px solid ${tokens.grid}`,
                  color: tokens.busy,
                  fontSize: 9.5,
                  fontWeight: 800,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <BoltRoundedIcon sx={{ fontSize: 10 }} />
                {meta.assignActCount}
              </Box>

              {/* The badge does not fit a phone-width cell — dot instead. */}
              <Box
                sx={{
                  display: { xs: "block", sm: "none" },
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  bgcolor: tokens.busy,
                }}
              />
            </>
          )}
        </Box>
      </Box>
    </Tooltip>
  );
};

export const MonthDateHeader = memo(MonthDateHeaderBase);
