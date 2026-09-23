import React, {
  useState,
  useMemo,
  useCallback,
  type CSSProperties,
} from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Stack,
  Fade,
  CircularProgress,
  IconButton,
  LinearProgress,
  Tooltip,
  Collapse,
  Autocomplete,
  Chip,
  TextField,
  Card,
} from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTabColorTokens } from "../../../style/theme";

// ─── 1. Types & Mock Data ─────────────────────────────────────────────────────

export interface ShiftInfo {
  shiftId: string;
  subFunction: string;
  shiftName: string;
  shiftHours: string;
  shiftEnd: string;
  shiftStart: string;
  shiftRange: string;
  teamFunction: string;
}

export interface ShiftRow {
  shiftId: string;
  shiftName: string;
  status: "Enabled" | "Disabled";
  teamAllocation: string;
  minLOneReq: number;
  minLTwoReq: number;
  minLThreeReq: number;
  minLFourReq: number;
  empCat: string[];
}

const TOTAL_EMPLOYEES = 46;
const EMP_CAT_OPTIONS = ["All", "Onroll", "Offroll", "Project"];

const SHIFT_INFO: ShiftInfo[] = [
  {
    shiftId: "1",
    subFunction: "All",
    shiftName: "A",
    shiftHours: "08:00",
    shiftEnd: "15:30",
    shiftStart: "07:30",
    shiftRange: "7:30 am – 3:30 pm",
    teamFunction: "IP Core",
  },
  {
    shiftId: "2",
    subFunction: "All",
    shiftName: "B",
    shiftHours: "08:00",
    shiftEnd: "22:00",
    shiftStart: "14:00",
    shiftRange: "2:00 pm – 10:00 pm",
    teamFunction: "IP Core",
  },
  {
    shiftId: "3",
    subFunction: "All",
    shiftName: "N",
    shiftHours: "09:30",
    shiftEnd: "07:30",
    shiftStart: "22:00",
    shiftRange: "10:00 pm – 7:30 am",
    teamFunction: "IP Core",
  },
  {
    shiftId: "4",
    subFunction: "All",
    shiftName: "G",
    shiftHours: "09:00",
    shiftEnd: "18:30",
    shiftStart: "09:30",
    shiftRange: "9:30 am – 6:30 pm",
    teamFunction: "IP Core",
  },
  {
    shiftId: "5",
    subFunction: "All",
    shiftName: "LG",
    shiftHours: "09:00",
    shiftEnd: "20:00",
    shiftStart: "11:00",
    shiftRange: "11:00 am – 8:00 pm",
    teamFunction: "IP Core",
  },
];

const INITIAL_DATA: ShiftRow[] = [
  {
    shiftId: "1",
    shiftName: "A",
    status: "Enabled",
    teamAllocation: "5",
    minLOneReq: 1,
    minLTwoReq: 0,
    minLThreeReq: 0,
    minLFourReq: 0,
    empCat: ["All"],
  },
  {
    shiftId: "2",
    shiftName: "B",
    status: "Enabled",
    teamAllocation: "10",
    minLOneReq: 1,
    minLTwoReq: 0,
    minLThreeReq: 0,
    minLFourReq: 0,
    empCat: ["Project"],
  },
  {
    shiftId: "3",
    shiftName: "N",
    status: "Enabled",
    teamAllocation: "11",
    minLOneReq: 7,
    minLTwoReq: 2,
    minLThreeReq: 2,
    minLFourReq: 0,
    empCat: ["All"],
  },
  {
    shiftId: "4",
    shiftName: "G",
    status: "Enabled",
    teamAllocation: "10",
    minLOneReq: 6,
    minLTwoReq: 0,
    minLThreeReq: 2,
    minLFourReq: 0,
    empCat: ["Offroll"],
  },
  {
    shiftId: "5",
    shiftName: "LG",
    status: "Enabled",
    teamAllocation: "10",
    minLOneReq: 1,
    minLTwoReq: 0,
    minLThreeReq: 0,
    minLFourReq: 0,
    empCat: ["Onroll"],
  },
];

// ─── 2. Style Tokens & Animations ─────────────────────────────────────────────

const useScheduleTokens = (theme: any) => {
  const isDark = theme.palette.mode === "dark";
  return {
    isDark,
    surface: isDark ? "#0f172a" : "#ffffff",
    background: isDark ? "#1e293b" : "#f8fafc",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    textPrimary: isDark ? "#f8fafc" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    primary: "#3b82f6",
    success: "#10b981",
    danger: "#ef4444",
    radiusXL: 16,
    hoverBg: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.02)",
  };
};

