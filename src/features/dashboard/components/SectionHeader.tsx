import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { Colors } from "../types/colorTypes";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  colors: Colors;
}

export function SectionHeader({ title, subtitle, right, colors }: SectionHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // When the card gets narrow the whole control group moves to its own row
        // rather than squeezing the title into two lines beside it.
        flexWrap: "wrap",
        columnGap: "10px",
        rowGap: "6px",
        mb: "12px",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {/* nowrap is what makes the control group wrap first: the title keeps
            its full hypothetical width, so flex breaks the line before it. A
            title too long for the card on its own still ellipsizes. */}
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.textPrimary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 11, color: colors.textSecondary, mt: 0.3, fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {right && <Box sx={{ flexShrink: 0, ml: "auto" }}>{right}</Box>}
    </Box>
  );
}
