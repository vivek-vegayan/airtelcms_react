import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Stack,
  Typography,
  Chip,
  Skeleton,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CloseIcon from "@mui/icons-material/Close";
import BadgeIcon from "@mui/icons-material/Badge";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import dayjs from "dayjs";
import { useGetDailyAssignmentsQuery } from "../../../dashboard/api/dashboardApi";
import type { EngineerDailyAssignmentRow } from "../../../dashboard/types/dashboard.types";
import { parseShiftTime } from "../../../userMe/userRoster/utils/rosterTransform";

interface ShiftInfoDialogProps {
  open: boolean;
  onClose: () => void;
  data:
    | {
        shift: any;
        date: string;
        user: any;
      }
    | null;
}

/* ─── Status classification ──────────────────────────────────────────────
   The proc (sp_engineer_daily_assignments) only ever returns one of these
   three literal remark strings — mapping is exhaustive, so the label alone
   (no hover needed) always carries full meaning. */
type StatusTone = "success" | "warning" | "error";

function toneForRemark(remark: string): StatusTone {
  if (remark === "Done") return "success";
  if (remark === "CRQ number not generated") return "error";
  return "warning"; // "Deployment/Operations Task Not Closed"
}

const STATUS_META: Record<
  StatusTone,
  { label: string; Icon: typeof TaskAltRoundedIcon }
> = {
  success: { label: "Completed", Icon: TaskAltRoundedIcon },
  warning: { label: "Pending closure", Icon: WarningAmberRoundedIcon },
  error: { label: "CRQ not raised", Icon: CancelRoundedIcon },
};

function fmtTime(value?: string | null): string {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("h:mm A") : "—";
}

