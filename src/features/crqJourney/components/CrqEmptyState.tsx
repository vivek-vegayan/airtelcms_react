import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

interface CrqEmptyStateProps {
  title?: string;
  subtitle?: string;
}

export const CrqEmptyState: React.FC<CrqEmptyStateProps> = ({
  title = "No CRQ Selected",
  subtitle = "Choose a Change Request above to view its journey flow.",
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 340,
        background: theme.palette.background.paper,
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: "14px",
        gap: 2.5,
        px: 3,
        animation: "crqEmptyFadeIn 0.35s ease-out",
        "@keyframes crqEmptyFadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 72,
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.palette.primary.main}22, transparent 70%)`,
            animation: "crqEmptyPulse 2.6s ease-in-out infinite",
            "@keyframes crqEmptyPulse": {
              "0%, 100%": { transform: "scale(0.9)", opacity: 0.6 },
              "50%": { transform: "scale(1.15)", opacity: 1 },
            },
          }}
        />
        <Box
          sx={{
            position: "relative",
            width: 64,
            height: 64,
            borderRadius: "18px",
            background: isDark
              ? `linear-gradient(135deg, ${theme.palette.primary.main}33, ${theme.palette.primary.main}14)`
              : `linear-gradient(135deg, ${theme.palette.primary.main}1f, ${theme.palette.primary.main}0d)`,
            border: `1px solid ${theme.palette.primary.main}2e`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AccountTreeIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
        </Box>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: 15 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary", mt: 0.5, maxWidth: 340 }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
};
