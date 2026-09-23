import { Box, Chip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import type { Colors } from "../types/colorTypes";
import type { AttendanceSession } from "../types/dashboard.types";
import { pulseRingSx } from "../constants/dashboard.styles";

interface AttendanceSessionTimelineProps {
  sessions: AttendanceSession[];
  colors: Colors;
}

function formatClock(iso: string): string {
  return format(parseISO(iso), "h:mm a");
}

function formatDuration(mins: number | null): string {
  if (!mins || mins <= 0) return "0h 0m";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Vertical session-by-session timeline, list-shaped for a future multi-session-per-day backend. */
export function AttendanceSessionTimeline({ sessions, colors }: AttendanceSessionTimelineProps) {
  if (sessions.length === 0) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {sessions.map((session, i) => {
        const isLast = i === sessions.length - 1;
        return (
          <motion.div
            key={session.index}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, delay: i * 0.08 }}
          >
            <Box sx={{ display: "flex", gap: "14px" }}>
              {/* Rail: dot + connecting line */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    mt: "4px",
                    background: session.isActive ? colors.success : colors.accent,
                    border: `2px solid ${colors.surface}`,
                    boxShadow: `0 0 0 2px ${session.isActive ? colors.successBorder : colors.accentBorder}`,
                    ...(session.isActive ? pulseRingSx(colors.successBorder) : {}),
                  }}
                />
                {!isLast && <Box sx={{ flex: 1, width: "2px", background: colors.border, minHeight: "28px", mt: "4px" }} />}
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "4px" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: colors.textPrimary }}>
                    Session {session.index}
                  </Typography>
                  {session.isActive && (
                    <Chip
                      label="Live"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 9,
                        fontWeight: 800,
                        bgcolor: colors.successDim,
                        color: colors.success,
                        "& .MuiChip-label": { px: "6px" },
                      }}
                    />
                  )}
                </Box>

                <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
                  {formatClock(session.clockInTime)} — {session.clockOutTime ? formatClock(session.clockOutTime) : "now"}
                </Typography>

                <Typography sx={{ fontSize: 11, fontWeight: 700, color: colors.accent, mt: "2px" }}>
                  {formatDuration(session.durationMinutes)}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
}
