import React from "react";
import { Box, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import type { Colors } from "../../../types/colorTypes";
import type { WorkflowStageId } from "../../../constants/workflowStages";
import type { StageMeta } from "../types/attributeUpdate.types";
import { STEPPER_DONE } from "../constants/attributeUpdate.constants";

export interface StageStepDescriptor {
  id: WorkflowStageId;
  label: string;
  shortLabel: string;
}

interface AttributeStageStepperProps {
  stages: StageStepDescriptor[];
  currentStageId: WorkflowStageId | null;
  stageMeta: Partial<Record<WorkflowStageId, StageMeta>>;
  /** Jump-to-card: scrolls the clicked stage's timeline card into view. */
  onJumpToStage: (stageId: WorkflowStageId) => void;
  colors: Colors;
}

/**
 * Sticky mini-nav across the top of the Attribute Update timeline. Every
 * stage renders at once in the body below, so this strip is a jump-to-card
 * shortcut, not a stage switcher: each step's done/current/pending look
 * reflects the CRQ's real per-stage run state (stageMeta), and clicking a
 * step scrolls its card into view instead of changing what's rendered.
 */
export const AttributeStageStepper: React.FC<AttributeStageStepperProps> = ({
  stages,
  currentStageId,
  stageMeta,
  onJumpToStage,
  colors,
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
      bgcolor: colors.surface2,
      borderBottom: `1px solid ${colors.border}`,
      flexShrink: 0,
    }}
  >
    {stages.map((stage, index) => {
      const runState = stageMeta[stage.id]?.runState ?? "not_started";
      const isCurrent = stage.id === currentStageId;
      const isDone = runState === "completed" || runState === "failed";

      return (
        <Box
          key={stage.id}
          onClick={() => onJumpToStage(stage.id)}
          sx={{
            textAlign: "center",
            px: 0.75,
            pt: 1.2,
            pb: 1,
            minWidth: 0,
            cursor: "pointer",
            borderBottom: `3px solid ${isCurrent ? colors.accent : "transparent"}`,
            bgcolor: isCurrent ? colors.surface : "transparent",
            transition: "background 0.15s ease",
            "&:hover": { bgcolor: isCurrent ? colors.surface : colors.trackOff },
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "50%",
              mb: 0.5,
              fontSize: 12,
              fontWeight: 600,
              bgcolor: isDone ? STEPPER_DONE.bg : isCurrent ? colors.accent : colors.surface,
              border: `1.5px solid ${
                isDone ? STEPPER_DONE.border : isCurrent ? colors.accent : colors.border
              }`,
              color: isDone ? STEPPER_DONE.fg : isCurrent ? "#fff" : colors.textSecondary,
            }}
          >
            {isDone ? <CheckRoundedIcon sx={{ fontSize: 15 }} /> : index + 1}
          </Box>
          <Typography
            sx={{
              fontSize: 12,
              lineHeight: 1.35,
              px: 0.5,
              wordBreak: "break-word",
              fontWeight: isCurrent ? 600 : 400,
              color: isCurrent || isDone ? colors.textPrimary : colors.textSecondary,
            }}
          >
            {stage.shortLabel}
          </Typography>
        </Box>
      );
    })}
  </Box>
);

export default AttributeStageStepper;
