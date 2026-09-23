import React from "react";
import {
  Alert,
  Box,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";

import type { Colors } from "../../../../types/colorTypes";
import type { RescheduleWizard } from "../useRescheduleWizard";
import {
  InfoTile,
  StepError,
  StepSection,
  StepSkeleton,
  formatDateTime,
} from "../RescheduleAtoms";
import { stageLabel } from "../stageLabel";

/**
 *
 * ****************************************************************************
 * Step   - what is being rescheduled, whether it may be, and why.            *
 * The gates CRQ_SP_RESCHEDULE_INITIATE enforces (closed CRQ / manual hold)   *
 * are already evaluated by CRQ_SP_RESCHEDULE_CONTEXT, so a blocked CRQ says  *
 * so here instead of after a failed write. There is no cap on how many times *
 * a CRQ may be rescheduled.                                                  *
 * ****************************************************************************
 *
 **/
export const DetailsStep: React.FC<{
  wizard: RescheduleWizard;
  colors: Colors;
  /**
   * The CRQ's planned execution window as the cockpit already has it
   * (activity_plan_start_date/end_date). Shown in preference to the
   * scheduling-engine reservation the context procedure returns, falling back
   * to it when the caller has no plan dates to hand.
   */
  activityPlanStartDate?: string | null;
  activityPlanEndDate?: string | null;
}> = ({ wizard, colors, activityPlanStartDate, activityPlanEndDate }) => {
  const {
    context,
    isContextLoading,
    contextError,
    reasonOptions,
    isReasonOptionsLoading,
    selectedReason,
    setSelectedReason,
    reasonNote,
    setReasonNote,
  } = wizard;

  if (isContextLoading) return <StepSkeleton rows={4} />;
  if (contextError) return <Alert severity="error">{contextError}</Alert>;
  if (!context) return null;

  const used = context.rescheduleCount ?? 0;

  return (
    <Box>
      <StepError message={wizard.stepError} />

      {!context.canReschedule && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: 12.5 }}>
          {context.blockedReason ?? "This CRQ cannot be rescheduled."}
        </Alert>
      )}

      {context.activeRescheduleId && (
        <Alert severity="info" sx={{ mb: 2, fontSize: 12.5 }}>
          A reschedule started earlier is still open (
          {context.activeRescheduleStatus?.toLowerCase().replace("_", " ")}).
          Continuing resumes it instead of starting a new one.
        </Alert>
      )}

      <StepSection
        icon={<AssignmentRoundedIcon sx={{ fontSize: 14 }} />}
        title="CRQ"
        colors={colors}
      >
        <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
          <InfoTile
            label="CRQ Number"
            value={context.crqNo}
            colors={colors}
            mono
          />
          <InfoTile
            label="Current Stage"
            value={stageLabel(context.currentStage)}
            colors={colors}
            icon={<TimelineRoundedIcon sx={{ fontSize: 12 }} />}
            accent={colors.accent}
          />
          <InfoTile label="Plan" value={context.planNo} colors={colors} mono />
          <InfoTile
            label="Status"
            value={context.currentStatus ?? "—"}
            colors={colors}
          />
        </Stack>
        {/* The reschedule moves the CRQ's booked window, so a multi-task CRQ
            moves as a unit - worth saying, since only one schedule exists. */}
        {(context.taskCount ?? 0) > 1 && (
          <Typography sx={{ fontSize: 11.5, color: colors.textDim, mt: 1 }}>
            This CRQ has {context.taskCount} tasks. Rescheduling moves the CRQ's
            execution window, so all of them move together.
          </Typography>
        )}
      </StepSection>

      <StepSection
        icon={<PersonRoundedIcon sx={{ fontSize: 14 }} />}
        title="Current Assignment"
        colors={colors}
      >
        <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
          <InfoTile
            label="Assigned Engineer"
            value={
              context.engineerName
                ? `${context.engineerName}${context.engineerOlmId ? ` (${context.engineerOlmId})` : ""}`
                : "Not assigned yet"
            }
            colors={colors}
          />
          <InfoTile
            label="Execution start"
            value={formatDateTime(activityPlanStartDate ?? context.scheduledStart)}
            colors={colors}
            icon={<EventRoundedIcon sx={{ fontSize: 12 }} />}
          />
          <InfoTile
            label="Execution End"
            value={formatDateTime(activityPlanEndDate ?? context.scheduledEnd)}
            colors={colors}
            icon={<EventRoundedIcon sx={{ fontSize: 12 }} />}
          />
        </Stack>
      </StepSection>

      <StepSection
        icon={<RepeatRoundedIcon sx={{ fontSize: 14 }} />}
        title="Reschedule Count"
        colors={colors}
      >
        <Box
          sx={{
            px: 1.6,
            py: 1.2,
            borderRadius: colors.radius,
            border: `1px solid ${colors.border}`,
            bgcolor: colors.surface,
          }}
        >
          <Stack direction="row" alignItems="baseline" spacing={0.6}>
            <Typography
              sx={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary }}
            >
              {used}
            </Typography>
            <Typography
              sx={{ fontSize: 12, fontWeight: 700, color: colors.textDim }}
            >
              {used === 1 ? "reschedule so far" : "reschedules so far"}
            </Typography>
          </Stack>
        </Box>
      </StepSection>

      <TextField
        select
        label="Reason for reschedule (optional)"
        fullWidth
        value={selectedReason ?? ""}
        onChange={(e) => setSelectedReason(e.target.value || null)}
        disabled={!context.canReschedule || isReasonOptionsLoading}
        size="small"
        sx={{ mb: selectedReason ? 1.5 : 0 }}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {reasonOptions.map((option) => (
          <MenuItem key={option.reason} value={option.reason}>
            {option.reason}
          </MenuItem>
        ))}
      </TextField>

      {selectedReason && (
        <TextField
          label="Additional details (optional)"
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          value={reasonNote}
          onChange={(e) => setReasonNote(e.target.value.slice(0, 500))}
          disabled={!context.canReschedule}
          helperText={`${reasonNote.length}/500`}
          size="small"
        />
      )}
    </Box>
  );
};

export default DetailsStep;
