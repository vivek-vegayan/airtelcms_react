import { useEffect, useRef, useState } from "react";
import { Box, Button, Card, Chip, IconButton, Skeleton, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { format, parseISO } from "date-fns";
import type { Colors } from "../types/colorTypes";
import type { AttendanceRow, WorkMode } from "../types/dashboard.types";
import type { DashboardAttendanceStatus } from "../hooks/useDashboardAttendance";
import { fadeIn, getCardSx } from "../constants/dashboard.styles";
import { PermissionGate } from "../../../rbac/PermissionGate";
import { SectionHeader } from "./SectionHeader";
import { AttendanceTimeline } from "./AttendanceTimeline";
import { AttendanceLiveTimer } from "./AttendanceLiveTimer";
import { AttendanceExpandDialog } from "./AttendanceExpandDialog";

interface AttendanceCardProps {
  attendance?: AttendanceRow | null;
  status: DashboardAttendanceStatus;
  errorMessage?: string;
  isMutating: boolean;
  onSetWorkMode: (mode: WorkMode) => void;
  onClockIn: (mode?: WorkMode) => void;
  onClockOut: () => void;
  colors: Colors;
  mounted: boolean;
  delay: number;
}

function formatMinutes(mins: number | null | undefined): string {
  if (!mins || mins <= 0) return "0h 0m";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatClock(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(parseISO(iso), "h:mm a");
}

/** Live-ticking elapsed seconds since clock-in, for display only (no extra network calls). */
function useLiveElapsedSeconds(clockInTime: string | null | undefined, clockOutTime: string | null | undefined, fallbackMinutes: number | null | undefined) {
  const [seconds, setSeconds] = useState((fallbackMinutes ?? 0) * 60);

  useEffect(() => {
    if (!clockInTime || clockOutTime) {
      setSeconds((fallbackMinutes ?? 0) * 60);
      return;
    }
    const start = parseISO(clockInTime).getTime();
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [clockInTime, clockOutTime, fallbackMinutes]);

  return seconds;
}

export function AttendanceCard({
  attendance,
  status,
  errorMessage,
  isMutating,
  onSetWorkMode,
  onClockIn,
  onClockOut,
  colors,
  mounted,
  delay,
}: AttendanceCardProps) {
  const workMode = attendance?.workfromLocation ?? null;
  const attendanceStatus = attendance?.status ?? "NOT_STARTED";
  const elapsedSeconds = useLiveElapsedSeconds(attendance?.clockInTime, attendance?.clockOutTime, attendance?.workedMinutes);
  const workedMinutes = Math.floor(elapsedSeconds / 60);

  const [expandOpen, setExpandOpen] = useState(false);

  // Detects NOT_STARTED→CLOCKED_IN / CLOCKED_IN→CLOCKED_OUT transitions to fire a one-shot
  // success burst — ignores the initial mount value so a page refresh mid-shift stays silent.
  const prevStatusRef = useRef(attendanceStatus);
  const [celebrate, setCelebrate] = useState<"in" | "out" | null>(null);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== attendanceStatus) {
      if (prev === "NOT_STARTED" && attendanceStatus === "CLOCKED_IN") setCelebrate("in");
      else if (prev === "CLOCKED_IN" && attendanceStatus === "CLOCKED_OUT") setCelebrate("out");
      prevStatusRef.current = attendanceStatus;
    }
  }, [attendanceStatus]);
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(null), 1600);
    return () => clearTimeout(t);
  }, [celebrate]);

  const statusChip =
    attendanceStatus === "CLOCKED_IN"
      ? { label: "Working", tone: colors.success, bg: colors.successDim }
      : attendanceStatus === "CLOCKED_OUT"
        ? { label: "Day complete", tone: colors.textSecondary, bg: colors.border }
        : { label: "Not started", tone: colors.textDim, bg: colors.border };

  return (
    <Card
      sx={{
        ...getCardSx(colors),
        p: { xs: "14px", sm: "16px" },
        position: "relative",
        overflow: "hidden",
        minWidth: 0,
        ...fadeIn(mounted, delay),
      }}
    >
      <SectionHeader
        title="Today's attendance"
        colors={colors}
        right={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "nowrap", gap: "6px" }}>
            {(status === "ready" || status === "empty") && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={statusChip.label}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Chip
                    label={statusChip.label}
                    size="small"
                    icon={
                      attendanceStatus === "CLOCKED_IN" ? (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: colors.success,
                            ml: "8px !important",
                            animation: "attendanceDotPulse 1.4s ease-in-out infinite",
                            "@keyframes attendanceDotPulse": {
                              "0%,100%": { opacity: 1 },
                              "50%": { opacity: 0.35 },
                            },
                          }}
                        />
                      ) : undefined
                    }
                    sx={{ bgcolor: statusChip.bg, color: statusChip.tone, fontWeight: 700, fontSize: 11 }}
                  />
                </motion.div>
              </AnimatePresence>
            )}
            {(status === "ready" || status === "empty") && (
              <IconButton size="small" onClick={() => setExpandOpen(true)} sx={{ color: colors.textDim, p: "4px" }}>
                <OpenInFullRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            )}
          </Box>
        }
      />

      {status === "loading" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "10px", py: "6px" }}>
          <Skeleton variant="rounded" height={36} sx={{ borderRadius: "10px" }} />
          <Skeleton variant="rounded" height={36} sx={{ borderRadius: "10px" }} />
        </Box>
      )}

      {status === "error" && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", py: "22px" }}>
          <ErrorOutlineIcon sx={{ fontSize: 24, color: colors.danger }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.danger, textAlign: "center" }}>
            {errorMessage}
          </Typography>
        </Box>
      )}

      {(status === "ready" || status === "empty") && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {attendanceStatus !== "NOT_STARTED" && (
            <AttendanceLiveTimer elapsedSeconds={elapsedSeconds} status={attendanceStatus} colors={colors} size="sm" />
          )}

          <PermissionGate
            module="Me"
            action="UPDATE"
            fallback={
              <Typography sx={{ fontSize: 12, color: colors.textDim }}>
                You don't have permission to update attendance.
              </Typography>
            }
          >
            <AnimatePresence initial={false}>
              {attendanceStatus === "NOT_STARTED" && (
                <motion.div
                  key="mode-picker"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <Box sx={{ display: "flex", gap: "8px", pb: "8px" }}>
                    <motion.div style={{ flex: 1 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        fullWidth
                        size="small"
                        disabled={isMutating}
                        onClick={() => onSetWorkMode("WFH")}
                        startIcon={<HomeIcon sx={{ fontSize: 16 }} />}
                        variant={workMode === "WFH" ? "contained" : "outlined"}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
                      >
                        WFH
                      </Button>
                    </motion.div>
                    <motion.div style={{ flex: 1 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        fullWidth
                        size="small"
                        disabled={isMutating}
                        onClick={() => onSetWorkMode("WFO")}
                        startIcon={<BusinessIcon sx={{ fontSize: 16 }} />}
                        variant={workMode === "WFO" ? "contained" : "outlined"}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
                      >
                        WFO
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {attendanceStatus === "NOT_STARTED" && (
              <motion.div whileHover={workMode ? { scale: 1.015 } : undefined} whileTap={workMode ? { scale: 0.985 } : undefined}>
                <Button
                  fullWidth
                  size="small"
                  color="success"
                  disabled={isMutating || !workMode}
                  onClick={() => onClockIn(workMode ?? undefined)}
                  startIcon={isMutating ? <CircularProgress size={14} color="inherit" /> : <LoginIcon sx={{ fontSize: 16 }} />}
                  variant="contained"
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
                >
                  {isMutating ? "Clocking in…" : "Clock In"}
                </Button>
              </motion.div>
            )}

            {attendanceStatus === "CLOCKED_IN" && (
              <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                <Button
                  fullWidth
                  size="small"
                  color="error"
                  disabled={isMutating}
                  onClick={onClockOut}
                  startIcon={isMutating ? <CircularProgress size={14} color="inherit" /> : <LogoutIcon sx={{ fontSize: 16 }} />}
                  variant="contained"
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
                >
                  {isMutating ? "Clocking out…" : "Clock Out"}
                </Button>
              </motion.div>
            )}
          </PermissionGate>

          <AttendanceTimeline
            shiftRange={attendance?.shiftRange ?? null}
            clockInTime={attendance?.clockInTime ?? null}
            clockOutTime={attendance?.clockOutTime ?? null}
            status={attendanceStatus}
            colors={colors}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "8px",
              pt: "8px",
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {[
              { label: "CLOCK IN", value: formatClock(attendance?.clockInTime), tone: colors.textPrimary, align: "left" as const },
              { label: "CLOCK OUT", value: formatClock(attendance?.clockOutTime), tone: colors.textPrimary, align: "center" as const },
              { label: "HOURS", value: formatMinutes(workedMinutes), tone: colors.accent, align: "right" as const },
            ].map((cell) => (
              <Box key={cell.label} sx={{ minWidth: 0, textAlign: cell.align }}>
                <Typography sx={{ fontSize: 10, color: colors.textDim, fontWeight: 600, letterSpacing: ".3px" }} noWrap>
                  {cell.label}
                </Typography>
                <Typography sx={{ fontSize: 13, color: cell.tone, fontWeight: 700, mt: "2px" }} noWrap>
                  {cell.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: colors.isDark ? "rgba(15,17,26,0.88)" : "rgba(255,255,255,0.92)",
              backdropFilter: "blur(3px)",
              zIndex: 2,
            }}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 46, color: colors.success }} />
            </motion.div>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: colors.textPrimary }}>
              {celebrate === "in" ? "Clocked in!" : "Clocked out!"}
            </Typography>
            <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>
              {celebrate === "in" ? "Have a great day 🎉" : "Nice work today 👏"}
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>

      <AttendanceExpandDialog
        open={expandOpen}
        onClose={() => setExpandOpen(false)}
        attendance={attendance}
        status={status}
        errorMessage={errorMessage}
        isMutating={isMutating}
        elapsedSeconds={elapsedSeconds}
        onSetWorkMode={onSetWorkMode}
        onClockIn={onClockIn}
        onClockOut={onClockOut}
        colors={colors}
      />
    </Card>
  );
}