function fmtDuration(mins?: number | null): string {
  if (mins == null || Number.isNaN(mins) || mins < 0) return "—";
  if (mins === 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Shift-day time math ────────────────────────────────────────────────
   A night shift's work is timestamped on the calendar date the shift *starts*,
   so 12:00–2:00 AM under a 10:00 PM – 7:00 AM shift arrives with a clock time
   that sits *before* the shift start. Read as plain wall clock it looks like
   the small hours of the morning before, which is why the timeline used to
   invent its own bounds around it. Everything below works in minutes on the
   shift day instead — a clock time earlier than the shift start belongs to the
   stretch past midnight — the same rule the dashboard's AttendanceTimeline
   applies. */
const MINUTES_IN_DAY = 24 * 60;

/** "22:00" → 1320. NaN when the source string was not a real time. */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

/** Minutes past midnight of a timestamp, seconds kept as a fraction. */
function minutesOfDay(value: string): number {
  const d = dayjs(value);
  return d.hour() * 60 + d.minute() + d.second() / 60;
}

/** Minutes on the shift day, given where that shift day begins. */
function toShiftMinutes(value: string, anchor: number): number {
  const mins = minutesOfDay(value);
  return mins < anchor ? mins + MINUTES_IN_DAY : mins;
}

/** Renders a shift-day minute (which may run past 1440) as a clock label. */
function fmtShiftClock(mins: number): string {
  const wrapped = ((Math.round(mins) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** The rostered window out of "N (10:00 PM - 07:00 AM)", in shift-day minutes
 *  (an overnight end rolls past 1440). `null` for shifts that carry no time
 *  range at all — WO, Holiday, Leave — or a label the parser cannot read. */
function parseShiftWindow(label: string): { start: number; end: number } | null {
  const parsed = parseShiftTime(label);
  if (!("startTime" in parsed) || !parsed.startTime || !parsed.endTime) return null;
  const start = hhmmToMinutes(parsed.startTime);
  let end = hhmmToMinutes(parsed.endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (end <= start) end += MINUTES_IN_DAY; // overnight shift
  return { start, end };
}

/** An assignment that actually carries both ends of its window. */
type TimedAssignment = EngineerDailyAssignmentRow & {
  startTime: string;
  endTime: string;
};

type TimelineLane = { row: TimedAssignment; start: number; end: number };

type Timeline = {
  /** Axis bounds, in shift-day minutes. */
  start: number;
  end: number;
  lanes: TimelineLane[];
  /** The rostered window — set only when the axis had to reach past it. */
  shiftWindow: { start: number; end: number } | null;
};

/* ─── Small presentational pieces ────────────────────────────────────── */
function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, color: "text.secondary" }}>
      {icon}
      <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
    </Stack>
  );
}

function MetaBox({
  icon,
  label,
  value,
  accent,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
  isDark: boolean;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: "8px 10px",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.25,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(accent, isDark ? 0.18 : 0.1),
          color: accent,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }} noWrap>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function StatTile({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <Box sx={{ flex: 1, p: "10px 12px", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 800, color: tone || "text.primary", mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}

function StatusLegend({
  rows,
  toneColor,
}: {
  rows: EngineerDailyAssignmentRow[];
  toneColor: Record<StatusTone, string>;
}) {
  const tones = Array.from(new Set(rows.map((r) => toneForRemark(r.remark)))) as StatusTone[];
  if (tones.length <= 1) return null;
  return (
    <Stack direction="row" spacing={1.75} flexWrap="wrap" sx={{ mb: 1.5, rowGap: 0.5 }}>
      {tones.map((t) => {
        const { label, Icon } = STATUS_META[t];
        return (
          <Stack key={t} direction="row" spacing={0.5} alignItems="center">
            <Icon sx={{ fontSize: 13, color: toneColor[t] }} />
            <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: "text.secondary" }}>{label}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

/** Compact Gantt-style timeline: one lane per assignment, positioned inside
 *  the rostered shift window. */
function AssignmentTimeline({
  timeline,
  toneColor,
  isDark,
}: {
  timeline: Timeline;
  toneColor: Record<StatusTone, string>;
  isDark: boolean;
}) {
  const span = timeline.end - timeline.start || 1;
  const pct = (mins: number) => ((mins - timeline.start) / span) * 100;

  return (
    <Box
      sx={{
        mb: 2,
        p: "12px 14px 10px",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FAFBFC",
      }}
    >
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "text.secondary" }}>
          {fmtShiftClock(timeline.start)}
        </Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: "text.secondary" }}>
          {fmtShiftClock(timeline.end)}
        </Typography>
      </Stack>
      <Box sx={{ position: "relative" }}>
        {/* Only drawn when an assignment pushed the axis past the rostered
            window, so an overrun stays readable instead of being clipped. */}
        {timeline.shiftWindow && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${pct(timeline.shiftWindow.start)}%`,
              width: `${pct(timeline.shiftWindow.end) - pct(timeline.shiftWindow.start)}%`,
              borderRadius: 1,
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.04)",
              pointerEvents: "none",
            }}
          />
        )}
        <Stack spacing="7px">
          {timeline.lanes.map(({ row: r, start, end }, i) => {
            const left = pct(start);
            const width = Math.max(pct(end) - left, 2.5);
            const tone = toneForRemark(r.remark);

            return (
              <Tooltip
                key={`${r.planNo}-${r.stage}-${i}`}
                arrow
                placement="top"
                title={
                  <Box sx={{ py: 0.25 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
                      {(r.crqNo ?? r.planNo) || "—"} · {r.stage}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, opacity: 0.85 }}>
                      {fmtTime(r.startTime)} – {fmtTime(r.endTime)} ({fmtDuration(r.durationMins)})
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, opacity: 0.85 }}>{r.remark}</Typography>
                  </Box>
                }
              >
                <Box
                  sx={{
                    position: "relative",
                    height: 20,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 2,
                      bottom: 4,
                      left: `${left}%`,
                      width: `${width}%`,
                      minWidth: 6,
                      borderRadius: "4px",
                      bgcolor: toneColor[tone],
                      boxShadow: `0 1px 3px ${alpha(toneColor[tone], 0.4)}`,
                      transition: "filter .15s, transform .15s",
                      transformOrigin: "center",
                      "&:hover": { filter: "brightness(1.1)", transform: "scaleY(1.15)" },
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}

function AssignmentRow({
  row,
  toneColor,
  isDark,
}: {
  row: EngineerDailyAssignmentRow;
  toneColor: Record<StatusTone, string>;
  isDark: boolean;
}) {
  const tone = toneForRemark(row.remark);
  const { label, Icon } = STATUS_META[tone];
  const color = toneColor[tone];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: "9px 10px",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
        transition: "all .15s",
        "&:hover": { borderColor: alpha(color, 0.45), transform: "translateX(2px)" },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(color, isDark ? 0.18 : 0.1),
          color,
        }}
      >
        <Icon sx={{ fontSize: 17 }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="body2" fontWeight={700} noWrap>
            {(row.crqNo ?? row.planNo) || "—"}
          </Typography>
          <Chip
            label={row.stage}
            size="small"
            sx={{
              height: 16,
              fontSize: 9,
              fontWeight: 700,
              borderRadius: "4px",
              "& .MuiChip-label": { px: "6px" },
            }}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: "1px" }}>
          {fmtTime(row.startTime)} – {fmtTime(row.endTime)}
          {row.durationMins != null ? ` · ${fmtDuration(row.durationMins)}` : ""}
        </Typography>
      </Box>

      <Chip
        label={label}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: 9.5,
          color,
          bgcolor: alpha(color, isDark ? 0.16 : 0.1),
          border: `1px solid ${alpha(color, 0.3)}`,
          flexShrink: 0,
          "& .MuiChip-label": { px: "8px" },
        }}
      />
    </Box>
  );
}

/* ─── Main dialog ─────────────────────────────────────────────────────── */
export const ShiftInfoDialog = ({ open, onClose, data }: ShiftInfoDialogProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = theme.palette.primary.main;

  const toneColor: Record<StatusTone, string> = {
    success: theme.palette.success.main,
    warning: isDark ? theme.palette.warning.light : theme.palette.warning.dark,
    error: theme.palette.error.main,
  };

  const user = data?.user;
  const shift = data?.shift;
  const dateStr = data?.date ? dayjs(data.date).format("YYYY-MM-DD") : "";

  const {
    data: assignments,
    isFetching,
    isError,
  } = useGetDailyAssignmentsQuery(
    { date: dateStr, userId: user?.userId },
    { skip: !open || !dateStr || user?.userId == null },
  );

  const rows = useMemo(() => {
    return [...(assignments ?? [])].sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf();
    });
  }, [assignments]);

  const timedRows = useMemo(
    () =>
      rows.filter(
        (r): r is TimedAssignment =>
          !!r.startTime && !!r.endTime && dayjs(r.startTime).isValid() && dayjs(r.endTime).isValid(),
      ),
    [rows],
  );

  /* shiftDisplay is the one place the rostered window survives — it arrives as
     "N (10:00 PM - 7:00 AM)". timeRange, when a caller sets it instead, is the
     bare range with an en dash, so it gets wrapped back into the shape
     parseShiftTime expects. */
  const shiftLabel = useMemo(() => {
    const display: string = shift?.shiftDisplay ?? "";
    if (display.includes("(")) return display;
    const range: string = shift?.timeRange ?? "";
    return range ? `(${range.replace(/\s*[–—-]\s*/, " - ")})` : display;
  }, [shift?.shiftDisplay, shift?.timeRange]);

  const timeline = useMemo<Timeline | null>(() => {
    if (!timedRows.length) return null;

    // The shift day starts at the rostered start time; with no parseable shift
    // it falls back to the hour the earliest assignment begins.
    const shiftWindow = parseShiftWindow(shiftLabel);
    const anchor =
      shiftWindow?.start ??
      Math.floor(Math.min(...timedRows.map((r) => minutesOfDay(r.startTime))) / 60) * 60;

    const lanes: TimelineLane[] = timedRows.map((r) => {
      const start = toShiftMinutes(r.startTime, anchor);
      let end = toShiftMinutes(r.endTime, anchor);
      if (end < start) end += MINUTES_IN_DAY; // assignment runs past midnight
      return { row: r, start, end };
    });

    // The axis is the rostered window, widened to the hour only when an
    // assignment genuinely falls outside it — never stretched by an arbitrary
    // fraction, so both end labels stay real clock times the rest of the
    // dialog agrees with.
    const dataStart = Math.min(...lanes.map((l) => l.start));
    const dataEnd = Math.max(...lanes.map((l) => l.end));
    const start = Math.min(shiftWindow?.start ?? dataStart, Math.floor(dataStart / 60) * 60);
    const end = Math.max(shiftWindow?.end ?? dataEnd, Math.ceil(dataEnd / 60) * 60);

    return {
      start,
      end: end > start ? end : start + 60,
      lanes,
      shiftWindow:
        shiftWindow && (start < shiftWindow.start || end > shiftWindow.end) ? shiftWindow : null,
    };
  }, [timedRows, shiftLabel]);

  if (!data) return null;

  const title = shift?.shiftDisplay || "Shift";
  const sub = shift?.timeRange || "";
  const availMins = shift?.availableMins ?? 0;
  const employeeName = user?.employeeName || user?.olmid || user?.userId || "-";

  const totalCount = rows.length;
  const doneCount = rows.filter((r) => toneForRemark(r.remark) === "success").length;
  const totalMins = rows.reduce((sum, r) => sum + Math.max(r.durationMins ?? 0, 0), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", maxHeight: "85vh" } }}
    >
      {/* Header */}
      <Box
        sx={{
          position: "relative",
          px: 3,
          pt: 2.5,
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          background: isDark
            ? `linear-gradient(135deg, ${alpha(accent, 0.18)} 0%, ${alpha(accent, 0)} 60%)`
            : `linear-gradient(135deg, ${alpha(accent, 0.1)} 0%, ${alpha(accent, 0)} 60%)`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.75}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              flexShrink: 0,
              background: `linear-gradient(135deg, ${accent} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: `0 10px 24px ${alpha(accent, 0.32)}`,
            }}
          >
            <InfoRoundedIcon sx={{ fontSize: 20 }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontSize="1.05rem" fontWeight={700} noWrap>
              Shift &amp; Assignment Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }} noWrap>
              {employeeName} · {dayjs(data.date).format("dddd, MMM D, YYYY")}
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close shift details"
            sx={{ width: 32, height: 32, border: "1px solid", borderColor: "divider", borderRadius: 1.5, flexShrink: 0 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {/* Meta strip */}
        <Stack direction="row" spacing={1.25} sx={{ mb: 3 }}>
          <MetaBox icon={<BadgeIcon sx={{ fontSize: 16 }} />} label="Employee ID" value={user?.olmid || user?.userId || "-"} accent="#7C3AED" isDark={isDark} />
          <MetaBox icon={<EventNoteIcon sx={{ fontSize: 16 }} />} label="Shift" value={`${title}${sub ? ` · ${sub}` : ""}`} accent="#2563EB" isDark={isDark} />
          <MetaBox icon={<AccessTimeRoundedIcon sx={{ fontSize: 16 }} />} label="Available" value={`${availMins}m`} accent="#0F6E56" isDark={isDark} />
        </Stack>

        <SectionTitle icon={<ListAltRoundedIcon sx={{ fontSize: 16 }} />} label="Daily Assignments" />

        {isFetching && (
          <Stack spacing={1}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={46} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        )}

        {!isFetching && isError && (
          <Stack alignItems="center" spacing={1} sx={{ py: 3 }}>
            <CancelRoundedIcon sx={{ fontSize: 28, color: "error.main" }} />
            <Typography variant="body2" color="error.main" fontWeight={600}>
              Failed to load assignments for this day.
            </Typography>
          </Stack>
        )}

        {!isFetching && !isError && totalCount === 0 && (
          <Stack alignItems="center" spacing={1} sx={{ py: 3 }}>
            <EventBusyRoundedIcon sx={{ fontSize: 28, color: "text.disabled" }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              No assignments recorded for this day.
            </Typography>
          </Stack>
        )}

        {!isFetching && !isError && totalCount > 0 && (
          <>
            <Stack direction="row" spacing={1.25} sx={{ mb: 2.5 }}>
              <StatTile label="Tasks" value={totalCount} />
              <StatTile label="Completed" value={`${doneCount}/${totalCount}`} tone={theme.palette.success.main} />
              <StatTile label="Scheduled time" value={fmtDuration(totalMins)} />
            </Stack>

            <StatusLegend rows={rows} toneColor={toneColor} />

            {timeline && <AssignmentTimeline timeline={timeline} toneColor={toneColor} isDark={isDark} />}

            <Stack spacing={1}>
              {rows.map((r, i) => (
                <AssignmentRow key={`${r.planNo}-${r.stage}-${i}`} row={r} toneColor={toneColor} isDark={isDark} />
              ))}
            </Stack>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
