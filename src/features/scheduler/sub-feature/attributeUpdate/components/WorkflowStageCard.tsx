import React, { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography, alpha } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { format } from "date-fns";

import type { Colors } from "../../../types/colorTypes";
import { stageStatePalette, type WorkflowStageId } from "../../../constants/workflowStages";
import type { StageDialogMode, StageMeta } from "../types/attributeUpdate.types";
import { WorkflowStageCardBody } from "./WorkflowStageCardBody";

interface WorkflowStageCardProps {
  stageId: WorkflowStageId;
  label: string;
  mode: StageDialogMode;
  meta: StageMeta | undefined;
  crqNo: string;
  colors: Colors;
}

const fmtDate = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : format(d, "dd-MMM-yyyy HH:mm");
};

const MODE_COPY: Record<StageDialogMode, { action: string; icon: React.ReactNode }> = {
  edit: { action: "Attribute Update", icon: <EditNoteRoundedIcon sx={{ fontSize: 15 }} /> },
  view: { action: "Attribute View", icon: <VisibilityRoundedIcon sx={{ fontSize: 15 }} /> },
  pending: { action: "Pending", icon: <HourglassEmptyRoundedIcon sx={{ fontSize: 15 }} /> },
};

/**
 * One card in the Attribute Update workflow timeline. Deliberately a thin,
 * memoized shell: the header (this component) is cheap enough to mount for
 * all 7 stages up front - it takes its stage's mode/meta as plain props
 * (resolved once by the dialog, not re-derived per card via Redux), no
 * RTK Query, no react-hook-form. The expensive part - live data fetch,
 * react-hook-form, Save - lives entirely in WorkflowStageCardBody, which
 * this component only mounts once the card is actually open: immediately
 * for "edit" (the CRQ's current stage), lazily on expand for "view"
 * (history) stages, never for "pending" (future) stages.
 */
export const WorkflowStageCard: React.FC<WorkflowStageCardProps> = React.memo(
  function WorkflowStageCard({ stageId, label, mode, meta, crqNo, colors }) {
    const [expanded, setExpanded] = useState(false);

    const isEditable = mode === "edit";
    const isPending = mode === "pending";
    const isOpen = isEditable || expanded;

    const palette = stageStatePalette(meta?.runState ?? "not_started", colors);
    const copy = MODE_COPY[mode];
    const updatedCaption =
      mode === "view" ? [meta?.performedBy, fmtDate(meta?.completedAt)].filter(Boolean).join(" · ") : null;

    return (
      <Box id={`attribute-stage-${stageId}`} sx={{ scrollMarginTop: 12, mb: 1.5 }}>
        <Accordion
          expanded={isOpen}
          onChange={(_, next) => !isEditable && !isPending && setExpanded(next)}
          disableGutters
          elevation={0}
          sx={{
            bgcolor: colors.surface,
            border: `1.5px solid ${isEditable ? colors.accent : colors.border}`,
            borderRadius: `${colors.radiusL} !important`,
            overflow: "hidden",
            opacity: isPending ? 0.65 : 1,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={
              !isPending && (
                <ExpandMoreRoundedIcon sx={{ color: colors.textSecondary, fontSize: 20 }} />
              )
            }
            sx={{
              px: 2,
              py: 0.5,
              minHeight: 56,
              bgcolor: isEditable ? alpha(colors.accent, colors.isDark ? 0.16 : 0.08) : "transparent",
              cursor: isPending ? "default" : "pointer",
              "& .MuiAccordionSummary-content": { alignItems: "center", my: 1 },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: palette.dot }}
              />
              <Typography
                noWrap
                sx={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary, minWidth: 0 }}
              >
                {label}
              </Typography>

              <Chip
                label={palette.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10.5,
                  fontWeight: 700,
                  bgcolor: palette.bg,
                  color: palette.fg,
                }}
              />

              {updatedCaption && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{ display: { xs: "none", sm: "flex" } }}
                >
                  <PersonOutlineIcon sx={{ fontSize: 13, color: colors.textDim }} />
                  <Typography sx={{ fontSize: 11, color: colors.textDim, whiteSpace: "nowrap" }}>
                    {updatedCaption}
                  </Typography>
                </Stack>
              )}

              <Box sx={{ flex: 1 }} />

              <Chip
                icon={copy.icon as React.ReactElement}
                label={copy.action}
                size="small"
                sx={{
                  height: 24,
                  fontWeight: 700,
                  fontSize: 11.5,
                  bgcolor: isEditable ? colors.accent : isPending ? colors.trackOff : colors.surface2,
                  color: isEditable ? "#fff" : colors.textSecondary,
                  border: isEditable ? "none" : `1px solid ${colors.border}`,
                  "& .MuiChip-icon": { color: isEditable ? "#fff" : colors.textDim },
                }}
              />
            </Stack>
          </AccordionSummary>

          {/* WorkflowStageCardBody (query + form + field grid) only ever
              mounts here - i.e. only when the card is open and not pending -
              so collapsed history stages and every future stage cost
              nothing beyond this header row. */}
          {!isPending && isOpen && (
            <AccordionDetails sx={{ px: 2, py: 1.75 }}>
              <WorkflowStageCardBody
                stageId={stageId}
                crqNo={crqNo}
                isEditable={isEditable}
                colors={colors}
              />
            </AccordionDetails>
          )}
        </Accordion>
      </Box>
    );
  },
);

export default WorkflowStageCard;
