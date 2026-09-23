import React from "react";
import { Avatar, Box, Stack, Tooltip, Typography } from "@mui/material";
import { format } from "date-fns";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
// import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import type { Colors } from "../../types/colorTypes";
import type { Crq } from "../../types/crqWorkflow.types";
import {
  WORKFLOW_STAGES,
  classifyStatusValue,
  resolveStageState,
  stageStatePalette,
} from "../../constants/workflowStages";

interface CrqWorkflowHeaderProps {
  crq: Crq;
  currentStageIndex: number;
  colors: Colors;
}

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : format(d, "dd-MMM-yyyy HH:mm");
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Compact span between two instants ("45m", "2h 15m", "3d 4h") - used to
 * qualify the execution window without pushing the header onto a second row.
 * Returns null for zero-length or inverted ranges. */
const formatDuration = (start: Date, end: Date): string | null => {
  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (totalMinutes <= 0) return null;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours) return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
};

/** First letter of the first two whitespace-separated tokens (e.g. "Jane
 * Doe" -> "JD"); falls back to the first two characters for single-token
 * values such as an OLM ID. */
const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

/** Small colored pill with a status dot, driven by the same StageRunState
 * palette StageRail uses below it - keeps status color-coding consistent
 * across the cockpit instead of a component-local heuristic. */
const StatusPill: React.FC<{
  label: string;
  bg: string;
  fg: string;
  dot: string;
  pulse?: boolean;
}> = ({ label, bg, fg, dot, pulse }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={0.6}
    sx={{
      display: "inline-flex",
      px: 1.1,
      py: "4px",
      borderRadius: "999px",
      bgcolor: bg,
      lineHeight: 1,
      transition: "transform 0.14s ease",
      "&:hover": { transform: "scale(1.03)" },
    }}
  >
    <Box
      className={pulse ? "status-pulse-dot" : undefined}
      sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: dot, flexShrink: 0 }}
    />
    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: fg, whiteSpace: "nowrap" }}>
      {label}
    </Typography>
  </Stack>
);

/** One label/value field in the summary strip, with an optional leading icon.
 * `dense` shrinks the caption for the secondary (meta/timestamps) row so it
 * reads as subordinate to the primary identity/status row above it. */
const Field: React.FC<{
  label: string;
  icon?: React.ReactNode;
  dense?: boolean;
  children: React.ReactNode;
}> = ({ label, icon, dense, children }) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={0.35}>
      {icon}
      <Typography
        sx={{
          fontSize: dense ? 8 : 9,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontWeight: 800,
          color: "inherit",
          opacity: dense ? 0.5 : 0.6,
        }}
      >
        {label}
      </Typography>
    </Stack>
    <Box sx={{ mt: dense ? 0.15 : 0.35 }}>{children}</Box>
  </Box>
);

const Divider: React.FC<{ colors: Colors; height?: number }> = ({ colors, height = 26 }) => (
  <Box sx={{ width: "1px", height, bgcolor: colors.border, flexShrink: 0 }} />
);

/** Extra CRQ-provided fields (department/support group/category) shown under
 * their own real names - never relabeled as "Team/Sub Function" since no
 * field with that exact meaning exists on this data model. */
const EXTRA_FIELD_LABELS: Array<[key: string, label: string]> = [
  ["assignedDepartment", "Assigned Department"],
  ["supportGroupName", "Support Group"],
  ["categorizationTier_1", "Category"],
];

/** Compact CRQ summary strip: identity, live status/stage, assigned engineer,
 * raised/last-updated dates, and (when present) an assignment/department field. */
