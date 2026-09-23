import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Tab,
  Tabs,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LayersIcon from "@mui/icons-material/Layers";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import {
  useGetActivityPhaseViewQuery,
  useGetShiftDropdownsQuery,
  useUpdateActivityPhaseMutation,
  type PlanViewRow,
  type ActivityEntry,
  type ActivityPhaseView,
} from "../api/planApiSlice";
import AddActivityDialog from "./AddActivityDialog";
import TeamAssignmentSelect from "../../../../orgHierarchy/components/TeamAssignmentSelect";
import NumericField from "../../../../../components/common/NumericField";

// ─────────────────────────────── Constants ───────────────────────────────────
const LEVELS = ["L1", "L2", "L3", "L4"];

const STAGE_KEYS = [
  "review",
  "impactAnalysis",
  "scheduling",
  "mopCreation",
  "mopValidation",
  "execution",
] as const;

type StageKey = (typeof STAGE_KEYS)[number];

// ─── Phase metadata ───────────────────────────────────────────────────────────
const PHASE_META: Record<
  StageKey,
  { label: string; desc: string; icon: React.ReactNode }
> = {
  review: {
    label: "Review",
    desc: "CRQ review shift and time allocation",
    icon: <VisibilityIcon sx={{ fontSize: 16 }} />,
  },
  impactAnalysis: {
    label: "Impact analysis",
    desc: "Assess impact scope, level and time needed",
    icon: <WarningAmberIcon sx={{ fontSize: 16 }} />,
  },
  scheduling: {
    label: "Scheduling",
    desc: "Scheduling shift, level and duration window",
    icon: <CalendarMonthIcon sx={{ fontSize: 16 }} />,
  },
  mopCreation: {
    label: "MOP creation",
    desc: "MOP document creation shift and level",
    icon: <NoteAddIcon sx={{ fontSize: 16 }} />,
  },
  mopValidation: {
    label: "MOP validation",
    desc: "MOP validation shift, level and review time",
    icon: <FactCheckIcon sx={{ fontSize: 16 }} />,
  },
  execution: {
    label: "Execution",
    desc: "Full execution config — shift, margins and timing",
    icon: <PlayArrowIcon sx={{ fontSize: 16 }} />,
  },
};

// ─── Field definitions ────────────────────────────────────────────────────────
type FieldDef = {
  key: string;
  label: string;
  type?: "number";
  options?: string[];
  hint?: string;
};

const FIELD_MAP: Record<StageKey, FieldDef[]> = {
  review: [
    { key: "assignTeam", label: "Assign Team" },
    { key: "shift", label: "Shift" },
    {
      key: "minimumLevelRequirement",
      label: "Minimum level Requirement",
      options: LEVELS,
    },
    {
      key: "time",
      label: "Time required (min)",
      type: "number",
      hint: "Typical: 30–120 min",
    },
  ],
  impactAnalysis: [
    { key: "assignTeam", label: "Assign Team" },
    { key: "shift", label: "Shift" },
    {
      key: "minimumLevelRequirement",
      label: "Minimum level Requirement",
      options: LEVELS,
    },
    {
      key: "time",
      label: "Time required (min)",
      type: "number",
      hint: "Typical: 30–90 min",
    },
  ],
  scheduling: [
    { key: "assignTeam", label: "Assign Team" },
    { key: "shift", label: "Shift" },
    {
      key: "minimumLevelRequirement",
      label: "Minimum level Requirement",
      options: LEVELS,
    },
    {
      key: "time",
      label: "Duration (min)",
      type: "number",
      hint: "Typical: 60–180 min",
    },
  ],
  mopCreation: [
    { key: "assignTeam", label: "Assign Team" },
    { key: "shift", label: "Shift" },
    {
      key: "minimumLevelRequirement",
      label: "Minimum level Requirement",
      options: LEVELS,
    },
    {
      key: "time",
      label: "Time required (min)",
      type: "number",
      hint: "Typical: 45–120 min",
    },
  ],
  mopValidation: [
    { key: "assignTeam", label: "Assign Team" },
    { key: "shift", label: "Shift" },
    {
      key: "minimumLevelRequirement",
      label: "Minimum level Requirement",
      options: LEVELS,
    },
    {
      key: "time",
      label: "Time required (min)",
      type: "number",
      hint: "Typical: 30–60 min",
    },
  ],
  execution: [
    { key: "assignTeam", label: "Assign Team" },
    { key: "shift", label: "Shift" },
    {
      key: "minimumLevelRequirement",
      label: "Minimum level Requirement",
      options: LEVELS,
    },
    {
      key: "time",
      label: "Activity time (min)",
      type: "number",
      hint: "Total activity duration",
    },
    {
      key: "daysMargin",
      label: "Days margin",
      type: "number",
      hint: "Buffer days before execution",
    },
    {
      key: "reservationMargin",
      label: "Reservation margin",
      type: "number",
      hint: "Resource reservation buffer",
    },
    {
      key: "rollbackTime",
      label: "Rollback time (min)",
      type: "number",
      hint: "Time to rollback if needed",
    },
  ],
};

