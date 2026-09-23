
import { Box, useTheme } from "@mui/material";
import { MONO, SHIFT_COLORS } from "../../util/Shiftconstants";
import type { ShiftCode } from "../../types/Futureweek.types";

interface ShiftChipProps {
  code: ShiftCode;
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

export function ShiftChip({ code, size = "md", active = false }: ShiftChipProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const c = SHIFT_COLORS[code];

  const dims =
    size === "sm"
      ? { minWidth: 28, height: 20, fontSize: 10, px: "4px", borderRadius: "4px" }
      : size === "lg"
      ? { minWidth: 44, height: 30, fontSize: 13, px: "8px", borderRadius: "7px" }
      : { minWidth: 36, height: 26, fontSize: 11, px: "6px", borderRadius: "5px" };

  return (
    <Box
      component="span"
      sx={{
        display: "inline-grid",
        placeItems: "center",
        fontFamily: MONO,
        fontWeight: 700,
        letterSpacing: "0.02em",
        border: "1.5px solid",
        userSelect: "none",
        transition: "all 0.1s ease",
        bgcolor: active
          ? (isDark ? c.bgDark : c.bgLight)
          : (isDark ? c.bgDark : c.bgLight),
        color: isDark ? c.fgDark : c.fgLight,
        borderColor: active
          ? c.solid
          : (isDark ? c.borderDark : c.borderLight),
        boxShadow: active ? `0 0 0 2px ${c.solid}40` : "none",
        ...dims,
      }}
    >
      {code}
    </Box>
  );
}