import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Divider,
  Slider,
  FormControlLabel,
  Switch,
  Chip,
  alpha,
  useTheme,
  Tooltip,
} from "@mui/material";

// ── Icons ─────────────────────────────────────────────────────────────────────
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckIcon from "@mui/icons-material/Check";
import PersonIcon from "@mui/icons-material/Person";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

// ── Shared Types ──────────────────────────────────────────────────────────────
export interface FilterState {
  query: string;
  levels: string[];
  roles: string[];
  shiftCodes: string[];
  workRange: [number, number];
  nightRange: [number, number];
  showHighLoad: boolean;
  showLowRest: boolean;
}

export type SortField =
  | "name"
  | "olmid"
  | "role"
  | "level"
  | "work"
  | "night"
  | "off"
  | "load";

export interface SortConfig {
  field: SortField;
  dir: "asc" | "desc";
}

interface LevelMeta {
  bg: string;
  text: string;
  solid: string;
}

interface RosterFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filter: FilterState;
  allRoles: string[];
  onApply: (f: FilterState) => void;
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
}

// ── Local Constants ───────────────────────────────────────────────────────────
const TOTAL_COLS = 42;
const ALL_LEVELS = ["L1", "L2", "L3", "L4"];
const SHIFT_CODES = ["G", "N", "A", "B", "L", "W", "H", "C", "Leave"];
const MONO = "'Roboto Mono', 'Fira Mono', monospace";

const SHIFT_META: Record<string, { label: string }> = {
  G: { label: "General" },
  N: { label: "Night" },
  A: { label: "Afternoon" },
  B: { label: "Early" },
  L: { label: "Late" },
  W: { label: "Week Off" },
  H: { label: "Holiday" },
  C: { label: "Comp Off" },
  Leave: { label: "Leave" },
};

const LEVEL_META: Record<string, LevelMeta> = {
  L1: { bg: "#EFF6FF", text: "#1D4ED8", solid: "#3B82F6" },
  L2: { bg: "#F0FDF4", text: "#15803D", solid: "#22C55E" },
  L3: { bg: "#FFF7ED", text: "#C2410C", solid: "#F97316" },
  L4: { bg: "#FDF4FF", text: "#7E22CE", solid: "#A855F7" },
};

