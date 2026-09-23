import { memo } from "react";
import { TableCell, Typography, useTheme } from "@mui/material";

interface Props {
  /** Employee count shown next to the label; omit to hide. */
  count?: number;
}

/**
 * Sticky top-left corner header cell ("Employees (n)") shared by the
 * Weekly and Monthly tables. Width matches RosterEmployeeCell.
 */
export const RosterEmployeeHeaderCell = memo(({ count }: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";

  return (
    <TableCell
      sx={{
        width: 190,
        minWidth: 190,
        maxWidth: 190,
        position: "sticky",
        left: 0,
        top: 0,
        zIndex: 30,
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${CELL_BORDER}`,
        borderRight: `1px solid ${CELL_BORDER}`,
        py: "10px",
        px: "8px",
      }}
    >
      <Typography fontSize="0.75rem" fontWeight={600}>
        Employees{count !== undefined ? ` (${count})` : ""}
      </Typography>
    </TableCell>
  );
});
RosterEmployeeHeaderCell.displayName = "RosterEmployeeHeaderCell";
