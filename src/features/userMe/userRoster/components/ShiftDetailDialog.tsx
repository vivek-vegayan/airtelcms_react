import { memo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import LaptopMacRoundedIcon from "@mui/icons-material/LaptopMacRounded";
import moment from "moment";
import { useCalendarTokens } from "../constants/calendarTokens";
import { getShiftVisual } from "../constants/shiftColors";
import { extractShiftTimeLabel } from "../utils/rosterTransform";
import type { CalendarEvent, RosterDayMeta } from "../types/roster.types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** The day being inspected — set for both event clicks and day clicks. */
  date: Date | null;
  /** Roster facts for that day, when the API returned any. */
  meta: RosterDayMeta | null;
  /** Present only when the user clicked the shift pill itself. */
  event: CalendarEvent | null;
}

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);

  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: `${t.radiusSm}px`,
          display: "grid",
          placeItems: "center",
          bgcolor: t.isDark ? "rgba(255,255,255,0.045)" : "rgba(13,27,42,0.035)",
          color: t.textMuted,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography
          sx={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: t.textFaint,
            lineHeight: 1.5,
          }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: t.text }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
};

/**
 * Day-level roster detail. Opens from a shift pill *or* from the date
 * itself, so every day in the grid is inspectable — including ones with
 * nothing rostered, which now say so instead of being un-clickable.
 */
const ShiftDetailDialogBase = ({ open, onClose, date, meta, event }: Props) => {
  const theme = useTheme();
  const t = useCalendarTokens(theme);
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const visual = meta ? getShiftVisual(meta.code, t.isDark) : null;

  // Every event is `allDay` now (see rosterTransform.ts) — read the real
  // window off the shift display text instead, falling back to the code's
  // canonical time when this specific entry carries none.
  const shiftDisplay = meta?.shiftDisplay ?? event?.resource?.shiftDisplay ?? "";
  const timeValue =
    extractShiftTimeLabel(shiftDisplay) ??
    (visual && visual.time !== "—" ? visual.time : "All day");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      slotProps={{
        paper: {
          sx: {
            borderRadius: fullScreen ? 0 : `${t.radius + 2}px`,
            bgcolor: t.surfaceRaised,
            backgroundImage: "none",
            border: `1px solid ${t.grid}`,
            boxShadow: t.shadowPop,
            overflow: "hidden",
          },
        },
      }}
    >
      <Box sx={{ height: 4, bgcolor: visual ? visual.accent : t.grid }} />

      <DialogTitle sx={{ pb: 1, pt: 2 }}>
        <Typography
          sx={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: t.textFaint,
          }}
        >
          Roster detail
        </Typography>
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: t.text,
            lineHeight: 1.35,
          }}
        >
          {date ? moment(date).format("dddd, DD MMM YYYY") : "—"}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2.5 }}>
        {meta && visual ? (
          <Stack spacing={1.75}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                p: 1.25,
                borderRadius: `${t.radiusSm + 2}px`,
                bgcolor: visual.bg,
                border: `1px solid ${visual.border}`,
              }}
            >
              <Box
                sx={{
                  minWidth: 34,
                  height: 26,
                  px: 0.75,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: `${t.radiusSm}px`,
                  bgcolor: visual.accent,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {meta.code}
              </Box>
              <Box minWidth={0}>
                <Typography
                  sx={{ fontSize: 13.5, fontWeight: 700, color: visual.fg }}
                >
                  {meta.label}
                </Typography>
                {meta.shiftDisplay && meta.shiftDisplay !== meta.label && (
                  <Typography
                    noWrap
                    sx={{ fontSize: 11, color: visual.fg, opacity: 0.8 }}
                  >
                    {meta.shiftDisplay}
                  </Typography>
                )}
              </Box>
            </Stack>

            <DetailRow
              icon={<AccessTimeRoundedIcon sx={{ fontSize: 15 }} />}
              label="Timing"
              value={timeValue}
            />

            {meta.workMode && (
              <DetailRow
                icon={<LaptopMacRoundedIcon sx={{ fontSize: 15 }} />}
                label="Work mode"
                value={meta.workMode}
              />
            )}

            <DetailRow
              icon={<BoltRoundedIcon sx={{ fontSize: 15 }} />}
              label="Activities assigned"
              value={
                meta.assignActCount === 0
                  ? "None"
                  : `${meta.assignActCount} ${
                      meta.assignActCount === 1 ? "activity" : "activities"
                    }`
              }
            />

            {meta.availableMins > 0 && (
              <DetailRow
                icon={<HourglassBottomRoundedIcon sx={{ fontSize: 15 }} />}
                label="Available capacity"
                value={`${Math.round(meta.availableMins / 60)}h ${
                  meta.availableMins % 60
                }m`}
              />
            )}
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1} sx={{ py: 3, textAlign: "center" }}>
            <EventBusyRoundedIcon sx={{ fontSize: 26, color: t.textFaint }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>
              No shift rostered for this day
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
        <Button onClick={onClose} variant="contained" size="small" fullWidth={fullScreen}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(ShiftDetailDialogBase);
