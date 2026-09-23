import React, { memo } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import moment from "moment";
import { useCalendarTokens } from "../constants/calendarTokens";

type RosterView = "month" | "week" | "day";

/**
 * Rendered as a sibling of the calendar rather than through rbc's `toolbar`
 * slot, so the error notice and the month summary can sit between it and
 * the grid. Navigation semantics are unchanged — PREV/NEXT still step by
 * the active view's unit, TODAY still jumps to now.
 */
interface CustomToolbarProps {
  date: Date;
  label: string;
  currentView: RosterView;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: RosterView) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const VIEWS: readonly RosterView[] = ["month", "week", "day"];

const CustomToolbar: React.FC<CustomToolbarProps> = ({
  date,
  onNavigate,
  onView,
  label,
  currentView,
  onRefresh,
  isRefreshing,
}) => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  const isCurrentPeriod = moment(date).isSame(moment(), "month");

  // Sub-label gives the range real context; rbc's own `label` already
  // reads correctly for week and day, so only Month needs enriching.
  const subLabel =
    currentView === "month"
      ? `${moment(date).startOf("month").format("ddd, DD MMM")} – ${moment(date)
          .endOf("month")
          .format("ddd, DD MMM YYYY")}`
      : moment(date).format("MMMM YYYY");

  const navButtonSx = {
    width: 32,
    height: 32,
    borderRadius: `${t.radiusSm}px`,
    color: t.textMuted,
    "&:hover": { bgcolor: t.hoverBg, color: t.text },
  } as const;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      rowGap={1.25}
      columnGap={1.5}
      sx={{ mb: 1.5 }}
    >
      {/* ── Period navigation ──────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={1.25} minWidth={0}>
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            border: `1px solid ${t.grid}`,
            borderRadius: `${t.radiusSm + 2}px`,
            bgcolor: t.surface,
            overflow: "hidden",
          }}
        >
          <Tooltip title="Previous" arrow>
            <IconButton
              size="small"
              aria-label="Previous period"
              onClick={() => onNavigate("PREV")}
              sx={{ ...navButtonSx, borderRadius: 0 }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box sx={{ width: "1px", height: 20, bgcolor: t.grid }} />

          <Tooltip title="Jump to today" arrow>
            <Button
              size="small"
              onClick={() => onNavigate("TODAY")}
              startIcon={isMobile ? undefined : <TodayIcon sx={{ fontSize: 15 }} />}
              sx={{
                minWidth: 0,
                height: 32,
                px: isMobile ? 1.25 : 1.5,
                borderRadius: 0,
                fontSize: 12,
                fontWeight: 600,
                color: t.textMuted,
                "&:hover": { bgcolor: t.hoverBg, color: t.text },
              }}
            >
              Today
            </Button>
          </Tooltip>

          <Box sx={{ width: "1px", height: 20, bgcolor: t.grid }} />

          <Tooltip title="Next" arrow>
            <IconButton
              size="small"
              aria-label="Next period"
              onClick={() => onNavigate("NEXT")}
              sx={{ ...navButtonSx, borderRadius: 0 }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography
              component="h2"
              noWrap
              sx={{
                fontSize: { xs: 15, sm: 17, lg: 19 },
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: t.text,
                lineHeight: 1.2,
              }}
            >
              {label}
            </Typography>

            {isCurrentPeriod && !isMobile && (
              <Chip
                label="Current"
                size="small"
                sx={{
                  height: 18,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: t.accent,
                  bgcolor: t.accentSoft,
                  border: `1px solid ${t.accentBorder}`,
                }}
              />
            )}
          </Stack>

          {!isMobile && (
            <Typography
              noWrap
              sx={{ fontSize: 11, color: t.textMuted, lineHeight: 1.4 }}
            >
              {subLabel}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* ── Refresh + view switch ──────────────────────────────────── */}
      {/* No year picker: the period arrows and Today already move the
          anchor, and the heading states the year outright — a second,
          coarser control for the same thing was only a way to land on a
          month nobody asked for. */}
      <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
        <Tooltip title="Refresh roster" arrow>
          <span>
            <IconButton
              size="small"
              aria-label="Refresh roster"
              onClick={onRefresh}
              disabled={isRefreshing}
              sx={{
                ...navButtonSx,
                border: `1px solid ${t.grid}`,
                bgcolor: t.surface,
                "@keyframes rosterSpin": {
                  from: { transform: "rotate(0deg)" },
                  to: { transform: "rotate(360deg)" },
                },
                "& svg": isRefreshing
                  ? { animation: "rosterSpin 900ms linear infinite" }
                  : undefined,
              }}
            >
              <RefreshRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </span>
        </Tooltip>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={currentView}
          onChange={(_, next) => next && onView(next)}
          aria-label="Calendar view"
          sx={{
            bgcolor: t.surface,
            "& .MuiToggleButton-root": {
              height: 32,
              px: isCompact ? 1.25 : 1.75,
              textTransform: "capitalize",
              fontSize: 12,
              fontWeight: 600,
              color: t.textMuted,
              borderColor: t.grid,
              "&:hover": { bgcolor: t.hoverBg },
              "&.Mui-selected": {
                bgcolor: t.accent,
                color: t.accentContrast,
                "&:hover": { bgcolor: t.accent, filter: "brightness(0.94)" },
              },
            },
          }}
        >
          {VIEWS.map((view) => (
            <ToggleButton key={view} value={view} aria-label={`${view} view`}>
              {view}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
};

export default memo(CustomToolbar);
