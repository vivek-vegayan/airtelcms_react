import React, { useMemo, useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

import type { Colors } from "../../../types/colorTypes";
import type { RescheduleCalendarModel } from "../../../types/reschedule.types";
import { LegendDot } from "./RescheduleAtoms";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Why a given day cannot be picked - drives its colour, tooltip and cursor. */
type DayBlock = "past" | "outside" | "busy" | "holiday" | "freeze" | null;

const BLOCK_REASON: Record<Exclude<DayBlock, null>, string> = {
  past: "Past date - a reschedule must land in the future",
  outside: "Outside the available scheduling window",
  busy: "No engineer has enough free capacity on this date",
  holiday: "Declared holiday",
  freeze: "Network freeze window",
};

interface RescheduleCalendarProps {
  calendar: RescheduleCalendarModel;
  selected: string | null;
  onSelect: (isoDate: string) => void;
  colors: Colors;
}

/**
 * Month grid over the window Get_Predicted_SlotDates_Reschedule returned.
 * Selectable days are exactly the ones the procedure would accept: inside
 * [startDate, endDate], in the future, and in none of the busy / holiday /
 * network-freeze buckets. Weekends are shown but stay selectable - the
 * procedure classifies them separately and does not refuse them.
 */
export const RescheduleCalendar: React.FC<RescheduleCalendarProps> = ({
  calendar,
  selected,
  onSelect,
  colors,
}) => {
  const windowStart = calendar.startDate ? parseISO(calendar.startDate) : null;
  const windowEnd = calendar.endDate ? parseISO(calendar.endDate) : null;

  const [cursor, setCursor] = useState<Date>(() =>
    startOfMonth(windowStart ?? new Date()),
  );

  const today = startOfDay(new Date());

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const leading = first.getDay();
    const cells: (Date | null)[] = Array.from({ length: leading }, () => null);
    return cells.concat(eachDayOfInterval({ start: first, end: last }));
  }, [cursor]);

  const classify = (day: Date): DayBlock => {
    const iso = format(day, "yyyy-MM-dd");
    if (!isBefore(today, day)) return "past";
    if (windowStart && isBefore(day, windowStart)) return "outside";
    if (windowEnd && isBefore(windowEnd, day)) return "outside";
    if (calendar.networkFreezeDates.has(iso)) return "freeze";
    if (calendar.holidayDates.has(iso)) return "holiday";
    if (calendar.busyDates.has(iso) || calendar.weekendDates.has(iso)) return "busy";
    return null;
  };

  const blockColor = (block: Exclude<DayBlock, null>): string =>
    block === "freeze"
      ? colors.danger
      : block === "holiday"
        ? colors.warning
        : block === "busy"
          ? colors.info
          : colors.textDim;

  // Only offer month navigation across months the window actually spans.
  const canGoBack = !windowStart || isBefore(startOfMonth(windowStart), startOfMonth(cursor));
  const canGoForward = !windowEnd || isBefore(startOfMonth(cursor), startOfMonth(windowEnd));

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <IconButton
          size="small"
          disabled={!canGoBack}
          onClick={() => setCursor((c) => addMonths(c, -1))}
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: colors.textPrimary }}>
          {format(cursor, "MMMM yyyy")}
        </Typography>
        <IconButton
          size="small"
          disabled={!canGoForward}
          onClick={() => setCursor((c) => addMonths(c, 1))}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {WEEKDAYS.map((d, i) => (
          <Typography
            key={`${d}-${i}`}
            sx={{
              fontSize: 10,
              fontWeight: 800,
              textAlign: "center",
              color: colors.textDim,
              py: 0.4,
            }}
          >
            {d}
          </Typography>
        ))}

        {days.map((day, idx) => {
          if (!day) return <Box key={`pad-${idx}`} />;

          const iso = format(day, "yyyy-MM-dd");
          const block = classify(day);
          const isSelected = selected === iso;
          const disabled = block !== null;
          const inMonth = isSameMonth(day, cursor);

          const cell = (
            <Box
              onClick={() => !disabled && onSelect(iso)}
              sx={{
                position: "relative",
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: colors.radius,
                fontSize: 12.5,
                fontWeight: isSelected ? 800 : 600,
                cursor: disabled ? "not-allowed" : "pointer",
                userSelect: "none",
                opacity: inMonth ? 1 : 0.4,
                color: isSelected
                  ? "#fff"
                  : disabled
                    ? colors.textDim
                    : colors.textPrimary,
                bgcolor: isSelected
                  ? colors.accent
                  : disabled
                    ? colors.trackOff
                    : "transparent",
                border: `1px solid ${
                  isSelected ? colors.accent : disabled ? "transparent" : colors.border
                }`,
                transition: "background-color .15s, border-color .15s",
                "&:hover": disabled
                  ? {}
                  : { bgcolor: isSelected ? colors.accent : colors.accentDim, borderColor: colors.accent },
              }}
            >
              {day.getDate()}
              {block && block !== "past" && block !== "outside" && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 3,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: blockColor(block),
                  }}
                />
              )}
            </Box>
          );

          return disabled && block !== "past" && block !== "outside" ? (
            <Tooltip key={iso} title={BLOCK_REASON[block]} arrow placement="top">
              <span>{cell}</span>
            </Tooltip>
          ) : (
            <React.Fragment key={iso}>{cell}</React.Fragment>
          );
        })}
      </Box>

      <Stack
        direction="row"
        flexWrap="wrap"
        useFlexGap
        sx={{ columnGap: 1.5, rowGap: 0.6, mt: 1.5 }}
      >
        <LegendDot color={colors.accent} label="Selected" colors={colors} />
        <LegendDot color={colors.info} label="Busy / weekend" colors={colors} />
        <LegendDot color={colors.warning} label="Holiday" colors={colors} />
        <LegendDot color={colors.danger} label="Network freeze" colors={colors} />
        <LegendDot color={colors.textDim} label="Unavailable" colors={colors} />
      </Stack>
    </Box>
  );
};

export default RescheduleCalendar;
