import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  DialogActions,
  DialogContent,
  Fade,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import type { ReviewFormInputs, ThemeColors } from "../../../types/crq.types";
import { STATUS_OPTIONS } from "../../../types/constants";
import { useCancellationReasons } from "../../../hook/useCancellationReasons";
import { SectionLabel, StatusCard, TeamButton } from "./PlanInvDialog.styles";
import {
  AttributeUpdateGate,
  useAttributeUpdateGate,
} from "../../generic/dialog/AttributeUpdateGate";

interface Props {
  crq: any;
  crqNo: string | null;
  crqId: string | null;
  /** The CRQ, or the Plan & Inventory stage on its own, is cancelled - every
   * action in this form (Attribute Update, the outcome cards, the
   * cancellation block, Submit) is inert. The dialog still opens so what was
   * recorded stays readable. */
  isCancelled: boolean;
  /** Which level the cancellation came from, so the alert names the right one. */
  cancelledScope?: "crq" | "stage";
  /** Review outcome for this CRQ is already recorded (Done) - Pass/Failed/
   * Cancelled and Submit are disabled, same as isCancelled, but this gets
   * its own alert copy since the CRQ itself isn't cancelled. */
  isDone: boolean;
  /** Viewer lacks the Scheduler module's UPDATE permission — locks the form
   * exactly like isCancelled/isDone do, but without claiming the stage was
   * cancelled or already reviewed. */
  readOnly?: boolean;
  panelOpen: boolean;
  /** Mirrors `PlanInvDialog`'s own `open` flag - flipping it resets the
   * Attribute Update gate, so every fresh visit to this form has to visit
   * attributes again before an outcome is recorded silently. */
  open: boolean;
  colors: ThemeColors;
  setPanelOpen: (v: boolean) => void;
  onClose: () => void;
  /** Performs the actual review submission; may return { success } to control the dialog. */
  onExternalSubmit?: (data: any) => void | Promise<{ success: boolean } | void>;
}