// ─── Transform one ActivityEntry into editable form state ─────────────────────
const transformEntry = (entry: ActivityEntry) => ({
  activityId: entry.activityId,
  activityName: entry.activityName,
  phases: {
    review: {
      assignTeam: entry.phases.review?.assignTeam ?? "",
      assignedSubDomainId: entry.phases.review?.assignedSubDomainId ?? undefined,
      activityPhaseConfigId: entry.phases.review?.activityPhaseConfigId ?? undefined,
      shift: entry.phases.review?.shift ?? "",
      minimumLevelRequirement:
        entry.phases.review?.minimumLevelRequirement ?? "",
      time: entry.phases.review?.time ?? "",
    },
    impactAnalysis: {
      assignTeam: entry.phases.impactAnalysis?.assignTeam ?? "",
      assignedSubDomainId:
        entry.phases.impactAnalysis?.assignedSubDomainId ?? undefined,
      activityPhaseConfigId:
        entry.phases.impactAnalysis?.activityPhaseConfigId ?? undefined,
      shift: entry.phases.impactAnalysis?.shift ?? "",
      minimumLevelRequirement:
        entry.phases.impactAnalysis?.minimumLevelRequirement ?? "",
      time: entry.phases.impactAnalysis?.time ?? "",
    },
    scheduling: {
      assignTeam: entry.phases.scheduling?.assignTeam ?? "",
      assignedSubDomainId: entry.phases.scheduling?.assignedSubDomainId ?? undefined,
      activityPhaseConfigId:
        entry.phases.scheduling?.activityPhaseConfigId ?? undefined,
      shift: entry.phases.scheduling?.shift ?? "",
      minimumLevelRequirement:
        entry.phases.scheduling?.minimumLevelRequirement ?? "",
      time: entry.phases.scheduling?.time ?? "",
    },
    mopCreation: {
      assignTeam: entry.phases.mopCreation?.assignTeam ?? "",
      assignedSubDomainId: entry.phases.mopCreation?.assignedSubDomainId ?? undefined,
      activityPhaseConfigId:
        entry.phases.mopCreation?.activityPhaseConfigId ?? undefined,
      shift: entry.phases.mopCreation?.shift ?? "",
      minimumLevelRequirement:
        entry.phases.mopCreation?.minimumLevelRequirement ?? "",
      time: entry.phases.mopCreation?.time ?? "",
    },
    mopValidation: {
      assignTeam: entry.phases.mopValidation?.assignTeam ?? "",
      assignedSubDomainId:
        entry.phases.mopValidation?.assignedSubDomainId ?? undefined,
      activityPhaseConfigId:
        entry.phases.mopValidation?.activityPhaseConfigId ?? undefined,
      shift: entry.phases.mopValidation?.shift ?? "",
      minimumLevelRequirement:
        entry.phases.mopValidation?.minimumLevelRequirement ?? "",
      time: entry.phases.mopValidation?.time ?? "",
    },
    execution: {
      assignTeam: entry.execution?.assignTeam ?? "",
      assignedSubDomainId: entry.execution?.assignedSubDomainId ?? undefined,
      activityPhaseConfigId: entry.execution?.activityPhaseConfigId ?? undefined,
      shift: entry.execution?.shift ?? "",
      minimumLevelRequirement: entry.execution?.minimumLevelRequirement ?? "",
      time: entry.execution?.time ?? "",
      daysMargin: entry.execution?.daysMargin ?? "",
      reservationMargin: entry.execution?.reservationMargin ?? "",
      rollbackTime: entry.execution?.rollbackTime ?? "",
    },
  },
});

