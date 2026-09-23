import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Add,
  Close,
  Save,
  Schedule,
} from "@mui/icons-material";
import { toast } from "react-toastify";

import {
  useAddActivityMutation,
  useGetShiftDropdownsQuery,
  type PlanViewRow,
} from "../api/planApiSlice";
import ActivityPhaseSection from "./ActivityPhaseSection";
import { parseShift, shiftColor } from "../utils/shiftFormat";

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_PHASE_SLIM = {
  shift: "",
  minimumLevelRequirement: "",
  requiredTimeMinutes: 0,
  assignedToTeam: 0,
};

const INITIAL_PHASE_FULL = {
  ...INITIAL_PHASE_SLIM,
  daysMargin: 0,
  reservationMargin: 0,
  rollbackTime: 0,
};

const PHASES = [
  { key: "crqReview",      label: "CRQ Review",       variant: "slim" },
  { key: "impactAnalysis",  label: "Impact Analysis",  variant: "slim" },
  { key: "scheduling",      label: "Scheduling",       variant: "slim" },
  { key: "mopCreate",       label: "MOP Create",       variant: "slim" },
  { key: "mopValidate",     label: "MOP Validate",     variant: "slim" },
  { key: "crqExecution",    label: "CRQ Execution",    variant: "full" },
] as const;

type PhaseKey = (typeof PHASES)[number]["key"];