const ANIM_CSS = `
  @keyframes ntfRowIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .ntf-row { animation: ntfRowIn 0.3s ease both; }
  
  .ntf-tog { position: relative; display: inline-block; width: 34px; height: 18px; cursor: pointer; flex-shrink: 0; }
  .ntf-tog input { opacity: 0; width: 0; height: 0; }
  .ntf-track { position: absolute; inset: 0; background-color: var(--tog-bg, #cbd5e1); border-radius: 34px; transition: .3s; }
  .ntf-tog input:checked + .ntf-track { background-color: #10b981; }
  .ntf-thumb { position: absolute; height: 12px; width: 12px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; }
  .ntf-tog input:checked + .ntf-track .ntf-thumb { transform: translateX(16px); }
`;

const getShiftColor = (name: string, isDark: boolean) => {
  const colors: Record<string, { color: string; bg: string }> = {
    A: { color: "#d97706", bg: isDark ? "rgba(217,119,6,0.15)" : "#fef3c7" },
    B: { color: "#2563eb", bg: isDark ? "rgba(37,99,235,0.15)" : "#dbeafe" },
    N: { color: "#4f46e5", bg: isDark ? "rgba(79,70,229,0.15)" : "#e0e7ff" },
    G: { color: "#475569", bg: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9" },
    LG: { color: "#059669", bg: isDark ? "rgba(5,150,105,0.15)" : "#d1fae5" },
  };
  return (
    colors[name] || {
      color: "#9333ea",
      bg: isDark ? "rgba(147,51,234,0.15)" : "#f3e8ff",
    }
  );
};

const getCategoryStyle = (cat: string, isDark: boolean) => {
  const styles: Record<string, { bg: string; color: string }> = {
    All: {
      bg: isDark ? "rgba(2,132,199,0.2)" : "#E0F2FE",
      color: isDark ? "#38bdf8" : "#0284C7",
    },
    Onroll: {
      bg: isDark ? "rgba(22,163,74,0.2)" : "#DCFCE7",
      color: isDark ? "#4ade80" : "#16A34A",
    },
    Offroll: {
      bg: isDark ? "rgba(234,88,12,0.2)" : "#FFEDD5",
      color: isDark ? "#fb923c" : "#EA580C",
    },
    Project: {
      bg: isDark ? "rgba(147,51,234,0.2)" : "#F3E8FF",
      color: isDark ? "#c084fc" : "#9333EA",
    },
  };
  return (
    styles[cat] || {
      bg: isDark ? "rgba(255,255,255,0.1)" : "#F1F5F9",
      color: isDark ? "#cbd5e1" : "#475569",
    }
  );
};

// ─── 3. Custom Mini Components ────────────────────────────────────────────────

const CustomToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  isDark: boolean;
}> = ({ checked, onChange, isDark }) => (
  <label
    className="ntf-tog"
    style={{ "--tog-bg": isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1" } as any}
  >
    <input type="checkbox" checked={checked} onChange={onChange} />
    <div className="ntf-track">
      <div className="ntf-thumb" />
    </div>
  </label>
);

const AllocationBadge: React.FC<{
  allocation: string;
  total: number;
  tk: any;
}> = ({ allocation, total, tk }) => {
  const pct =
    total > 0
      ? Math.min(((parseFloat(allocation) || 0) / total) * 100, 100)
      : 0;
  const color = pct >= 100 ? tk.danger : pct > 60 ? "#F59E0B" : tk.success;
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        ml: 1,
        flexShrink: 0,
      }}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        sx={{ color: tk.border, position: "absolute" }}
        size={24}
        thickness={6}
      />
      <CircularProgress
        variant="determinate"
        value={pct}
        sx={{ color }}
        size={24}
        thickness={6}
      />
    </Box>
  );
};

const SeamlessInput: React.FC<{
  value: string | number;
  disabled: boolean;
  onChange: (v: string) => void;
  tk: any;
  width?: number;
}> = ({ value, disabled, onChange, tk, width = 45 }) => (
  <TextField
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    variant="outlined"
    sx={{
      width,
      "& .MuiOutlinedInput-root": {
        height: 28,
        transition: "all 0.2s ease",
        backgroundColor: "transparent",
        "& fieldset": {
          borderColor: "transparent",
          borderWidth: "1px",
          borderRadius: "6px",
        },
        "&:hover fieldset": {
          borderColor: disabled ? "transparent" : tk.border,
        },
        "&.Mui-focused fieldset": {
          borderColor: tk.primary,
          borderWidth: "2px",
        },
        "&.Mui-focused": {
          backgroundColor: tk.background,
          boxShadow: `0 2px 8px rgba(0,0,0,0.1)`,
        },
      },
      "& input": {
        textAlign: "center",
        p: 0,
        fontSize: "13px",
        fontWeight: 600,
        color: disabled ? tk.textSecondary : tk.textPrimary,
      },
    }}
  />
);

