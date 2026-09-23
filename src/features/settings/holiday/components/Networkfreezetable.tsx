import React, { useState } from "react";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  IconButton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Delete, Edit, Add } from "@mui/icons-material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import dayjs from "dayjs";
import {
  MaterialReactTable,
} from "material-react-table";
import { useAppTable } from "../../../../components/ui/AppTable";
import {
  useGetNetworkFreezeDataQuery,
  useAddNetworkFreezeMutation,
  useUpdateNetworkFreezeMutation,
  useDeleteNetworkFreezeMutation,
  type NetworkFreeze,
} from "../../api/globalSettingApiSlice";

// ─── Props ────────────────────────────────────────────────────────────────────
interface NetworkFreezeTableProps {
  onRefresh?: () => void;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const getStatus = (start: string, end: string) => {
  const now = dayjs();
  if (dayjs(start).isAfter(now)) return "upcoming";
  if (dayjs(end).isBefore(now)) return "past";
  return "active";
};

const STATUS_CONFIG = {
  upcoming: {
    label: "Upcoming",
    bg: "#eff6ff",
    color: "#1d4ed8",
    dot: "#3b82f6",
    darkBg: "rgba(59,130,246,0.15)",
    darkColor: "#93c5fd",
    darkDot: "#60a5fa",
  },
  active: {
    label: "Active",
    bg: "#f0fdf4",
    color: "#15803d",
    dot: "#22c55e",
    darkBg: "rgba(34,197,94,0.15)",
    darkColor: "#86efac",
    darkDot: "#4ade80",
  },
  past: {
    label: "Past",
    bg: "#f8fafc",
    color: "#64748b",
    dot: "#94a3b8",
    darkBg: "rgba(148,163,184,0.12)",
    darkColor: "#94a3b8",
    darkDot: "#64748b",
  },
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const FONT = "'DM Sans', sans-serif";
const GRADIENT = "linear-gradient(135deg, #2d3a8c 0%, #3b4fd8 100%)";
const GRADIENT_HOVER = "linear-gradient(135deg, #232e73 0%, #2f3fb5 100%)";

// ─── Field sx ─────────────────────────────────────────────────────────────────
const fieldSx = (mode: "light" | "dark") => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: "13px",
    fontFamily: FONT,
    backgroundColor: mode === "dark" ? "rgba(255,255,255,0.04)" : "#f8fafc",
    "& fieldset": {
      borderColor: mode === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0",
    },
    "&:hover fieldset": {
      borderColor: mode === "dark" ? "rgba(255,255,255,0.2)" : "#a5b4fc",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#3b4fd8",
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "12.5px",
    fontFamily: FONT,
    "&.Mui-focused": { color: "#3b4fd8" },
  },
  "& .MuiInputBase-input": {
    color: mode === "dark" ? "#f1f5f9" : "#0f172a",
    "&:disabled": {
      WebkitTextFillColor: mode === "dark" ? "#64748b" : "#94a3b8",
    },
  },
});

const toInputValue = (iso: string) =>
  iso ? dayjs(iso).format("YYYY-MM-DDTHH:mm") : "";

// ─── Empty add-form state ─────────────────────────────────────────────────────
const EMPTY_ADD = {
  freezeName: "",
  startDateTime: "",
  endDateTime: "",
  remarks: "",
};

