import { alpha, Box, Stack, Typography, useTheme } from "@mui/material";
import { AVATAR } from "./goldenGrid.constants";
import type { GoldenSetEmployee } from "./goldenGrid.types";
import { initials } from "./goldenGrid.utils";
import { useGoldenGridTokens } from "./useGoldenGridTokens";
import LevelBadge from "./LevelBadge";

export default function EmployeeCell({
  emp,
  isEditing,
}: {
  emp: GoldenSetEmployee;
  isEditing?: boolean;
}) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);
  const inits = initials(emp.name);
  return (
    <Stack direction="row" alignItems="center" gap={1.1} sx={{ minWidth: 0 }}>
      <Box
        sx={{
          width: AVATAR,
          height: AVATAR,
          borderRadius: tk.radius,
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 10.5,
          letterSpacing: "0.02em",
          flexShrink: 0,
          bgcolor: isEditing
            ? tk.accentDim
            : alpha(theme.palette.text.primary, 0.05),
          color: isEditing ? tk.accent : tk.textSecondary,
          border: "1.5px solid",
          borderColor: isEditing ? tk.accentBorder : "transparent",
          transition: "all 0.2s",
        }}
      >
        {inits}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={0.75}>
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 650,
              lineHeight: 1.15,
              color: tk.textPrimary,
            }}
            noWrap
          >
            {emp.name}
          </Typography>
          <LevelBadge level={emp.level} />
        </Stack>
        <Typography
          sx={{
            fontSize: 9.5,
            color: tk.textSecondary,
            fontWeight: 500,
            mt: 0.1,
            lineHeight: 1.2,
          }}
          noWrap
        >
          {emp.olmid} · {emp.role.replace(/_/g, " ")}
        </Typography>
      </Box>
    </Stack>
  );
}