// ─── 4. Main Table Component ──────────────────────────────────────────────────

export const WeekDaySchedule: React.FC = () => {
  const theme = useTheme();
  const tk = useScheduleTokens(theme);
  const bg = useTabColorTokens(theme);

  const [data, setData] = useState<ShiftRow[]>(INITIAL_DATA);
  const [showInfo, setShowInfo] = useState(false);
  const [saved, setSaved] = useState(false);

  // Derived calculations
  const totalAllocated = data.reduce(
    (s, r) => s + (parseFloat(r.teamAllocation) || 0),
    0,
  );
  const overallPct =
    TOTAL_EMPLOYEES > 0
      ? Math.min((totalAllocated / TOTAL_EMPLOYEES) * 100, 100)
      : 0;
  const isFull = overallPct >= 100;

  // Handlers
  const handleUpdate = useCallback(
    (index: number, field: keyof ShiftRow, value: any) => {
      setData((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
    },
    [],
  );

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ─── Columns Definition ───
  const columns = useMemo<MRT_ColumnDef<ShiftRow>[]>(
    () => [
      {
        accessorKey: "shiftName",
        header: "Shift",
        size: 90,
        Cell: ({ row, cell }) => {
          const c = getShiftColor(cell.getValue<string>(), tk.isDark);
          const info = SHIFT_INFO.find(
            (s) => s.shiftId === row.original.shiftId,
          );
          return (
            <Tooltip
              title={info ? info.shiftRange : ""}
              placement="right"
              arrow
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: "8px",
                  background: c.bg,
                  color: c.color,
                  border: `1px solid ${c.color}30`,
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                {cell.getValue<string>()}
              </Box>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        Cell: ({ row }) => (
          <CustomToggle
            isDark={tk.isDark}
            checked={row.original.status === "Enabled"}
            onChange={() =>
              handleUpdate(
                row.index,
                "status",
                row.original.status === "Enabled" ? "Disabled" : "Enabled",
              )
            }
          />
        ),
      },
      {
        accessorKey: "teamAllocation",
        header: "Allocation",
        size: 130,
        Cell: ({ row, cell }) => (
          <Stack direction="row" alignItems="center" gap={1}>
            <SeamlessInput
              tk={tk}
              width={40}
              value={cell.getValue<string>()}
              disabled={row.original.status === "Disabled"}
              onChange={(v) => {
                if (v === "" || /^\d*$/.test(v)) {
                  handleUpdate(row.index, "teamAllocation", v);
                }
              }}
            />
            <AllocationBadge
              allocation={cell.getValue<string>()}
              total={TOTAL_EMPLOYEES}
              tk={tk}
            />
          </Stack>
        ),
      },
      ...(
        ["minLOneReq", "minLTwoReq", "minLThreeReq", "minLFourReq"] as const
      ).map((key, i) => ({
        accessorKey: key,
        header: `Min L${i + 1}`,
        size: 90,
        muiTableHeadCellProps: { align: "center" as const },
        muiTableBodyCellProps: { align: "center" as const },
        Cell: ({ row, cell }: any) => (
          <SeamlessInput
            tk={tk}
            value={cell.getValue() as number}
            disabled={row.original.status === "Disabled"}
            onChange={(v) => handleUpdate(row.index, key, parseInt(v, 10) || 0)}
          />
        ),
      })),
      {
        accessorKey: "empCat",
        header: "Employee Category",
        size: 280,
        Cell: ({ row, cell }) => (
          <Autocomplete
            multiple
            disableClearable
            disableCloseOnSelect
            options={EMP_CAT_OPTIONS}
            value={cell.getValue<string[]>()}
            disabled={row.original.status === "Disabled"}
            onChange={(_, v) => handleUpdate(row.index, "empCat", v)}
            sx={{ "& .MuiAutocomplete-endAdornment": { display: "none" } }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const s = getCategoryStyle(option, tk.isDark);
                return (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    sx={{
                      height: 22,
                      fontSize: "11px",
                      fontWeight: 600,
                      bgcolor: s.bg,
                      color: s.color,
                      border: `1px solid ${s.color}40`,
                      borderRadius: "6px",
                      m: "2px",
                      "& .MuiChip-deleteIcon": {
                        color: s.color,
                        fontSize: "14px",
                        opacity: 0.7,
                        "&:hover": { opacity: 1 },
                      },
                    }}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  row.original.empCat.length === 0 ? "Add tags..." : ""
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    p: "2px 4px",
                    minHeight: 32,
                    cursor: "pointer",
                    bgcolor: "transparent",
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: tk.border },
                    "&.Mui-focused fieldset": { borderColor: tk.primary },
                  },
                  "& input": {
                    fontSize: "12px",
                    color: tk.textSecondary,
                    ml: 0.5,
                  },
                }}
              />
            )}
          />
        ),
      },
    ],
    [tk, handleUpdate],
  );

  // ─── Table Config ───
  const table = useAppTable({
    columns,
    data,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    muiTableBodyRowProps: ({ row }) => ({
      className: "ntf-row",
      style: { animationDelay: `${row.index * 0.04}s` },
      sx: {
        opacity: row.original.status === "Disabled" ? 0.6 : 1,
        transition: "background .13s",
        "&:hover": { background: `${tk.hoverBg} !important` },
      },
    }),
  });

  return (
    <Box sx={{ m: "0 auto", p: { xs: 1, md: 1, bgcolor: bg.accentDim } }}>
      <style>{ANIM_CSS}</style>

      {/* ── Custom Top Header ── */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        {/* <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{ width: 6, height: 24, borderRadius: 2, bgcolor: tk.primary }}
          />
          <Typography variant="h6" fontWeight={700} color={tk.textPrimary}>
            Week Day Schedule
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" gap={2}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: tk.background,
              border: `1px solid ${tk.border}`,
            }}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <GroupsRoundedIcon
                sx={{ fontSize: "1.2rem", color: tk.textSecondary }}
              />
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: tk.textSecondary,
                }}
              >
                Total: {TOTAL_EMPLOYEES}
              </Typography>
            </Stack>
            <Box sx={{ width: 1, height: 14, bgcolor: tk.border }} />
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: isFull ? tk.danger : tk.success,
                }}
              >
                Allocated: {totalAllocated}{" "}
                <span style={{ color: tk.textSecondary }}>
                  / {TOTAL_EMPLOYEES}
                </span>
              </Typography>
              <Box sx={{ width: 48 }}>
                <LinearProgress
                  variant="determinate"
                  value={overallPct}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: tk.border,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: isFull ? tk.danger : tk.success,
                    },
                  }}
                />
              </Box>
            </Stack>
          </Box>

          <Tooltip title={showInfo ? "Hide Details" : "Show Shift Times"} arrow>
            <IconButton
              onClick={() => setShowInfo((v) => !v)}
              sx={{
                border: `1px solid ${tk.border}`,
                borderRadius: 2,
                color: showInfo ? tk.primary : tk.textSecondary,
                bgcolor: showInfo
                  ? tk.isDark
                    ? "rgba(59,130,246,0.15)"
                    : "#eff6ff"
                  : "transparent",
              }}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack> */}
      </Stack>

      {/* ── Collapsible Info ── */}
      <Collapse in={showInfo}>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1.5}
          mb={3}
          p={1.5}
          sx={{
            bgcolor: tk.background,
            borderRadius: 2,
            border: `1px dashed ${tk.border}`,
          }}
        >
          {SHIFT_INFO.map((s) => {
            const c = getShiftColor(s.shiftName, tk.isDark);
            return (
              <Box
                key={s.shiftId}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  bgcolor: c.bg,
                  border: `1px solid ${c.color}20`,
                }}
              >
                <Typography
                  sx={{ fontSize: "12px", color: c.color, fontWeight: 700 }}
                >
                  {s.shiftName} —{" "}
                  <span style={{ opacity: 0.8, fontWeight: 500 }}>
                    {s.shiftRange}
                  </span>
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Collapse>

      {/* ── Material React Table ── */}
      <MaterialReactTable table={table} />

      {/* ── Bottom Action ── */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        mt={3}
        gap={2}
      >
        <Fade in={saved}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{
              px: 1.5,
              py: 0.75,
              bgcolor: tk.isDark ? "rgba(16,185,129,0.1)" : "#ecfdf5",
              borderRadius: 2,
              border: `1px solid ${tk.isDark ? "rgba(16,185,129,0.2)" : "#d1fae5"}`,
            }}
          >
            <CheckCircleRoundedIcon
              sx={{ fontSize: "1.1rem", color: tk.success }}
            />
            <Typography
              sx={{ fontSize: "12px", color: tk.success, fontWeight: 700 }}
            >
              Saved successfully
            </Typography>
          </Stack>
        </Fade>
        <Box
          component="button"
          onClick={handleSave}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            height: 38,
            px: 3,
            borderRadius: 2,
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            bgcolor: tk.primary,
            color: "#fff",
            border: "none",
            transition: "all .2s",
            "&:hover": {
              bgcolor: "#2563eb",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
            },
          }}
        >
          <SaveRoundedIcon sx={{ fontSize: "1.1rem" }} /> Save Changes
        </Box>
      </Stack>
    </Box>
  );
};

export default WeekDaySchedule;
