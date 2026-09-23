import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  MaterialReactTable,

  type MRT_Cell,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableInstance,
} from "material-react-table";
import { useAppTable } from "../../../../../components/ui/AppTable";
import {
  Box,
  Typography,
  Switch,
  styled,
  Chip,
  Avatar,
  Tooltip,
  TextField,
  Button,
  Stack,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Snackbar,
  Alert,
  type AlertColor,
  CircularProgress,
} from "@mui/material";
import { useUpdateTaskConfigMutation } from "../api/taskConfigApi";

import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

// ─── Types ──────────────────────────────────────────────────────────────────

type EmployeeLevel = "L2" | "L3" | "L4";
type EmployeeRole = "Onroll" | "Contract";

interface TaskFlags {
  crqValidation: boolean;
  impactAnalysis: boolean;
  mopCreation: boolean;
  mopValidation: boolean;
  schedulingApprovals: boolean;
  networkExecution: boolean;
}

type TaskKey = keyof TaskFlags;

interface TaskData extends TaskFlags {
  id: number;
  olmId: string;
  userId?: number;
  employeeName: string;
  employeeLevel: EmployeeLevel;
  roll: EmployeeRole;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface SnackState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface AddEmployeeForm {
  employeeName: string;
  olmId: string;
  employeeLevel: EmployeeLevel;
  roll: EmployeeRole;
}

interface TaskColumnMeta {
  key: TaskKey;
  label: string;
  fullLabel: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TASK_COLUMNS: TaskColumnMeta[] = [
  { key: "crqValidation", label: "CRQ", fullLabel: "CRQ Validation" },
  { key: "impactAnalysis", label: "Impact", fullLabel: "Impact Analysis" },
  { key: "mopCreation", label: "MOP", fullLabel: "MOP Creation" },
  { key: "mopValidation", label: "Validation", fullLabel: "MOP Validation" },
  {
    key: "schedulingApprovals",
    label: "Approval",
    fullLabel: "Scheduling Approvals",
  },
  {
    key: "networkExecution",
    label: "Execution",
    fullLabel: "Network Execution",
  },
];

const ALL_TASK_KEYS: TaskKey[] = TASK_COLUMNS.map((c) => c.key);

const DEFAULT_ADD_FORM: AddEmployeeForm = {
  employeeName: "",
  olmId: "",
  employeeLevel: "L3",
  roll: "Onroll",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const generateOlmId = (): string =>
  "B0" + String(Math.floor(100000 + Math.random() * 900000));

// let nextId = INITIAL_DATA.length + 1;

// ─── Styled Components ────────────────────────────────────────────────────────

const ActionSwitch = styled(Switch)(({ theme }) => ({
  width: 36,
  height: 20,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 3,
    transitionDuration: "200ms",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: 0,
      },
    },
  },
  "& .MuiSwitch-thumb": { width: 14, height: 14 },
  "& .MuiSwitch-track": {
    borderRadius: 10,
    backgroundColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
    opacity: 1,
  },
}));

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <Paper
    elevation={0}
    sx={{
      position: "relative",
      p: "6px 10px 6px 12px",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1.5,
      display: "flex",
      alignItems: "center",
      gap: 1,
      overflow: "hidden",
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        bgcolor: color,
      }}
    />
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: 1,
        bgcolor: `${color}18`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
        "& svg": { fontSize: 15 },
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        noWrap
        sx={{ fontSize: 10.5, color: "text.secondary", lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography
        noWrap
        sx={{
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.25,
          color: "text.primary",
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

// ─── Add Employee Dialog ──────────────────────────────────────────────────────

interface AddEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (form: AddEmployeeForm) => void;
}

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [form, setForm] = useState<AddEmployeeForm>(DEFAULT_ADD_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AddEmployeeForm, string>>
  >({});

  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_ADD_FORM, olmId: generateOlmId() });
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AddEmployeeForm, string>> = {};
    if (!form.employeeName.trim()) newErrors.employeeName = "Name is required";
    if (!form.olmId.trim()) newErrors.olmId = "OLM ID is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (): void => {
    if (validate()) onAdd(form);
  };

  const handleLevelChange = (e: SelectChangeEvent<EmployeeLevel>): void =>
    setForm((f) => ({ ...f, employeeLevel: e.target.value as EmployeeLevel }));

  const handleRoleChange = (e: SelectChangeEvent<EmployeeRole>): void =>
    setForm((f) => ({ ...f, roll: e.target.value as EmployeeRole }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: 16 }}>
        Add Employee
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Full Name"
            size="small"
            fullWidth
            value={form.employeeName}
            onChange={(e) =>
              setForm((f) => ({ ...f, employeeName: e.target.value }))
            }
            error={!!errors.employeeName}
            helperText={errors.employeeName}
          />
          <TextField
            label="OLM ID"
            size="small"
            fullWidth
            value={form.olmId}
            onChange={(e) => setForm((f) => ({ ...f, olmId: e.target.value }))}
            error={!!errors.olmId}
            helperText={errors.olmId}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Level</InputLabel>
            <Select<EmployeeLevel>
              value={form.employeeLevel}
              label="Level"
              onChange={handleLevelChange}
            >
              <MenuItem value="L2">L2</MenuItem>
              <MenuItem value="L3">L3</MenuItem>
              <MenuItem value="L4">L4</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Role</InputLabel>
            <Select<EmployeeRole>
              value={form.roll}
              label="Role"
              onChange={handleRoleChange}
            >
              <MenuItem value="Onroll">Onroll</MenuItem>
              <MenuItem value="Contract">Contract</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" size="small">
          Add Employee
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface TaskConfigProps {
  data?: {
    userId: number;
    crqValidation: boolean;
    employeeLevel: "L2" | "L3" | "L4";
    employeeName: string;
    impactAnalysis: boolean;
    mopCreation: boolean;
    mopValidation: boolean;
    networkExecution: boolean;
    olmId: string;
    schedulingApprovals: boolean;
  }[];
  isLoading?: boolean;
  /** True while a filter change is re-fetching data for an already-rendered table. */
  isFetching?: boolean;
}

export const TaskConfig: React.FC<TaskConfigProps> = ({
  data: propData,
  isLoading,
  isFetching,
}) => {
  const [data, setData] = useState<TaskData[]>([]);
  const [search] = useState<string>("");
  const [levelFilter] = useState<EmployeeLevel | "All">("All");
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [snack, setSnack] = useState<SnackState>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (propData) {
      const mappedData: TaskData[] = propData.map((item, index) => ({
        id: index + 1,
        olmId: item.olmId,
        userId: item.userId,
        employeeName: item.employeeName,
        employeeLevel: item.employeeLevel,
        roll: "Onroll", // Default since not in API
        crqValidation: item.crqValidation,
        impactAnalysis: item.impactAnalysis,
        mopCreation: item.mopCreation,
        mopValidation: item.mopValidation,
        schedulingApprovals: item.schedulingApprovals,
        networkExecution: item.networkExecution,
      }));
      setData(mappedData);
    } else {
      setData([]);
    }
  }, [propData]);

  const [updateTaskConfig] = useUpdateTaskConfigMutation();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showSnack = (message: string, severity: AlertColor = "success"): void =>
    setSnack({ open: true, message, severity });

  const closeSnack = (
    _: React.SyntheticEvent | Event,
    reason?: string,
  ): void => {
    if (reason === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  };

  // ── Mutation Handlers ──────────────────────────────────────────────────────

  const handleToggle = useCallback(
    async (rowId: number, columnKey: TaskKey): Promise<void> => {
      const row = data.find((r) => r.id === rowId);
      if (!row) return;

      const currentValue = row[columnKey];
      const updatedValue = !currentValue;
      const affectedUserId = row.userId;

      setData((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, [columnKey]: updatedValue } : r,
        ),
      );

      if (affectedUserId === undefined || affectedUserId === 0) {
        showSnack(`Cannot update task config for unsaved employee.`, "warning");
        return;
      }

      try {
        await updateTaskConfig({
          affectedUserId,
          colName: columnKey,
          newValue: String(updatedValue),
        }).unwrap();
        showSnack(`${columnKey} updated successfully.`);
      } catch (error) {
        setData((prev) =>
          prev.map((r) =>
            r.id === rowId ? { ...r, [columnKey]: currentValue } : r,
          ),
        );
        showSnack(`Failed to update ${columnKey}.`, "error");
      }
    },
    [data, updateTaskConfig],
  );

  const handleEnableAll = useCallback((rowId: number): void => {
    setData((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const allEnabled = ALL_TASK_KEYS.every((k) => row[k]);
        const updated = ALL_TASK_KEYS.reduce<Partial<TaskFlags>>(
          (acc, k) => ({ ...acc, [k]: !allEnabled }),
          {},
        );
        return { ...row, ...updated };
      }),
    );
  }, []);

  const handleDelete = useCallback((rowId: number, name: string): void => {
    setData((prev) => prev.filter((r) => r.id !== rowId));
    showSnack(`${name} removed from task configuration.`, "info");
  }, []);

  const handleAdd = useCallback((form: AddEmployeeForm): void => {
    const newRow: TaskData = {
      id: data.length + 1,
      olmId: form.olmId,
      userId: 0,
      employeeName: form.employeeName,
      employeeLevel: form.employeeLevel,
      roll: form.roll,
      crqValidation: false,
      impactAnalysis: false,
      mopCreation: false,
      mopValidation: false,
      schedulingApprovals: false,
      networkExecution: false,
    };
    setData((prev) => [...prev, newRow]);
    setAddOpen(false);
    showSnack(`${form.employeeName} added successfully.`);
  }, []);

  const handleBulkAction = useCallback(
    (table: MRT_TableInstance<TaskData>, enable: boolean): void => {
      const selectedIds = table
        .getSelectedRowModel()
        .rows.map((r: MRT_Row<TaskData>) => r.original.id);
      if (!selectedIds.length) return;
      setData((prev) =>
        prev.map((row) => {
          if (!selectedIds.includes(row.id)) return row;
          const updated = ALL_TASK_KEYS.reduce<Partial<TaskFlags>>(
            (acc, k) => ({ ...acc, [k]: enable }),
            {},
          );
          return { ...row, ...updated };
        }),
      );
      table.resetRowSelection();
      showSnack(
        `${selectedIds.length} employee(s) ${enable ? "fully enabled" : "fully restricted"}.`,
      );
    },
    [],
  );

  // ── Derived Stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = data.length;
    const totalToggles = total * ALL_TASK_KEYS.length;
    const activeToggles = data.reduce(
      (s, r) => s + ALL_TASK_KEYS.filter((k) => r[k]).length,
      0,
    );
    const fullAccess = data.filter((r) =>
      ALL_TASK_KEYS.every((k) => r[k]),
    ).length;
    const restricted = total - fullAccess;
    return { total, totalToggles, activeToggles, fullAccess, restricted };
  }, [data]);

  // ── Filtered Data ──────────────────────────────────────────────────────────

  const filteredData = useMemo<TaskData[]>(() => {
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        (levelFilter === "All" || r.employeeLevel === levelFilter) &&
        (r.employeeName.toLowerCase().includes(q) ||
          r.olmId.toLowerCase().includes(q)),
    );
  }, [data, search, levelFilter]);

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns = useMemo<MRT_ColumnDef<TaskData>[]>(
    () => [
      {
        accessorKey: "olmId",
        header: "OLM ID",
        size: 105,

        Cell: ({ cell }) => (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: "text.secondary",
              fontFamily: "monospace",
            }}
          >
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "employeeName",
        header: "Employee",
        size: 210,
        Cell: ({ cell }) => {
          const name = cell.getValue<string>();
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: "primary.light",
                  color: "primary.dark",
                  flexShrink: 0,
                }}
              >
                {getInitials(name)}
              </Avatar>
              <Typography sx={{ fontSize: 13 }}>{name}</Typography>
            </Box>
          );
        },
      },
      {
        accessorKey: "employeeLevel",
        header: "Level",
        size: 70,
        Cell: ({ cell }) => {
          const level = cell.getValue<EmployeeLevel>();
          const colorMap: Record<
            EmployeeLevel,
            "secondary" | "primary" | "success"
          > = {
            L4: "secondary",
            L3: "primary",
            L2: "success",
          };
          return (
            <Chip
              label={level}
              size="small"
              color={colorMap[level]}
              variant="outlined"
              sx={{ fontSize: 11, fontWeight: 700, height: 20 }}
            />
          );
        },
      },
      {
        accessorKey: "roll",
        header: "Role",
        size: 95,
        Cell: ({ cell }) => {
          const role = cell.getValue<EmployeeRole>();
          return (
            <Chip
              label={role}
              size="small"
              variant="filled"
              color={role === "Contract" ? "warning" : "default"}
              sx={{ fontSize: 11, height: 20 }}
            />
          );
        },
      },
      // ── Task Toggle Columns ──
      ...TASK_COLUMNS.map<MRT_ColumnDef<TaskData>>((col) => ({
        accessorKey: col.key,
        header: col.label,

        Header: () => (
          <Tooltip title={col.fullLabel} placement="top" arrow>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {col.label}
            </Typography>
          </Tooltip>
        ),
        size: 80,
        enableSorting: false,

        Cell: ({
          cell,
          row,
        }: {
          cell: MRT_Cell<TaskData, unknown>;
          row: MRT_Row<TaskData>;
        }) => (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Tooltip
              title={`${cell.getValue() ? "Disable" : "Enable"} ${col.fullLabel}`}
              placement="top"
              arrow
            >
              <ActionSwitch
                size="small"
                checked={Boolean(cell.getValue())}
                onChange={() => handleToggle(row.original.id, col.key)}
              />
            </Tooltip>
          </Box>
        ),
      })),
    ],
    [data, handleToggle, handleEnableAll, handleDelete],
  );

  // ── Table ──────────────────────────────────────────────────────────────────

  const table = useAppTable<TaskData>({
    columns,
    data: filteredData,
    enableSorting: true,
    enablePagination: false,
    enableRowSelection: false,
    initialState: { density: "compact" },
    state: { isLoading: isFetching },
    muiTableContainerProps: {
      sx: {
        maxHeight: {
          xs: "calc(100vh - 400px)",
          sm: "calc(100vh - 380px)",
          md: "calc(100vh - 360px)",
          lg: "calc(100vh - 340px)",
          xl: "calc(100vh - 320px)",
        },
        minHeight: 240,
      },
    },

    muiTableBodyRowProps: {
      sx: { "&:hover": { backgroundColor: "rgba(24, 95, 165, 0.03)" } },
    },

    
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 1,
          mb: 1.5,
        }}
      >
        <StatCard
          label="Total Employees"
          value={stats.total}
          icon={<PeopleAltOutlinedIcon fontSize="small" />}
          color="#185FA5"
        />
        <StatCard
          label="Tasks Enabled"
          value={`${stats.activeToggles}/${stats.totalToggles}`}
          icon={<TaskAltIcon fontSize="small" />}
          color="#0F6E56"
        />
        <StatCard
          label="Full Access"
          value={stats.fullAccess}
          icon={<LockOpenOutlinedIcon fontSize="small" />}
          color="#3B6D11"
        />
        <StatCard
          label="Restricted"
          value={stats.restricted}
          icon={<LockOutlinedIcon fontSize="small" />}
          color="#854F0B"
        />
      </Box>

      {/* Table */}
      <MaterialReactTable table={table} />

      {/* Add Dialog */}
      <AddEmployeeDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant="filled"
          sx={{ fontSize: 13 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskConfig;
