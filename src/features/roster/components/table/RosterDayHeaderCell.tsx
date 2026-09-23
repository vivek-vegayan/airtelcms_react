import { memo } from "react";
import { TableCell, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";

interface Props {
  date: string; // YYYY-MM-DD
  isToday: boolean;
  isWeekend: boolean;
  minWidth: number;
  width?: number | "auto";
}

/**
 * Day column header shared by the Weekly and Monthly tables: weekday on
 * top, day-of-month below, with a blue accent for today and a subtle
 * tint for weekends.
 */
export const RosterDayHeaderCell = memo(
  ({ date, isToday, isWeekend, minWidth, width }: Props) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";

    return (
      <TableCell
        align="center"
        sx={{
          minWidth,
          width,
          px: "4px",
          py: "6px",
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: isToday
            ? isDark
              ? alpha("#3B82F6", 0.15)
              : "#EBF3FF"
            : isWeekend
              ? isDark
                ? alpha("#fff", 0.02)
                : "#FAFAFA"
              : theme.palette.background.paper,
          boxShadow: isToday ? "inset 0 -2px 0 #3B82F6" : "none",
          borderBottom: isToday ? "none" : `1px solid ${CELL_BORDER}`,
        }}
      >
        <Typography
          fontSize="0.7rem"
          fontWeight={600}
          color={isToday ? "#2563EB" : "text.secondary"}
          lineHeight={1.2}
        >
          {dayjs(date).format("ddd")}
        </Typography>
        <Typography
          fontWeight={700}
          fontSize="0.9rem"
          color={isToday ? "#2563EB" : "text.primary"}
          lineHeight={1.2}
        >
          {dayjs(date).format("DD")}
        </Typography>
      </TableCell>
    );
  },
);
RosterDayHeaderCell.displayName = "RosterDayHeaderCell";
