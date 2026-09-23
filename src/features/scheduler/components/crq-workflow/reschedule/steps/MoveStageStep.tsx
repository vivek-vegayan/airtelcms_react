import React from "react";
import { Alert, Box, Radio, Stack, Typography } from "@mui/material";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

import type { Colors } from "../../../../types/colorTypes";
import type { CrqStageEnum } from "../../../../types/reschedule.types";
import { WORKFLOW_STAGES, STAGE_ID_TO_ENUM } from "../../../../constants/workflowStages";
import type { RescheduleWizard } from "../useRescheduleWizard";
import { StatusChip, StepError, StepSection } from "../RescheduleAtoms";
import { stageLabel } from "../stageLabel";

/**
 * Step 3 - choose which earlier stage the CRQ goes back to.
 *
 * The full 7-stage rail is rendered for context, but selectability comes
 * entirely from `context.eligibleStages`, which CRQ_SP_RESCHEDULE_CONTEXT
 * derives with the same rule CRQ_SP_RESCHEDULE_MOVE_STAGE validates against.
 * No transition table exists on this side - add a stage to the database enum
 * and it appears here automatically.
 */
export const MoveStageStep: React.FC<{ wizard: RescheduleWizard; colors: Colors }> = ({
  wizard,
  colors,
}) => {
  const { context, toStage, setToStage } = wizard;
  if (!context) return null;

  const eligible = new Set<string>(context.eligibleStages);

  return (
    <Box>
      <StepError message={wizard.stepError} />

      {eligible.size === 0 && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: 12.5 }}>
          {stageLabel(context.currentStage)} is the first stage of the workflow, so there is no
          earlier stage to move this CRQ back to.
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2, fontSize: 12.5 }}>
        Moving the stage increments the reschedule count and writes both an action and a stage
        entry to the CRQ history. The current engineer reservation is parked, not deleted.
      </Alert>

      <StepSection
        icon={<TimelineRoundedIcon sx={{ fontSize: 14 }} />}
        title="Target Stage"
        colors={colors}
      >
        <Stack spacing={0.8}>
          {WORKFLOW_STAGES.map((stage) => {
            const stageEnum = STAGE_ID_TO_ENUM[stage.id] as CrqStageEnum;
            const isCurrent = stageEnum === context.currentStage;
            const selectable = eligible.has(stageEnum);
            const isSelected = toStage === stageEnum;

            return (
              <Stack
                key={stage.id}
                direction="row"
                alignItems="center"
                spacing={1}
                onClick={() => selectable && setToStage(stageEnum)}
                sx={{
                  px: 1.2,
                  py: 0.9,
                  borderRadius: colors.radius,
                  cursor: selectable ? "pointer" : "default",
                  border: `1.5px solid ${isSelected ? colors.accent : colors.border}`,
                  bgcolor: isSelected
                    ? colors.accentDim
                    : selectable
                      ? colors.surface
                      : colors.trackOff,
                  opacity: selectable || isCurrent ? 1 : 0.55,
                  transition: "border-color .15s, background-color .15s",
                  "&:hover": selectable ? { borderColor: colors.accent } : {},
                }}
              >
                <Radio
                  size="small"
                  checked={isSelected}
                  disabled={!selectable}
                  sx={{ p: 0.3 }}
                  inputProps={{ "aria-label": stage.label }}
                />
                <Typography
                  sx={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: isSelected || isCurrent ? 800 : 600,
                    color: selectable || isCurrent ? colors.textPrimary : colors.textDim,
                  }}
                >
                  {stage.label}
                </Typography>

                {isCurrent && (
                  <StatusChip
                    label="Current"
                    fg={colors.accent}
                    bg={colors.accentDim}
                    border={colors.accentBorder}
                  />
                )}
                {!isCurrent && !selectable && (
                  <LockRoundedIcon sx={{ fontSize: 14, color: colors.textDim }} />
                )}
              </Stack>
            );
          })}
        </Stack>
      </StepSection>
    </Box>
  );
};

export default MoveStageStep;
