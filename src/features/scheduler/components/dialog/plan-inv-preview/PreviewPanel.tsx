import React from "react";
import { Box, Button, Chip, Tooltip, Typography, alpha } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { ThemeColors } from "../../../types/crq.types";
import { CheckPointSummaryPreview } from "./CheckPointSummaryPreview/CheckPointSummaryPreview";

interface Props {
  crqNo: string | null;
  crqStatus: string | null;
  isCancelled: boolean;
  /** Review outcome already recorded - checkpoint Pass/Fail actions become read-only. */
  isDone?: boolean;
  panelOpen: boolean;
  colors: ThemeColors;
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PreviewPanel: React.FC<Props> = ({
  crqNo,
  crqStatus,
  isCancelled,
  isDone = false,
  panelOpen,
  colors,
  setPanelOpen,
}) => {
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
          px: 2,
          py: 0.9,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          gap: 1.1,
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, fontSize: 12.5, color: colors.textPrimary }}
        >
          CheckPoint Summary Preview
        </Typography>
        <Chip
          label="Live"
          size="small"
          sx={{
            height: 18,
            fontSize: 9.5,
            fontWeight: 700,
            bgcolor: alpha(colors.accent, 0.1),
            color: colors.accent,
          }}
        />
        <Box sx={{ flex: 1 }} />

        {/* Collapse/expand is a view control, not an action, so it stays live
            even on a frozen stage - on a small screen the form auto-collapses,
            and disabling this was the only way back to it. */}
        <Tooltip title={panelOpen ? "Hide the validation form panel" : "Show the validation form panel"} arrow>
          <Button
            size="small"
            onClick={() => setPanelOpen((v) => !v)}
            aria-label={panelOpen ? "Hide validation panel" : "Show validation panel"}
            startIcon={panelOpen ? <ChevronLeftIcon sx={{ fontSize: "16px !important" }} /> : <ChevronRightIcon sx={{ fontSize: "16px !important" }} />}
            sx={{
              color: colors.accent,
              border: `1px solid ${alpha(colors.accent, 0.28)}`,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 1.5,
              py: 0.35,
            }}
          >
            {panelOpen ? "Hide Panel" : "Show Panel"}
          </Button>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <CheckPointSummaryPreview
          crqNo={crqNo}
          crqStatus={crqStatus}
          disableActions={isCancelled || isDone}
        />
      </Box>
    </Box>
  );
};