const shiftColorMap = new Map<string, { background: string; color: string; border: string }>([
  ["Leave", { background: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5" }],
  ["New Joinee", { background: "#FFFBEB", color: "#92400E", border: "#FCD34D" }],
  ["N", { background: "#EEF2FF", color: "#3730A3", border: "#818CF8" }],
  ["A", { background: "#F5F3FF", color: "#6B21A8", border: "#C4B5FD" }],
  ["B", { background: "#ECFEFF", color: "#155E75", border: "#67E8F9" }],
  ["G", { background: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD" }],
  ["L", { background: "#ECFDF5", color: "#065F46", border: "#6EE7B7" }],
  ["W", { background: "#F8FAFC", color: "#475569", border: "#CBD5F5" }],
  ["H", { background: "#FFF7ED", color: "#C2410C", border: "#FDBA74" }],
  ["C", { background: "#F1F5F9", color: "#475569", border: "#CBD5E1" }],
]);

function getShiftColor(code: string) {
  return shiftColorMap.get(code) ?? { background: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD" };
}

const defaultFilter = (): FilterState => ({
  query: "",
  levels: [],
  roles: [],
  shiftCodes: [],
  workRange: [0, TOTAL_COLS],
  nightRange: [0, TOTAL_COLS],
  showHighLoad: false,
  showLowRest: false,
});

export default function RosterFilterDrawer({
  open,
  onClose,
  filter,
  allRoles,
  onApply,
  sort,
  onSortChange,
}: RosterFilterDrawerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const tk = {
    accent: theme.palette.primary.main,
    accentDim: alpha(theme.palette.primary.main, 0.08),
    accentBorder: alpha(theme.palette.primary.main, 0.35),
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    textDim: alpha(theme.palette.text.secondary, 0.6),
    border: theme.palette.divider,
    surface: theme.palette.background.paper,
    bg: theme.palette.background.default,
  };

  const [local, setLocal] = useState<FilterState>(filter);

  // Sync internal state when drawer opens or initial filter updates
  useEffect(() => {
    setLocal(filter);
  }, [filter, open]);

  const update = (patch: Partial<FilterState>) => {
    setLocal((prev) => ({ ...prev, ...patch }));
  };

  const toggleArr = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleReset = () => {
    const cleared = defaultFilter();
    setLocal(cleared);
    onApply(cleared);
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  // Helper component for group headings with actions
  const GroupHeader = ({
    title,
    count,
    onClear,
  }: {
    title: string;
    count?: number;
    onClear?: () => void;
  }) => (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, mt: 1 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: tk.textSecondary, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {title}
        </Typography>
        {count ? (
          <Box sx={{ bgcolor: tk.accentDim, color: tk.accent, px: 0.8, py: 0.2, borderRadius: "10px", fontSize: 10, fontWeight: 700 }}>
            {count} Selected
          </Box>
        ) : null}
      </Stack>
      {onClear && count && count > 0 ? (
        <Button size="small" onClick={onClear} sx={{ fontSize: 10, textTransform: "none", minWidth: 0, p: 0, color: tk.accent }}>
          Clear
        </Button>
      ) : null}
    </Stack>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          bgcolor: tk.surface,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderLeft: `1px solid ${tk.border}`,
          boxShadow: isDark ? "-4px 0 24px rgba(0,0,0,0.6)" : "-4px 0 24px rgba(13,27,42,0.08)",
        },
      }}
    >
      {/* Drawer Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 3,
          py: 2,
          borderBottom: `1px solid ${tk.border}`,
          bgcolor: isDark ? "rgba(255,255,255,0.01)" : "rgba(13,27,42,0.01)",
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              bgcolor: tk.accentDim,
              borderRadius: "8px",
              width: 32,
              height: 32,
              color: tk.accent,
            }}
          >
            <TuneIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 750, fontSize: 15, color: tk.textPrimary, letterSpacing: "-0.01em" }}>
              Roster Filters
            </Typography>
            <Typography sx={{ fontSize: 11, color: tk.textSecondary }}>
              Refine active views and constraints
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Tooltip title="Reset all options">
            <IconButton onClick={handleReset} size="small" sx={{ color: tk.textSecondary }}>
              <RestartAltIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} size="small" sx={{ color: tk.textSecondary }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Stack>

      {/* Drawer Content */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2.5, display: "flex", flexDirection: "column", gap: 3.5 }}>
        
        {/* Sorting Section */}
        <Box>
          <GroupHeader title="Sorting Order" />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {(["name", "work", "night", "off", "load"] as SortField[]).map((f) => {
              const active = sort.field === f;
              return (
                <Chip
                  key={f}
                  label={`${f.toUpperCase()} ${active ? (sort.dir === "asc" ? "↑" : "↓") : ""}`}
                  onClick={() =>
                    onSortChange({
                      field: f,
                      dir: sort.field === f && sort.dir === "asc" ? "desc" : "asc",
                    })
                  }
                  variant={active ? "filled" : "outlined"}
                  color={active ? "primary" : "default"}
                  size="small"
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    height: 28,
                    borderRadius: "6px",
                    cursor: "pointer",
                    "& .MuiChip-label": { px: 1.2 },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        <Divider />

        {/* Level Filter */}
        <Box>
          <GroupHeader
            title="Employee Levels"
            count={local.levels.length}
            onClear={() => update({ levels: [] })}
          />
          <Stack gap={1}>
            {ALL_LEVELS.map((lv) => {
              const meta = LEVEL_META[lv] ?? { bg: "#F1F5F9", text: "#475569", solid: "#64748B" };
              const active = local.levels.includes(lv);
              return (
                <Box
                  key={lv}
                  onClick={() => update({ levels: toggleArr(local.levels, lv) })}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.1,
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: active ? meta.solid : tk.border,
                    bgcolor: active ? alpha(meta.solid, 0.08) : "transparent",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: active ? meta.solid : alpha(meta.solid, 0.4),
                      bgcolor: active ? alpha(meta.solid, 0.12) : alpha(meta.solid, 0.04),
                    },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: meta.solid }} />
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: active ? meta.text : tk.textPrimary, flex: 1 }}>
                    Level {lv}
                  </Typography>
                  {active && <CheckIcon sx={{ fontSize: 15, color: meta.solid }} />}
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Divider />

        {/* Role Filter */}
        <Box>
          <GroupHeader
            title="Roles"
            count={local.roles.length}
            onClear={() => update({ roles: [] })}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 220, overflowY: "auto", pr: 0.5 }}>
            {allRoles.map((role) => {
              const active = local.roles.includes(role);
              return (
                <Box
                  key={role}
                  onClick={() => update({ roles: toggleArr(local.roles, role) })}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.1,
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: active ? tk.accent : tk.border,
                    bgcolor: active ? tk.accentDim : "transparent",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: tk.accent,
                      bgcolor: tk.accentDim,
                    },
                  }}
                >
                  <PersonIcon sx={{ fontSize: 16, color: active ? tk.accent : tk.textDim }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 550, color: active ? tk.accent : tk.textPrimary, flex: 1 }} noWrap>
                    {role.replace(/_/g, " ")}
                  </Typography>
                  {active && <CheckIcon sx={{ fontSize: 15, color: tk.accent }} />}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Divider />

        {/* Shift Presence */}
        <Box>
          <GroupHeader
            title="Has Shift Presence"
            count={local.shiftCodes.length}
            onClear={() => update({ shiftCodes: [] })}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
            {SHIFT_CODES.map((code) => {
              const sc = getShiftColor(code);
              const active = local.shiftCodes.includes(code);
              return (
                <Box
                  key={code}
                  onClick={() => update({ shiftCodes: toggleArr(local.shiftCodes, code) })}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    p: 1,
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: active ? sc.border : tk.border,
                    bgcolor: active ? alpha(sc.background, 0.8) : "transparent",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: sc.border,
                      bgcolor: alpha(sc.background, 0.4),
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      width: 24,
                      height: 24,
                      borderRadius: "4px",
                      bgcolor: sc.background,
                      color: sc.color,
                      fontFamily: MONO,
                      fontWeight: 700,
                      fontSize: 10,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    {code}
                  </Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 550, color: tk.textPrimary }} noWrap>
                    {SHIFT_META[code]?.label ?? code}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Divider />

        {/* Ranges Section */}
        <Box>
          <GroupHeader title="Threshold Configurations" />

          {/* Work Days Slider */}
          <Box sx={{ px: 1, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: tk.textPrimary }}>
                Work Days
              </Typography>
              <Typography sx={{ fontSize: 11, color: tk.textSecondary, fontFamily: MONO, fontWeight: 600 }}>
                {local.workRange[0]} - {local.workRange[1]} days
              </Typography>
            </Stack>
            <Slider
              value={local.workRange}
              onChange={(_, v) => update({ workRange: v as [number, number] })}
              min={0}
              max={TOTAL_COLS}
              valueLabelDisplay="auto"
              size="small"
            />
          </Box>

          {/* Night Shifts Slider */}
          <Box sx={{ px: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: tk.textPrimary }}>
                Night Shifts
              </Typography>
              <Typography sx={{ fontSize: 11, color: tk.textSecondary, fontFamily: MONO, fontWeight: 600 }}>
                {local.nightRange[0]} - {local.nightRange[1]} nights
              </Typography>
            </Stack>
            <Slider
              value={local.nightRange}
              onChange={(_, v) => update({ nightRange: v as [number, number] })}
              min={0}
              max={TOTAL_COLS}
              valueLabelDisplay="auto"
              size="small"
            />
          </Box>
        </Box>

        <Divider />

        {/* Compliance and Exceptions */}
        <Box>
          <GroupHeader title="Compliance Filters" />
          <Stack gap={1}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1,
                borderRadius: "8px",
                border: `1px solid ${tk.border}`,
                bgcolor: local.showHighLoad ? alpha(theme.palette.warning.main, 0.04) : "transparent",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: tk.textPrimary }}>
                  High Night Load Only
                </Typography>
                <Typography sx={{ fontSize: 10, color: tk.textSecondary }}>
                  Filters workers with &gt; 8 nights
                </Typography>
              </Box>
              <Switch
                size="small"
                checked={local.showHighLoad}
                onChange={(e) => update({ showHighLoad: e.target.checked })}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1,
                borderRadius: "8px",
                border: `1px solid ${tk.border}`,
                bgcolor: local.showLowRest ? alpha(theme.palette.error.main, 0.04) : "transparent",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: tk.textPrimary }}>
                  Low Rest Violations Only
                </Typography>
                <Typography sx={{ fontSize: 10, color: tk.textSecondary }}>
                  Filters workers with &lt; 6 days off
                </Typography>
              </Box>
              <Switch
                size="small"
                checked={local.showLowRest}
                onChange={(e) => update({ showLowRest: e.target.checked })}
              />
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Drawer Sticky Footer Actions */}
      <Stack
        direction="row"
        gap={2}
        sx={{
          p: 2.5,
          borderTop: `1px solid ${tk.border}`,
          bgcolor: isDark ? "rgba(0,0,0,0.15)" : "rgba(13,27,42,0.015)",
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: 12.5,
            height: 40,
          }}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={handleApply}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 650,
            fontSize: 12.5,
            height: 40,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
          }}
        >
          Apply Filters
        </Button>
      </Stack>
    </Drawer>
  );
}