type TransformedActivity = ReturnType<typeof transformEntry>;

// ─── Per-activity configs shape ───────────────────────────────────────────────
type AllConfigs = Record<string, Record<StageKey, Record<string, any>>>;

function buildInitialConfigs(activities: TransformedActivity[]): AllConfigs {
  const result: AllConfigs = {};
  for (const a of activities) {
    result[a.activityId] = a.phases as Record<StageKey, Record<string, any>>;
  }
  return result;
}

// ─────────────────────────────── PhaseForm ───────────────────────────────────
const PhaseForm = ({
  stageKey,
  config,
  onChange,
  shifts = [],
  errors,
}: {
  stageKey: StageKey;
  config: Record<string, any>;
  onChange: (key: string, val: any) => void;
  shifts?: string[];
  errors?: Set<string>;
}) => {
  const meta = PHASE_META[stageKey];
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          p: 1.5,
          mb: 2.5,
          bgcolor: "action.hover",
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            color: "primary.main",
            mt: 0.2,
            display: "flex",
            alignItems: "center",
          }}
        >
          {meta.icon}
        </Box>
        <Box>
          <Typography fontWeight={500} fontSize={14}>
            {meta.label}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {meta.desc}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 2,
        }}
      >
        {FIELD_MAP[stageKey].map((f) => {
          if (f.key === "assignTeam") {
            return (
              <Box
                key={f.key}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  gridColumn: "1 / -1",
                }}
              >
                <Typography fontSize={12} color="text.secondary">
                  {f.label}
                </Typography>
                <TeamAssignmentSelect
                  value={config.assignedSubDomainId}
                  onChange={(subDomainId) =>
                    onChange("assignedSubDomainId", subDomainId)
                  }
                />
                {errors?.has("assignTeam") && (
                  <Typography fontSize={11} color="error.main" sx={{ pl: 0.5 }}>
                    Team assignment is required
                  </Typography>
                )}
              </Box>
            );
          }

          if (f.type === "number") {
            return (
              <Box
                key={f.key}
                sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
              >
                <NumericField
                  fullWidth
                  size="small"
                  label={f.label}
                  value={config[f.key]}
                  error={errors?.has(f.key)}
                  onChange={(n) => onChange(f.key, n)}
                />
                {f.hint && (
                  <Typography fontSize={11} color="text.disabled" sx={{ pl: 0.5 }}>
                    {f.hint}
                  </Typography>
                )}
              </Box>
            );
          }

          // The saved shift (e.g. "G", "LG,N") may not match any dropdown
          // entry; keep it as an option so the select still displays it.
          const currentShift = f.key === "shift" ? String(config.shift ?? "").trim() : "";
          const optionsList: string[] | undefined =
            f.options ??
            (f.key === "shift"
              ? currentShift && !shifts.includes(currentShift)
                ? [currentShift, ...shifts]
                : shifts
              : undefined);
          return (
          <Box
            key={f.key}
            sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            <TextField
              select={!!optionsList}
              fullWidth
              size="small"
              label={f.label}
              value={f.key === "shift" ? currentShift : (config[f.key] ?? "")}
              error={errors?.has(f.key)}
              onChange={(e) => onChange(f.key, e.target.value)}
            >
              {optionsList?.map((o) => (
                <MenuItem key={o} value={o}>
                  {o}
                </MenuItem>
              ))}
            </TextField>
            {f.hint && (
              <Typography fontSize={11} color="text.disabled" sx={{ pl: 0.5 }}>
                {f.hint}
              </Typography>
            )}
          </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// ─────────────────────────── BasicInfoBar ────────────────────────────────────
const BasicInfoBar = ({ info }: { info: ActivityPhaseView["basicInfo"] }) => (
  <Box
    sx={{
      px: 2.5,
      py: 0.75,
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 2,
      bgcolor: "action.hover",
      borderBottom: "1px solid",
      borderColor: "divider",
    }}
  >
    {[
      { label: "Domain", val: info.domain },
      { label: "Layer", val: info.layer },
      { label: "CHM", val: `${info.chmDomain} › ${info.chmSubDomain}` },
      { label: "Vendor", val: info.vendorOem },
      { label: "Impact", val: info.changeImpact },
    ].map(({ label, val }) => (
      <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography fontSize={11} color="text.disabled">
          {label}:
        </Typography>
        <Typography fontSize={11} fontWeight={500} color="text.secondary">
          {val}
        </Typography>
      </Box>
    ))}
  </Box>
);

// ─────────────────────────────── Main Dialog ─────────────────────────────────
interface Props {
  open: boolean;
  plan: PlanViewRow | null;
  onClose: () => void;
}

export const PlanDetailDialog: React.FC<Props> = ({ open, plan, onClose }) => {
  // `currentData` (not `data`) so that while a newly clicked plan is loading
  // we don't render - and seed the form from - the previous plan's response.
  const { currentData: data, isFetching } = useGetActivityPhaseViewQuery(
    { planId: plan?.planId ?? 0 },
    { skip: !plan },
  );
  const isLoading = isFetching && !data;

  const { data: shiftData } = useGetShiftDropdownsQuery();
  const shifts = useMemo(
    () =>
      Array.from(
        new Set((shiftData ?? []).map((s) => (s.shiftRange ?? "").trim()).filter(Boolean)),
      ),
    [shiftData],
  );

  const [updateActivityPhase, { isLoading: isSaving }] = useUpdateActivityPhaseMutation();

  const activities = useMemo<TransformedActivity[]>(
    () => (data?.activities ?? []).map(transformEntry),
    [data],
  );

  const [activityIdx, setActivityIdx] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [savedPhase, setSavedPhase] = useState<StageKey | null>(null);
  const [allConfigs, setAllConfigs] = useState<AllConfigs>({});
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saveErrors, setSaveErrors] = useState<Set<string>>(new Set());

  // Re-seed form state from the server the first time a given plan's
  // activities arrive, and again whenever the dialog is reopened - but not on
  // every background refetch (e.g. the one a successful "Save phase" triggers
  // via invalidatesTags), which would otherwise reset the user back to
  // activity/phase 0 mid-edit.
  const initializedPlanRef = useRef<number | null>(null);
  useEffect(() => {
    if (!open) {
      initializedPlanRef.current = null;
      return;
    }
    if (activities.length > 0 && initializedPlanRef.current !== (plan?.planId ?? null)) {
      setAllConfigs(buildInitialConfigs(activities));
      setActivityIdx(0);
      setPhaseIdx(0);
      setDirty(new Set());
      setSaveErrors(new Set());
      initializedPlanRef.current = plan?.planId ?? null;
    }
  }, [activities, open, plan?.planId]);

  const currentActivity = activities[activityIdx] ?? null;
  const activeKey = STAGE_KEYS[phaseIdx];
  const dirtyKey = currentActivity ? `${currentActivity.activityId}:${activeKey}` : "";
  const isCurrentDirty = dirty.has(dirtyKey);

  const currentConfigs: Record<StageKey, Record<string, any>> = useMemo(
    () =>
      currentActivity
        ? (allConfigs[currentActivity.activityId] ??
          (Object.fromEntries(STAGE_KEYS.map((k) => [k, {}])) as any))
        : (Object.fromEntries(STAGE_KEYS.map((k) => [k, {}])) as any),
    [allConfigs, currentActivity],
  );

  const isFilled = useCallback(
    (key: StageKey) =>
      Object.values(currentConfigs[key] ?? {}).some(
        (v) => v !== "" && v !== null && v !== undefined,
      ),
    [currentConfigs],
  );

  const filledCount = STAGE_KEYS.filter(isFilled).length;
  const progress = Math.round((filledCount / STAGE_KEYS.length) * 100);

  const handleChange = (field: string, value: any) => {
    if (!currentActivity) return;
    setAllConfigs((prev) => ({
      ...prev,
      [currentActivity.activityId]: {
        ...prev[currentActivity.activityId],
        [activeKey]: {
          ...(prev[currentActivity.activityId]?.[activeKey] ?? {}),
          [field]: value,
        },
      },
    }));
    setDirty((prev) => new Set(prev).add(dirtyKey));
    setSaveErrors((prev) => {
      const errorKey = field === "assignedSubDomainId" ? "assignTeam" : field;
      if (!prev.has(errorKey)) return prev;
      const next = new Set(prev);
      next.delete(errorKey);
      return next;
    });
  };

  const confirmDiscardIfDirty = () => {
    if (!isCurrentDirty) return true;
    return window.confirm(
      "You have unsaved changes on this phase. Discard them?",
    );
  };

  const goToPhase = (i: number) => {
    if (!confirmDiscardIfDirty()) return;
    setSaveErrors(new Set());
    setPhaseIdx(i);
  };

  const handleSave = async () => {
    if (!currentActivity) return;
    const cfg = currentConfigs[activeKey];

    if (!cfg.activityPhaseConfigId) {
      toast.error("This phase isn't available to edit yet.");
      return;
    }

    const errors = new Set<string>();
    if (!cfg.shift) errors.add("shift");
    if (!cfg.minimumLevelRequirement) errors.add("minimumLevelRequirement");
    if (cfg.time === "" || cfg.time === null || cfg.time === undefined) errors.add("time");
    if (!cfg.assignedSubDomainId) errors.add("assignTeam");
    if (activeKey === "execution") {
      if (cfg.daysMargin === "" || cfg.daysMargin === null || cfg.daysMargin === undefined)
        errors.add("daysMargin");
      if (
        cfg.reservationMargin === "" ||
        cfg.reservationMargin === null ||
        cfg.reservationMargin === undefined
      )
        errors.add("reservationMargin");
      if (cfg.rollbackTime === "" || cfg.rollbackTime === null || cfg.rollbackTime === undefined)
        errors.add("rollbackTime");
    }

    if (errors.size > 0) {
      setSaveErrors(errors);
      toast.error("Please fill in the required fields highlighted below.");
      return;
    }

    try {
      const res = await updateActivityPhase({
        activityPhaseConfigId: Number(cfg.activityPhaseConfigId),
        shift: cfg.shift,
        minimumLevelRequirement: cfg.minimumLevelRequirement,
        requiredTimeMinutes: Number(cfg.time),
        assignedToTeam: Number(cfg.assignedSubDomainId),
        daysMargin: activeKey === "execution" ? Number(cfg.daysMargin) : null,
        reservationMargin:
          activeKey === "execution" ? Number(cfg.reservationMargin) : null,
        rollbackTime: activeKey === "execution" ? Number(cfg.rollbackTime) : null,
      }).unwrap();

      toast.success(res?.message || "Phase saved successfully");
      setSaveErrors(new Set());
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(dirtyKey);
        return next;
      });
      setSavedPhase(activeKey);
      setTimeout(() => setSavedPhase(null), 1800);
    } catch (err) {
      console.error(err);
      const msg =
        (err as any)?.data?.message || (err as any)?.message || "Failed to save phase";
      toast.error(msg);
    }
  };

  const handleActivityChange = (_: React.SyntheticEvent, idx: number) => {
    if (!confirmDiscardIfDirty()) return;
    setActivityIdx(idx);
    setPhaseIdx(0);
    setSavedPhase(null);
    setSaveErrors(new Set());
  };

  const handleCloseDialog = () => {
    if (!confirmDiscardIfDirty()) return;
    onClose();
  };

  if (!plan) return null;

  const hasActivities = activities.length > 0;

  return (
    <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="lg">
      {/* ── Header ── */}
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography fontWeight={500} fontSize={16}>
            Plan #{plan.planId}
          </Typography>
          <Chip
            label={plan.planType}
            size="small"
            color="info"
            variant="outlined"
            sx={{ height: 22, fontSize: 11, fontWeight: 500 }}
          />

          <Chip
            clickable
            onClick={() => setOpenAddDialog(true)}
            icon={<AddIcon />}
            label="Add New Activity"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
        <IconButton size="small" onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Basic info strip ── */}
      {data?.basicInfo && <BasicInfoBar info={data.basicInfo} />}

      {/* ── Activity tabs ── */}
      {hasActivities && (
        <Box
          sx={{
            px: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <LayersIcon sx={{ fontSize: 14, color: "text.disabled", mr: 0.5 }} />
          <Tabs
            value={activityIdx}
            onChange={handleActivityChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                minHeight: 40,
                fontSize: 12,
                py: 0,
                textTransform: "none",
              },
            }}
          >
            {activities.map((a) => {
              const actConfigs =
                allConfigs[a.activityId] ??
                Object.fromEntries(STAGE_KEYS.map((k) => [k, {}]));
              const filled = STAGE_KEYS.filter((k) =>
                Object.values(actConfigs[k] ?? {}).some(
                  (v) => v !== "" && v !== null && v !== undefined,
                ),
              ).length;
              return (
                <Tab
                  key={a.activityId}
                  label={
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      <span>{a.activityName}</span>
                      <Chip
                        label={`${filled}/${STAGE_KEYS.length}`}
                        size="small"
                        variant={
                          filled === STAGE_KEYS.length ? "filled" : "outlined"
                        }
                        color={
                          filled === STAGE_KEYS.length ? "success" : "default"
                        }
                        sx={{
                          height: 16,
                          fontSize: 10,
                          "& .MuiChip-label": { px: 0.75 },
                        }}
                      />
                    </Box>
                  }
                />
              );
            })}
          </Tabs>
        </Box>
      )}

      <DialogContent sx={{ p: 0, display: "flex", m: 2 }}>
        {isLoading ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : hasActivities && currentActivity ? (
          <>
            {/* ── Sidebar ── */}
            <Box
              sx={{
                width: 200,
                flexShrink: 0,
                borderRight: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                py: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "text.disabled",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  px: 2,
                  pb: 1,
                }}
              >
                Phases
              </Typography>

              {STAGE_KEYS.map((key, i) => {
                const meta = PHASE_META[key];
                const filled = isFilled(key);
                const isActive = i === phaseIdx;
                return (
                  <Tooltip key={key} title={meta.desc} placement="right" arrow>
                    <Box
                      onClick={() => goToPhase(i)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        px: 2,
                        py: 1.1,
                        cursor: "pointer",
                        borderLeft: "3px solid",
                        borderColor: isActive ? "primary.main" : "transparent",
                        bgcolor: isActive ? "primary.50" : "transparent",
                        "&:hover": {
                          bgcolor: isActive ? "primary.50" : "action.hover",
                        },
                        transition: "all 0.12s",
                      }}
                    >
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          bgcolor: isActive ? "primary.main" : "action.hover",
                          color: isActive
                            ? "primary.contrastText"
                            : "text.secondary",
                          transition: "all 0.12s",
                        }}
                      >
                        {meta.icon}
                      </Box>
                      <Typography
                        fontSize={13}
                        fontWeight={isActive ? 500 : 400}
                        color={isActive ? "primary.dark" : "text.secondary"}
                        sx={{ flex: 1 }}
                      >
                        {meta.label}
                      </Typography>
                      {filled && (
                        <CheckCircleIcon
                          sx={{
                            fontSize: 15,
                            color: "success.main",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                );
              })}

              {/* Progress */}
              <Box sx={{ mt: "auto", px: 2, pt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography fontSize={11} color="text.disabled">
                    Progress
                  </Typography>
                  <Typography
                    fontSize={11}
                    fontWeight={500}
                    color="primary.main"
                  >
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 4, borderRadius: 99 }}
                />
              </Box>
            </Box>

            {/* ── Form panel ── */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>
                <PhaseForm
                  stageKey={activeKey}
                  config={currentConfigs[activeKey]}
                  onChange={handleChange}
                  shifts={shifts}
                  errors={saveErrors}
                />
              </Box>

              {/* Prev / Next */}
              <Box
                sx={{
                  px: 3,
                  py: 1.5,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Button
                  size="small"
                  disabled={phaseIdx === 0}
                  startIcon={<ChevronLeftIcon />}
                  onClick={() => goToPhase(phaseIdx - 1)}
                  sx={{ fontSize: 12, color: "primary.main" }}
                >
                  {phaseIdx > 0
                    ? PHASE_META[STAGE_KEYS[phaseIdx - 1]].label
                    : "Previous"}
                </Button>
                <Button
                  size="small"
                  disabled={phaseIdx === STAGE_KEYS.length - 1}
                  endIcon={<ChevronRightIcon />}
                  onClick={() => goToPhase(phaseIdx + 1)}
                  sx={{ fontSize: 12, color: "primary.main" }}
                >
                  {phaseIdx < STAGE_KEYS.length - 1
                    ? PHASE_META[STAGE_KEYS[phaseIdx + 1]].label
                    : "Next"}
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          !isLoading && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography fontSize={13} color="text.disabled">
                No activity data available
              </Typography>
            </Box>
          )
        )}
      </DialogContent>

      {/* ── Footer ── */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "action.hover",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography fontSize={12} color="text.secondary">
            {currentActivity
              ? `${currentActivity.activityName} › ${PHASE_META[activeKey].label}`
              : ""}
          </Typography>
          {isCurrentDirty && (
            <Chip
              label="Unsaved changes"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ height: 18, fontSize: 10 }}
            />
          )}
        </Box>

        <Box sx={{ display: "gap", gap: 1 }}>
          <Button size="small" onClick={handleCloseDialog} sx={{ fontSize: 13 }}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            disableElevation
            disabled={!currentActivity || isSaving}
            startIcon={
              isSaving ? (
                <CircularProgress size={16} color="inherit" />
              ) : savedPhase === activeKey ? (
                <CheckCircleIcon sx={{ fontSize: 16 }} />
              ) : (
                <SaveIcon sx={{ fontSize: 16 }} />
              )
            }
            onClick={handleSave}
            color={savedPhase === activeKey ? "success" : "primary"}
            sx={{ fontSize: 13, px: 2.5, borderRadius: 2 }}
          >
            {isSaving ? "Saving…" : savedPhase === activeKey ? "Saved!" : "Save phase"}
          </Button>
        </Box>
      </Box>
      {plan && (
        <AddActivityDialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          plan={plan}
          existingActivityNames={activities.map((a) => a.activityName)}
        />
      )}
    </Dialog>
  );
};
