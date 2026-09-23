import { memo, useMemo } from "react";
import { TableCell, Box, Tooltip, Typography, useTheme } from "@mui/material";
import dayjs from "dayjs";
import { formatMinutes, isFutureDate } from "../utils/dateUtils";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePermission } from "../../auth/hooks/usePermission";
import {
  SHIFT_COLOR_MAP,
  hexToRgb,
  resolveShiftKeyFromShift,
} from "../constant/shiftPalette";

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface RosterShiftCellCompactProps {
  shift: any;
  shiftDate: string | Date;
  rowUserId: string | number;
  onEditClick: (shift: any) => void;
  isSelectedForSwap?: boolean;
  isSwapMode?: boolean;
  highlightShift?: string;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export const RosterShiftCellCompact = memo(function RosterShiftCellCompact({
  shift,
  shiftDate,
  rowUserId,
  onEditClick,
  isSelectedForSwap,
  isSwapMode,
  highlightShift = "",
}: RosterShiftCellCompactProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user, role } = useAuth();
  const { hasPermission } = usePermission();

  const isOff =
    !shift || shift.shiftDisplay === "WO" || shift.type === "Week Off";
  const isLeave =
    shift?.shiftDisplay?.toLowerCase() === "leave" || shift?.type === "Leave";
  const isToday = dayjs(shiftDate).isSame(dayjs(), "day");
  const shiftKey = resolveShiftKeyFromShift(shift);
  const style = SHIFT_COLOR_MAP[shiftKey] ?? SHIFT_COLOR_MAP.W;

  const isDimmed = highlightShift !== "" && shiftKey !== highlightShift;

  const isFuture = isFutureDate(shiftDate);
  const canEdit = useMemo(() => {
    if (!isFuture) return false;
    if (role === "TEAM_MEMBER")
      return String(user?.userId) === String(rowUserId);
    return (
      hasPermission("Roster Management", "UPDATE") || role === "SUPER_ADMIN"
    );
  }, [isFuture, role, user, rowUserId, hasPermission]);

  const isClickable = canEdit || isSwapMode;

  const tooltipTitle = isOff
    ? "Week Off"
    : isLeave
      ? "Leave"
      : shift?.shiftDisplay || "Shift";

  const actCount: number = shift?.assignActCount ?? 0;
  const regularTooltip = isLeave
    ? tooltipTitle
    : `${tooltipTitle} · ${actCount} ${
        actCount === 1 ? "activity" : "activities"
      } · ${formatMinutes(shift?.availableMins)} available`;

  /* shared TableCell sx — tight padding, centered content */
  const cellSx = {
    p: "4px 0",
    borderBottom: "none",
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
    minWidth: 56,
    width: 56,
  };

  /* ── Week-off ──────────────────────────────────────────────────────── */
  if (isOff) {
    return (
      <TableCell sx={cellSx}>
        <Tooltip title="Week Off" arrow enterDelay={400}>
          <Box
            onClick={() => isClickable && onEditClick(shift)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 26,
              borderRadius: "6px",
              border: isSelectedForSwap ? "1.5px solid" : "1.5px dashed",
              borderColor: isSelectedForSwap
                ? "#2563EB"
                : isDark
                  ? style.cardBorderDark
                  : style.cardBorder,
              bgcolor: isSelectedForSwap
                ? isDark
                  ? "#1E3A8A"
                  : "#DBEAFE"
                : isDark
                  ? style.cardBgDark
                  : style.cardBg,
              cursor: isClickable ? "pointer" : "default",
              opacity: isDimmed ? 0.1 : 1,
              transition: "opacity .14s, border-color .14s",
              mx: "auto",
              ...(isClickable && {
                "&:hover": { borderColor: style.badgeBg },
              }),
            }}
          >
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 600,
                color: isDark ? style.textColorDark : style.textColor,
                letterSpacing: ".02em",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              WO
            </Typography>
          </Box>
        </Tooltip>
      </TableCell>
    );
  }

  /* ── Regular shift ── */
  return (
    <TableCell sx={cellSx}>
      <Tooltip title={regularTooltip} arrow enterDelay={400}>
        <Box
          onClick={() => isClickable && onEditClick(shift)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 26,
            borderRadius: "6px",
            border: `1.5px solid ${
              isSelectedForSwap
                ? "#2563EB"
                : isToday
                  ? style.badgeBg
                  : isDark
                    ? `rgba(${hexToRgb(style.badgeBg)}, 0.35)`
                    : style.cardBorder
            }`,
            bgcolor: isSelectedForSwap
              ? isDark
                ? "#1E3A8A"
                : "#DBEAFE"
              : isDark
                ? `rgba(${hexToRgb(style.badgeBg)}, 0.18)`
                : style.cardBg,
            cursor: isClickable ? "pointer" : "default",
            opacity: isDimmed ? 0.12 : 1,
            mx: "auto",
            outline:
              isToday && !isSelectedForSwap
                ? `1.5px solid ${style.badgeBg}`
                : "none",
            outlineOffset: "1px",
            transition: "opacity .14s, transform .13s, box-shadow .13s",
            "&:hover": {
              opacity: isDimmed ? 0.25 : 1,
              transform: isClickable ? "scale(1.08)" : "none",
              boxShadow: isClickable
                ? `0 2px 8px rgba(${hexToRgb(style.badgeBg)}, 0.35)`
                : "none",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: shiftKey.length > 1 ? "0.55rem" : "0.62rem",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: shiftKey.length > 1 ? "-.5px" : "0",
              color: isDark
                ? `rgba(${hexToRgb(style.badgeBg)}, 0.95)`
                : style.textColor,
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {shiftKey}
          </Typography>
        </Box>
      </Tooltip>
    </TableCell>
  );
});
