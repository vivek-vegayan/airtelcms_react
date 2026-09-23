import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
// import type { StageConfig } from "../../../types/stageWorkflow.types";
import SmartScrollContainer from "../../../../../components/common/SmartScrollContainer";
import { FieldRenderer } from "./FieldRenderer";
import { AttributeUpdateGate, useAttributeUpdateGate } from "./AttributeUpdateGate";
import { StageActionBlockedAlert } from "./StageActionBlockedAlert";
import { useStageRefresh } from "../../../hook/useStageRefresh";
import type {
  StageActionError,
  StageConfig,
  StageSubmitResult,
} from "../../../types/stageWorkflow.types";

interface GenericFormPanelProps {
  crq: any;
  stageConfig: StageConfig;
  /** The CRQ, or this stage on its own, is cancelled - every action in this
   * form (Attribute Update, the outcome cards, every field, Submit) is inert.
   * The dialog still opens so what was recorded stays readable. */
  isCancelled: boolean;
  /** Which level the cancellation came from, so the alert names the right one. */
  cancelledScope?: "crq" | "stage";
  /** This stage's outcome is already recorded (Done) - Pass/Failed/Cancelled
   * and Submit are disabled, same as isCancelled, but the CRQ itself is not
   * cancelled so it gets its own alert copy below. */
  isDone: boolean;
  /** Viewer lacks the Scheduler module's UPDATE permission — locks the form
   * exactly like isCancelled/isDone do, but without claiming the stage was
   * cancelled or already reviewed. */
  readOnly?: boolean;
  panelOpen: boolean;
  colors: any;
  setPanelOpen: (v: boolean) => void;
  /** Whether `StageReviewDialog` also renders a `StagePreviewPanel` next to
   * this one - only true for Impact Analysis. When false there is nothing
   * for the "Hide Panel" toggle to reveal, so it's omitted and this stays
   * the dialog's only content. */
  hasPreviewPanel: boolean;
  /** Mirrors `StageReviewDialog`'s own `open` flag - flipping it resets the
   * Attribute Update gate, so every fresh visit to this form has to visit
   * attributes again before an outcome is recorded silently. */
  open: boolean;
  onClose: () => void;
  onSubmitDone: (values: Record<string, any>, crq: any) => Promise<StageSubmitResult>;
}

/**
 * One form panel, driven entirely by `stageConfig.statusOptions` and
 * `stageConfig.fields`. This single component replaces the bespoke
 * `FormPanel` that previously existed only for the Impact Analysis stage -
 * every other stage now reuses it as-is.
 */
