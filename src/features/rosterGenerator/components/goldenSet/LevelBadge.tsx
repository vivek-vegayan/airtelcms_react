import { alpha, Box } from "@mui/material";
import { LEVEL_META } from "./goldenGrid.constants";
import type { LevelMeta } from "./goldenGrid.types";

export default function LevelBadge({ level }: { level: string }) {
  const c: LevelMeta = LEVEL_META[level] ?? {
    bg: "#F1F5F9",
    text: "#475569",
    solid: "#64748B",
  };
  return (
    <Box
      component="span"
      sx={{
        display: "inline-grid",
        placeItems: "center",
        px: 0.75,
        height: 18,
        borderRadius: "4px",
        fontSize: 9.5,
        fontWeight: 700,
        bgcolor: c.bg,
        color: c.text,
        border: `1px solid ${alpha(c.solid, 0.25)}`,
        letterSpacing: "0.03em",
        flexShrink: 0,
      }}
    >
      {level}
    </Box>
  );
}
