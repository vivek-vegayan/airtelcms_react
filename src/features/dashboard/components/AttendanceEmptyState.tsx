import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import WavingHandRoundedIcon from "@mui/icons-material/WavingHandRounded";
import KeyboardDoubleArrowDownRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowDownRounded";
import type { Colors } from "../types/colorTypes";

interface AttendanceEmptyStateProps {
  colors: Colors;
}

/** Friendly "nothing clocked yet" illustration + nudge, shown in the expand dialog before the first clock-in. */
export function AttendanceEmptyState({ colors }: AttendanceEmptyStateProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", py: "22px" }}>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.accentDim} 0%, transparent 72%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: colors.accentDim,
            border: `1.5px solid ${colors.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WavingHandRoundedIcon sx={{ fontSize: 30, color: colors.accent }} />
        </Box>
      </motion.div>

      <Typography sx={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary, textAlign: "center" }}>
        Ready to start your day?
      </Typography>
      <Typography sx={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", maxWidth: 280 }}>
        Pick a work mode and clock in — we'll start tracking your hours right away.
      </Typography>

      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ marginTop: 2 }}
      >
        <KeyboardDoubleArrowDownRoundedIcon sx={{ fontSize: 20, color: colors.accent }} />
      </motion.div>
    </Box>
  );
}