export const GenericFormPanel: React.FC<GenericFormPanelProps> = ({
  crq,
  stageConfig,
  isCancelled,
  cancelledScope = "crq",
  isDone,
  readOnly = false,
  panelOpen,
  colors,
  setPanelOpen,
  hasPreviewPanel,
  open,
  onClose,
  onSubmitDone,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A refusal from the stage's stored procedure - it rolled back, so nothing
  // changed and the dialog stays open with everything typed still in place.
  const [blockedError, setBlockedError] = useState<StageActionError | null>(null);
  const refreshStage = useStageRefresh(stageConfig.key);
  const isLocked = isCancelled || isDone || readOnly;

  // "Attribute Update" lives here, directly above the outcome selector,
  // instead of on the cockpit's record-action row. Picking Pass/Failed/
  // Cancelled without opening it warns but never blocks - see
  // useAttributeUpdateGate. A Done stage keeps it clickable so attributes can
  // still be reviewed/updated after the outcome is recorded.
  const attributeGate = useAttributeUpdateGate({ crq, open, disabled: isCancelled || readOnly });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<Record<string, any>>({
    defaultValues: { status: undefined, remark: "" },
  });

  const values = useWatch({ control }) as Record<string, any>;

  const handleFormSubmit = async (formValues: Record<string, any>) => {
    if (!crq?.crqNo || !crq?.crqId) {
      toast.error("CRQ details missing. Please select a valid CRQ.");
      return;
    }
    if (!formValues.status) {
      toast.error("Please select an outcome.");
      return;
    }

    // Config-driven required check - covers the cancellation block
    // (cygnetStatus/field1/cancellationReason/field5) and the CHM remark,
    // whichever of stageConfig.fields is currently required for this
    // outcome, without hardcoding any stage-specific field names.
    const missing = stageConfig.fields
      .filter((f) => f.type !== "readonly")
      .filter((f) => (f.requiredWhen ? f.requiredWhen(formValues) : f.required))
      .filter((f) => !formValues[f.name])
      .map((f) => f.label);
    if (missing.length) {
      toast.error(`Required: ${missing.join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmitDone(formValues, crq);
    setIsSubmitting(false);
    setBlockedError(result.error ?? null);
    if (result.success) onClose();
  };

  // "Try again" - the blocker was external (an Ops task to close, a CAB
  // decision to come). Resubmit exactly what's already in the form.
  const handleRetry = () => {
    setBlockedError(null);
    handleSubmit(handleFormSubmit)();
  };

  // "Change outcome" - this outcome can never succeed for this CRQ. Drop the
  // selection so the outcome cards read as unanswered again.
  const handleChangeOutcome = () => {
    setBlockedError(null);
    setValue("status", undefined, { shouldDirty: true });
  };

  // "Refresh" - the row on screen is stale (the CRQ moved on, or is gone).
  // Reload the listing and close, rather than acting on what's shown.
  const handleRefresh = () => {
    setBlockedError(null);
    refreshStage();
    onClose();
  };

  const paletteColor: Record<string, string> = {
    success: "#16a34a",
    error: "#dc2626",
    warning: "#d97706",
  };

  return (
    <Box
      component="aside"
      sx={{
        width: !panelOpen ? "0px" : hasPreviewPanel ? { xs: "100%", md: "360px" } : "100%",
        minWidth: !panelOpen ? "0px" : hasPreviewPanel ? { xs: "100%", md: "360px" } : "100%",
        transition: "width 280ms ease, min-width 280ms ease, opacity 200ms ease",
        opacity: panelOpen ? 1 : 0,
        borderRight: panelOpen && hasPreviewPanel ? `1px solid ${colors.border}` : "none",
        display: "flex",
        flexDirection: "column",
        bgcolor: colors.surface,
        flexShrink: 0,
        // Alongside StagePreviewPanel this sits in a row, where the default
        // cross-axis stretch already gives it the row's full height. Alone
        // in the Drawer it's the sole child of a column flex container, so
        // it needs its own flex-grow to fill that column's height instead.
        flexGrow: hasPreviewPanel ? 0 : 1,
        minHeight: hasPreviewPanel ? undefined : 0,
        overflow: "hidden",
      }}
    >
      {panelOpen && (
        <Box
          component="form"
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
          sx={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.25,
              borderBottom: `1px solid ${colors.border}`,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: colors.textSecondary,
            }}
          >
            {stageConfig.label} Action
          </Box>

          <DialogContent sx={{ p: 0, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <SmartScrollContainer fill>
              <Stack spacing={2.5} sx={{ p: 2.5 }}>
                <Collapse in={isCancelled} unmountOnExit>
                  <Alert severity="error" icon={<WarningAmberRoundedIcon fontSize="small" />}>
                    {cancelledScope === "crq" ? (
                      <>
                        This CRQ is <strong>Cancelled</strong>. Its outcome is final, so there is
                        nothing left to record here.
                      </>
                    ) : (
                      <>
                        This {stageConfig.label} stage is <strong>Cancelled</strong>. Its outcome is
                        final, so there is nothing left to record here.
                      </>
                    )}
                  </Alert>
                </Collapse>

                <Collapse in={isDone && !isCancelled} unmountOnExit>
                  <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="small" />}>
                    This stage is already <strong>Completed</strong>. The recorded outcome is shown below, read-only.
                  </Alert>
                </Collapse>

                {/* The stage's procedure refused this outcome. Kept inline
                    rather than toasted: it describes a state that has to be
                    resolved (CAB, Ops task, a CRQ that moved on), and it
                    carries the actions that can resolve it. */}
                {blockedError && (
                  <StageActionBlockedAlert
                    error={blockedError}
                    busy={isSubmitting}
                    onRetry={handleRetry}
                    onReset={handleChangeOutcome}
                    onRefresh={handleRefresh}
                  />
                )}

                {!isCancelled && (
                  <AttributeUpdateGate
                    visited={attributeGate.visited}
                    warned={attributeGate.warned}
                    disabled={attributeGate.isDisabled}
                    colors={colors}
                    onOpen={attributeGate.openDialog}
                  />
                )}

                {/* Outcome selector, built from stageConfig.statusOptions.
                    A cancelled stage renders neither this nor the fields below
                    it: nothing here can be submitted any more, so the whole
                    action block goes rather than sitting there greyed out. */}
                {!isCancelled && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: colors.textSecondary, fontSize: 12, mb: 1, display: "block" }}
                    >
                      Select outcome *
                    </Typography>
                    <Stack spacing={1} role="radiogroup">
                      {stageConfig.statusOptions.map((opt) => {
                        const color = paletteColor[opt.palette];
                        const Icon = opt.icon;
                        const selected = values.status === opt.value;
                        return (
                          <Box
                            key={opt.value}
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              if (isLocked) return;
                              // The refusal belonged to the previous choice.
                              setBlockedError(null);
                              setValue("status", opt.value, { shouldDirty: true, shouldValidate: true });
                              attributeGate.warnIfPending();
                            }}
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: 2,
                              border: "1.5px solid",
                              borderColor: selected ? color : colors.border,
                              bgcolor: selected ? alpha(color, 0.06) : colors.surface,
                              cursor: isLocked ? "not-allowed" : "pointer",
                              opacity: isLocked ? 0.5 : 1,
                            }}
                          >
                            <Icon sx={{ fontSize: 18, color: selected ? color : colors.textSecondary }} />
                            <Box>
                              <Typography sx={{ fontSize: 13.5, fontWeight: selected ? 700 : 500, color: selected ? color : colors.textPrimary }}>
                                {opt.label}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: colors.textSecondary }}>
                                {opt.description}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                    {errors.status && (
                      <Alert severity="warning" sx={{ mt: 1.5, py: 0.5, fontSize: 12 }}>
                        {(errors.status as any)?.message}
                      </Alert>
                    )}
                  </Box>
                )}

                {/* Remaining config-driven fields (cancellation block, remarks, etc) */}
                {!isCancelled &&
                  stageConfig.fields.map((field) => (
                    <FieldRenderer
                      key={field.name}
                      field={field}
                      control={control}
                      errors={errors}
                      values={values}
                      disabled={isLocked}
                    />
                  ))}
              </Stack>
            </SmartScrollContainer>
          </DialogContent>

          {(!isCancelled || hasPreviewPanel) && (
            <DialogActions
              sx={{
                px: 2,
                py: 1.5,
                borderTop: `1px solid ${colors.border}`,
                flexDirection: "column",
                alignItems: "stretch",
                gap: 1,
              }}
            >
              {!isCancelled && (
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting || !isDirty || isLocked}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <CheckCircleOutlineIcon sx={{ fontSize: "17px !important" }} />
                    )
                  }
                  sx={{
                    textTransform: "none",
                    bgcolor: colors.accent,
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 2,
                    py: 1,
                    whiteSpace: "nowrap",
                    boxShadow: `0 2px 10px ${alpha(colors.accent, 0.35)}`,
                    "&:hover": { bgcolor: colors.accent, filter: "brightness(1.08)" },
                  }}
                >
                  {isSubmitting ? "Submitting…" : `Submit ${stageConfig.label}`}
                </Button>
              )}
              {hasPreviewPanel && (
                <Button
                  size="small"
                  onClick={() => setPanelOpen(false)}
                  startIcon={<ChevronLeftIcon sx={{ fontSize: "16px !important" }} />}
                  sx={{
                    color: colors.textSecondary,
                    textTransform: "none",
                    alignSelf: "flex-start",
                    fontSize: 12.5,
                    px: 1,
                    "&:hover": { bgcolor: alpha(colors.textSecondary, 0.07) },
                  }}
                >
                  Hide Panel
                </Button>
              )}
            </DialogActions>
          )}
        </Box>
      )}
    </Box>
  );
};

export default GenericFormPanel;
