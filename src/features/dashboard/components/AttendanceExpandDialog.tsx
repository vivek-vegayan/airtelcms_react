import { Box, Button, Chip, CircularProgress, Dialog, IconButton, Skeleton, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import type { Colors } from "../types/colorTypes";
import type { AttendanceRow, WorkMode } from "../types/dashboard.types";
import type { DashboardAttendanceStatus } from "../hooks/useDashboardAttendance";
import { SlideUpTransition } from "../../../components/common/SlideUpTransition";
import { PermissionGate } from "../../../rbac/PermissionGate";
import { AttendanceLiveTimer } from "./AttendanceLiveTimer";
import { AttendanceTimeline } from "./AttendanceTimeline";
import { AttendanceEmptyState } from "./AttendanceEmptyState";
import { AttendanceSessionTimeline } from "./AttendanceSessionTimeline";
import { buildSessions } from "../utils/attendanceSessions";

interface AttendanceExpandDialogProps {
  open: boolean;
  onClose: () => void;
  attendance?: AttendanceRow | null;
  status: DashboardAttendanceStatus;
  errorMessage?: string;
  isMutating: boolean;
  elapsedSeconds: number;
  onSetWorkMode: (mode: WorkMode) => void;
  onClockIn: (mode?: WorkMode) => void;
  onClockOut: () => void;
  colors: Colors;
}

function formatClock(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(parseISO(iso), "h:mm a");
}

function formatMinutes(mins: number | null | undefined): string {
  if (!mins || mins <= 0) return "0h 0m";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Full-room "premium" attendance experience, opened from the compact dashboard card. */
export function AttendanceExpandDialog({
  open,
  onClose,
  attendance,
  status,
  errorMessage,
  isMutating,
  elapsedSeconds,
  onSetWorkMode,
  onClockIn,
  onClockOut,
  colors,
}: AttendanceExpandDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const workMode = attendance?.workfromLocation ?? null;
  const attendanceStatus = attendance?.status ?? "NOT_STARTED";
  const workedMinutes = Math.floor(elapsedSeconds / 60);
  const sessions = buildSessions(attendance);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      TransitionComponent={SlideUpTransition}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : "20px",
          background: colors.surface,
          border: `1.5px solid ${colors.border}`,
          backgroundImage: "none",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "20px", pt: "18px", pb: "8px" }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary }}>Today's Attendance</Typography>
          <Typography sx={{ fontSize: 12, color: colors.textSecondary, mt: "2px" }}>
            {format(new Date(), "EEEE, MMM d")}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: colors.textDim }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: "20px", pb: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>
        {status === "loading" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", py: "12px" }}>
            <Skeleton variant="rounded" height={90} sx={{ borderRadius: "16px" }} />
            <Skeleton variant="rounded" height={44} sx={{ borderRadius: "12px" }} />
          </Box>
        )}

        {status === "error" && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", py: "26px" }}>
            <ErrorOutlineIcon sx={{ fontSize: 26, color: colors.danger }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.danger, textAlign: "center" }}>
              {errorMessage}
            </Typography>
          </Box>
        )}

        {(status === "ready" || status === "empty") && (
          <>
            {attendanceStatus === "NOT_STARTED" ? (
              <AttendanceEmptyState colors={colors} />
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Chip
                    label={attendanceStatus === "CLOCKED_IN" ? "Currently working" : "Day complete"}
                    size="small"
                    sx={{
                      bgcolor: attendanceStatus === "CLOCKED_IN" ? colors.successDim : colors.border,
                      color: attendanceStatus === "CLOCKED_IN" ? colors.success : colors.textSecondary,
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  />
                </Box>

                <AttendanceLiveTimer elapsedSeconds={elapsedSeconds} status={attendanceStatus} colors={colors} size="lg" />

                <AttendanceTimeline
                  shiftRange={attendance?.shiftRange ?? null}
                  clockInTime={attendance?.clockInTime ?? null}
                  clockOutTime={attendance?.clockOutTime ?? null}
                  status={attendanceStatus}
                  colors={colors}
                />
              </>
            )}

            <PermissionGate
              module="Me"
              action="UPDATE"
              fallback={
                <Typography sx={{ fontSize: 12, color: colors.textDim, textAlign: "center" }}>
                  You don't have permission to update attendance.
                </Typography>
              }
            >
              {attendanceStatus === "NOT_STARTED" && (
                <Box sx={{ display: "flex", gap: "10px" }}>
                  <Button
                    fullWidth
                    disabled={isMutating || attendanceStatus !== "NOT_STARTED"}
                    onClick={() => onSetWorkMode("WFH")}
                    startIcon={<HomeIcon sx={{ fontSize: 18 }} />}
                    variant={workMode === "WFH" ? "contained" : "outlined"}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "12px", py: "10px" }}
                  >
                    WFH
                  </Button>
                  <Button
                    fullWidth
                    disabled={isMutating || attendanceStatus !== "NOT_STARTED"}
                    onClick={() => onSetWorkMode("WFO")}
                    startIcon={<BusinessIcon sx={{ fontSize: 18 }} />}
                    variant={workMode === "WFO" ? "contained" : "outlined"}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "12px", py: "10px" }}
                  >
                    WFO
                  </Button>
                </Box>
              )}

              {attendanceStatus === "NOT_STARTED" && (
                <motion.div whileHover={workMode ? { scale: 1.02 } : undefined} whileTap={workMode ? { scale: 0.98 } : undefined}>
                  <Button
                    fullWidth
                    size="large"
                    color="success"
                    disabled={isMutating || !workMode}
                    onClick={() => onClockIn(workMode ?? undefined)}
                    startIcon={isMutating ? <CircularProgress size={16} color="inherit" /> : <LoginIcon />}
                    variant="contained"
                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: "14px", py: "12px", fontSize: 15 }}
                  >
                    {isMutating ? "Clocking in…" : "Clock In"}
                  </Button>
                </motion.div>
              )}

              {attendanceStatus === "CLOCKED_IN" && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    fullWidth
                    size="large"
                    color="error"
                    disabled={isMutating}
                    onClick={onClockOut}
                    startIcon={isMutating ? <CircularProgress size={16} color="inherit" /> : <LogoutIcon />}
                    variant="contained"
                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: "14px", py: "12px", fontSize: 15 }}
                  >
                    {isMutating ? "Clocking out…" : "Clock Out"}
                  </Button>
                </motion.div>
              )}
            </PermissionGate>

            {sessions.length > 0 && (
              <Box sx={{ pt: "4px", borderTop: `1px solid ${colors.border}` }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: colors.textDim, mb: "12px", mt: "14px", letterSpacing: ".4px" }}>
                  SESSIONS
                </Typography>
                <AttendanceSessionTimeline sessions={sessions} colors={colors} />
              </Box>
            )}

            {attendanceStatus !== "NOT_STARTED" && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  pt: "14px",
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 10, color: colors.textDim, fontWeight: 600 }}>FIRST CLOCK IN</Typography>
                  <Typography sx={{ fontSize: 13, color: colors.textPrimary, fontWeight: 700 }}>
                    {formatClock(attendance?.clockInTime)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, color: colors.textDim, fontWeight: 600 }}>LAST CLOCK OUT</Typography>
                  <Typography sx={{ fontSize: 13, color: colors.textPrimary, fontWeight: 700 }}>
                    {formatClock(attendance?.clockOutTime)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, color: colors.textDim, fontWeight: 600 }}>SESSIONS TODAY</Typography>
                  <Typography sx={{ fontSize: 13, color: colors.textPrimary, fontWeight: 700 }}>
                    {sessions.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 10, color: colors.textDim, fontWeight: 600 }}>TOTAL HOURS</Typography>
                  <Typography sx={{ fontSize: 13, color: colors.accent, fontWeight: 700 }}>
                    {formatMinutes(workedMinutes)}
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Dialog>
  );
}
