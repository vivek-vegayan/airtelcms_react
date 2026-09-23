import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import type { Colors } from "../types/colorTypes";
import type { AttendanceStatus } from "../types/dashboard.types";
import { pulseGlowSx } from "../constants/dashboard.styles";

interface AttendanceLiveTimerProps {
  elapsedSeconds: number;
  status: AttendanceStatus;
  colors: Colors;
  size?: "sm" | "lg";
}

/** "H:MM:SS" */
function formatStopwatch(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Big hero stopwatch with a breathing glow backdrop while clocked in. Reused by the compact card and the expand dialog. */
export function AttendanceLiveTimer({ elapsedSeconds, status, colors, size = "sm" }: AttendanceLiveTimerProps) {
  const isWorking = status === "CLOCKED_IN";
  const fontSize = size === "lg" ? 56 : 28;
  const glowSize = size === "lg" ? 220 : 120;
  const tone = isWorking ? colors.success : colors.textSecondary;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: size === "lg" ? "8px" : "4px",
      }}
    >
      {isWorking && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: glowSize,
            height: glowSize,
            borderRadius: "50%",
            pointerEvents: "none",
            ...pulseGlowSx(colors.successDim),
          }}
        />
      )}

      <motion.div
        animate={isWorking ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={isWorking ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ display: "flex", alignItems: "baseline", gap: 8, zIndex: 1 }}
      >
        <Typography
          sx={{
            fontSize,
            fontWeight: 800,
            fontFamily: "'DM Mono','Roboto Mono',monospace",
            letterSpacing: ".5px",
            color: tone,
            lineHeight: 1,
          }}
        >
          {formatStopwatch(elapsedSeconds)}
        </Typography>
      </motion.div>

      <Typography sx={{ fontSize: size === "lg" ? 13 : 11, fontWeight: 700, color: colors.textDim, mt: size === "lg" ? "6px" : "2px", zIndex: 1 }}>
        {status === "NOT_STARTED" ? "not started yet" : isWorking ? "worked so far" : "total worked"}
      </Typography>
    </Box>
  );
}
