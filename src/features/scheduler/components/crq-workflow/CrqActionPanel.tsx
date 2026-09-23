import React from "react";
import { Box, Button, Chip, Divider, Stack, Tooltip, Typography } from "@mui/material";
import { toast } from "react-toastify";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { Colors } from "../../types/colorTypes";

export type StageMode = "editable" | "view" | "locked";

export interface CRQAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface CrqActionPanelProps {
  stageLabel: string;
  mode: StageMode;
  isRunning: boolean;
  onStartPause: () => void;
  onReview: () => void;
  isBusy?: boolean;
  /**
   * User holds Scheduler VIEW but not UPDATE. The stage is still whatever
   * `mode` says it is — this only removes the ability to act on it, so the
   * badge reports the permission rather than mislabelling an active stage as
   * "Completed". Review stays reachable; the dialog it opens locks its own
   * fields off the same flag.
   */
  readOnly?: boolean;
  /**
   * The selected stage (or the whole CRQ) was cancelled. Start/Pause is the
   * single control this freezes - everything else stays live, since the
   * dialogs they open drop their own action controls when cancelled and are
   * still worth opening to read.
   */
  isCanceled?: boolean;
  /** Record-level actions that apply regardless of the selected stage
   * (Attribute Update, Show Prev CRQ Status, ...). Adding a future action is
   * a one-line addition to this array - no changes needed here. */
  recordActions: CRQAction[];
  colors: Colors;
}

/** Lighter, smaller "utility tier" button for record-level actions (Validate,
 * Attribute Update, ...) - visually subordinate to the Start/Pause/Review
 * pair, which stay full-weight. Local to this panel rather than reusing the
 * shared CustomActionButton, since that component is also used by pages
 * outside this screen's redesign scope. */
const UtilityActionButton: React.FC<{ action: CRQAction; colors: Colors }> = ({ action, colors }) => (
  <Button
    variant="outlined"
    size="small"
    disabled={action.disabled}
    onClick={action.onClick}
    startIcon={action.icon}
    sx={{
      height: 30,
      textTransform: "none",
      fontWeight: 600,
      fontSize: 12,
      borderRadius: "7px",
      px: 1.3,
      borderColor: colors.border,
      color: colors.textSecondary,
      bgcolor: "transparent",
      "&:hover": { borderColor: colors.accentBorder, bgcolor: colors.accentDim, color: colors.accent },
      "&.Mui-disabled": { borderColor: colors.border, color: colors.textDim },
    }}
  >
    {action.label}
  </Button>
);

const MODE_COPY: Record<StageMode, { badge: string; note: string }> = {
  editable: {
    badge: "Editable",
    note: "This is the active stage — its output is editable and actionable here.",
  },
  view: {
    badge: "View only",
    note: "Completed stage — output is retained for reference and is read-only.",
  },
  locked: {
    badge: "Locked",
    note: "This stage has not been reached yet for this CRQ.",
  },
};

/**
 * Single sticky Action Panel for the CRQ cockpit - every action available on
 * this CRQ (record-level + stage-level) lives in one container so there is
 * one obvious place to look for "what can I do here", instead of the actions
 * being split across a separate toolbar and a stage banner.
 */