export const CrqWorkflowHeader: React.FC<CrqWorkflowHeaderProps> = ({
  crq,
  currentStageIndex,
  colors,
}) => {
  const c = crq as any;
  const currentStage = WORKFLOW_STAGES[currentStageIndex];

  const currentHistoryEntry = crq.history?.find((h) => h.current) ?? null;
  const anyAssignedEntry = crq.history?.find((h) => h.assignedTo || h.performedBy) ?? null;
  const engineer =
    c.olmidReview ??
    c.olmidImpactAnalysis ??
    currentHistoryEntry?.assignedTo ??
    currentHistoryEntry?.performedBy ??
    anyAssignedEntry?.assignedTo ??
    anyAssignedEntry?.performedBy ??
    null;

  const lastUpdatedDate = (() => {
    const dates: Date[] = [];
    (crq.history ?? []).forEach((h) => {
      const s = parseDate(h.startedAt);
      const e = parseDate(h.completedAt);
      if (s) dates.push(s);
      if (e) dates.push(e);
    });
    [
      "executionSlotStart",
      "executionSlotEnd",
      "impactStartDate",
      "impactEndDate",
      "reviewStartDate",
      "reviewEndDate",
    ].forEach((k) => {
      const d = parseDate(c[k]);
      if (d) dates.push(d);
    });
    if (!dates.length) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  })();

  /** CRQ_MASTER_TBL.execution_slot_start/end - the reschedule-aware slot the
   * CRQ actually runs in, published by Get_CRQ_Workflow_Overview* as
   * executionSlotStart/executionSlotEnd. */
  const executionWindow = (() => {
    const startDate = parseDate(crq.executionSlotStart);
    const endDate = parseDate(crq.executionSlotEnd);
    return {
      start: formatDate(crq.executionSlotStart),
      end: formatDate(crq.executionSlotEnd),
      duration: startDate && endDate ? formatDuration(startDate, endDate) : null,
    };
  })();

  const executionWindowTooltip = executionWindow.start || executionWindow.end
    ? `Execution Window: ${executionWindow.start ?? "—"} → ${executionWindow.end ?? "—"}${
        executionWindow.duration ? ` (${executionWindow.duration})` : ""
      }`
    : "Execution Window: not scheduled yet";

  const extraField = EXTRA_FIELD_LABELS.find(([key]) => typeof c[key] === "string" && c[key].trim());

  const crqStatusState = classifyStatusValue(c.crqStatus);
  const crqStatusPill = stageStatePalette(crqStatusState, colors);

  const currentStageState = resolveStageState(crq, currentStageIndex, currentStageIndex);
  const currentStagePill = stageStatePalette(currentStageState, colors);

  return (
    <Box
      sx={{
        bgcolor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: colors.shadowCard,
        px: 2.25,
        py: 0.85,
        position: "relative",
        zIndex: 1,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${colors.accent}, transparent 65%)`,
        },
      }}
    >
      {/* Single row - identity, live status/stage, ownership and timestamps
          all in one line. Overflows horizontally (rather than wrapping) so
          it never grows into a second row. */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.35}
        flexWrap="nowrap"
        sx={{
          color: colors.textPrimary,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { height: 4 },
          "& > *": { flexShrink: 0 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.7,
            pl: 0.8,
            pr: 0.8,
            py: 0.35,
            borderRadius: colors.radiusL,
            bgcolor: colors.accentDim,
            border: `1px solid ${colors.accentBorder}`,
          }}
        >
          <Avatar sx={{ width: 25, height: 25, bgcolor: colors.accent, color: colors.surface }}>
            <AssignmentRoundedIcon sx={{ fontSize: 13.5 }} />
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontSize: 8,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: colors.accent,
                fontWeight: 800,
                opacity: 0.85,
                lineHeight: 1.25,
              }}
            >
              Change Request
            </Typography>
            <Typography sx={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.2 }}>
              {crq.crqNo}
            </Typography>
          </Box>
        </Box>

        <Divider colors={colors} />

        <Tooltip title={`CRQ Status: ${c.crqStatus || "—"}`} arrow>
          <span>
            <StatusPill
              label={c.crqStatus || "—"}
              bg={crqStatusPill.bg}
              fg={crqStatusPill.fg}
              dot={crqStatusPill.dot}
              pulse={crqStatusState === "in_progress"}
            />
          </span>
        </Tooltip>

        <ArrowForwardRoundedIcon sx={{ fontSize: 13, color: colors.textDim, opacity: 0.4 }} />

        <Tooltip title={`Current Stage: ${currentStage.label} (Stage ${currentStageIndex + 1} of ${WORKFLOW_STAGES.length})`} arrow>
          <span>
            <StatusPill
              label={currentStage.label}
              bg={currentStagePill.bg}
              fg={currentStagePill.fg}
              dot={currentStagePill.dot}
              pulse={currentStageState === "in_progress"}
            />
          </span>
        </Tooltip>

        <Divider colors={colors} />

        {extraField && (
          <>
            <Box sx={{ flexShrink: 0 }}>
              <Field label={extraField[1]} icon={<ApartmentRoundedIcon sx={{ fontSize: 11, color: colors.textDim }} />}>
                <Tooltip title={c[extraField[0]]} arrow>
                  <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, maxWidth: 140 }}>
                    {c[extraField[0]]}
                  </Typography>
                </Tooltip>
              </Field>
            </Box>
            <Divider colors={colors} />
          </>
        )}

        <Box sx={{ flexShrink: 0 }}>
          <Field dense label="Raised Date" icon={<CalendarTodayRoundedIcon sx={{ fontSize: 10, color: colors.textDim }} />}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>
              {formatDate(crq.crqRaisedDate) ?? "—"}
            </Typography>
          </Field>
        </Box>

       

        <Divider colors={colors} height={18} />

        <Box sx={{ flexShrink: 0 }}>
          <Field dense label="Execution Window" icon={<ScheduleRoundedIcon sx={{ fontSize: 10, color: colors.textDim }} />}>
            <Tooltip title={executionWindowTooltip} arrow>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  color: executionWindow.start || executionWindow.end ? "inherit" : colors.textDim,
                }}
              >
                {executionWindow.start || executionWindow.end ? (
                  <>
                    {executionWindow.start ?? "—"} → {executionWindow.end ?? "—"}
                    {executionWindow.duration && (
                      <Box
                        component="span"
                        sx={{ ml: 0.6, fontSize: 10, fontWeight: 700, color: colors.textDim }}
                      >
                        ({executionWindow.duration})
                      </Box>
                    )}
                  </>
                ) : (
                  "Not scheduled"
                )}
              </Typography>
            </Tooltip>
          </Field>
        </Box>
      </Stack>
    </Box>
  );
};

export default CrqWorkflowHeader;
