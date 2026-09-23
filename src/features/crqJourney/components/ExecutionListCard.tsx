import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";

interface ExecutionListCardProps {
  icon: React.ElementType;
  label: string;
  statusLabel: string;
  color: string;
  muted?: boolean;
}

/** Compact monochrome-bordered card used inside the dashed Execution box. */
export const ExecutionListCard: React.FC<ExecutionListCardProps> = ({ icon: Icon, label, statusLabel, color, muted }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Paper
      elevation={0}
      sx={{
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : "#DBE6F2"}`,
        borderRadius: "10px",
        p: "10px 11px",
        position: "relative",
        background: theme.palette.background.paper,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Icon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0, mt: "1px" }} />
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.primary", lineHeight: 1.25 }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize: 11, color, mt: 0.75, pl: "24px", fontWeight: muted ? 400 : 500 }}>{statusLabel}</Typography>
      <Box
        sx={{
          position: "absolute",
          right: 9,
          bottom: 9,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: muted ? (isDark ? "#475569" : "#CBD5E1") : color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
      </Box>
    </Paper>
  );
};
