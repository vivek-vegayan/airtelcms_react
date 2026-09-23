import { memo, useMemo } from "react";
import {
  TableCell,
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import dayjs from "dayjs";
import { formatMinutes, isFutureDate } from "../utils/dateUtils";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePermission } from "../../auth/hooks/usePermission";
import {
  SHIFT_COLOR_MAP,
  resolveShiftKeyFromShift,
} from "../constant/shiftPalette";

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface RosterShiftCellProps {
  shift: any;
  shiftDate: string | Date;
  rowUserId: string | number;
  onEditClick: (shift: any) => void;
  onInfoClick?: (
    shift: any,
    date: string | Date,
    id: string | number,
  ) => void;
  isSelectedForSwap?: boolean;
  isSwapMode?: boolean;
  /** When set, cells whose shift key does NOT match are dimmed */
  highlightShift?: string;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export const RosterShiftCell = memo(function RosterShiftCell({
  shift,
  shiftDate,
  rowUserId,
  onEditClick,
  onInfoClick,
  isSelectedForSwap,
  isSwapMode,
  highlightShift = "",
}: RosterShiftCellProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user, role } = useAuth();
  const { hasPermission } = usePermission();

  const isOff =
    !shift || shift.shiftDisplay === "WO" || shift.type === "Week Off";
  const isLeave =
    shift?.shiftDisplay?.toLowerCase() === "leave" ||
    shift?.type === "Leave";
  const isRegular = !isOff && !isLeave;
  const isToday = dayjs(shiftDate).isSame(dayjs(), "day");
  const shiftKey = resolveShiftKeyFromShift(shift);
  const style = SHIFT_COLOR_MAP[shiftKey] ?? SHIFT_COLOR_MAP.W;

  const cardBg = isDark ? style.cardBgDark : style.cardBg;
  const cardBorder = isDark ? style.cardBorderDark : style.cardBorder;
  const textColor = isDark ? style.textColorDark : style.textColor;

  /** Dim this cell when highlight is active and this shift doesn't match */
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
  const title = isOff
    ? "Week Off"
    : isLeave
      ? "Leave"
      : shift?.shiftDisplay || "Shift";
  const timeRange = isRegular ? shift?.timeRange || "" : "";
  /* The badge already shows the shift code, so the first line only needs the
     time window, e.g. "LG (11:00 AM - 8:00 PM)" → "11:00 AM - 8:00 PM". */
  const headline =
    timeRange || title.match(/\(([^)]+)\)/)?.[1]?.trim() || title;
  const actCount: number = shift?.assignActCount ?? 0;
  const availLabel = formatMinutes(shift?.availableMins);
  const tooltipText = [
    title,
    timeRange,
    `${actCount} ${actCount === 1 ? "activity" : "activities"}`,
    `${availLabel} available`,
  ]
    .filter(Boolean)
    .join(" · ");

  /* ── Week-off: minimal dashed box ─────────────────────────────────── */
  if (isOff) {
    return (
      <TableCell sx={{ p: "3px", borderBottom: "none" }}>
        <Box
          onClick={() => isClickable && onEditClick(shift)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 42,
            borderRadius: "8px",
            border: isSelectedForSwap ? "1px solid" : "1px dashed",
            borderColor: isSelectedForSwap ? "#2563EB" : cardBorder,
            bgcolor: isSelectedForSwap
              ? isDark
                ? "#1E3A8A"
                : "#DBEAFE"
              : cardBg,
            cursor: isClickable ? "pointer" : "default",
            opacity: isDimmed ? 0.1 : 1,
            transition: "opacity .14s, border-color .14s",
            ...(isClickable && {
              "&:hover": { borderColor: style.badgeBg },
            }),
          }}
        >
          <Typography
            fontSize="0.6rem"
            fontWeight={600}
            sx={{
              color: textColor,
              letterSpacing: ".02em",
            }}
          >
            Week off
          </Typography>
        </Box>
      </TableCell>
    );
  }

  /* ── Regular shift ────────────────────────────────────────────────── */
  return (
    <TableCell sx={{ p: "3px", borderBottom: "none" }}>
      <Tooltip
        title={tooltipText}
        arrow
        enterDelay={500}
      >
        <Box
          onClick={() => isClickable && onEditClick(shift)}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            bgcolor: isSelectedForSwap
              ? isDark
                ? "#1E3A8A"
                : "#DBEAFE"
              : cardBg,
            border: `1px solid ${
              isSelectedForSwap
                ? "#2563EB"
                : isToday
                  ? style.badgeBg
                  : cardBorder
            }`,
            borderRadius: "8px",
            px: "6px",
            height: 42,
            overflow: "hidden",
            cursor: isClickable ? "pointer" : "default",
            opacity: isDimmed ? 0.12 : 1,
            transition:
              "transform .13s ease, box-shadow .13s ease, opacity .14s",
            // Today: outline + pulse
            ...(isToday &&
              !isSelectedForSwap && {
                outline: `1.5px solid ${style.badgeBg}`,
                outlineOffset: "1px",
                animation: "todayPulseCell 2.6s ease-in-out infinite",
                "@keyframes todayPulseCell": {
                  "0%,100%": { boxShadow: `0 0 0 0 ${style.glowColor}` },
                  "60%": { boxShadow: `0 0 0 5px transparent` },
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  borderRadius: "7px",
                  background:
                    "linear-gradient(108deg,transparent 20%,rgba(255,255,255,.22) 50%,transparent 80%)",
                  backgroundSize: "200% 100%",
                  animation: "sweepCell 3s linear infinite",
                  pointerEvents: "none",
                },
                "@keyframes sweepCell": {
                  "0%": { backgroundPosition: "-200% center" },
                  "100%": { backgroundPosition: "200% center" },
                },
              }),
            "&:hover": {
              transform: isClickable ? "translateY(-1px)" : "none",
              boxShadow: isClickable ? "0 4px 12px rgba(0,0,0,.08)" : "none",
              "& .sc-ico": { opacity: 0, transform: "translateY(-4px)" },
              "& .sc-info": { opacity: 1 },
            },
          }}
        >
          {/* Today "Live" tag */}
          {isToday && !isSelectedForSwap && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                bgcolor: style.badgeBg,
                color: "#fff",
                fontSize: "7px",
                fontWeight: 700,
                px: "6px",
                py: "2px",
                borderRadius: "0 7px 0 6px",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,.8)",
                  animation:
                    "dotPop .4s .2s both cubic-bezier(.34,1.56,.64,1)",
                  "@keyframes dotPop": {
                    "0%": { transform: "scale(0)", opacity: 0 },
                    "70%": { transform: "scale(1.4)" },
                    "100%": { transform: "scale(1)", opacity: 1 },
                  },
                }}
              />
            </Box>
          )}

          {/* Badge */}
          <Box
            sx={{
              width: 23,
              height: 23,
              borderRadius: "6px",
              bgcolor: style.badgeBg,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: shiftKey.length > 1 ? "0.48rem" : "0.58rem",
              letterSpacing: "-.4px",
              flexShrink: 0,
              textShadow: "0 1px 2px rgba(0,0,0,.15)",
            }}
          >
            {shiftKey}
          </Box>

          {/* Text */}
          <Stack sx={{ flex: 1, minWidth: 0, pr: "14px" }}>
            <Typography
              fontSize="0.6rem"
              fontWeight={700}
              noWrap
              sx={{ color: textColor, lineHeight: 1.3 }}
            >
              {headline}
            </Typography>
            {isRegular && (
              <Stack
                direction="row"
                alignItems="center"
                spacing="6px"
                sx={{ mt: "2px", color: textColor, lineHeight: 1 }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing="2px"
                  sx={{
                    px: "3px",
                    py: "1px",
                    borderRadius: "4px",
                    bgcolor: actCount > 0 ? `${style.badgeBg}26` : "transparent",
                    opacity: actCount > 0 ? 1 : 0.6,
                  }}
                >
                  <AssignmentOutlinedIcon sx={{ fontSize: 10 }} />
                  <Typography fontSize="0.55rem" fontWeight={700} lineHeight={1}>
                    {actCount}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing="2px"
                  sx={{ opacity: 0.75 }}
                >
                  <ScheduleOutlinedIcon sx={{ fontSize: 10 }} />
                  <Typography
                    fontSize="0.55rem"
                    fontWeight={600}
                    lineHeight={1}
                    noWrap
                  >
                    {availLabel}
                  </Typography>
                </Stack>
              </Stack>
            )}
          </Stack>

          {/* Status icon (hides on hover) */}
          {!isToday && isRegular && !isSelectedForSwap && (
            <Box
              className="sc-ico"
              sx={{
                position: "absolute",
                top: 4,
                right: 5,
                width: 14,
                height: 14,
                borderRadius: "50%",
                bgcolor: `${style.badgeBg}22`,
                color: style.badgeBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                transition: "opacity .15s, transform .15s",
              }}
            />
          )}

          {/* Edit button */}
          {canEdit && !isSwapMode && (
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                top: 3,
                right: 3,
                opacity: 0,
                transform: "scale(.8)",
                transition: "all .15s ease",
                bgcolor: isDark
                  ? "rgba(255,255,255,.1)"
                  : "rgba(0,0,0,.04)",
                p: "2px",
                ".sc:hover &, &:focus": { opacity: 1, transform: "scale(1)" },
              }}
            >
              <EditIcon sx={{ fontSize: 12 }} />
            </IconButton>
          )}

          {/* Info icon (appears on hover) */}
          {isRegular && onInfoClick && !isSelectedForSwap && (
            <IconButton
              className="sc-info"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick(shift, shiftDate, rowUserId);
              }}
              sx={{
                position: "absolute",
                bottom: 2,
                right: 4,
                opacity: 0,
                transition: "opacity .15s",
                bgcolor: isDark
                  ? "rgba(255,255,255,.08)"
                  : "rgba(0,0,0,.04)",
                p: "1px",
              }}
            >
              <InfoIcon sx={{ fontSize: 11, color: "text.secondary" }} />
            </IconButton>
          )}

          {/* Swap selected checkmark */}
          {isSelectedForSwap && (
            <Box
              sx={{
                position: "absolute",
                top: 3,
                right: 3,
                width: 14,
                height: 14,
                borderRadius: "50%",
                bgcolor: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{ color: "#fff", fontSize: "8px", fontWeight: 800 }}
              >
                ✓
              </Typography>
            </Box>
          )}
        </Box>
      </Tooltip>
    </TableCell>
  );
});