const INITIAL_FORM = {
  activityName: "",
  crqReview:      { ...INITIAL_PHASE_SLIM },
  impactAnalysis:  { ...INITIAL_PHASE_SLIM },
  scheduling:      { ...INITIAL_PHASE_SLIM },
  mopCreate:       { ...INITIAL_PHASE_SLIM },
  mopValidate:     { ...INITIAL_PHASE_SLIM },
  crqExecution:    { ...INITIAL_PHASE_FULL },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  plan: PlanViewRow;
  onClose: () => void;
  /** Existing activity names on this plan, for a friendly duplicate-name check. */
  existingActivityNames?: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddActivityDialog: React.FC<Props> = ({
  open,
  plan,
  onClose,
  existingActivityNames = [],
}) => {
  const theme = useTheme();
  const [addActivity, { isLoading }] = useAddActivityMutation();

  // Live shift options, shared with the Edit-phase dialog's identical dedup
  // pattern (PlanDetailDialog.tsx) — RTK Query dedupes this against that
  // dialog's own subscription, so opening both never double-fetches.
  const { data: shiftData, isFetching: shiftsLoading } = useGetShiftDropdownsQuery();
  const shiftOptions = useMemo(
    () =>
      Array.from(
        new Set((shiftData ?? []).map((s) => (s.shiftRange ?? "").trim()).filter(Boolean)),
      ),
    [shiftData],
  );

  const [form, setForm] = useState(INITIAL_FORM);

  const [activityNameError, setActivityNameError] = useState<string | null>(null);
  const [phaseShiftErrors, setPhaseShiftErrors] = useState<Set<PhaseKey>>(new Set());
  const [phaseTeamErrors, setPhaseTeamErrors] = useState<Set<PhaseKey>>(new Set());

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Stable across renders (functional setState) so memoized phase sections
   *  don't re-render just because a sibling phase or the activity name changed. */
  const updatePhase = useCallback((phase: PhaseKey, field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: value,
      },
    }));
    if (field === "shift" && value) {
      setPhaseShiftErrors((prev) => {
        if (!prev.has(phase)) return prev;
        const next = new Set(prev);
        next.delete(phase);
        return next;
      });
    }
    if (field === "assignedToTeam" && value) {
      setPhaseTeamErrors((prev) => {
        if (!prev.has(phase)) return prev;
        const next = new Set(prev);
        next.delete(phase);
        return next;
      });
    }
  }, []);

  // One stable onChange callback per phase, created once, so each
  // ActivityPhaseSection's props stay referentially identical across
  // renders that don't touch that phase - this is what lets React.memo
  // actually skip re-rendering the other 5 phases while one is being edited.
  const phaseOnChangeHandlers = useMemo(
    () =>
      Object.fromEntries(
        PHASES.map(({ key }) => [
          key,
          (field: string, value: any) => updatePhase(key, field, value),
        ]),
      ) as Record<PhaseKey, (field: string, value: any) => void>,
    [updatePhase],
  );

  /** Matches ActivityInsertRequestDTO's @NotBlank/@NotNull on every phase's shift + team + activityName */
  const validateForm = (): boolean => {
    const missingShifts = new Set(
      PHASES.filter(({ key }) => !form[key].shift).map(({ key }) => key),
    );
    const missingTeams = new Set(
      PHASES.filter(({ key }) => !form[key].assignedToTeam).map(({ key }) => key),
    );
    const trimmedName = form.activityName.trim();
    const isDuplicate = existingActivityNames.some(
      (name) => name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    let nameError: string | null = null;
    if (!trimmedName) nameError = "Activity Name is required";
    else if (isDuplicate) nameError = "An activity with this name already exists on this plan";

    setActivityNameError(nameError);
    setPhaseShiftErrors(missingShifts);
    setPhaseTeamErrors(missingTeams);

    return !nameError && missingShifts.size === 0 && missingTeams.size === 0;
  };

  const [appliedShift, setAppliedShift] = useState<string | null>(null);

  const applyShiftToAll = useCallback((shift: string) => {
    setForm((prev) => {
      const updated = { ...prev };
      PHASES.forEach(({ key }) => {
        updated[key] = { ...prev[key], shift };
      });
      return updated;
    });
    setAppliedShift(shift);
    setPhaseShiftErrors(new Set());
  }, []);

  // ── Build API payload with prefixed param names ────────────────────────────

  const buildPayload = () => {
    const payload: Record<string, any> = {
      planId: plan.planId,
      activityName: form.activityName.trim(),
    };

    PHASES.forEach(({ key, variant }) => {
      const phase = form[key];

      // 4 common fields — always sent
      payload[`${key}Shift`]                   = phase.shift;
      payload[`${key}MinimumLevelRequirement`] = phase.minimumLevelRequirement;
      payload[`${key}RequiredTimeMinutes`]      = phase.requiredTimeMinutes;
      payload[`${key}AssignedToTeam`]           = phase.assignedToTeam;

      // 3 extra fields — only for crqExecution
      if (variant === "full") {
        const full = phase as typeof INITIAL_PHASE_FULL;
        payload[`${key}DaysMargin`]        = full.daysMargin;
        payload[`${key}ReservationMargin`] = full.reservationMargin;
        payload[`${key}RollbackTime`]      = full.rollbackTime;
      }
    });

    return payload;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill in the required fields highlighted below.");
      return;
    }
    try {
      await addActivity(buildPayload()).unwrap();
      toast.success("Activity added successfully!");
      setForm(INITIAL_FORM);
      setActivityNameError(null);
      setPhaseShiftErrors(new Set());
      setPhaseTeamErrors(new Set());
      setAppliedShift(null);
      onClose();
    } catch (err) {
      console.error(err);
      const msg =
        (err as any)?.data?.message || (err as any)?.message || "Failed to add activity. Please try again.";
      toast.error(msg);
    }
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setActivityNameError(null);
    setPhaseShiftErrors(new Set());
    setPhaseTeamErrors(new Set());
    setAppliedShift(null);
    onClose();
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const configuredCount = PHASES.filter(
    ({ key }) =>
      form[key].shift !== "" || form[key].minimumLevelRequirement !== "",
  ).length;
  const progress = Math.round((configuredCount / PHASES.length) * 100);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle
        sx={{
          display: "flex", alignItems: "center", gap: 1.5,
          py: 2, px: 3, borderBottom: "1px solid", borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: "primary.main", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "primary.contrastText", flexShrink: 0,
          }}
        >
          <Add />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Add New Activity
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Plan #{plan.planId} · Configure all six phases for this activity
          </Typography>
        </Box>
        <Chip
          label={`${configuredCount}/${PHASES.length} configured`}
          size="small"
          color={configuredCount === PHASES.length ? "success" : "default"}
          variant="outlined"
        />
        <IconButton size="small" onClick={handleCancel} sx={{ ml: 1 }} disabled={isLoading}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 3 }}
      />

      <DialogContent sx={{ p: 2.5 }}>
        <Stack spacing={2} sx={{ pt: 1.5 }}>
          <TextField
            fullWidth
            label="Activity Name"
            placeholder="e.g. Network Maintenance Upgrade"
            value={form.activityName}
            onChange={(e) => {
              const next = e.target.value;
              setForm((prev) => ({ ...prev, activityName: next }));
              if (activityNameError && next.trim()) setActivityNameError(null);
            }}
            error={!!activityNameError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Add color="action" />
                </InputAdornment>
              ),
            }}
            helperText={
              activityNameError ??
              "Enter a descriptive name that identifies this activity"
            }
          />

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.4 : 0.18),
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.09)}, ${alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.1 : 0.05)})`,
              transition: "background-color 0.2s ease",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: shiftOptions.length ? 1.25 : 0 }}>
              <Box
                sx={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: "primary.main", color: "primary.contrastText",
                }}
              >
                <Schedule sx={{ fontSize: 14 }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
                  Quick Apply
                </Typography>
                <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                  Tap a shift to set it across all 6 phases at once
                </Typography>
              </Box>
            </Box>

            {shiftsLoading ? (
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rounded" width={68} height={44} sx={{ borderRadius: 2.5 }} />
                ))}
              </Stack>
            ) : shiftOptions.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                No shifts configured yet
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {shiftOptions.map((s) => {
                  const { code, range } = parseShift(s);
                  const accent = shiftColor(range, theme);
                  const selected = appliedShift === s;
                  return (
                    <Tooltip key={s} title={range ? `${code} · ${range}` : code} arrow disableInteractive>
                      <Box
                        component="button"
                        type="button"
                        onClick={() => applyShiftToAll(s)}
                        sx={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center",
                          minWidth: 66, px: 1.25, py: 0.75, gap: 0.15,
                          borderRadius: 2.5, cursor: "pointer",
                          border: "1.5px solid",
                          borderColor: selected ? accent : alpha(accent, 0.35),
                          bgcolor: selected ? accent : alpha(accent, 0.08),
                          boxShadow: selected ? `0 3px 10px ${alpha(accent, 0.4)}` : "none",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            borderColor: accent,
                            bgcolor: selected ? accent : alpha(accent, 0.16),
                            boxShadow: `0 3px 8px ${alpha(accent, 0.3)}`,
                          },
                          "&:active": { transform: "translateY(0)" },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 13, fontWeight: 800, lineHeight: 1.2,
                            color: selected ? "#fff" : accent,
                          }}
                        >
                          {code}
                        </Typography>
                        {range && (
                          <Typography
                            sx={{
                              fontSize: 9.5, whiteSpace: "nowrap", lineHeight: 1.2,
                              color: selected ? "#fff" : "text.secondary",
                              opacity: selected ? 0.9 : 1,
                            }}
                          >
                            {range}
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            )}
          </Box>

          <Divider>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              PHASE CONFIGURATION
            </Typography>
          </Divider>

          {PHASES.map(({ key, label, variant }, idx) => (
            <ActivityPhaseSection
              key={key}
              title={label}
              variant={variant}
              value={form[key]}
              onChange={phaseOnChangeHandlers[key]}
              phaseIndex={idx}
              shiftError={phaseShiftErrors.has(key)}
              teamError={phaseTeamErrors.has(key)}
              shiftOptions={shiftOptions}
              shiftsLoading={shiftsLoading}
            />
          ))}
        </Stack>
      </DialogContent>

      <Box
        sx={{
          p: 2.5, px: 3, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          borderTop: "1px solid", borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {configuredCount === 0
            ? "No phases configured yet"
            : `${configuredCount} of ${PHASES.length} phases configured`}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" color="inherit" onClick={handleCancel}
            startIcon={<Close />} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={isLoading || !form.activityName.trim()}
            startIcon={<Save />} sx={{ minWidth: 140 }}>
            {isLoading ? "Saving…" : "Save Activity"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default AddActivityDialog;
