import { Box, Typography } from "@mui/material";
import type { Colors } from "../types/colorTypes";
import { shiftColorMap } from "../../userMe/userRoster/constants/shiftColors";

interface ShiftLegendProps {
  colors: Colors;
}

export function ShiftLegend({ colors }: ShiftLegendProps) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", mt: "12px" }}>
      <Typography sx={{ fontSize: 9, color: colors.textDim, fontWeight: 700, letterSpacing: ".4px", textTransform: "uppercase" }}>
        Legend
      </Typography>
      {Array.from(shiftColorMap.entries()).map(([code, tone]) => (
        <Box
          key={code}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            borderRadius: "20px",
            px: "8px",
            py: "3px",
            background: tone.background,
            border: `1px solid ${tone.border}`,
          }}
        >
          <Typography sx={{ fontSize: 9, fontWeight: 700, color: tone.color }}>{code}</Typography>
        </Box>
      ))}
    </Box>
  );
}
