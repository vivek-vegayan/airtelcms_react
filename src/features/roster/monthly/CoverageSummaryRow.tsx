import { memo } from "react";
import { TableCell, TableRow, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface Props {
  /** Active-staff count per day, parallel to `dates`. */
  coverage: number[];
  dates: string[];
  /** Number of currently visible (filtered) employees. */
  totalUsers: number;
}

/**
 * Sticky "Active staff / day" summary row at the bottom of the Monthly
 * grid, color-coded by coverage percentage.
 */
export const CoverageSummaryRow = memo(function CoverageSummaryRow({
  coverage,
  dates,
  totalUsers,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";

  const getCoverageColor = (count: number) => {
    const pct = totalUsers > 0 ? count / totalUsers : 0;
    if (pct > 0.7) return theme.palette.success.main;
    if (pct > 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <TableRow
      sx={{
        bgcolor: isDark ? alpha("#fff", 0.03) : "#F9FAFB",
        position: "sticky",
        bottom: 0,
        zIndex: 5,
      }}
    >
      <TableCell
        sx={{
          position: "sticky",
          left: 0,
          zIndex: 10,
          bgcolor: isDark ? alpha("#fff", 0.03) : "#F9FAFB",
          borderTop: `1px solid ${CELL_BORDER}`,
          borderRight: `1px solid ${CELL_BORDER}`,
          borderBottom: "none",
          py: "5px",
          px: "12px",
        }}
      >
        <Typography fontSize={10} fontWeight={600} color="text.secondary">
          Active staff / day
        </Typography>
      </TableCell>
      {coverage.map((count, i) => (
        <TableCell
          key={dates[i]}
          align="center"
          sx={{
            py: "4px",
            borderTop: `1px solid ${CELL_BORDER}`,
            borderBottom: "none",
          }}
        >
          <Typography
            fontSize={10}
            fontWeight={700}
            color={getCoverageColor(count)}
          >
            {count}
          </Typography>
        </TableCell>
      ))}
    </TableRow>
  );
});
