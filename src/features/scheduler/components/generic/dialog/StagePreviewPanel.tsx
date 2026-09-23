import React from "react";
import { Box, Button, Chip, Tooltip, Typography, alpha } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { StageConfig } from "../../../types/stageWorkflow.types";
import SmartScrollContainer from "../../../../../components/common/SmartScrollContainer";
import { ImpactBatchExplorer } from "./impactAnalysis/ImpactBatchExplorer";
import { MopCreateDocumentPanel } from "./mopCreate/MopCreateDocumentPanel";
import { MopValidatePanel } from "./mopValidate/MopValidatePanel";

interface StagePreviewPanelProps {
  crqNo: string | null;
  stageConfig: StageConfig;
  /** Cancelled / already-reviewed / view-only stage - the panel stays
   * readable (batches, drill-downs, Delta, Excel download; the stored MOP
   * and its download) but every side-effecting control in it - Impact
   * Analysis's "Refetch", MOP Create's uploader - is inert. */
  readOnly?: boolean;
  panelOpen: boolean;
  colors: any;
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Per-stage copy for the panel's header row and its collapse toggle. Only
 * the stages `StageReviewDialog.hasPreviewPanel` admits appear here; every
 * other stage (MOP Validate, Scheduling, Activity Implement, Closer) has no
 * summary data to show, so that dialog skips this panel entirely for them
 * rather than mounting it empty.
 */
const PANEL_COPY: Record<string, { title: string; chip: string; show: string; hide: string }> = {
  impactanalysis: {
    title: "Impact Analysis Summary",
    chip: "Live",
    show: "Show Validation",
    hide: "Hide Validation",
  },
  mopcreate: {
    title: "MOP Document",
    chip: "Live",
    show: "Show Document",
    hide: "Hide Document",
  },
  mopvalidate: {
    title: "MOP Validation",
    chip: "Live",
    show: "Show Validation",
    hide: "Hide Validation",
  },
};

/**
 * Right panel of `StageReviewDialog`, paired with the stage's action form.
 * What it renders is chosen by stage: Impact Analysis gets the live
 * `ImpactBatchExplorer`, MOP Create the MOP header and document uploader, MOP
 * Validate the current MOP version and its review.
 */
export const StagePreviewPanel: React.FC<StagePreviewPanelProps> = ({
  crqNo,
  stageConfig,
  readOnly = false,
  panelOpen,
  colors,
  setPanelOpen,
}) => {
  const copy = PANEL_COPY[stageConfig.key] ?? {
    title: `${stageConfig.label} Summary`,
    chip: "Live",
    show: "Show Panel",
    hide: "Hide Panel",
  };

  return (
    <Box
      component="section"
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: colors.isDark ? alpha("#fff", 0.02) : "#F4F5F7",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.2,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13, color: colors.textPrimary }}>
          {copy.title}
        </Typography>
        <Chip
          label={copy.chip}
          size="small"
          sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: alpha(colors.accent, 0.1), color: colors.accent }}
        />
        <Box sx={{ flex: 1 }} />
        {/* Collapse/expand is a view control, not an action, so it stays live
            even on a frozen stage - on a small screen the form auto-collapses,
            and disabling this was the only way back to it. */}
        <Tooltip title={panelOpen ? "Collapse" : "Expand"} arrow>
          <Button
            size="small"
            onClick={() => setPanelOpen((v) => !v)}
            startIcon={panelOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            sx={{ color: colors.accent, border: `1px solid ${alpha(colors.accent, 0.28)}` }}
          >
            {panelOpen ? copy.hide : copy.show}
          </Button>
        </Tooltip>
      </Box>

      {/* Both MOP panels size themselves to this box and never overflow it -
          MOP Create's PDF preview and MOP Validate's review body absorb the
          leftover height - so they are mounted directly. Wrapping them in the
          scroller would cap them at their content height and leave the preview
          a few hundred pixels tall. Impact Analysis is the opposite: an
          arbitrarily long batch list that has to scroll. */}
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {stageConfig.key === "mopcreate" ? (
          <MopCreateDocumentPanel crqNo={crqNo} readOnly={readOnly} colors={colors} />
        ) : stageConfig.key === "mopvalidate" ? (
          <MopValidatePanel crqNo={crqNo} readOnly={readOnly} colors={colors} />
        ) : (
          <SmartScrollContainer fill>
            <Box sx={{ p: 2.5 }}>
              <ImpactBatchExplorer crqNo={crqNo} colors={colors} readOnly={readOnly} />
            </Box>
          </SmartScrollContainer>
        )}
      </Box>
    </Box>
  );
};

export default StagePreviewPanel;
