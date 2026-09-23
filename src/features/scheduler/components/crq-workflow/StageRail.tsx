import React from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import type { Colors } from "../../types/colorTypes";
import type { Crq } from "../../types/crqWorkflow.types";
import {
  WORKFLOW_STAGES,
  resolveStageState,
  stageStatePalette,
  type WorkflowStageId,
} from "../../constants/workflowStages";

interface StageRailProps {
  crq: Crq;
  currentStageIndex: number;
  selectedStageId: WorkflowStageId;
  onSelectStage: (stageId: WorkflowStageId) => void;
  /** Opens the Preview CRQ PDF dialog for the current CRQ. The stored plan
   * PDF is per-CRQ (Get_Change_PlanPDF takes only the CRQ number, no stage
   * param), so every stage card's button opens the same document. */
  onPreviewCrq: () => void;
  colors: Colors;
}

/** Horizontal 7-stage navigator - one card per WORKFLOW_STAGES entry. */
export const StageRail: React.FC<StageRailProps> = ({
  crq,
  currentStageIndex,
  selectedStageId,
  onSelectStage,
  onPreviewCrq,
  colors,
}) => (
  <Box sx={{ bgcolor: colors.trackOff, borderBottom: `1px solid ${colors.border}`, px: 2, py: 0.85 }}>
    <Stack direction="row" spacing={0.6} sx={{ overflowX: "auto", pb: 0.4 }}>
      {WORKFLOW_STAGES.map((stage, idx) => {
        const state = resolveStageState(crq, idx, currentStageIndex);
        const isSelected = stage.id === selectedStageId;
        const clickable = idx <= currentStageIndex;

        const palette = stageStatePalette(state, colors);
        const chipLabel = palette.label;

        return (
          <Box
            key={stage.id}
            onClick={() => clickable && onSelectStage(stage.id)}
            sx={{
              flex: { xs: "0 0 112px", md: "0 0 128px", lg: "0 0 144px" },
              p: "7px 10px",
              borderRadius: colors.radius,
              border: `1.5px solid ${isSelected ? colors.accent : colors.border}`,
              bgcolor: colors.surface,
              cursor: clickable ? "pointer" : "not-allowed",
              boxShadow: isSelected ? `0 4px 14px ${colors.accentBorder}` : "0 1px 2px rgba(20,30,50,0.03)",
              transition: "all 0.16s ease",
              "&:hover": clickable && !isSelected ? { borderColor: colors.borderHover, transform: "translateY(-2px)" } : undefined,
            }}
          >

          
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <Box
                  className={state === "in_progress" ? "status-pulse-dot" : undefined}
                  sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: palette.dot }}
                />
                <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: colors.textDim, fontFamily: "monospace" }}>
                  S{idx + 1}
                </Typography>
              </Stack>
              <Box
                sx={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  px: "8px",
                  py: "2px",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                  bgcolor: palette.bg,
                  color: palette.fg,
                }}
              >
                {chipLabel}
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.6 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: state === "locked" ? colors.textDim : colors.textPrimary,
                  lineHeight: 1.15,
                  minWidth: 0,
                }}
                noWrap
              >
                {stage.shortLabel}
              </Typography>
              <Tooltip title={state === "locked" ? "Locked" : "Preview CRQ"}>
                <span>
                  <IconButton
                    size="small"
                    aria-label="Preview CRQ"
                    disabled={state === "locked"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewCrq();
                    }}
                    sx={{
                      width: 20,
                      height: 20,
                      ml: 0.5,
                      flexShrink: 0,
                      color: colors.textDim,
                      "&:hover": { color: colors.accent, bgcolor: colors.accentDim },
                      "&.Mui-disabled": { color: colors.textDim, opacity: 0.4 },
                    }}
                  >
                    <PictureAsPdfOutlinedIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  </Box>
);

export default StageRail;
