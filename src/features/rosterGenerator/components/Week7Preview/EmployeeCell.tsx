import React, { memo } from "react";
import { alpha, Box, Stack, Typography, useTheme } from "@mui/material";
import type { NormalisedEmployee } from "../../types/Futureweek.types";
import { nameInitials } from "../../util/Futureweek.utils";
import { LEVEL_COLORS } from "../../util/Shiftconstants";
interface EmployeeCellProps {
  employee: NormalisedEmployee;
  /** Highlights the avatar when the row is selected in row-edit mode */
  accent?: boolean;
}

export const EmployeeCell = memo(function EmployeeCell({
  employee,
  accent,
}: EmployeeCellProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const initials = nameInitials(employee.employeeName);
  const lc = LEVEL_COLORS[employee.jobLevel] ?? LEVEL_COLORS["L1"];

  return (
    <Stack direction="row" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
      {/* Avatar */}
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "9px",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.02em",
          bgcolor: accent
            ? (isDark
                ? alpha(theme.palette.warning.main, 0.18)
                : alpha(theme.palette.warning.main, 0.1))
            : (isDark
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.primary.main, 0.07)),
          color: accent
            ? (isDark ? theme.palette.warning.light : theme.palette.warning.dark)
            : (isDark ? theme.palette.primary.light : theme.palette.primary.main),
          border: `1px solid ${alpha(
            accent ? theme.palette.warning.main : theme.palette.primary.main,
            isDark ? 0.3 : 0.18,
          )}`,
          transition: "all 0.15s ease",
        }}
      >
        {initials}
      </Box>

      {/* Name + meta */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 0.25 }}>
          <Typography
            noWrap
            sx={{
              fontSize: 12.5,
              fontWeight: 650,
              lineHeight: 1.2,
              color: "text.primary",
            }}
          >
            {employee.employeeName}
          </Typography>

          {/* Level badge */}
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
              bgcolor: isDark ? alpha(lc.solid, 0.2) : lc.bg,
              color: isDark ? lc.solid : lc.text,
              border: `1px solid ${alpha(lc.solid, isDark ? 0.35 : 0.2)}`,
              letterSpacing: "0.03em",
              flexShrink: 0,
            }}
          >
            {employee.jobLevel}
          </Box>
        </Stack>

        <Typography
          noWrap
          sx={{ fontSize: 10, color: "text.secondary", fontWeight: 500 }}
        >
          {employee.olmid} · {employee.roleCode.replace(/_/g, " ")}
        </Typography>
      </Box>
    </Stack>
  );
});