import React, { memo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AccessTime,
  CalendarMonth,
  CheckCircle,
  ExpandMore,
  QueryBuilder,
  Schedule,
  SignalCellularAlt,
  Update,
} from "@mui/icons-material";
import TeamAssignmentSelect from "../../../../orgHierarchy/components/TeamAssignmentSelect";
import NumericField from "../../../../../components/common/NumericField";
import { parseShift, shiftColor } from "../utils/shiftFormat";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  title: string;
  variant: "slim" | "full";
  value: Record<string, any>;
  onChange: (field: string, value: any) => void;
  phaseIndex: number;
  shiftError?: boolean;
  teamError?: boolean;
  /** Live shift names from the DB (GET /monthlyrosterview/shiftdropdowns). */
  shiftOptions: string[];
  shiftsLoading?: boolean;
}

// ─── Accent colors per phase ─────────────────────────────────────────────────

const ACCENT_COLORS = [
  "#5C6BC0", "#26A69A", "#FFA726", "#AB47BC", "#42A5F5", "#EF5350",
];

/** Matches PlanDetailDialog's LEVELS so Add and Edit offer the same range. */
const LEVELS = ["L1", "L2", "L3", "L4"];

const FIELD_GRID_SX = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
  gap: 1.5,
};

// ─── Component ────────────────────────────────────────────────────────────────

const ActivityPhaseSection: React.FC<Props> = ({
  title,
  variant,
  value,
  onChange,
  phaseIndex,
  shiftError,
  teamError,
  shiftOptions,
  shiftsLoading,
}) => {
  const theme = useTheme();
  const [manuallyExpanded, setManuallyExpanded] = useState(phaseIndex === 0);
  const accent = ACCENT_COLORS[phaseIndex % ACCENT_COLORS.length];
  const isConfigured = !!value.shift && !!value.minimumLevelRequirement;

  // Auto-expand so a validation error is actually visible, not hidden in a
  // collapsed accordion, without needing an effect.
  const expanded = manuallyExpanded || !!shiftError || !!teamError;

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setManuallyExpanded((prev) => !prev)}
      disableGutters
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: shiftError || teamError ? "error.main" : "divider",
        borderRadius: "12px !important",
        "&::before": { display: "none" },
        overflow: "hidden",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          bgcolor: "grey.50",
          px: 2,
          minHeight: 50,
          "&.Mui-expanded": { minHeight: 50 },
          "& .MuiAccordionSummary-content": { my: 1 },
          transition: "background-color 0.15s ease",
          "& .MuiAccordionSummary-expandIconWrapper": {
            transition: "transform 0.2s ease",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              flexShrink: 0,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              bgcolor: shiftError || teamError ? "error.main" : accent,
              transition: "background-color 0.2s ease",
            }}
          >
            {phaseIndex + 1}
          </Box>
          <Typography fontWeight={700} fontSize={14} sx={{ flexShrink: 0 }}>
            {title}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 0.5, flexWrap: "wrap" }}>
            {isConfigured && !shiftError && !teamError && (
              <Chip
                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                label="Configured"
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 22, fontSize: 11 }}
              />
            )}
            {(shiftError || teamError) && (
              <Typography variant="caption" color="error.main" fontWeight={600}>
                {shiftError && teamError
                  ? "Shift and team are required"
                  : shiftError
                    ? "Shift is required"
                    : "Team assignment is required"}
              </Typography>
            )}
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 2, bgcolor: "background.paper" }}>
        {/* ── Row 1: core fields ──────────────────────────────── */}
        <Box sx={FIELD_GRID_SX}>
          {/* Shift — live from GET /monthlyrosterview/shiftdropdowns */}
          <FormControl fullWidth size="small" error={shiftError} disabled={shiftsLoading}>
            <InputLabel>Shift</InputLabel>
            <Select
              value={shiftsLoading ? "" : value.shift}
              label="Shift"
              onChange={(e) => onChange("shift", e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  {shiftsLoading ? (
                    <CircularProgress size={14} thickness={5} />
                  ) : (
                    <Schedule fontSize="small" />
                  )}
                </InputAdornment>
              }
              renderValue={(selected) => {
                if (!selected) return "";
                const { code, range } = parseShift(selected as string);
                return (
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                    <Box
                      component="span"
                      sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: shiftColor(range, theme), flexShrink: 0 }}
                    />
                    <Box component="span" sx={{ fontWeight: 700, color: shiftColor(range, theme) }}>{code}</Box>
                    {range && (
                      <Box component="span" sx={{ fontSize: 11, color: "text.secondary" }}>
                        {range}
                      </Box>
                    )}
                  </Box>
                );
              }}
            >
              {shiftsLoading ? (
                <MenuItem value="" disabled>
                  Loading shifts…
                </MenuItem>
              ) : shiftOptions.length === 0 ? (
                <MenuItem value="" disabled>
                  No shifts configured
                </MenuItem>
              ) : (
                shiftOptions.map((s) => {
                  const { code, range } = parseShift(s);
                  return (
                    <MenuItem key={s} value={s} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        component="span"
                        sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: shiftColor(range, theme), flexShrink: 0 }}
                      />
                      <Box component="span" sx={{ fontWeight: 700, color: shiftColor(range, theme), minWidth: 28 }}>{code}</Box>
                      {range && (
                        <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                          {range}
                        </Box>
                      )}
                    </MenuItem>
                  );
                })
              )}
            </Select>
            {shiftError && <FormHelperText>Required</FormHelperText>}
          </FormControl>

          {/* Min Level */}
          <FormControl fullWidth size="small">
            <InputLabel>Min Level</InputLabel>
            <Select
              value={value.minimumLevelRequirement}
              label="Min Level"
              onChange={(e) => onChange("minimumLevelRequirement", e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SignalCellularAlt fontSize="small" />
                </InputAdornment>
              }
            >
              {LEVELS.map((lvl) => (
                <MenuItem key={lvl} value={lvl}>
                  {lvl}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Time (Min) */}
          <NumericField
            fullWidth
            size="small"
            label="Time (Min)"
            value={value.requiredTimeMinutes}
            onChange={(n) => onChange("requiredTimeMinutes", n)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccessTime fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {/* Assigned Team */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography
              fontSize={12}
              color={teamError ? "error.main" : "text.secondary"}
              sx={{ mb: 0.5 }}
            >
              Assign Team
            </Typography>
            <TeamAssignmentSelect
              value={value.assignedToTeam || undefined}
              onChange={(subDomainId) =>
                onChange("assignedToTeam", subDomainId ?? 0)
              }
            />
            {teamError && (
              <Typography variant="caption" color="error.main" sx={{ display: "block", mt: 0.5 }}>
                Team assignment is required
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Row 2: only for crqExecution (variant === "full") ─── */}
        {variant === "full" && (
          <Box
            sx={{
              ...FIELD_GRID_SX,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
              mt: 1.5,
              pt: 1.5,
              borderTop: "1px dashed",
              borderColor: "divider",
            }}
          >
            <NumericField
              fullWidth
              size="small"
              label="Days Margin"
              value={value.daysMargin}
              onChange={(n) => onChange("daysMargin", n)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonth fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <NumericField
              fullWidth
              size="small"
              label="Reservation Margin"
              value={value.reservationMargin}
              onChange={(n) => onChange("reservationMargin", n)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <QueryBuilder fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <NumericField
              fullWidth
              size="small"
              label="Rollback Time"
              value={value.rollbackTime}
              onChange={(n) => onChange("rollbackTime", n)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Update fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default memo(ActivityPhaseSection);
