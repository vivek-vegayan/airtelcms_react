import { Box, TableCell, Tooltip, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";
import {
  getShiftStyle,
  resolveShiftKeyFromDisplay,
} from "../constant/shiftPalette";
import { formatMinutes } from "../utils/dateUtils";
import type { ShiftInfo, UserRoster } from "../types/monthlyRoster.type";

interface Props {
  user: UserRoster;
  date: string;
  shift: ShiftInfo | undefined;
  detailedView: boolean;
  highlightShift: string;
  isToday: boolean;
  isWeekend: boolean;
  onOpenDetail: (user: UserRoster, date: string, shift?: ShiftInfo) => void;
}

/**
 * One day cell of the Monthly grid: a compact shift-key pill (or dashed
 * week-off box) with a hover tooltip; clicking opens the detail dialog.
 */
export const MonthlyShiftCell = ({
  user,
  date,
  shift,
  detailedView,
  highlightShift,
  isToday,
  isWeekend,
  onOpenDetail,
}: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";

  const key = resolveShiftKeyFromDisplay(shift?.shiftDisplay);
  const p = getShiftStyle(key);
  const isWO = key === "W";
  const isDimmed = highlightShift !== "" && key !== highlightShift;

  return (
    <TableCell
      align="center"
      sx={{
        px: "2px",
        py: "4px",
        borderBottom: `1px solid ${CELL_BORDER}`,
        bgcolor: isToday
          ? isDark
            ? alpha("#3B82F6", 0.04)
            : alpha("#EBF3FF", 0.4)
          : isWeekend
            ? isDark
              ? alpha("#fff", 0.01)
              : "#FAFAFA"
            : "transparent",
      }}
    >
      <Tooltip
        arrow
        placement="top"
        title={
          <Box>
            <Typography fontSize={12} fontWeight={600}>
              {user.olmid} · {user.jobLevel}
            </Typography>
            <Typography fontSize={11}>
              {dayjs(date).format("ddd, DD MMM YYYY")}
            </Typography>
            <Typography fontSize={11}>
              Shift: {shift?.shiftDisplay ?? "Week Off"}
            </Typography>
            {shift?.workMode && (
              <Typography fontSize={11}>Mode: {shift.workMode}</Typography>
            )}
            {!isWO && (
              <Typography fontSize={11}>
                Activities: {shift?.assignActCount ?? 0}
              </Typography>
            )}
            {!isWO && shift?.availableMins !== undefined && (
              <Typography fontSize={11}>
                Available: {formatMinutes(shift.availableMins)}
              </Typography>
            )}
          </Box>
        }
      >
        {isWO ? (
          /* ── Week Off ── */
          <Box
            onClick={() => onOpenDetail(user, date, shift)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: detailedView ? 72 : 26,
              height: 22,
              borderRadius: "5px",
              border: "1px dashed",
              borderColor: isDark ? p.cardBorderDark : p.cardBorder,
              bgcolor: isDark ? p.cardBgDark : p.cardBg,
              color: isDark ? p.textColorDark : p.textColor,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              userSelect: "none",
              opacity: isDimmed ? 0.1 : 1,
              transition: "border-color .14s, color .14s, transform .14s",
              "&:hover": {
                borderColor: isDark ? "rgba(255,255,255,.25)" : "#CBD5E1",
                color: isDark ? "rgba(255,255,255,.4)" : "#94A3B8",
                transform: "scale(1.05)",
              },
            }}
          >
            {detailedView ? "Week Off" : "WO"}
          </Box>
        ) : (
          /* ── Regular shift ── */
          <Box
            onClick={() => onOpenDetail(user, date, shift)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: detailedView ? "4px" : 0,
              width: detailedView ? "auto" : 26,
              minWidth: detailedView ? 90 : 26,
              height: detailedView ? 26 : 22,
              px: detailedView ? "8px" : 0,
              borderRadius: "5px",
              border: `1px solid ${isDark ? alpha(p.badgeBg, 0.3) : p.cardBorder}`,
              bgcolor: isDark ? alpha(p.badgeBg, 0.15) : p.cardBg,
              opacity: isDimmed ? 0.12 : 1,
              cursor: "pointer",
              userSelect: "none",
              transition: "opacity .14s, transform .14s, box-shadow .14s",
              "&:hover": {
                opacity: isDimmed ? 0.25 : 1,
                transform: "scale(1.1)",
                boxShadow: `0 2px 8px ${p.badgeBg}44`,
              },
            }}
          >
            {/* Colored dot in detailed mode */}
            {detailedView && (
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "2px",
                  bgcolor: p.badgeBg,
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              sx={{
                fontSize: detailedView ? 11 : 10,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: key.length > 1 ? "-.4px" : 0,
                color: isDark ? alpha(p.badgeBg, 0.9) : p.textColor,
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              {detailedView ? (shift?.shiftDisplay ?? "WO") : key}
            </Typography>
          </Box>
        )}
      </Tooltip>
    </TableCell>
  );
};
