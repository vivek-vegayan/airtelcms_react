import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Add,
  CalendarToday,
  Delete,
  Edit,
  LocationOn,
  WarningAmberRounded,
} from "@mui/icons-material";
import dayjs from "dayjs";
import {
  MaterialReactTable,

  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../../components/ui/AppTable";
import {
  useGetHolidayDataQuery,
  useGetLocationOptionsQuery,
  useAddHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  type Holiday,
  type LocationOption,
} from "../../api/globalSettingApiSlice";

// ─── Constants ────────────────────────────────────────────────────────────────
const FONT = "'DM Sans', sans-serif";
const GRADIENT = "linear-gradient(135deg, #2d3a8c 0%, #3b4fd8 100%)";
const OTHER_VALUE = "__other__";

// ─── Status config ────────────────────────────────────────────────────────────
const getStatus = (date: string): "upcoming" | "past" =>
  dayjs(date).isBefore(dayjs(), "day") ? "past" : "upcoming";

const STATUS_CFG = {
  upcoming: {
    label: "Upcoming",
    bg: "#eff6ff",
    darkBg: "rgba(59,130,246,0.14)",
    color: "#1d4ed8",
    darkColor: "#93c5fd",
    dot: "#3b82f6",
    darkDot: "#60a5fa",
    bar: "#3b82f6",
    darkBar: "#3b82f6",
    rowBg: "rgba(239,246,255,0.35)",
    darkRowBg: "rgba(59,130,246,0.04)",
  },
  past: {
    label: "Past",
    bg: "#f8fafc",
    darkBg: "rgba(148,163,184,0.12)",
    color: "#64748b",
    darkColor: "#94a3b8",
    dot: "#94a3b8",
    darkDot: "#64748b",
    bar: "#cbd5e1",
    darkBar: "#475569",
    rowBg: "transparent",
    darkRowBg: "transparent",
  },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface HolidayForm {
  holidayOccasion: string;
  holidayDate: string;
  location: string; // selected dropdown value OR OTHER_VALUE
  locationManual: string; // filled when location === OTHER_VALUE
}

const EMPTY_FORM: HolidayForm = {
  holidayOccasion: "",
  holidayDate: "",
  location: "",
  locationManual: "",
};

// ─── Snackbar state ───────────────────────────────────────────────────────────
interface SnackState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Add Dialog
// ─────────────────────────────────────────────────────────────────────────────
interface AddDialogProps {
  open: boolean;
  onClose: () => void;
  locationOptions: LocationOption[];
  isDark: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  addHoliday: (p: {
    location: string;
    holidayDate: string;
    holidayOccasion: string;
  }) => Promise<void>;
  isAdding: boolean;
}

const AddHolidayDialog: React.FC<AddDialogProps> = ({
  open,
  onClose,
  locationOptions,
  isDark,
  onSuccess,
  onError,
  addHoliday,
  isAdding,
}) => {
  const [form, setForm] = useState<HolidayForm>(EMPTY_FORM);

  const ink = isDark ? "#f1f5f9" : "#0f172a";
  const ink2 = isDark ? "#94a3b8" : "#475569";
  const ink3 = isDark ? "#64748b" : "#94a3b8";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const slate = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      fontSize: "13px",
      fontFamily: FONT,
      backgroundColor: slate,
      "& fieldset": { borderColor: border },
      "&:hover fieldset": {
        borderColor: isDark ? "rgba(255,255,255,0.25)" : "#a5b4fc",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#3b4fd8",
        borderWidth: "1.5px",
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: "12.5px",
      fontFamily: FONT,
      color: ink3,
      "&.Mui-focused": { color: "#3b4fd8" },
    },
    "& .MuiInputBase-input": { color: ink },
    "& .MuiSelect-icon": { color: ink3 },
  };

  const resolvedLocation =
    form.location === OTHER_VALUE ? form.locationManual.trim() : form.location;

  const handleSubmit = async () => {
    if (
      !form.holidayOccasion.trim() ||
      !form.holidayDate ||
      !resolvedLocation
    ) {
      onError("Please fill in all fields.");
      return;
    }
    await addHoliday({
      location: resolvedLocation,
      holidayDate: form.holidayDate,
      holidayOccasion: form.holidayOccasion.trim(),
    });
    onSuccess("Holiday added successfully.");
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          background: isDark ? "#1e293b" : "#fff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"}`,
          boxShadow: "0 20px 60px rgba(15,23,42,0.22)",
        },
      }}
    >
      {/* Gradient header */}
      <Box
        sx={{
          background: GRADIENT,
          px: 3,
          pt: 3,
          pb: 2.5,
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.5,
          }}
        >
          <Add sx={{ fontSize: 22, color: "#fff" }} />
        </Box>
        <Typography
          sx={{
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            fontFamily: FONT,
            lineHeight: 1.3,
          }}
        >
          Add new holiday
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            fontFamily: FONT,
            mt: 0.4,
          }}
        >
          Fill in the details to create a holiday entry
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Occasion */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: ink3,
                fontFamily: FONT,
                mb: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Occasion Name
            </Typography>
            <TextField
              placeholder="e.g. Diwali, Republic Day"
              value={form.holidayOccasion}
              onChange={(e) =>
                setForm({ ...form, holidayOccasion: e.target.value })
              }
              fullWidth
              size="small"
              sx={fieldSx}
            />
          </Box>

          {/* Date */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: ink3,
                fontFamily: FONT,
                mb: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Holiday Date
            </Typography>
            <TextField
              type="date"
              value={form.holidayDate}
              onChange={(e) =>
                setForm({ ...form, holidayDate: e.target.value })
              }
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={fieldSx}
            />
            {form.holidayDate && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.75,
                }}
              >
                <CalendarToday sx={{ fontSize: 11, color: "#3b4fd8" }} />
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#3b4fd8",
                    fontFamily: FONT,
                    fontWeight: 500,
                  }}
                >
                  {dayjs(form.holidayDate).format("dddd, DD MMMM YYYY")}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Location dropdown */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: ink3,
                fontFamily: FONT,
                mb: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Location
            </Typography>
            <TextField
              select
              placeholder="Select location"
              value={form.location}
              onChange={(e) =>
                setForm({
                  ...form,
                  location: e.target.value,
                  locationManual: "",
                })
              }
              fullWidth
              size="small"
              sx={fieldSx}
            >
              {locationOptions.map((opt) => (
                <MenuItem
                  key={opt.location}
                  value={opt.location}
                  sx={{ fontSize: "13px", fontFamily: FONT }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <LocationOn sx={{ fontSize: 13, color: "#94a3b8" }} />
                    {opt.location}
                  </Box>
                </MenuItem>
              ))}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                value={OTHER_VALUE}
                sx={{
                  fontSize: "13px",
                  fontFamily: FONT,
                  color: "#3b4fd8",
                  fontWeight: 600,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Add sx={{ fontSize: 14 }} />
                  Other (enter manually)
                </Box>
              </MenuItem>
            </TextField>

            {/* Manual location input — shown only when "Other" is selected */}
            {form.location === OTHER_VALUE && (
              <TextField
                placeholder="Type your location..."
                value={form.locationManual}
                onChange={(e) =>
                  setForm({ ...form, locationManual: e.target.value })
                }
                fullWidth
                size="small"
                autoFocus
                sx={{ ...fieldSx, mt: 1.25 }}
              />
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "13px",
            color: ink2,
            border: `1px solid ${border}`,
            fontFamily: FONT,
            px: 2,
            "&:hover": {
              background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isAdding}
          variant="contained"
          startIcon={
            isAdding ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              <Add sx={{ fontSize: 16 }} />
            )
          }
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "13px",
            background: GRADIENT,
            fontFamily: FONT,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(59,79,216,0.35)",
            flex: 1,
            "&:hover": {
              background: "linear-gradient(135deg, #232e73 0%, #2f3fb5 100%)",
              boxShadow: "0 6px 20px rgba(59,79,216,0.4)",
            },
            "&:disabled": { background: "rgba(59,79,216,0.5)", color: "#fff" },
          }}
        >
          {isAdding ? "Saving..." : "Save holiday"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Edit Dialog
// ─────────────────────────────────────────────────────────────────────────────
interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  holiday: Holiday | null;
  locationOptions: LocationOption[];
  isDark: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  updateHoliday: (p: {
    holidayId: number;
    location: string;
    holidayDate: string;
    holidayOccasion: string;
  }) => Promise<void>;
  isUpdating: boolean;
}

const EditHolidayDialog: React.FC<EditDialogProps> = ({
  open,
  onClose,
  holiday,
  locationOptions,
  isDark,
  onSuccess,
  onError,
  updateHoliday,
  isUpdating,
}) => {
  // Keep form state and ensure it syncs whenever the selected `holiday`
  // or `locationOptions` change. Initialising from props inside an
  // effect avoids stale-initialiser issues and guarantees inputs are
  // populated and remain editable.
  const [form, setForm] = useState<HolidayForm>(EMPTY_FORM);

  React.useEffect(() => {
    if (!holiday) {
      setForm(EMPTY_FORM);
      return;
    }
    const isKnown = locationOptions.some((o) => o.location === holiday.location);
    setForm({
      holidayOccasion: holiday.holidayOccasion ?? "",
      holidayDate: holiday.holidayDate ?? "",
      location: isKnown ? holiday.location : OTHER_VALUE,
      locationManual: isKnown ? "" : holiday.location ?? "",
    });
  }, [holiday, locationOptions, open]);

  const ink = isDark ? "#f1f5f9" : "#0f172a";
  const ink2 = isDark ? "#94a3b8" : "#475569";
  const ink3 = isDark ? "#64748b" : "#94a3b8";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const slate = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      fontSize: "13px",
      fontFamily: FONT,
      backgroundColor: slate,
      "& fieldset": { borderColor: border },
      "&:hover fieldset": {
        borderColor: isDark ? "rgba(255,255,255,0.25)" : "#a5b4fc",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#3b4fd8",
        borderWidth: "1.5px",
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: "12.5px",
      fontFamily: FONT,
      color: ink3,
      "&.Mui-focused": { color: "#3b4fd8" },
    },
    "& .MuiInputBase-input": { color: ink },
    "& .MuiSelect-icon": { color: ink3 },
  };

  const resolvedLocation =
    form.location === OTHER_VALUE ? form.locationManual.trim() : form.location;



  const handleSubmit = async () => {
    if (
      !form.holidayOccasion.trim() ||
      !form.holidayDate ||
      !resolvedLocation
    ) {
      onError("Please fill in all fields.");
      return;
    }
    await updateHoliday({
      holidayId: holiday?.holidayId ?? 0,
      location: resolvedLocation,
      holidayDate: form.holidayDate,
      holidayOccasion: form.holidayOccasion.trim(),
    });
    onSuccess("Holiday updated successfully.");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          background: isDark ? "#1e293b" : "#fff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"}`,
          boxShadow: "0 20px 60px rgba(15,23,42,0.22)",
        },
      }}
    >
      {/* Amber-tinted header to distinguish from Add */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)",
          px: 3,
          pt: 3,
          pb: 2.5,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.5,
          }}
        >
          <Edit sx={{ fontSize: 20, color: "#fff" }} />
        </Box>
        <Typography
          sx={{
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            fontFamily: FONT,
            lineHeight: 1.3,
          }}
        >
          Edit holiday
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "12px",
            fontFamily: FONT,
            mt: 0.4,
          }}
        >
          Update the details for this holiday entry
        </Typography>

        {/* Holiday ID badge */}
        {holiday?.holidayId && (
          <Box
            sx={{
              mt: 1.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: "8px",
              py: "3px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.12)",
              border: "0.5px solid rgba(255,255,255,0.2)",
            }}
          >
            <Typography
              sx={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.6)",
                fontFamily: FONT,
                fontWeight: 600,
              }}
            >
              ID #{holiday.holidayId}
            </Typography>
          </Box>
        )}
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Occasion */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: ink3,
                fontFamily: FONT,
                mb: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Occasion Name
            </Typography>
            <TextField
              placeholder="e.g. Diwali, Republic Day"
              value={form.holidayOccasion}
              onChange={(e) =>
                setForm({ ...form, holidayOccasion: e.target.value })
              }
              fullWidth
              size="small"
              InputProps={{
                readOnly: false,
              }}
              sx={fieldSx}
            />
          </Box>

          {/* Date */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: ink3,
                fontFamily: FONT,
                mb: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Holiday Date
            </Typography>
            <TextField
              type="date"
              value={form.holidayDate}
              onChange={(e) =>
                setForm({ ...form, holidayDate: e.target.value })
              }
              fullWidth
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                readOnly: false,
              }}
              sx={fieldSx}
            />
            {form.holidayDate && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 0.75,
                }}
              >
                <CalendarToday sx={{ fontSize: 11, color: "#1d4ed8" }} />
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#1d4ed8",
                    fontFamily: FONT,
                    fontWeight: 500,
                  }}
                >
                  {dayjs(form.holidayDate).format("dddd, DD MMMM YYYY")}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Location */}
          <Box>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: ink3,
                fontFamily: FONT,
                mb: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Location
            </Typography>
            <TextField
              select
              value={form.location}
              onChange={(e) =>
                setForm({
                  ...form,
                  location: e.target.value,
                  locationManual: "",
                })
              }
              fullWidth
              size="small"
              InputProps={{
                readOnly: false,
              }}
              sx={fieldSx}
            >
              {locationOptions.map((opt) => (
                <MenuItem
                  key={opt.location}
                  value={opt.location}
                  sx={{ fontSize: "13px", fontFamily: FONT }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <LocationOn sx={{ fontSize: 13, color: "#94a3b8" }} />
                    {opt.location}
                  </Box>
                </MenuItem>
              ))}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                value={OTHER_VALUE}
                sx={{
                  fontSize: "13px",
                  fontFamily: FONT,
                  color: "#1d4ed8",
                  fontWeight: 600,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Add sx={{ fontSize: 14 }} />
                  Other (enter manually)
                </Box>
              </MenuItem>
            </TextField>

            {form.location === OTHER_VALUE && (
              <TextField
                placeholder="Type your location..."
                value={form.locationManual}
                onChange={(e) =>
                  setForm({ ...form, locationManual: e.target.value })
                }
                fullWidth
                size="small"
                InputProps={{
                  readOnly: false,
                }}
                autoFocus
                sx={{ ...fieldSx, mt: 1.25 }}
              />
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "13px",
            color: ink2,
            border: `1px solid ${border}`,
            fontFamily: FONT,
            px: 2,
            "&:hover": {
              background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isUpdating}
          variant="contained"
          startIcon={
            isUpdating ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              <Edit sx={{ fontSize: 15 }} />
            )
          }
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "13px",
            background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)",
            fontFamily: FONT,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
            flex: 1,
            "&:hover": {
              background: "linear-gradient(135deg, #172d4a 0%, #1a45c2 100%)",
              boxShadow: "0 6px 20px rgba(29,78,216,0.4)",
            },
            "&:disabled": { background: "rgba(29,78,216,0.5)", color: "#fff" },
          }}
        >
          {isUpdating ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Delete Dialog
// ─────────────────────────────────────────────────────────────────────────────
interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  holiday: Holiday | null;
  isDark: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  deleteHoliday: (id: number) => Promise<void>;
  isDeleting: boolean;
}

const DeleteHolidayDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  holiday,
  isDark,
  onSuccess,
  onError,
  deleteHoliday,
  isDeleting,
}) => {
  const ink = isDark ? "#f1f5f9" : "#0f172a";
  const ink2 = isDark ? "#94a3b8" : "#475569";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9";

  const handleDelete = async () => {
    if (!holiday?.holidayId) {
      onError("No holiday selected.");
      return;
    }
    try {
      await deleteHoliday(holiday.holidayId);
      onSuccess(`"${holiday.holidayOccasion}" deleted successfully.`);
      onClose();
    } catch {
      onError("Failed to delete holiday. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          background: isDark ? "#1e293b" : "#fff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"}`,
          boxShadow: "0 20px 60px rgba(15,23,42,0.22)",
        },
      }}
    >
      {/* Red-tinted header */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)"
            : "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
          px: 3,
          pt: 3,
          pb: 2.5,
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#fecdd3"}`,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            background: isDark ? "rgba(220,38,38,0.2)" : "#fef2f2",
            border: `1px solid ${isDark ? "rgba(220,38,38,0.3)" : "#fecaca"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.5,
          }}
        >
          <WarningAmberRounded sx={{ fontSize: 26, color: "#dc2626" }} />
        </Box>
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            fontFamily: FONT,
            lineHeight: 1.3,
            color: isDark ? "#fca5a5" : "#991b1b",
          }}
        >
          Delete holiday
        </Typography>
        <Typography
          sx={{
            fontSize: "12px",
            fontFamily: FONT,
            mt: 0.4,
            color: isDark ? "rgba(252,165,165,0.6)" : "#b91c1c",
          }}
        >
          This action is permanent and cannot be undone
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
        {/* Holiday detail card */}
        <Box
          sx={{
            p: 2,
            borderRadius: "12px",
            background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0"}`,
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#94a3b8",
              fontFamily: FONT,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.75,
            }}
          >
            Holiday to be deleted
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 700,
              color: ink,
              fontFamily: FONT,
              mb: 0.5,
            }}
          >
            {holiday?.holidayOccasion ?? "—"}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {holiday?.holidayDate && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 11, color: "#94a3b8" }} />
                <Typography
                  sx={{ fontSize: "11.5px", color: ink2, fontFamily: FONT }}
                >
                  {dayjs(holiday.holidayDate).format("DD MMM YYYY")}
                </Typography>
              </Box>
            )}
            {holiday?.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 12, color: "#94a3b8" }} />
                <Typography
                  sx={{ fontSize: "11.5px", color: ink2, fontFamily: FONT }}
                >
                  {holiday.location}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: "12.5px",
            color: ink2,
            fontFamily: FONT,
            lineHeight: 1.7,
          }}
        >
          Are you sure you want to permanently delete this holiday? Once
          deleted, it will be removed from all schedules.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "13px",
            color: ink2,
            border: `1px solid ${border}`,
            fontFamily: FONT,
            px: 2.5,
            "&:hover": {
              background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
            },
          }}
        >
          Keep it
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="contained"
          startIcon={
            isDeleting ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              <Delete sx={{ fontSize: 15 }} />
            )
          }
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontSize: "13px",
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            fontFamily: FONT,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(220,38,38,0.35)",
            flex: 1,
            "&:hover": {
              background: "linear-gradient(135deg, #c21f1f 0%, #a11616 100%)",
              boxShadow: "0 6px 20px rgba(220,38,38,0.45)",
            },
            "&:disabled": { background: "rgba(220,38,38,0.5)", color: "#fff" },
          }}
        >
          {isDeleting ? "Deleting..." : "Yes, delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component: HolidayListTable
// ─────────────────────────────────────────────────────────────────────────────
export const HolidayListTable: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const ink = isDark ? "#f1f5f9" : "#0f172a";
  const ink2 = isDark ? "#94a3b8" : "#475569";
  const ink3 = isDark ? "#64748b" : "#94a3b8";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9";
  const surfaceBg = isDark ? "#1e293b" : "#ffffff";
  const subSurface = isDark ? "rgba(255,255,255,0.03)" : "#fafbfc";
  const slate = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc";

  // ─── API ───────────────────────────────────────────────────────────────────
  const {
    data: holidays = [],
    isLoading,
    isFetching,
  } = useGetHolidayDataQuery();
  const { data: locationOptions = [] } = useGetLocationOptionsQuery();
  const [addHoliday, { isLoading: isAdding }] = useAddHolidayMutation();
  const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  // ─── Dialog states ─────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  // ─── Filter & snackbar ─────────────────────────────────────────────────────
  const [filter, setFilter] = useState<"all" | "upcoming">("all");
  const [snackbar, setSnackbar] = useState<SnackState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSuccess = useCallback(
    (msg: string) =>
      setSnackbar({ open: true, message: msg, severity: "success" }),
    [],
  );
  const showError = useCallback(
    (msg: string) =>
      setSnackbar({ open: true, message: msg, severity: "error" }),
    [],
  );

  // ─── Mutation wrappers (strip return for sub-components) ───────────────────
  const handleAdd = useCallback(
    async (p: {
      location: string;
      holidayDate: string;
      holidayOccasion: string;
    }) => {
      await addHoliday(p).unwrap();
    },
    [addHoliday],
  );

  const handleUpdate = useCallback(
    async (p: {
      location: string;
      holidayId: number;
      holidayDate: string;
      holidayOccasion: string;
    }) => {
      await updateHoliday(p).unwrap();
    },
    [updateHoliday],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteHoliday(id).unwrap();
    },
    [deleteHoliday],
  );

  // ─── Derived data ──────────────────────────────────────────────────────────
  const filteredData = useMemo(
    () =>
      filter === "upcoming"
        ? holidays.filter((r) => !dayjs(r.holidayDate).isBefore(dayjs(), "day"))
        : holidays,
    [holidays, filter],
  );

  const stats = useMemo(() => {
    const upcoming = holidays.filter(
      (r) => !dayjs(r.holidayDate).isBefore(dayjs(), "day"),
    ).length;
    return {
      total: holidays.length,
      upcoming,
      past: holidays.length - upcoming,
    };
  }, [holidays]);

  // ─── Action button style ───────────────────────────────────────────────────
  const actBtn = useCallback(
    (type: "edit" | "delete") => ({
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
    }),
    [isDark, ink2, border, surfaceBg],
  );

  // ─── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<MRT_ColumnDef<Holiday>[]>(
    () => [
      {
        accessorKey: "holidayOccasion",
        header: "Occasion",
        Cell: ({ cell, row }) => {
          const status = getStatus(row.original.holidayDate);
          const cfg = STATUS_CFG[status];
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 3,
                  height: 34,
                  borderRadius: 2,
                  flexShrink: 0,
                  background: isDark ? cfg.darkBar : cfg.bar,
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
                  {cell.getValue<string>()}
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
        accessorKey: "holidayDate",
        header: "Date",
        Cell: ({ row }) => (
          <Box>
            <Typography
              sx={{
                fontSize: "11.5px",
                fontWeight: 600,
                color: ink,
                fontFamily: "'JetBrains Mono','Courier New',monospace",
                letterSpacing: "-0.2px",
                lineHeight: 1.3,
              }}
            >
              {dayjs(row.original.holidayDate).format("DD MMM YYYY")}
            </Typography>
            <Typography
              sx={{ fontSize: "10px", color: ink2, fontFamily: FONT, mt: 0.25 }}
            >
              {row.original.holidayDay ??
                dayjs(row.original.holidayDate).format("dddd")}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
        Cell: ({ cell }) => (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: "8px",
              py: "3px",
              borderRadius: "20px",
              border: `0.5px solid ${border}`,
              background: slate,
            }}
          >
            <LocationOn sx={{ fontSize: 10, color: ink3 }} />
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 500,
                color: ink2,
                fontFamily: FONT,
              }}
            >
              {cell.getValue<string>()}
            </Typography>
          </Box>
        ),
      },
      {
        id: "action",
        header: "Actions",
        size: 80,
        Cell: ({ row }) => (
          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
            <Tooltip title="Edit holiday" placement="top">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedHoliday(row.original);
                  setEditOpen(true);
                }}
                sx={actBtn("edit")}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete holiday" placement="top">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedHoliday(row.original);
                  setDeleteOpen(true);
                }}
                sx={actBtn("delete")}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [isDark, ink, ink2, ink3, border, slate, actBtn],
  );

  const table = useAppTable<Holiday>({
    columns,
    data: filteredData,
    enableSorting: false,
    enablePagination: false,
    initialState: { density: "compact", columnPinning: { right: ["action"] } },
    muiTableBodyRowProps: ({ row }) => {
      const cfg = STATUS_CFG[getStatus(row.original.holidayDate)];
      return {
        sx: {
          background: isDark ? cfg.darkRowBg : cfg.rowBg,
          "&:hover td": {
            background: isDark ? "rgba(255,255,255,0.02)" : "#fafbff",
          },
          "&:last-child td": { borderBottom: "none" },
          transition: "background 0.12s",
        },
      };
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: "360px",
        background: surfaceBg,
        "&::-webkit-scrollbar": { width: "3px" },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: isDark ? "#334155" : "#e2e8f0",
          borderRadius: "4px",
        },
      },
    },
  });

  const apiLoading = isLoading || isFetching;

  return (
    <>
      <Backdrop
        open={apiLoading}
        sx={{
          zIndex: 9999,
          backdropFilter: "blur(3px)",
          background: "rgba(0,0,0,0.18)",
        }}
      >
        <CircularProgress size={28} sx={{ color: "#3b4fd8" }} />
      </Backdrop>

      {/* ── Main card ── */}
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
        {/* Header */}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Tooltip title="Add holiday" placement="bottom">
              <IconButton
                onClick={() => setAddOpen(true)}
                size="small"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  border: "0.5px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.12)",
                  "&:hover": { background: "rgba(255,255,255,0.2)" },
                  color: "#fff",
                  transition: "all 0.15s",
                }}
              >
                <Add sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Box>
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
                Holiday Schedule
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "10.5px",
                  fontFamily: FONT,
                  lineHeight: 1,
                }}
              >
                Manage team holidays
              </Typography>
            </Box>
          </Box>

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

        {/* Stats */}
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
            { label: "Past", value: stats.past, color: ink2 },
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

        <MaterialReactTable table={table} />
      </Box>

      {/* ── Separate dialogs ── */}
      <AddHolidayDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        locationOptions={locationOptions}
        isDark={isDark}
        onSuccess={showSuccess}
        onError={showError}
        addHoliday={handleAdd}
        isAdding={isAdding}
      />

      <EditHolidayDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        holiday={selectedHoliday}
        locationOptions={locationOptions}
        isDark={isDark}
        onSuccess={showSuccess}
        onError={showError}
        updateHoliday={handleUpdate}
        isUpdating={isUpdating}
      />

      <DeleteHolidayDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        holiday={selectedHoliday}
        isDark={isDark}
        onSuccess={showSuccess}
        onError={showError}
        deleteHoliday={handleDelete}
        isDeleting={isDeleting}
      />

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{
            borderRadius: "10px",
            fontFamily: FONT,
            fontSize: "12.5px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