export const FormPanel: React.FC<Props> = ({
  crq,
  crqNo,
  crqId,
  isCancelled,
  cancelledScope = "crq",
  isDone,
  readOnly = false,
  panelOpen,
  open,
  colors,
  setPanelOpen,
  onClose,
  onExternalSubmit,
}) => {
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const isLocked = isCancelled || isDone || readOnly;

  // "Attribute Update" lives here, directly above the outcome selector,
  // instead of on the cockpit's record-action row - same gate the six generic
  // stages use, so Plan & Inventory behaves identically. Picking an outcome
  // without opening it warns but never blocks. A Done review keeps it
  // clickable so attributes can still be reviewed/updated afterwards.
  const attributeGate = useAttributeUpdateGate({ crq, open, disabled: isCancelled || readOnly });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ReviewFormInputs>({
    defaultValues: { status: undefined, remark: "", cygnetStatus: undefined },
  });

  const statusValue = watch("status");
  const selectedReason = watch("cancellationReason");

  useEffect(() => {
    if (statusValue !== "canceled")
      setValue("cygnetStatus", undefined, { shouldValidate: false });
  }, [statusValue, setValue]);

  // Reason list + its reason -> owner mapping, from
  // sp_Get_Distinct_Cancellation_Reasons. Only fetched once the reviewer
  // picks Cancelled, since that is the only outcome that shows this block.
  const {
    reasons: cancellationReasons,
    ownerFor,
    isLoading: reasonsLoading,
    isError: reasonsFailed,
  } = useCancellationReasons({ skip: statusValue !== "canceled" });

  const rollbackOwner = useMemo(
    () => ownerFor(selectedReason),
    [ownerFor, selectedReason],
  );

  const handleFormSubmit = useCallback(
    async (data: ReviewFormInputs) => {
      if (!crqNo || !crqId || !data.status)
        return toast.error("CRQ details missing.");

      if (data.status === "canceled") {
        const missing: string[] = [];
        if (!data.field1) missing.push("Remedy Status");
        if (!data.cancellationReason) missing.push("Cancellation Reason");
        if (!data.cygnetStatus) missing.push("Send back to team");
        if (!data.field5) missing.push("Remedy Remark");
        if (missing.length) {
          return toast.error(`Required: ${missing.join(", ")}`, {
            position: "top-right",
          });
        }
      }

      const payload = {
        ...data,
        crqNo,
        crqId,
        planNumber: crq?.planNumber ?? "",
        field4: rollbackOwner,
      };

      setIsSubmitting(true);
      setSubmissionError(null);
      try {
        const result = await onExternalSubmit?.(payload);
        if (result && result.success === false) {
          setSubmissionError("Submission failed. Please try again.");
          return;
        }
        onClose();
      } catch (err: any) {
        setSubmissionError(
          err?.data?.message || err?.message || "Submission failed. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [crqNo, crqId, crq, rollbackOwner, onExternalSubmit, onClose],
  );

  const paletteColor = {
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
  };

  return (
    <Box
      component="aside"
      aria-label="Validation form"
      sx={{
        width: panelOpen ? { xs: "100%", md: "360px" } : "0px",
        minWidth: panelOpen ? { xs: "100%", md: "360px" } : "0px",
        transition:
          "width 280ms cubic-bezier(0.4,0,0.2,1), min-width 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
        opacity: panelOpen ? 1 : 0,
        borderRight: panelOpen ? `1px solid ${colors.border}` : "none",
        display: "flex",
        flexDirection: "column",
        bgcolor: colors.surface,
        flexShrink: 0,
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
          {/* Panel header strip */}
          <Box
            sx={{
              px: 1.75,
              py: 1,
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              gap: 0.85,
              flexShrink: 0,
              bgcolor: colors.isDark
                ? alpha("#fff", 0.02)
                : alpha(colors.accent, 0.025),
            }}
          >
            <TuneRoundedIcon
              sx={{ fontSize: 14, color: colors.accent }}
              aria-hidden="true"
            />
            <SectionLabel>Validation Action</SectionLabel>
          </Box>

          {/* Scrollable form area */}
          <DialogContent
            sx={{
              p: 0,
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              "&::-webkit-scrollbar": { width: 3 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: alpha(colors.textSecondary, 0.2),
                borderRadius: 4,
              },
            }}
          >
            <Box
              sx={{
                p: 1.75,
                display: "flex",
                flexDirection: "column",
                gap: 1.75,
              }}
            >
              {/* Cancelled CRQ alert */}
              <Collapse in={isCancelled} unmountOnExit>
                <Alert
                  severity="error"
                  icon={<WarningAmberRoundedIcon fontSize="small" />}
                  sx={{ borderRadius: 2, fontSize: 13 }}
                >
                  {cancelledScope === "crq" ? (
                    <>
                      This CRQ is <strong>Cancelled</strong>. Its outcome is
                      final, so there is nothing left to record here.
                    </>
                  ) : (
                    <>
                      This Plan &amp; Inventory stage is{" "}
                      <strong>Cancelled</strong>. Its outcome is final, so there
                      is nothing left to record here.
                    </>
                  )}
                </Alert>
              </Collapse>

              {/* Already-reviewed CRQ alert */}
              <Collapse in={isDone && !isCancelled} unmountOnExit>
                <Alert
                  severity="success"
                  icon={<CheckCircleOutlineIcon fontSize="small" />}
                  sx={{ borderRadius: 2, fontSize: 13 }}
                >
                  This CRQ's review is already <strong>Completed</strong>. The
                  recorded outcome is shown below, read-only.
                </Alert>
              </Collapse>

              {/* Submission error */}
              <Collapse in={Boolean(submissionError)} unmountOnExit>
                <Alert severity="error" sx={{ borderRadius: 2, fontSize: 13 }}>
                  {submissionError}
                </Alert>
              </Collapse>

              {!isCancelled && (
                <AttributeUpdateGate
                  visited={attributeGate.visited}
                  warned={attributeGate.warned}
                  disabled={attributeGate.isDisabled}
                  colors={colors}
                  onOpen={attributeGate.openDialog}
                />
              )}

              {/* ── Status selector ──────────────────────────────── */}
              {!isCancelled && (
                <Box>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{ mb: 1.25 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: colors.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      Select outcome
                    </Typography>
                    <Box
                      component="span"
                      sx={{ color: "error.main", fontSize: 13, lineHeight: 1 }}
                      aria-label="required"
                    >
                      *
                    </Box>
                  </Stack>

                  <Controller
                    name="status"
                    control={control}
                    rules={{ required: "Please select an outcome." }}
                    render={({ field }) => (
                      <Stack
                        spacing={1}
                        role="radiogroup"
                        aria-label="Validation outcome"
                      >
                        {STATUS_OPTIONS.map((opt) => {
                          const color = paletteColor[opt.palette];
                          const selected = field.value === opt.value;
                          const IconComp = opt.icon;
                          return (
                            <StatusCard
                              key={opt.value}
                              selected={selected}
                              accent={color}
                              isDisabled={isLocked}
                              onClick={() => {
                                if (isLocked) return;
                                field.onChange(opt.value);
                                attributeGate.warnIfPending();
                              }}
                              role="radio"
                              aria-checked={selected}
                              aria-disabled={isLocked}
                              tabIndex={isLocked ? -1 : 0}
                              onKeyDown={(e) => {
                                if (
                                  (e.key === "Enter" || e.key === " ") &&
                                  !isLocked
                                ) {
                                  e.preventDefault();
                                  field.onChange(opt.value);
                                  attributeGate.warnIfPending();
                                }
                              }}
                            >
                              <Box
                                sx={{
                                  width: 27,
                                  height: 27,
                                  borderRadius: 1.25,
                                  bgcolor: selected
                                    ? alpha(color, 0.14)
                                    : alpha(colors.textSecondary, 0.06),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  transition: "background-color 180ms ease",
                                }}
                              >
                                <IconComp
                                  sx={{
                                    fontSize: 15,
                                    color: selected
                                      ? color
                                      : colors.textSecondary,
                                  }}
                                  aria-hidden="true"
                                />
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0, pt: 0.1 }}>
                                <Typography
                                  sx={{
                                    fontSize: 13.5,
                                    fontWeight: selected ? 700 : 500,
                                    lineHeight: 1.25,
                                    color: selected ? color : colors.textPrimary,
                                    transition: "color 180ms ease",
                                  }}
                                >
                                  {opt.label}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: 11,
                                    color: selected
                                      ? alpha(color, 0.75)
                                      : colors.textSecondary,
                                    display: "block",
                                    lineHeight: 1.4,
                                    mt: 0.25,
                                    transition: "color 180ms ease",
                                  }}
                                >
                                  {opt.description}
                                </Typography>
                              </Box>
                              <Fade in={selected}>
                                <Box
                                  sx={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    bgcolor: color,
                                    flexShrink: 0,
                                    mt: 0.5,
                                  }}
                                  aria-hidden="true"
                                />
                              </Fade>
                            </StatusCard>
                          );
                        })}
                      </Stack>
                    )}
                  />

                  <Collapse in={Boolean(errors.status)} unmountOnExit>
                    <Alert
                      severity="warning"
                      sx={{ mt: 1.5, borderRadius: 1.5, py: 0.5, fontSize: 12 }}
                    >
                      {errors.status?.message}
                    </Alert>
                  </Collapse>
                </Box>
              )}

              {/* ── Cancellation details ──────────────────────────── */}
              <Collapse in={!isCancelled && statusValue === "canceled"} unmountOnExit>
                <Paper
                  variant="outlined"
                  aria-label="Cancellation details"
                  sx={{
                    borderRadius: 2.5,
                    borderColor: alpha(theme.palette.warning.main, 0.35),
                    overflow: "hidden",
                    bgcolor: alpha(theme.palette.warning.main, 0.025),
                  }}
                >
                  {/* Section strip */}
                  <Stack
                    direction="row"
                    spacing={0.875}
                    alignItems="center"
                    sx={{
                      px: 2,
                      py: 1.1,
                      borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                    }}
                  >
                    <CancelOutlinedIcon
                      sx={{ fontSize: 14, color: theme.palette.warning.dark }}
                      aria-hidden="true"
                    />
                    <SectionLabel sx={{ color: theme.palette.warning.dark }}>
                      Cancellation Details
                    </SectionLabel>
                  </Stack>

                  <Stack spacing={1.5} sx={{ p: 1.5 }}>
                    {/* Send back to */}
                    <Box>
                      <Stack
                        direction="row"
                        spacing={0.4}
                        alignItems="center"
                        sx={{ mb: 0.875 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            fontSize: 12,
                            color: colors.textSecondary,
                          }}
                        >
                          Send activity back to
                        </Typography>
                        <Box
                          component="span"
                          sx={{ color: "error.main", fontSize: 13 }}
                          aria-label="required"
                        >
                          *
                        </Box>
                      </Stack>

                      <Controller
                        name="cygnetStatus"
                        control={control}
                        rules={{ required: "Please select a team." }}
                        render={({ field }) => (
                          <Stack
                            direction="row"
                            spacing={1}
                            role="radiogroup"
                            aria-label="Send back to team"
                          >
                            {[
                              {
                                value: "REJECT_TO_PLANNING",
                                label: "Planning Team",
                              },
                              {
                                value: "REJECT_TO_OPERATIONS",
                                label: "Operations Team",
                              },
                            ].map((opt) => (
                              <TeamButton
                                key={opt.value}
                                selected={field.value === opt.value}
                                accent={colors.accent}
                                onClick={() =>
                                  !isLocked && field.onChange(opt.value)
                                }
                                role="radio"
                                aria-checked={field.value === opt.value}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    !isLocked && field.onChange(opt.value);
                                  }
                                }}
                              >
                                {opt.label}
                              </TeamButton>
                            ))}
                          </Stack>
                        )}
                      />
                    </Box>

                    {/* Remedy Status */}
                    <Controller
                      name="field1"
                      control={control}
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <FormControl
                          size="small"
                          fullWidth
                          disabled={isLocked}
                          error={Boolean(errors.field1)}
                        >
                          <InputLabel
                            id="remedy-status-label"
                            sx={{ fontSize: 13 }}
                          >
                            Remedy Status *
                          </InputLabel>
                          <Select
                            {...field}
                            labelId="remedy-status-label"
                            label="Remedy Status *"
                            sx={{ borderRadius: 1.5, fontSize: 13 }}
                          >
                            <MenuItem value="Cancelled" sx={{ fontSize: 13 }}>
                              Cancelled
                            </MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />

                    {/* Cancellation Reason */}
                    <Controller
                      name="cancellationReason"
                      control={control}
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <FormControl
                          size="small"
                          fullWidth
                          disabled={isLocked || reasonsLoading}
                          error={Boolean(errors.cancellationReason) || reasonsFailed}
                        >
                          <InputLabel
                            id="cancel-reason-label"
                            sx={{ fontSize: 13 }}
                          >
                            Cancellation Reason *
                          </InputLabel>
                          <Select
                            {...field}
                            labelId="cancel-reason-label"
                            label="Cancellation Reason *"
                            sx={{ borderRadius: 1.5, fontSize: 13 }}
                          >
                            {cancellationReasons.map((item) => (
                              <MenuItem
                                key={item.cancellationReason}
                                value={item.cancellationReason}
                                sx={{ fontSize: 13 }}
                              >
                                {item.cancellationReason}
                              </MenuItem>
                            ))}
                          </Select>
                          {(reasonsLoading || reasonsFailed) && (
                            <FormHelperText>
                              {reasonsLoading
                                ? "Loading…"
                                : "Could not load the list. Close and reopen to try again."}
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />

                    {/* Rollback owner (read-only) */}
                    <TextField
                      label="Cancellation Rejection Owner"
                      size="small"
                      fullWidth
                      value={rollbackOwner}
                      disabled={isLocked}
                      helperText="Auto-populated from selected reason"
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <PersonOutlineIcon
                            sx={{
                              color: colors.textSecondary,
                              mr: 0.75,
                              fontSize: 16,
                            }}
                            aria-hidden="true"
                          />
                        ),
                        sx: {
                          fontFamily:
                            '"JetBrains Mono","Fira Code","Courier New",monospace',
                          fontSize: 12.5,
                          borderRadius: 1.5,
                          bgcolor: alpha(colors.textSecondary, 0.03),
                        },
                      }}
                      InputLabelProps={{ sx: { fontSize: 13 } }}
                    />

                    {/* Remedy Remark (field5) */}
                    <Controller
                      name="field5"
                      control={control}
                      rules={{ required: "Remedy remark is required." }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          disabled={isLocked}
                          size="small"
                          fullWidth
                          label="Remedy Remark *"
                          placeholder="Enter cancellation remark…"
                          error={Boolean(errors.field5)}
                          helperText={errors.field5?.message}
                          InputProps={{
                            sx: { borderRadius: 1.5, fontSize: 13 },
                          }}
                          InputLabelProps={{ sx: { fontSize: 13 } }}
                        />
                      )}
                    />
                  </Stack>
                </Paper>
              </Collapse>
            </Box>
          </DialogContent>

          {/* ── Footer ────────────────────────────────────────────── */}
          <DialogActions
            sx={{
              px: 2,
              py: 1.25,
              borderTop: `1px solid ${colors.border}`,
              bgcolor: colors.isDark
                ? alpha("#fff", 0.015)
                : alpha(colors.accent, 0.015),
              gap: 1,
              flexShrink: 0,
            }}
          >
            <Button
              size="small"
              onClick={() => setPanelOpen(false)}
              startIcon={
                <ChevronLeftIcon sx={{ fontSize: "16px !important" }} />
              }
              aria-label="Hide validation panel"
              sx={{
                color: colors.textSecondary,
                fontSize: 12.5,
                fontWeight: 500,
                borderRadius: 1.5,
                textTransform: "none",
                px: 1.5,
                "&:hover": { bgcolor: alpha(colors.textSecondary, 0.07) },
              }}
            >
              Hide Panel
            </Button>

            <Box sx={{ flex: 1 }} />

            {!isCancelled && (
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !isDirty || isLocked}
                aria-label={
                  isSubmitting ? "Submitting validation" : "Submit validation"
                }
                aria-busy={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress
                      size={14}
                      color="inherit"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: "17px !important" }}
                      aria-hidden="true"
                    />
                  )
                }
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  px: 2.5,
                  py: 0.875,
                  bgcolor: colors.accent,
                  letterSpacing: "0.01em",
                  boxShadow: `0 2px 10px ${alpha(colors.accent, 0.4)}`,
                  "&:hover": {
                    bgcolor: colors.accent,
                    filter: "brightness(1.08)",
                    boxShadow: `0 4px 18px ${alpha(colors.accent, 0.5)}`,
                  },
                  "&:active": { filter: "brightness(0.96)" },
                  "&:disabled": {
                    boxShadow: "none",
                    bgcolor: alpha(colors.textSecondary, 0.12),
                  },
                  transition:
                    "filter 150ms ease, box-shadow 150ms ease, background-color 150ms ease",
                }}
              >
                {isSubmitting ? "Submitting…" : "Submit Validation"}
              </Button>
            )}
          </DialogActions>
        </Box>
      )}
    </Box>
  );
};
