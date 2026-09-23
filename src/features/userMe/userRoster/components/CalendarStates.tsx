import { memo } from "react";
import { Box, Button, Skeleton, Stack, Typography, useTheme } from "@mui/material";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import {
  useShimmerSx,
  useSkeletonVisible,
} from "../../../../components/loading/Skeletons";
import { useCalendarTokens } from "../constants/calendarTokens";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Month-grid shimmer used on a cold load only.
 *
 * It mirrors the real grid's structure — same header row, same six rows of
 * seven cells, same frame — and fills its container, so the swap to real
 * data is a cross-fade rather than a layout shift. It also self-suppresses
 * when a Global/Page loader is already covering the screen, per the app's
 * shared skeleton rule.
 */
const CalendarSkeletonBase = () => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);
  const shimmer = useShimmerSx();
  // Skeletons are the lowest-priority loader: stay silent (but keep the
  // frame, so nothing resizes) while a Global/Page loader owns the screen.
  const shimmerVisible = useSkeletonVisible(true);

  return (
    <Box
      aria-busy="true"
      aria-label="Loading roster"
      sx={{
        // Matches how the real calendar sizes itself, so the swap to data
        // is a cross-fade rather than a jump.
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${t.grid}`,
        borderRadius: `${t.radius}px`,
        overflow: "hidden",
        bgcolor: t.surface,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          bgcolor: t.surfaceHeader,
          borderBottom: `1px solid ${t.grid}`,
        }}
      >
        {WEEKDAYS.map((day) => (
          <Box
            key={day}
            sx={{
              py: 1.25,
              textAlign: "center",
              borderLeft: `1px solid ${t.grid}`,
              "&:first-of-type": { borderLeft: "none" },
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 9, sm: 11 },
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: t.textFaint,
              }}
            >
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gridTemplateRows: "repeat(6, minmax(52px, 1fr))",
        }}
      >
        {Array.from({ length: 42 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              minWidth: 0,
              p: { xs: 0.5, sm: 0.75 },
              borderLeft: `1px solid ${t.grid}`,
              borderTop: `1px solid ${t.grid}`,
              "&:nth-of-type(7n + 1)": { borderLeft: "none" },
            }}
          >
            {shimmerVisible && (
              <>
                <Skeleton
                  variant="rounded"
                  width={18}
                  height={12}
                  sx={{ borderRadius: "4px", ...shimmer }}
                />
                {/* Only some cells carry a pill, so the shimmer reads as a
                    calendar rather than a uniform block. */}
                {i % 3 !== 1 && (
                  <Skeleton
                    variant="rounded"
                    height={14}
                    sx={{ mt: 0.75, borderRadius: "4px", ...shimmer }}
                  />
                )}
              </>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const CalendarSkeleton = memo(CalendarSkeletonBase);

/**
 * The quiet "nothing rostered" note. It floats over a fully rendered,
 * fully navigable calendar and is pointer-transparent, so an empty month
 * still looks like a calendar — never like a failure.
 */
const CalendarEmptyOverlayBase = ({
  message = "No roster data available for this period",
}: {
  message?: string;
}) => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        px: 2,
      }}
    >
      <Stack
        alignItems="center"
        spacing={1}
        sx={{
          px: 2.5,
          py: 2,
          borderRadius: `${t.radius}px`,
          border: `1px dashed ${t.gridStrong}`,
          bgcolor: t.isDark ? "rgba(19,28,43,0.82)" : "rgba(255,255,255,0.86)",
          backdropFilter: "blur(2px)",
          maxWidth: 320,
          textAlign: "center",
        }}
      >
        <EventBusyRoundedIcon sx={{ fontSize: 26, color: t.textFaint }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>
          {message}
        </Typography>
        <Typography sx={{ fontSize: 11, color: t.textFaint, lineHeight: 1.5 }}>
          Nothing is scheduled yet. Use the arrows above to check another
          period.
        </Typography>
      </Stack>
    </Box>
  );
};

export const CalendarEmptyOverlay = memo(CalendarEmptyOverlayBase);

/**
 * Compact inline failure notice with a Retry.
 *
 * Deliberately *not* a full-width red banner and deliberately not a reason
 * to unmount the grid: the calendar stays on screen underneath, so a
 * transient network blip degrades the page instead of breaking it.
 */
const RosterErrorNoticeBase = ({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);

  return (
    <Stack
      role="alert"
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{
        mb: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: `${t.radiusSm + 2}px`,
        border: `1px solid ${
          t.isDark ? "rgba(239,159,39,0.28)" : "rgba(239,159,39,0.45)"
        }`,
        bgcolor: t.isDark ? "rgba(239,159,39,0.1)" : "rgba(250,238,218,0.7)",
      }}
    >
      <WifiOffRoundedIcon
        sx={{ fontSize: 17, color: theme.palette.warning.main, flexShrink: 0 }}
      />
      <Typography
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          fontWeight: 600,
          color: t.text,
        }}
      >
        {message}
      </Typography>
      <Button
        size="small"
        onClick={onRetry}
        disabled={isRetrying}
        startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
        sx={{
          flexShrink: 0,
          height: 26,
          px: 1.25,
          fontSize: 11.5,
          fontWeight: 700,
          color: theme.palette.warning.main,
          "&:hover": { bgcolor: t.hoverBg },
        }}
      >
        {isRetrying ? "Retrying…" : "Retry"}
      </Button>
    </Stack>
  );
};

export const RosterErrorNotice = memo(RosterErrorNoticeBase);
