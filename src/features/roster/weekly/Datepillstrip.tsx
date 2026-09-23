import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import dayjs from "dayjs";

interface DatePillStripProps {
  /** All dates in the current view period */
  dates: string[]; // YYYY-MM-DD
  /** Currently selected date */
  selectedDate: string; // YYYY-MM-DD
  /** Called when a date pill is clicked */
  onDateChange: (date: string) => void;
  /** Optional: map of date → shift code for coloring the pill bar */
  shiftCodeByDate?: Record<string, string>;
  /** Optional: map of date → CRQ/activity count for the dot */
  activityCountByDate?: Record<string, number>;
}

// Maps shift codes to accent colors for the pill bar indicator
const SHIFT_BAR_COLOR: Record<string, string> = {
  G:  "#0095fa",
  N:  "#35359c",
  A:  "#EAB308",
  B:  "#F59E0B",
  LG: "#16a34a",
  W:  "transparent",
  L:  "transparent",
};

export const DatePillStrip = ({
  dates,
  selectedDate,
  onDateChange,
  shiftCodeByDate = {},
  activityCountByDate = {},
}: DatePillStripProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const selectedIdx = dates.indexOf(selectedDate);

  function step(dir: number) {
    const next = selectedIdx + dir;
    if (next >= 0 && next < dates.length) {
      onDateChange(dates[next]);
    }
  }

  const isWeekend = (date: string) => {
    const d = dayjs(date).day();
    return d === 0 || d === 6;
  };

  return (
    <Box
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.5)
          : "#F8FAFC",
        px: 1.5,
        py: 1,
      }}
    >
      {/* Date label + stepper row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.75 }}
      >
        <IconButton
          size="small"
          onClick={() => step(-1)}
          disabled={selectedIdx <= 0}
          sx={{ p: 0.25 }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        <Typography
          variant="body2"
          sx={{ fontWeight: 700, fontSize: "0.78rem", textAlign: "center" }}
        >
          {dayjs(selectedDate).format("dddd, MMM D, YYYY")}
        </Typography>

        <IconButton
          size="small"
          onClick={() => step(1)}
          disabled={selectedIdx >= dates.length - 1}
          sx={{ p: 0.25 }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Pill strip */}
      <Stack
        direction="row"
        gap={0.4}
        sx={{
          overflowX: "auto",
          pb: 0.25,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {dates.map((date) => {
          const isSelected = date === selectedDate;
          const isWknd = isWeekend(date);
          const shiftCode = shiftCodeByDate[date] || "";
          const barColor = SHIFT_BAR_COLOR[shiftCode] ?? "transparent";
          const actCount = activityCountByDate[date] ?? 0;

          return (
            <Tooltip
              key={date}
              title={dayjs(date).format("ddd, MMM D")}
              enterDelay={600}
            >
              <Box
                onClick={() => onDateChange(date)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.3,
                  px: 0.75,
                  pt: 0.5,
                  pb: 0.4,
                  borderRadius: 1.5,
                  minWidth: 36,
                  cursor: "pointer",
                  flexShrink: 0,
                  border: "1px solid",
                  borderColor: isSelected
                    ? theme.palette.primary.main
                    : "transparent",
                  bgcolor: isSelected
                    ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.08)
                    : isWknd
                    ? isDark
                      ? alpha("#fff", 0.03)
                      : alpha("#000", 0.025)
                    : "transparent",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: isSelected
                      ? alpha(theme.palette.primary.main, isDark ? 0.25 : 0.12)
                      : isDark
                      ? alpha("#fff", 0.06)
                      : alpha("#000", 0.04),
                  },
                }}
              >
                {/* Day of week */}
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: isSelected
                      ? theme.palette.primary.main
                      : isWknd
                      ? "text.disabled"
                      : "text.secondary",
                    lineHeight: 1,
                  }}
                >
                  {dayjs(date).format("dd").slice(0, 2)}
                </Typography>

                {/* Date number */}
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected
                      ? theme.palette.primary.main
                      : isWknd
                      ? "text.disabled"
                      : "text.primary",
                    lineHeight: 1,
                  }}
                >
                  {dayjs(date).format("DD")}
                </Typography>

                {/* Shift bar indicator */}
                <Box
                  sx={{
                    width: "80%",
                    height: 3,
                    borderRadius: 2,
                    bgcolor:
                      barColor === "transparent"
                        ? isDark
                          ? alpha("#fff", 0.08)
                          : alpha("#000", 0.06)
                        : actCount > 0
                        ? barColor
                        : "transparent",
                    transition: "background-color 0.2s ease",
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
};