// ─── Component ────────────────────────────────────────────────────────────────
const NetworkFreezeTable: React.FC<NetworkFreezeTableProps> = ({
  onRefresh,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const ink = isDark ? "#f1f5f9" : "#0f172a";
  const ink2 = isDark ? "#94a3b8" : "#475569";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const subSurface = isDark ? "rgba(255,255,255,0.03)" : "#fafbfc";
  const mode = isDark ? "dark" : "light";

  // ─── RTK Query ───────────────────────────────────────────────────────────────
  const {
    data: freezeData = [],
    isLoading: isFetching,
    isError: fetchError,
  } = useGetNetworkFreezeDataQuery();

  const [addNetworkFreeze, { isLoading: isAdding }] =
    useAddNetworkFreezeMutation();
  const [updateNetworkFreeze, { isLoading: isUpdating }] =
    useUpdateNetworkFreezeMutation();
  const [deleteNetworkFreeze, { isLoading: isDeleting }] =
    useDeleteNetworkFreezeMutation();

  const mutating = isAdding || isUpdating || isDeleting;

  // ─── Local UI state ───────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<"all" | "upcoming">("all");

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [addErrors, setAddErrors] = useState<Partial<typeof EMPTY_ADD>>({});

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<NetworkFreeze | null>(null);
  const [editFreezeName, setEditFreezeName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  // Delete dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<NetworkFreeze | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const showSnack = (
    message: string,
    severity: "success" | "error" = "success",
  ) => setSnackbar({ open: true, message, severity });

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const now = dayjs();

  const displayed =
    filter === "upcoming"
      ? freezeData.filter((r) => dayjs(r.startDateTime).isAfter(now))
      : freezeData;

  const stats = {
    total: freezeData.length,
    upcoming: freezeData.filter((r) => dayjs(r.startDateTime).isAfter(now))
      .length,
    active: freezeData.filter(
      (r) =>
        !dayjs(r.startDateTime).isAfter(now) &&
        !dayjs(r.endDateTime).isBefore(now),
    ).length,
  };

  // ─── Add handlers ─────────────────────────────────────────────────────────────
  const openAddDialog = () => {
    setAddForm(EMPTY_ADD);
    setAddErrors({});
    setAddOpen(true);
  };

  const validateAdd = () => {
    const errs: Partial<typeof EMPTY_ADD> = {};
    if (!addForm.freezeName.trim())
      errs.freezeName = "Freeze name is required.";
    if (!addForm.startDateTime)
      errs.startDateTime = "Start date & time is required.";
    if (!addForm.endDateTime) errs.endDateTime = "End date & time is required.";
    if (
      addForm.startDateTime &&
      addForm.endDateTime &&
      dayjs(addForm.endDateTime).isBefore(dayjs(addForm.startDateTime))
    ) {
      errs.endDateTime = "End must be after start.";
    }
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAdd = async () => {
    if (!validateAdd()) return;
    try {
      await addNetworkFreeze({
        freezeName: addForm.freezeName.trim(),
        startDateTime: addForm.startDateTime.replace("T", " ") + ":00",
        endDateTime: addForm.endDateTime.replace("T", " ") + ":00",
        remarks: addForm.remarks.trim(),
      }).unwrap();
      showSnack("Freeze schedule added successfully!");
      setAddOpen(false);
      onRefresh?.();
    } catch {
      showSnack("Failed to add freeze schedule.", "error");
    }
  };

  // ─── Edit handlers ────────────────────────────────────────────────────────────
  const handleEditClick = (row: NetworkFreeze) => {
    setEditRow(row);
    setEditFreezeName(row.freezeName);
    setEditStart(toInputValue(row.startDateTime));
    setEditEnd(toInputValue(row.endDateTime));
    setEditRemarks("");
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editRow) return;
    if (!editFreezeName || !editStart || !editEnd) {
      showSnack("Please fill in all required fields.", "error");
      return;
    }
    if (dayjs(editEnd).isBefore(dayjs(editStart))) {
      showSnack("End date must be after start date.", "error");
      return;
    }
    try {
      await updateNetworkFreeze({
        freezeId: editRow.freezeId,
        freezeName: editFreezeName,
        startDateTime: editStart.replace("T", " ") + ":00",
        endDateTime: editEnd.replace("T", " ") + ":00",
        remarks: editRemarks,
      }).unwrap();
      showSnack("Freeze schedule updated successfully!");
      setEditOpen(false);
      onRefresh?.();
    } catch {
      showSnack("Failed to update freeze schedule.", "error");
    }
  };

  // ─── Delete handlers ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!rowToDelete) return;
    try {
      await deleteNetworkFreeze(rowToDelete.freezeId).unwrap();
      showSnack("Freeze schedule deleted.");
      setConfirmOpen(false);
      onRefresh?.();
    } catch {
      showSnack("Failed to delete freeze schedule.", "error");
    }
  };

  // ─── Shared sx helpers ────────────────────────────────────────────────────────
  const actBtn = (type: "edit" | "delete") => ({
    width: 28,
    height: 28,
    borderRadius: "7px",
    border: `0.5px solid ${border}`,
    background: surfaceBg,
    transition: "all 0.15s",
    "&:hover": {
      background:
        type === "edit"
          ? isDark
            ? "rgba(59,79,216,0.15)"
            : "#eff6ff"
          : isDark
            ? "rgba(220,38,38,0.12)"
            : "#fef2f2",
      borderColor: type === "edit" ? "#a5b4fc" : "#fca5a5",
    },
    "& svg": { fontSize: 14, color: ink2 },
    "&:hover svg": { color: type === "edit" ? "#3b4fd8" : "#dc2626" },
  });

  const cancelBtnSx = {
    borderRadius: "9px",
    textTransform: "none" as const,
    fontSize: "12.5px",
    color: ink2,
    border: `0.5px solid ${border}`,
    fontFamily: FONT,
    px: 2,
    "&:hover": { background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" },
  };

  const submitBtnSx = {
    borderRadius: "9px",
    textTransform: "none" as const,
    fontSize: "12.5px",
    background: GRADIENT,
    fontFamily: FONT,
    fontWeight: 700,
    boxShadow: "none",
    flex: 1,
    "&:hover": { background: GRADIENT_HOVER, boxShadow: "none" },
  };

  // ─── Duration calculation helpers ─────────────────────────────────────────────
  const addDurationHrs =
    addForm.startDateTime && addForm.endDateTime
      ? dayjs(addForm.endDateTime).diff(dayjs(addForm.startDateTime), "hour")
      : 0;
  const addDurationDays =
    addForm.startDateTime && addForm.endDateTime
      ? dayjs(addForm.endDateTime).diff(dayjs(addForm.startDateTime), "day")
      : 0;
  const addDurationMins =
    addForm.startDateTime && addForm.endDateTime
      ? dayjs(addForm.endDateTime).diff(
          dayjs(addForm.startDateTime),
          "minute",
        ) % 60
      : 0;
  const showDurationPreview =
    addForm.startDateTime &&
    addForm.endDateTime &&
    dayjs(addForm.endDateTime).isAfter(dayjs(addForm.startDateTime));

  // ─── Columns ──────────────────────────────────────────────────────────────────
  const columns = [
    {
      accessorKey: "freezeName",
      header: "Freeze Name",
      Cell: ({ cell, row }: any) => {
        const status = getStatus(
          row.original.startDateTime,
          row.original.endDateTime,
        );
        const cfg = STATUS_CONFIG[status];
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 3,
                height: 34,
                borderRadius: 2,
                flexShrink: 0,
                background: isDark ? cfg.darkDot : cfg.dot,
              }}
            />
            <Box>
              <Typography
                sx={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: ink,
                  fontFamily: FONT,
                  lineHeight: 1.3,
                }}
              >
                {cell.getValue()}
              </Typography>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.3,
                  px: "6px",
                  py: "1.5px",
                  borderRadius: "20px",
                  background: isDark ? cfg.darkBg : cfg.bg,
                }}
              >
                <Box
                  sx={{
                    width: 4.5,
                    height: 4.5,
                    borderRadius: "50%",
                    background: isDark ? cfg.darkDot : cfg.dot,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "9.5px",
                    fontWeight: 700,
                    color: isDark ? cfg.darkColor : cfg.color,
                    letterSpacing: "0.4px",
                    fontFamily: FONT,
                    lineHeight: 1,
                  }}
                >
                  {cfg.label}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      },
    },
    {
      accessorKey: "startDateTime",
      header: "Start",
      Cell: ({ cell }: any) => (
        <Box>
          <Typography
            sx={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: ink,
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              letterSpacing: "-0.2px",
              lineHeight: 1.3,
            }}
          >
            {dayjs(cell.getValue()).format("DD MMM YYYY")}
          </Typography>
          <Typography
            sx={{ fontSize: "10px", color: ink2, fontFamily: FONT, mt: 0.25 }}
          >
            {dayjs(cell.getValue()).format("HH:mm")}
          </Typography>
        </Box>
      ),
    },
    {
      accessorKey: "endDateTime",
      header: "End",
      Cell: ({ cell }: any) => (
        <Box>
          <Typography
            sx={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: ink,
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              letterSpacing: "-0.2px",
              lineHeight: 1.3,
            }}
          >
            {dayjs(cell.getValue()).format("DD MMM YYYY")}
          </Typography>
          <Typography
            sx={{ fontSize: "10px", color: ink2, fontFamily: FONT, mt: 0.25 }}
          >
            {dayjs(cell.getValue()).format("HH:mm")}
          </Typography>
        </Box>
      ),
    },
    {
      id: "duration",
      header: "Duration",
      Cell: ({ row }: any) => {
        const hrs = dayjs(row.original.endDateTime).diff(
          dayjs(row.original.startDateTime),
          "hour",
        );
        return (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 0.4,
              px: "8px",
              py: "3px",
              borderRadius: "6px",
              background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
              border: `0.5px solid ${border}`,
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: isDark ? "#a5b4fc" : "#3b4fd8",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "-0.3px",
              }}
            >
              {hrs.toLocaleString()}
            </Typography>
            <Typography
              sx={{
                fontSize: "9px",
                color: ink2,
                fontFamily: FONT,
                fontWeight: 600,
              }}
            >
              hrs
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "action",
      header: "Actions",
      size: 80,
      Cell: ({ row }: any) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit schedule" placement="top">
            <IconButton
              size="small"
              onClick={() => handleEditClick(row.original)}
              sx={actBtn("edit")}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete schedule" placement="top">
            <IconButton
              size="small"
              onClick={() => {
                setRowToDelete(row.original);
                setConfirmOpen(true);
              }}
              sx={actBtn("delete")}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const table = useAppTable({
    columns,
    data: displayed,
    enableSorting: false,
    enablePagination: false,
    initialState: {
      density: "compact",
      columnPinning: { right: ["action"] },
    },
    muiTableBodyRowProps: {
      sx: {
        "&:hover td": {
          background: isDark ? "rgba(255,255,255,0.02)" : "#fafbff",
        },
        "&:last-child td": { borderBottom: "none" },
        transition: "background 0.12s",
      },
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: "360px",
        background: surfaceBg,
        "&::-webkit-scrollbar": { width: "3px", height: "3px" },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: isDark ? "#334155" : "#e2e8f0",
          borderRadius: "4px",
        },
      },
    },
    state: { isLoading: isFetching },
    muiSkeletonProps: { animation: "wave" },
  });

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mutation backdrop */}
      <Backdrop
        open={mutating}
        sx={{
          zIndex: 9999,
          backdropFilter: "blur(4px)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <CircularProgress size={28} sx={{ color: "#3b4fd8" }} />
      </Backdrop>

      {/* ── Main Card ── */}
      <Box
        sx={{
          background: surfaceBg,
          borderRadius: "16px",
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? "0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)"
            : "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(59,79,216,0.07)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            background: GRADIENT,
            px: 2.5,
            py: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: icon + title + inline + Add button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            {/* Lock icon box */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "rgba(255,255,255,0.12)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 16, color: "#fff" }} />
            </Box>

            {/* Title + subtitle + inline Add button */}
            <Box>
              {/* Title row with inline + button */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography
                  sx={{
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                    fontFamily: FONT,
                    letterSpacing: "-0.2px",
                    lineHeight: 1.3,
                  }}
                >
                  Active Freeze Schedule
                </Typography>

                {/* ── Inline + Add button right next to the title text ── */}
                <Tooltip title="Add freeze schedule" placement="top">
                  <IconButton
                    size="small"
                    onClick={openAddDialog}
                    sx={{
                      width: 20,
                      height: 20,
                      p: 0,
                      borderRadius: "5px",
                      background: "rgba(255,255,255,0.18)",
                      border: "0.5px solid rgba(255,255,255,0.3)",
                      transition: "all 0.15s",
                      "&:hover": {
                        background: "rgba(255,255,255,0.32)",
                        border: "0.5px solid rgba(255,255,255,0.5)",
                        transform: "scale(1.1)",
                      },
                      "& svg": { fontSize: 12, color: "#fff" },
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "10.5px",
                  fontFamily: FONT,
                  lineHeight: 1,
                  mt: 0.2,
                }}
              >
                Manage network freeze windows
              </Typography>
            </Box>
          </Box>

          {/* Right: All / Upcoming toggle */}
          <Box
            sx={{
              display: "flex",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              p: "3px",
              gap: "2px",
            }}
          >
            {(["all", "upcoming"] as const).map((val) => (
              <Box
                key={val}
                onClick={() => setFilter(val)}
                sx={{
                  px: "12px",
                  py: "4px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                  fontFamily: FONT,
                  letterSpacing: "0.2px",
                  transition: "all 0.15s",
                  userSelect: "none",
                  background: filter === val ? "#fff" : "transparent",
                  color: filter === val ? "#2d3a8c" : "rgba(255,255,255,0.6)",
                  "&:hover": {
                    background:
                      filter === val ? "#fff" : "rgba(255,255,255,0.15)",
                  },
                }}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Stats bar ── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderBottom: `0.5px solid ${border}`,
          }}
        >
          {[
            { label: "Total", value: stats.total, color: ink },
            {
              label: "Upcoming",
              value: stats.upcoming,
              color: isDark ? "#818cf8" : "#3b4fd8",
            },
            {
              label: "Active",
              value: stats.active,
              color: isDark ? "#4ade80" : "#15803d",
            },
          ].map((s, i) => (
            <Box
              key={s.label}
              sx={{
                px: 2,
                py: "10px",
                borderRight: i < 2 ? `0.5px solid ${border}` : "none",
                background: subSurface,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: s.color,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </Typography>
              <Typography
                sx={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  color: ink2,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  fontFamily: FONT,
                }}
              >
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Fetch error banner */}
        {fetchError && (
          <Box
            sx={{
              px: 2.5,
              py: 1.25,
              background: isDark ? "rgba(220,38,38,0.1)" : "#fef2f2",
              borderBottom: `0.5px solid ${border}`,
            }}
          >
            <Typography
              sx={{ fontSize: "12px", color: "#dc2626", fontFamily: FONT }}
            >
              Failed to load freeze data. Please refresh the page.
            </Typography>
          </Box>
        )}

        {/* ── Table ── */}
        <MaterialReactTable table={table} />
      </Box>

      {/* ════════════════════════════════════════════════════════════════════════
          ADD FREEZE DIALOG  —  Improved
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={addOpen}
        onClose={() => !isAdding && setAddOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            background: isDark ? "#1e293b" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e8edf5"}`,
            boxShadow: isDark
              ? "0 24px 80px rgba(0,0,0,0.5)"
              : "0 24px 80px rgba(15,23,42,0.16)",
          },
        }}
      >
        {/* ── Dialog Header ── */}
        <Box
          sx={{
            background: GRADIENT,
            px: 3,
            pt: 2.5,
            pb: 2.5,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <Box
            sx={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              right: 60,
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              position: "relative",
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AddCircleOutlineIcon sx={{ fontSize: 22, color: "#fff" }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "15.5px",
                  fontWeight: 700,
                  fontFamily: FONT,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.25,
                }}
              >
                Add Freeze Schedule
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "11.5px",
                  fontFamily: FONT,
                  mt: 0.35,
                  lineHeight: 1,
                }}
              >
                Define a new network freeze window
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Dialog Body ── */}
        <DialogContent sx={{ px: 3, pt: 3, pb: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* ── Section: Freeze Name ── */}
            <Box sx={{ mb: 2.5 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 1 }}
              >
                <NotesOutlinedIcon
                  sx={{ fontSize: 12, color: isDark ? "#818cf8" : "#3b4fd8" }}
                />
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: isDark ? "#818cf8" : "#3b4fd8",
                    fontFamily: FONT,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  Freeze Name
                </Typography>
              </Box>
              <TextField
                placeholder="e.g. Diwali Season Freeze"
                value={addForm.freezeName}
                onChange={(e) => {
                  setAddForm((p) => ({ ...p, freezeName: e.target.value }));
                  if (addErrors.freezeName)
                    setAddErrors((p) => ({ ...p, freezeName: "" }));
                }}
                fullWidth
                size="small"
                error={!!addErrors.freezeName}
                helperText={addErrors.freezeName}
                sx={fieldSx(mode)}
                slotProps={{
                  formHelperText: {
                    sx: { fontFamily: FONT, fontSize: "11px", mt: 0.5, ml: 0 },
                  },
                }}
              />
            </Box>

            {/* ── Section: Freeze Window ── */}
            <Box sx={{ mb: showDurationPreview ? 1.5 : 2.5 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 1 }}
              >
                <CalendarMonthOutlinedIcon
                  sx={{ fontSize: 12, color: isDark ? "#818cf8" : "#3b4fd8" }}
                />
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: isDark ? "#818cf8" : "#3b4fd8",
                    fontFamily: FONT,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  Freeze Window
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.5,
                }}
              >
                {/* Start */}
                <Box>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: ink2,
                      fontFamily: FONT,
                      mb: 0.6,
                      letterSpacing: "0.2px",
                    }}
                  >
                    Start
                  </Typography>
                  <TextField
                    type="datetime-local"
                    value={addForm.startDateTime}
                    onChange={(e) => {
                      setAddForm((p) => ({
                        ...p,
                        startDateTime: e.target.value,
                      }));
                      if (addErrors.startDateTime)
                        setAddErrors((p) => ({ ...p, startDateTime: "" }));
                    }}
                    fullWidth
                    size="small"
                    error={!!addErrors.startDateTime}
                    helperText={addErrors.startDateTime}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx(mode)}
                    FormHelperTextProps={{
                      sx: {
                        fontFamily: FONT,
                        fontSize: "11px",
                        mt: 0.5,
                        ml: 0,
                      },
                    }}
                  />
                </Box>

                {/* End */}
                <Box>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: ink2,
                      fontFamily: FONT,
                      mb: 0.6,
                      letterSpacing: "0.2px",
                    }}
                  >
                    End
                  </Typography>
                  <TextField
                    type="datetime-local"
                    value={addForm.endDateTime}
                    onChange={(e) => {
                      setAddForm((p) => ({
                        ...p,
                        endDateTime: e.target.value,
                      }));
                      if (addErrors.endDateTime)
                        setAddErrors((p) => ({ ...p, endDateTime: "" }));
                    }}
                    fullWidth
                    size="small"
                    error={!!addErrors.endDateTime}
                    helperText={addErrors.endDateTime}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx(mode)}
                    FormHelperTextProps={{
                      sx: {
                        fontFamily: FONT,
                        fontSize: "11px",
                        mt: 0.5,
                        ml: 0,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* ── Duration Preview pill ── */}
            {showDurationPreview && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  px: 1.75,
                  py: 1.1,
                  mb: 2.5,
                  borderRadius: "10px",
                  background: isDark ? "rgba(99,102,241,0.1)" : "#eef2ff",
                  border: `1px solid ${isDark ? "rgba(99,102,241,0.22)" : "#c7d2fe"}`,
                }}
              >
                <AccessTimeOutlinedIcon
                  sx={{
                    fontSize: 14,
                    color: isDark ? "#a5b4fc" : "#4f46e5",
                    flexShrink: 0,
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 0.5,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: isDark ? "#a5b4fc" : "#4f46e5",
                      fontFamily: FONT,
                      fontWeight: 500,
                    }}
                  >
                    Duration:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: isDark ? "#c7d2fe" : "#312e81",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {addDurationDays > 0 && `${addDurationDays}d `}
                    {addDurationHrs % 24 > 0 && `${addDurationHrs % 24}h `}
                    {addDurationMins > 0 && `${addDurationMins}m`}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "11px",
                      color: isDark ? "#818cf8" : "#6366f1",
                      fontFamily: FONT,
                    }}
                  >
                    · {addDurationHrs.toLocaleString()} hrs total
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ── Section: Remarks ── */}
            <Box sx={{ mb: 0.5 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 1 }}
              >
                <NotesOutlinedIcon
                  sx={{ fontSize: 12, color: isDark ? "#818cf8" : "#3b4fd8" }}
                />
                <Typography
                  sx={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: isDark ? "#818cf8" : "#3b4fd8",
                    fontFamily: FONT,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  Remarks{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                      color: isDark ? "#475569" : "#94a3b8",
                    }}
                  >
                    (optional)
                  </span>
                </Typography>
              </Box>
              <TextField
                placeholder="Any notes about this freeze window…"
                value={addForm.remarks}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, remarks: e.target.value }))
                }
                fullWidth
                size="small"
                multiline
                rows={2}
                sx={fieldSx(mode)}
              />
            </Box>
          </Box>
        </DialogContent>

        {/* Divider */}
        <Box sx={{ height: "1px", background: border, mx: 0, mt: 2.5 }} />

        {/* ── Dialog Actions ── */}
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, gap: 1 }}>
          <Button
            onClick={() => setAddOpen(false)}
            disabled={isAdding}
            sx={cancelBtnSx}
          >
            Cancel
          </Button>
          <Button
            onClick={submitAdd}
            variant="contained"
            disabled={isAdding}
            sx={submitBtnSx}
          >
            {isAdding ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={13} sx={{ color: "#fff" }} />
                <span>Adding…</span>
              </Box>
            ) : (
              "Add Freeze Schedule"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════
          EDIT DIALOG
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={editOpen}
        onClose={() => !isUpdating && setEditOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
            background: isDark ? "#1e293b" : "#fff",
            border: `0.5px solid ${border}`,
            boxShadow: "0 8px 40px rgba(15,23,42,0.18)",
          },
        }}
      >
        <Box sx={{ background: GRADIENT, px: 2.5, py: 2 }}>
          <Typography
            sx={{
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: FONT,
            }}
          >
            Edit Freeze Schedule
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "11.5px",
              fontFamily: FONT,
              mt: 0.3,
            }}
          >
            Update the schedule details below
          </Typography>
        </Box>

        <DialogContent sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Freeze Name"
              value={editFreezeName}
              onChange={(e) => setEditFreezeName(e.target.value)}
              fullWidth
              size="small"
              sx={fieldSx(mode)}
            />
            <TextField
              label="Start Date & Time"
              type="datetime-local"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={fieldSx(mode)}
            />
            <TextField
              label="End Date & Time"
              type="datetime-local"
              value={editEnd}
              onChange={(e) => setEditEnd(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={fieldSx(mode)}
            />
            <TextField
              label="Remarks"
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
              sx={fieldSx(mode)}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1.25, gap: 1 }}>
          <Button
            onClick={() => setEditOpen(false)}
            disabled={isUpdating}
            sx={cancelBtnSx}
          >
            Cancel
          </Button>
          <Button
            onClick={submitEdit}
            variant="contained"
            disabled={isUpdating}
            sx={submitBtnSx}
          >
            {isUpdating ? (
              <CircularProgress size={13} sx={{ color: "#fff" }} />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════════
          DELETE CONFIRM DIALOG
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={confirmOpen}
        onClose={() => !isDeleting && setConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            width: 360,
            background: isDark ? "#1e293b" : "#fff",
            border: `0.5px solid ${border}`,
            boxShadow: "0 8px 40px rgba(15,23,42,0.18)",
          },
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.5, pb: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: isDark ? "rgba(220,38,38,0.15)" : "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
            }}
          >
            <Delete sx={{ fontSize: 20, color: "#dc2626" }} />
          </Box>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 700,
              color: ink,
              fontFamily: FONT,
            }}
          >
            Delete schedule
          </Typography>
        </Box>
        <DialogContent sx={{ px: 2.5, py: 1 }}>
          <DialogContentText
            sx={{
              fontSize: "12.5px",
              color: ink2,
              fontFamily: FONT,
              lineHeight: 1.6,
            }}
          >
            Are you sure you want to delete{" "}
            <strong style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>
              {rowToDelete?.freezeName}
            </strong>
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={isDeleting}
            sx={cancelBtnSx}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={isDeleting}
            sx={{
              borderRadius: "9px",
              textTransform: "none",
              fontSize: "12.5px",
              background: "#dc2626",
              fontFamily: FONT,
              fontWeight: 700,
              boxShadow: "none",
              flex: 1,
              "&:hover": { background: "#b91c1c", boxShadow: "none" },
            }}
          >
            {isDeleting ? (
              <CircularProgress size={13} sx={{ color: "#fff" }} />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          sx={{
            borderRadius: "10px",
            fontFamily: FONT,
            fontSize: "13px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NetworkFreezeTable;
