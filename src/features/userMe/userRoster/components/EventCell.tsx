import React, { memo } from "react";
import { type EventProps } from "react-big-calendar";
import { Box, Divider, Tooltip, Typography } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import moment from "moment";
import { useRosterCalendar } from "../context/RosterCalendarContext";
import { extractShiftTimeLabel } from "../utils/rosterTransform";
import type { CalendarEvent } from "../types/roster.types";

/** Multi-line hover card — replaces the old single concatenated string. */
const ShiftTooltip = ({
  code,
  label,
  dateLabel,
  timeLabel,
  workMode,
  assignActCount,
  availableMins,
}: {
  code: string;
  label: string;
  dateLabel: string;
  timeLabel: string;
  workMode: string | null;
  assignActCount: number;
  availableMins: number;
}) => (
  <Box sx={{ py: 0.25, minWidth: 150 }}>
    <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
      {code} · {label}
    </Typography>
    <Typography sx={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>
      {dateLabel}
    </Typography>

    <Divider sx={{ my: 0.625, borderColor: "rgba(255,255,255,0.16)" }} />

    <Typography sx={{ fontSize: 11, lineHeight: 1.6 }}>
      Timing: {timeLabel}
    </Typography>
    {workMode && (
      <Typography sx={{ fontSize: 11, lineHeight: 1.6 }}>
        Work mode: {workMode}
      </Typography>
    )}
    <Typography sx={{ fontSize: 11, lineHeight: 1.6 }}>
      Activities: {assignActCount}
    </Typography>
    {availableMins > 0 && (
      <Typography sx={{ fontSize: 11, lineHeight: 1.6 }}>
        Available: {Math.round(availableMins / 60)}h
      </Typography>
    )}
  </Box>
);

const EventCell: React.FC<EventProps<CalendarEvent>> = ({ event }) => {
  const { tokens } = useRosterCalendar();

  const resource = event.resource;
  const code = resource?.code ?? event.title;
  const label = resource?.label ?? event.title;
  const workMode = resource?.workMode ?? null;
  const assignActCount = resource?.assignActCount ?? 0;
  const availableMins = resource?.availableMins ?? 0;

  // Every event is `allDay` now (see rosterTransform.ts) — the shift's real
  // time window, when it has one, comes from the display string instead.
  const timeRange = extractShiftTimeLabel(resource?.shiftDisplay ?? "");
  const timeLabel = timeRange ?? "All day";

  return (
    <Tooltip
      arrow
      enterDelay={350}
      enterNextDelay={250}
      placement="top"
      title={
        <ShiftTooltip
          code={code}
          label={label}
          dateLabel={moment(event.start).format("ddd, DD MMM YYYY")}
          timeLabel={timeLabel}
          workMode={workMode}
          assignActCount={assignActCount}
          availableMins={availableMins}
        />
      }
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minWidth: 0,
          height: "100%",
          px: 0.25,
          cursor: "pointer",
        }}
      >
        {/* Saturated hue keeps the code legible even at the smallest sizes. */}
        <Box
          sx={{
            width: 4,
            height: 12,
            borderRadius: "2px",
            flexShrink: 0,
            bgcolor: "currentColor",
            opacity: 0.65,
          }}
        />

        <Typography
          component="span"
          sx={{
            fontSize: 11,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: code.length > 1 ? "-0.02em" : 0,
            flexShrink: 0,
          }}
        >
          {code}
        </Typography>

        {workMode && (
          <Typography
            component="span"
            sx={{
              fontSize: 10,
              fontWeight: 600,
              lineHeight: 1.2,
              opacity: 0.72,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: { xs: "none", sm: "inline" },
            }}
          >
            {workMode}
          </Typography>
        )}

        {assignActCount > 0 && (
          <Box
            sx={{
              ml: "auto",
              display: { xs: "none", md: "inline-flex" },
              alignItems: "center",
              gap: "1px",
              flexShrink: 0,
              fontSize: 9.5,
              fontWeight: 800,
              lineHeight: 1,
              opacity: 0.85,
            }}
          >
            <BoltRoundedIcon sx={{ fontSize: 10 }} />
            {assignActCount}
          </Box>
        )}

        {timeRange && !workMode && assignActCount === 0 && (
          <ScheduleRoundedIcon
            sx={{
              ml: "auto",
              fontSize: 11,
              opacity: 0.5,
              flexShrink: 0,
              display: { xs: "none", lg: "inline" },
              color: tokens.textMuted,
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default memo(EventCell);
