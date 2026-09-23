import { useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Tooltip,
  Collapse,
  Paper,
  useTheme,
  alpha,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import dayjs from "dayjs";

interface ShiftCount {
  shiftName: string;
  totalUsers: number;
}

interface CoverageHealthBarProps {
  shiftCounts: ShiftCount[];           // from useGetCurrentShiftCountQuery
  weekDates: string[];                 // YYYY-MM-DD array for current period
  /** Per-day breakdown: date → shiftName → count */
  perDayCounts?: Record<string, Record<string, number>>;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  /** Minimum active staff required per day (default: 2) */
  minActive?: number;
}

const SHIFT_MIN_RULES: Record<string, number> = {
  N: 1, // at least 1 night shift
  G: 1, // at least 1 general/morning
};

// Map shift codes to display labels
const SHIFT_LABEL: Record<string, string> = {
  G: "General",
  N: "Night",
  B: "Break",
  LG: "Late General",
  A: "Afternoon",
};

const SHIFT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  G:           { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  N:           { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  B:           { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  LG:          { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  A:           { bg: "#FEFCE8", text: "#A16207", border: "#FEF08A" },
  "TOTAL COUNT": { bg: "#F0FDF4", text: "#15803D", border: "#86EFAC" },
};

const SHIFT_COLOR_DARK: Record<string, { bg: string; text: string; border: string }> = {
  G:           { bg: "#1e3a5f", text: "#93C5FD", border: "#1D4ED8" },
  N:           { bg: "#1e1b4b", text: "#A5B4FC", border: "#4338CA" },
  B:           { bg: "#422006", text: "#FCD34D", border: "#B45309" },
  LG:          { bg: "#052e16", text: "#6EE7B7", border: "#065F46" },
  A:           { bg: "#3b2a00", text: "#FDE68A", border: "#A16207" },
  "TOTAL COUNT": { bg: "#052e16", text: "#6EE7B7", border: "#065F46" },
};

export const CoverageHealthBar = ({
  shiftCounts,
  weekDates,
  perDayCounts,
  showDetails = false,
  onToggleDetails,
  minActive = 2,
}: CoverageHealthBarProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Derive gap days from per-day breakdown if available
  const { gapDays, gapDetails } = useMemo(() => {
    if (!perDayCounts || !weekDates.length) return { gapDays: 0, gapDetails: [] };

    const details: { date: string; reason: string }[] = [];

    weekDates.forEach((date) => {
      const day = dayjs(date).day(); // 0=Sun, 6=Sat
      if (day === 0 || day === 6) return; // skip weekends

      const counts = perDayCounts[date] || {};
      const active = Object.entries(counts)
        .filter(([k]) => !["W", "L"].includes(k))
        .reduce((s, [, v]) => s + v, 0);

      if (active < minActive) {
        details.push({
          date,
          reason: `Only ${active} active staff (min ${minActive})`,
        });
        return;
      }

      // Check shift-specific minimums
      for (const [shift, min] of Object.entries(SHIFT_MIN_RULES)) {
        if ((counts[shift] || 0) < min) {
          details.push({
            date,
            reason: `${SHIFT_LABEL[shift] || shift} shift understaffed`,
          });
          return;
        }
      }
    });

    return { gapDays: details.length, gapDetails: details };
  }, [perDayCounts, weekDates, minActive]);

  const totalStaff =
    shiftCounts.find((s) => s.shiftName === "TOTAL COUNT")?.totalUsers ?? 0;
  const isHealthy = gapDays === 0 && totalStaff > 0;
  const hasData = shiftCounts.length > 0;

  const colorMap = isDark ? SHIFT_COLOR_DARK : SHIFT_COLOR;

  return (
    <Box
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.6)
          : alpha("#F8FAFC", 0.8),
        px: 2,
        py: 1,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
        {/* Health chip — clickable to expand details */}
        <Tooltip
          title={
            !hasData
              ? "No roster data loaded"
              : isHealthy
              ? "All coverage rules pass for this period"
              : `${gapDays} day${gapDays > 1 ? "s" : ""} below minimum staffing`
          }
        >
          <Chip
            size="small"
            clickable={!!onToggleDetails}
            onClick={onToggleDetails}
            icon={
              isHealthy ? (
                <CheckCircleIcon sx={{ fontSize: "14px !important" }} />
              ) : (
                <WarningAmberIcon sx={{ fontSize: "14px !important" }} />
              )
            }
            label={
              !hasData
                ? "No data"
                : isHealthy
                ? "Coverage healthy"
                : `${gapDays} gap day${gapDays > 1 ? "s" : ""}`
            }
            color={!hasData ? "default" : isHealthy ? "success" : "error"}
            sx={{ fontWeight: 700, fontSize: "0.72rem", height: 26 }}
          />
        </Tooltip>

        {/* Divider dot */}
        <Box
          sx={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            bgcolor: "text.disabled",
            flexShrink: 0,
          }}
        />

        {/* Per-shift count pills */}
        <Stack direction="row" gap={0.75} flexWrap="wrap" alignItems="center">
          {shiftCounts
            .filter((s) => s.shiftName !== "TOTAL COUNT")
            .map((item) => {
              const style = colorMap[item.shiftName] ?? {
                bg: isDark ? "#1e293b" : "#F1F5F9",
                text: isDark ? "#94a3b8" : "#475569",
                border: isDark ? "#334155" : "#E2E8F0",
              };
              const isLow =
                SHIFT_MIN_RULES[item.shiftName] !== undefined &&
                item.totalUsers < SHIFT_MIN_RULES[item.shiftName];

              return (
                <Tooltip
                  key={item.shiftName}
                  title={`${SHIFT_LABEL[item.shiftName] || item.shiftName}: ${item.totalUsers} staff${isLow ? " ⚠ below minimum" : ""}`}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1,
                      py: 0.25,
                      borderRadius: 5,
                      border: `1px solid ${isLow ? theme.palette.error.main : style.border}`,
                      bgcolor: isLow
                        ? alpha(theme.palette.error.main, isDark ? 0.15 : 0.06)
                        : style.bg,
                      cursor: "default",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: isLow ? theme.palette.error.main : style.text,
                        lineHeight: 1,
                      }}
                    >
                      {item.shiftName}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: isLow
                          ? theme.palette.error.main
                          : theme.palette.text.primary,
                        lineHeight: 1,
                      }}
                    >
                      {item.totalUsers}
                    </Typography>
                    {isLow && (
                      <WarningAmberIcon
                        sx={{
                          fontSize: 11,
                          color: theme.palette.error.main,
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
        </Stack>

        {/* Total */}
        {totalStaff > 0 && (
          <>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: "text.disabled",
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {totalStaff} total
            </Typography>
          </>
        )}

        {/* Info toggle */}
        {onToggleDetails && gapDays > 0 && (
          <Tooltip title="View gap details">
            <InfoOutlinedIcon
              onClick={onToggleDetails}
              sx={{
                fontSize: 15,
                color: "text.disabled",
                cursor: "pointer",
                ml: "auto",
                "&:hover": { color: "text.secondary" },
              }}
            />
          </Tooltip>
        )}
      </Stack>

      {/* Gap details panel */}
      <Collapse in={showDetails && gapDetails.length > 0}>
        <Paper
          elevation={0}
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            bgcolor: alpha(theme.palette.error.main, isDark ? 0.08 : 0.04),
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: theme.palette.error.main,
              display: "block",
              mb: 1,
            }}
          >
            Coverage gaps
          </Typography>
          <Stack gap={0.5}>
            {gapDetails.map((g) => (
              <Stack key={g.date} direction="row" gap={1} alignItems="center">
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, minWidth: 90, color: "text.primary" }}
                >
                  {dayjs(g.date).format("ddd, MMM D")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {g.reason}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
};