import React, { useMemo } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { useTabColorTokens } from "../../../../../style/theme";
import { SlideUpTransition } from "../../../../../components/common/SlideUpTransition";
import { resolveCardMode, useAttributeUpdate } from "../hooks/useAttributeUpdate";
import { CMS_STAGE_SCHEMAS } from "../constants/attributeUpdateFieldCatalog";
import type { WorkflowStageId } from "../../../constants/workflowStages";
import { AttributeStageStepper } from "./AttributeStageStepper";
import { AttributeCrqHeaderCard } from "./AttributeCrqHeaderCard";
import { WorkflowStageCard } from "./WorkflowStageCard";

const STAGE_LIST = CMS_STAGE_SCHEMAS.map(({ id, label, shortLabel }) => ({
  id,
  label,
  shortLabel,
}));

const jumpToStage = (stageId: WorkflowStageId) => {
  document
    .getElementById(`attribute-stage-${stageId}`)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/**
 * "Attribute Update" dialog: the CRQ's full 7-stage workflow timeline, one
 * card per stage (WorkflowStageCard). Exactly one card - the CRQ's current
 * stage - is ever editable; stages before it are read-only history
 * ("Attribute View"), stages after it are disabled ("Pending"). Every
 * card's data loads live via GET /attributeupdate/details and saves via
 * POST /attributeupdate/save. Mount it once on the hosting page and open it
 * via `useOpenAttributeUpdate()`.
 */
export const AttributeUpdateDialog: React.FC = () => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const {
    dialogOpen,
    crq,
    currentStageId,
    crqStatus,
    stageMeta,
    close,
    refresh,
    isRefreshing,
  } = useAttributeUpdate();

  // Resolved once per (stageMeta/currentStageId/crqStatus) change, not per
  // card render: each card gets its mode/meta as plain props instead of
  // independently re-deriving them (or re-subscribing to Redux) 7x over.
  const stageEntries = useMemo(
    () =>
      STAGE_LIST.map((stage) => ({
        stage,
        mode: resolveCardMode(stage.id, currentStageId, stageMeta[stage.id], crqStatus),
      })),
    [currentStageId, crqStatus, stageMeta],
  );

  const currentStageLabel =
    CMS_STAGE_SCHEMAS.find((s) => s.id === currentStageId)?.label ?? "—";
  const finishedCount = useMemo(
    () =>
      Object.values(stageMeta).filter(
        (m) => m?.runState === "completed" || m?.runState === "failed",
      ).length,
    [stageMeta],
  );

  return (
    <Dialog
      open={dialogOpen}
      onClose={close}
      maxWidth="lg"
      fullWidth
      fullScreen={isSmall}
      TransitionComponent={SlideUpTransition}
      keepMounted={false}
      PaperProps={{
        elevation: 0,
        sx: {
          height: isSmall ? "100%" : "88vh",
          maxHeight: 820,
          display: "flex",
          flexDirection: "column",
          bgcolor: colors.isDark ? "#131419" : "#F4F5F7",
          borderRadius: isSmall ? 0 : "16px",
          border: `1px solid ${colors.border}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          flexShrink: 0,
          bgcolor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5 }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(colors.accent, 0.18)} 0%, ${alpha(colors.accent, 0.08)} 100%)`,
              border: `1px solid ${alpha(colors.accent, 0.2)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EditNoteRoundedIcon sx={{ color: colors.accent, fontSize: 19 }} />
          </Box>

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, fontSize: 15, color: colors.textPrimary }}
          >
            Attribute Update
          </Typography>

          <Box
            sx={{
              width: "1px",
              height: 16,
              bgcolor: colors.border,
              display: { xs: "none", sm: "block" },
            }}
          />

          <Stack
            direction="row"
            spacing={0.75}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            {crq?.crqNo && (
              <Chip
                label={crq.crqNo}
                size="small"
                sx={{
                  height: 22,
                  fontWeight: 600,
                  fontSize: 10.5,
                  bgcolor: alpha(colors.accent, 0.1),
                  color: colors.accent,
                  border: `1px solid ${alpha(colors.accent, 0.2)}`,
                }}
              />
            )}
            {crq?.crqId !== null && crq?.crqId !== undefined && (
              <Chip
                label={`ID: ${crq.crqId}`}
                size="small"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: 10.5,
                  color: colors.textSecondary,
                  borderColor: colors.border,
                }}
              />
            )}
          </Stack>

          <Box sx={{ flex: 1 }} />

          {/* Values can move underneath an open dialog - a Remedy sync, or a
              save made on another stage - so the whole timeline can be re-pulled
              in place instead of closing out and reloading the page. */}
          <Tooltip title="Refresh attribute data" arrow>
            <span>
              <IconButton
                onClick={refresh}
                disabled={isRefreshing}
                size="small"
                sx={{
                  color: colors.textSecondary,
                  width: 30,
                  height: 30,
                  borderRadius: 1.5,
                  mr: 0.25,
                }}
              >
                {isRefreshing ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <RefreshRoundedIcon sx={{ fontSize: 17 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Close" arrow>
            <IconButton
              onClick={close}
              size="small"
              sx={{
                color: colors.textSecondary,
                width: 30,
                height: 30,
                borderRadius: 1.5,
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      {!!STAGE_LIST.length && (
        <AttributeStageStepper
          stages={STAGE_LIST}
          currentStageId={currentStageId}
          stageMeta={stageMeta}
          onJumpToStage={jumpToStage}
          colors={colors}
        />
      )}

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2 }}>
        {crq && (
          <>
            <AttributeCrqHeaderCard
              crq={crq}
              currentStageLabel={currentStageLabel}
              completion={{ filled: finishedCount, total: STAGE_LIST.length }}
              colors={colors}
            />

            {stageEntries.map(({ stage, mode }) => (
              <WorkflowStageCard
                key={stage.id}
                stageId={stage.id}
                label={stage.label}
                mode={mode}
                meta={stageMeta[stage.id]}
                crqNo={crq.crqNo}
                colors={colors}
              />
            ))}
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default AttributeUpdateDialog;
