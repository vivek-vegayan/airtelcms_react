import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { Colors } from "../types/colorTypes";
import type { AttendanceStatus } from "../types/dashboard.types";
import { parseShiftTime } from "../../userMe/userRoster/utils/rosterTransform";
import { pulseRingSx } from "../constants/dashboard.styles";

interface AttendanceTimelineProps {
  shiftRange: string | null;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: AttendanceStatus;
  colors: Colors;
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function formatMinutesLabel(mins: number): string {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Today's shift-start → clock-in → now/clock-out → shift-end progress bar. */
export function AttendanceTimeline({ shiftRange, clockInTime, clockOutTime, status, colors }: AttendanceTimelineProps) {
  const now = new Date();

  let startMin = 0;
  let endMin = 24 * 60;

  if (shiftRange) {
    const parsed = parseShiftTime(shiftRange);
    if ("startTime" in parsed && parsed.startTime && parsed.endTime) {
      startMin = hhmmToMinutes(parsed.startTime);
      endMin = hhmmToMinutes(parsed.endTime);
      if (endMin <= startMin) endMin += 24 * 60; // overnight shift
    }
  }

  const totalSpan = Math.max(endMin - startMin, 1);
  const clampPct = (mins: number) => Math.min(100, Math.max(0, ((mins - startMin) / totalSpan) * 100));
  const wrapToShiftDay = (mins: number) => (mins < startMin ? mins + 1440 : mins);

  const clockInMin = clockInTime ? wrapToShiftDay(minutesSinceMidnight(new Date(clockInTime))) : null;
  const clockOutMin = clockOutTime ? wrapToShiftDay(minutesSinceMidnight(new Date(clockOutTime))) : null;
  const nowMin = wrapToShiftDay(minutesSinceMidnight(now));

  const clockInPct = clockInMin != null ? clampPct(clockInMin) : null;
  const clockOutPct = clockOutMin != null ? clampPct(clockOutMin) : null;
  const nowPct = clampPct(nowMin);

  const segmentStartPct = clockInPct ?? 0;
  const segmentEndPct =
    status === "CLOCKED_OUT" ? (clockOutPct ?? segmentStartPct) : status === "CLOCKED_IN" ? nowPct : segmentStartPct;

  const springTransition = { type: "spring" as const, stiffness: 120, damping: 20 };

  return (
    <Box sx={{ pt: "2px" }}>
      <Box
        sx={{
          position: "relative",
          height: "6px",
          borderRadius: "3px",
          background: colors.border,
          mt: "20px",
          mb: "6px",
          overflow: "visible",
        }}
      >
        {clockInPct != null && (
          <motion.div
            initial={false}
            animate={{ left: `${segmentStartPct}%`, width: `${Math.max(segmentEndPct - segmentStartPct, 0)}%` }}
            transition={springTransition}
            style={{
              position: "absolute",
              top: 0,
              height: "100%",
              borderRadius: "3px",
              background:
                status === "CLOCKED_OUT"
                  ? colors.textDim
                  : `linear-gradient(90deg, ${colors.success}, ${colors.accent})`,
            }}
          />
        )}

        {clockInPct != null && (
          <Box
            title={`Clock in · ${format(new Date(clockInTime as string), "h:mm a")}`}
            sx={{
              position: "absolute",
              left: `calc(${clockInPct}% - 5px)`,
              top: "-3px",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: colors.success,
              border: `2px solid ${colors.surface}`,
            }}
          />
        )}

        {clockOutPct != null && (
          <Box
            title={`Clock out · ${format(new Date(clockOutTime as string), "h:mm a")}`}
            sx={{
              position: "absolute",
              left: `calc(${clockOutPct}% - 5px)`,
              top: "-3px",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: colors.textDim,
              border: `2px solid ${colors.surface}`,
            }}
          />
        )}

        {status === "CLOCKED_IN" && (
          <Box
            title={`Now · ${format(now, "h:mm a")}`}
            sx={{
              position: "absolute",
              left: `calc(${nowPct}% - 4px)`,
              top: "-2px",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: colors.accent,
              ...pulseRingSx(colors.accentBorder),
            }}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: colors.textDim }}>
          {formatMinutesLabel(startMin)}
        </Typography>
        {status === "CLOCKED_IN" && (
          <Typography sx={{ fontSize: 9, fontWeight: 800, color: colors.accent }}>
            ● {format(now, "h:mm a")} now
          </Typography>
        )}
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: colors.textDim }}>
          {formatMinutesLabel(endMin)}
        </Typography>
      </Box>
    </Box>
  );
}
