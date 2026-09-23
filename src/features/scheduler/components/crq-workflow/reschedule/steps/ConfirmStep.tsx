import React from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";

import type { Colors } from "../../../../types/colorTypes";
import type { RescheduleWizard } from "../useRescheduleWizard";
import {
  StepError,
  StepSection,
  TransitionRow,
  formatDateOnly,
  formatTimeOnly,
} from "../RescheduleAtoms";
import { stageLabel } from "../stageLabel";

/**
 * Step 5 - the before/after summary the user confirms.
 *
 * Everything on the left is what the CRQ looks like now
 * (CRQ_SP_RESCHEDULE_CONTEXT); everything on the right is what
 * CRQ_SP_RESCHEDULE_CONFIRM_SLOT is about to write. Nothing has been reserved
 * yet at this point, so Cancel is still safe.
 */
export const ConfirmStep: React.FC<{ wizard: RescheduleWizard; colors: Colors }> = ({
  wizard,
  colors,
}) => {
  const { context, selectedSlot, toStage, selectedReason, reasonNote } = wizard;
  if (!context || !selectedSlot) return null;

  const shiftLabel = (letter: string | null | undefined) => (letter ? `${letter} Shift` : "—");

  return (
    <Box>
      <StepError message={wizard.stepError} />

      <Alert severity="warning" sx={{ mb: 2, fontSize: 12.5 }}>
        Confirming archives the previous reservation, activates the new one and updates the CRQ's
        execution slot, stage assignment and audit history. This cannot be undone from the wizard.
      </Alert>

      <StepSection
        icon={<CompareArrowsRoundedIcon sx={{ fontSize: 14 }} />}
        title="Current → New"
        colors={colors}
      >
        <Stack spacing={0.8}>
          <TransitionRow
            label="Stage"
            from={stageLabel(context.currentStage)}
            to={stageLabel(toStage)}
            colors={colors}
          />
          <TransitionRow
            label="Date"
            from={formatDateOnly(context.scheduledStart)}
            to={formatDateOnly(selectedSlot.startDateTime)}
            colors={colors}
          />
          <TransitionRow
            label="Time"
            from={
              context.scheduledStart
                ? `${formatTimeOnly(context.scheduledStart)} – ${formatTimeOnly(context.scheduledEnd)}`
                : "—"
            }
            to={`${formatTimeOnly(selectedSlot.startDateTime)} – ${formatTimeOnly(selectedSlot.endDateTime)}`}
            colors={colors}
          />
          <TransitionRow
            label="Shift"
            from={shiftLabel(context.shiftLetter)}
            to={shiftLabel(selectedSlot.shiftLetter ?? context.shiftLetter)}
            colors={colors}
            changed={!!selectedSlot.shiftLetter && context.shiftLetter !== selectedSlot.shiftLetter}
          />
        </Stack>
      </StepSection>

      <StepSection icon={<NotesRoundedIcon sx={{ fontSize: 14 }} />} title="Reason" colors={colors}>
        <Box
          sx={{
            px: 1.4,
            py: 1.1,
            borderRadius: colors.radius,
            border: `1px solid ${colors.border}`,
            bgcolor: colors.surface,
          }}
        >
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: colors.textPrimary }}>
            {selectedReason ?? "—"}
          </Typography>
          {reasonNote.trim() && (
            <Typography
              sx={{ fontSize: 12.5, color: colors.textSecondary, whiteSpace: "pre-wrap", mt: 0.5 }}
            >
              {reasonNote.trim()}
            </Typography>
          )}
        </Box>
      </StepSection>
    </Box>
  );
};

export default ConfirmStep;
