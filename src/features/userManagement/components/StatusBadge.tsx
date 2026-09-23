import { Box, Typography, alpha, useTheme } from "@mui/material";
import type { UserStatus } from "../types/user";

/**
 * Status pill. The colours come from the live palette rather than the
 * hardcoded pastel hexes this used before (`#ECFDF5` / `#F3F4F6`), which were
 * near-white chips on the dark theme's dark surfaces.
 */
export default function StatusBadge({ status }: { status: UserStatus }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const active = status === "Active";

  const base = active ? theme.palette.success.main : theme.palette.text.disabled;
  const text = active
    ? isDark
      ? theme.palette.success.light
      : theme.palette.success.dark
    : theme.palette.text.secondary;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.7,
        px: 1.1,
        py: 0.4,
        borderRadius: 999,
        bgcolor: alpha(base, isDark ? 0.18 : 0.1),
        border: "1px solid",
        borderColor: alpha(base, isDark ? 0.32 : 0.22),
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: base, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: text, lineHeight: 1 }}>
        {status}
      </Typography>
    </Box>
  );
}