export const CrqActionPanel: React.FC<CrqActionPanelProps> = ({
  stageLabel,
  mode,
  isRunning,
  onStartPause,
  onReview,
  isBusy,
  readOnly = false,
  isCanceled = false,
  recordActions,
  colors,
}) => {
  const copy = isCanceled
    ? {
        badge: "Canceled",
        note: "This stage was cancelled — its outcome is final. Everything here still opens, read-only; only starting the stage again is blocked.",
      }
    : readOnly
      ? {
          badge: "Read only",
          note: "You have view access to the Scheduler — acting on this stage requires the Scheduler module's Update permission.",
        }
      : MODE_COPY[mode];
  const canceledStartHint = `${stageLabel} was cancelled, so it can't be started again. Open "Review ${stageLabel}" to read the recorded outcome, or raise a new CRQ to redo this work.`;
  const badgePalette = isCanceled
    ? { bg: colors.dangerDim, fg: colors.danger }
    : mode === "editable" && !readOnly
      ? { bg: colors.successDim, fg: colors.success }
      : { bg: colors.trackOff, fg: colors.textDim };

  return (
    // Rendered by CrqDetailedView as a static sibling of CrqWorkflowHeader/
    // StageRail, outside the scrollable stage-content Box - not sticky.
    // Position-sticky + z-index inside that scroll container proved
    // unreliable (scrolled Accordion content from StageSummaryGrid kept
    // rendering above it), so this card simply never enters the scrolling
    // region at all: structurally, nothing scrolled can appear above it.
    <Box sx={{ px: 2, pt: 2 }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          bgcolor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: colors.radius,
          boxShadow: colors.isDark
            ? "0 4px 14px rgba(0,0,0,0.45)"
            : "0 4px 14px rgba(15,23,42,0.1)",
          px: 1.5,
          py: 0.85,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          <Chip
            label={copy.badge}
            size="small"
            sx={{
              height: 20,
              fontWeight: 800,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              bgcolor: badgePalette.bg,
              color: badgePalette.fg,
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: colors.textPrimary }} noWrap>
            {stageLabel}
          </Typography>
          <Tooltip title={copy.note} arrow placement="bottom-start">
            <InfoOutlinedIcon sx={{ fontSize: 14, color: colors.textDim, cursor: "help", flexShrink: 0 }} />
          </Tooltip>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          justifyContent={{ xs: "flex-start", lg: "flex-end" }}
          useFlexGap
          sx={{ columnGap: 0.75, rowGap: 0.75 }}
        >
          {recordActions.map((action) => (
            <UtilityActionButton key={action.key} action={action} colors={colors} />
          ))}

          {mode === "locked" && (
            <Chip
              label="Not reached"
              size="small"
              sx={{
                height: 28,
                fontWeight: 800,
                fontSize: 12,
                px: 0.5,
                bgcolor: colors.trackOff,
                color: colors.textDim,
              }}
            />
          )}

          {mode === "view" && !readOnly && (
            <Chip
              label="✓ Completed"
              size="small"
              sx={{
                height: 28,
                fontWeight: 800,
                fontSize: 12,
                px: 0.5,
                bgcolor: colors.successDim,
                color: colors.success,
              }}
            />
          )}

          {(mode === "editable" || mode === "view") && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: colors.border, my: 0.5, display: { xs: "none", sm: "block" } }}
              />
              {mode === "editable" && !readOnly && (
                <Tooltip title={isCanceled ? canceledStartHint : ""} arrow>
                  <Box
                    component="span"
                    onClick={() => {
                      if (!isCanceled) return;
                      // toastId de-dupes an impatient double-click into one toast.
                      toast.info(canceledStartHint, { toastId: "stage-canceled-start" });
                    }}
                    sx={{ display: "inline-flex" }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      disabled={isBusy || isCanceled}
                      onClick={onStartPause}
                      startIcon={
                        isRunning ? <PauseRoundedIcon sx={{ fontSize: 16 }} /> : <PlayArrowRoundedIcon sx={{ fontSize: 16 }} />
                      }
                      sx={{
                        height: 34,
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: 13,
                        borderRadius: "8px",
                        px: 2.2,
                        boxShadow: isRunning ? "none" : "0 4px 12px rgba(15,115,80,0.28)",
                        border: isRunning ? `1.5px solid ${colors.dangerBorder}` : "none",
                        background: isRunning ? "transparent" : "linear-gradient(135deg,#15a06b,#0f7350)",
                        color: isRunning ? colors.danger : "#fff",
                        "&:hover": {
                          boxShadow: isRunning ? "none" : "0 6px 16px rgba(15,115,80,0.36)",
                          background: isRunning ? colors.dangerDim : "linear-gradient(135deg,#15a06b,#0f7350)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      {isRunning ? "Pause" : "Start Stage"}
                    </Button>
                  </Box>
                </Tooltip>
              )}
              {/* Stays clickable on a completed (view-mode) stage too, so the
                  outcome that was already recorded can still be opened -
                  GenericFormPanel/FormPanel disable the Pass/Failed/Cancelled
                  actions inside once they see the stage is already Done. */}
              <Button
                variant="outlined"
                size="small"
                onClick={onReview}
                startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                sx={{
                  height: 34,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: "8px",
                  px: 2,
                  borderWidth: "1.5px",
                  borderColor: colors.accentBorder,
                  color: colors.accent,
                  bgcolor: colors.surface,
                  "&:hover": { bgcolor: colors.accentDim, borderColor: colors.accent },
                }}
              >
                Review {stageLabel}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default CrqActionPanel;
