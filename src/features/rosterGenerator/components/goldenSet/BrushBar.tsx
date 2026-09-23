import { Box, Stack, Typography, useTheme } from "@mui/material";
import { SHIFT_CODES } from "./goldenGrid.constants";
import { useGoldenGridTokens } from "./useGoldenGridTokens";
import ShiftPill from "./ShiftPill";

export default function BrushBar({
  brush,
  onSelect,
}: {
  brush: string;
  onSelect: (c: string) => void;
}) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      flexWrap="wrap"
      sx={{
        px: 2,
        py: 1.25,
        borderBottom: `1px solid ${tk.border}`,
        bgcolor: tk.isDark ? "rgba(24,95,165,0.06)" : "rgba(24,95,165,0.025)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          borderRadius: "6px",
          bgcolor: tk.accentDim,
          border: `1px solid ${tk.accentBorder}`,
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: tk.accent,
            animation: "tkPulse 2s infinite",
          }}
        />
        <Typography
          sx={{
            fontSize: 11,
            color: tk.accent,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          PAINT MODE
        </Typography>
      </Box>
      <Stack direction="row" gap={0.75} flexWrap="wrap">
        {SHIFT_CODES.map((code) => (
          <ShiftPill
            key={code}
            code={code}
            active={brush === code}
            onClick={() => onSelect(code)}
          />
        ))}
      </Stack>
      <Typography
        sx={{
          ml: "auto",
          fontSize: 10.5,
          color: tk.textDim,
          fontStyle: "italic",
          display: { xs: "none", md: "block" },
        }}
      >
        Click or drag cells · hotkeys: G N A B L W H C
      </Typography>
    </Stack>
  );
}
