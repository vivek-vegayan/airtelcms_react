import type { ReactNode } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useGoldenGridTokens } from "./useGoldenGridTokens";

interface GoldenGridHintBannerProps {
  icon: ReactNode;
  children: ReactNode;
}

export default function GoldenGridHintBanner({
  icon,
  children,
}: GoldenGridHintBannerProps) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: tk.radiusL,
        flexShrink: 0,
        bgcolor: tk.isDark ? "rgba(255,255,255,0.03)" : "rgba(13,27,42,0.025)",
        border: `1px dashed ${tk.border}`,
        animation: "fadeSlideIn .18s ease",
      }}
    >
      {icon}
      <Typography sx={{ fontSize: 11, color: tk.textDim }}>
        {children}
      </Typography>
    </Box>
  );
}
