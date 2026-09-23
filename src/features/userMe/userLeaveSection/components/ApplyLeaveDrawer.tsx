
import {
  Drawer,
  Box,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Alert,
  Collapse,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import { useState, useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import NightsStayRoundedIcon from "@mui/icons-material/NightsStayRounded";
// import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
// import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import { useApplyLeaveMutation, useGetLeaveTypesQuery } from "../api/leave.api";
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onClose: () => void;
}

type DurationType = "Full Day" | "Half Day";
type HalfDaySession = "FirstHalf" | "SecondHalf";

const SESSION_OPTIONS: {
  value: HalfDaySession;
  label: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "FirstHalf",
    label: "First Half",
    sub: "Morning session",
    icon: <WbSunnyRoundedIcon sx={{ fontSize: 18 }} />,
  },
  {
    value: "SecondHalf",
    label: "Second Half",
    sub: "Afternoon session",
    icon: <NightsStayRoundedIcon sx={{ fontSize: 18 }} />,
  },
];

function getDayCount(
  start: string,
  end: string,
  duration: DurationType,
): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return null;
  const diff =
    Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return duration === "Half Day" ? 0.5 : diff;
}

const fieldLabelSx = {
  mb: 1,
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "text.secondary",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "primary.main",
      borderWidth: "1.5px",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderWidth: "2px",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.875rem",
  },
};
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export default function ApplyLeaveDrawer({ open, onClose }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [applyLeave, { isLoading, isError, error }] = useApplyLeaveMutation();
  const { data: leaveTypes = [], isLoading: typesLoading } =
    useGetLeaveTypesQuery();

  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    duration: "Full Day" as DurationType,
    session: "First Half" as HalfDaySession,
  });

  const [touched, setTouched] = useState({
    leaveType: false,
    startDate: false,
    endDate: false,
    reason: false,
  });

  const isHalfDay = form.duration === "Half Day";

  const dayCount = useMemo(
    () => getDayCount(form.startDate, form.endDate, form.duration),
    [form.startDate, form.endDate, form.duration],
  );

  const isEndBeforeStart =
    form.startDate &&
    form.endDate &&
    new Date(form.endDate) < new Date(form.startDate);

  const canSubmit =
    !isLoading &&
    form.leaveType &&
    form.startDate &&
    (isHalfDay || form.endDate) &&
    !isEndBeforeStart &&
    form.reason.trim().length > 0;

  const handleDurationChange = (val: DurationType) => {
    setForm((f) => ({
      ...f,
      duration: val,
      endDate: val === "Half Day" ? f.startDate : f.endDate,
    }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      startDate: val,
      endDate: f.duration === "Half Day" ? val : f.endDate,
    }));
  };

  const handleSubmit = async () => {
    setTouched({ leaveType: true, startDate: true, endDate: true, reason: true });
    if (!canSubmit) return;

    try {
      const res = await applyLeave({
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: isHalfDay ? form.startDate : form.endDate,
        reason: form.reason,
        leaveDuration: form.duration,
        ...(isHalfDay && { session: form.session }),
      }).unwrap();

      // 🔥 CORE LOGIC
      if (res.status === "Success") {
        toast.success(res.message || "Leave applied successfully");

        setForm({
          leaveType: "",
          startDate: "",
          endDate: "",
          reason: "",
          duration: "Full Day",
          session: "FirstHalf",
        });

        setTouched({ leaveType: false, startDate: false, endDate: false, reason: false });

        onClose();
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch (err: any) {
      // Fallback error handling
      const msg =
        err?.data?.message ||
        "Failed to submit leave request. Please try again.";

      toast.error(msg);
    }
  };

  const accentBlue = "#2563EB";
  const accentBlueSoft = isDark ? alpha("#2563EB", 0.15) : "#EFF6FF";
  const accentBlueBorder = isDark ? alpha("#2563EB", 0.5) : "#BFDBFE";

  const selectionCardSx = (active: boolean) => ({
    flex: 1,
    py: 1.5,
    px: 2,
    borderRadius: "12px",
    border: "1.5px solid",
    borderColor: active
      ? accentBlue
      : isDark
        ? "rgba(255,255,255,0.1)"
        : "#E5E7EB",
    bgcolor: active
      ? accentBlueSoft
      : isDark
        ? "rgba(255,255,255,0.03)"
        : "#FAFAFA",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      borderColor: active ? accentBlue : accentBlueBorder,
      bgcolor: accentBlueSoft,
      transform: "translateY(-1px)",
      boxShadow: `0 4px 12px ${alpha(accentBlue, 0.12)}`,
    },
  });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 280, exit: 220 }}
      PaperProps={{
        elevation: 0,
        sx: {
          width: { xs: "100vw", sm: 460 },
          bgcolor: isDark ? "#0F1117" : "#FFFFFF",
          backgroundImage: "none",
          borderLeft: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "#F0F0F0",
          boxShadow: isDark
            ? "-24px 0 64px rgba(0,0,0,0.6)"
            : "-24px 0 64px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* ── HEADER ── */}
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2.5,
            borderBottom: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
            background: isDark
              ? "linear-gradient(145deg, #141820 0%, #0F1117 100%)"
              : "linear-gradient(145deg, #F8FAFF 0%, #FFFFFF 100%)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${alpha(accentBlue, 0.08)}, transparent 70%)`,
              pointerEvents: "none",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  background: `linear-gradient(135deg, ${accentBlue} 0%, #1D4ED8 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 8px 20px ${alpha(accentBlue, 0.35)}`,
                  flexShrink: 0,
                }}
              >
                <EventNoteRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: isDark ? "#F9FAFB" : "#111827",
                    lineHeight: 1.3,
                  }}
                >
                  Apply for Leave
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280",
                    mt: 0.2,
                  }}
                >
                  Submit a new leave request
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close drawer"
              sx={{
                color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
                width: 32,
                height: 32,
                transition: "all 0.18s ease",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6",
                  color: isDark ? "#F9FAFB" : "#111827",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "#D1D5DB",
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* ── BODY ── */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            px: 3,
            py: 3,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
              borderRadius: 4,
            },
          }}
        >
          <Stack spacing={3}>
            {/* Error Alert */}
            <Collapse in={isError} unmountOnExit>
              <Alert
                severity="error"
                variant="outlined"
                sx={{
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  "& .MuiAlert-icon": { fontSize: 18 },
                }}
              >
                {(error as any)?.data?.message ??
                  "Failed to submit. Please try again."}
              </Alert>
            </Collapse>

            {/* ── SECTION: Leave Details ── */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF",
                  }}
                >
                  Leave Details
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: "1px",
                    bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                  }}
                />
              </Box>

              <Stack spacing={2.5}>
                {/* Leave Type */}
                <Box>
                  <Typography
                    component="label"
                    htmlFor="leave-type-select"
                    sx={fieldLabelSx}
                  >
                    Leave Type{" "}
                    <Box component="span" sx={{ color: "#EF4444", ml: 0.3 }}>
                      *
                    </Box>
                  </Typography>
                  <TextField
                    id="leave-type-select"
                    select
                    fullWidth
                    size="small"
                    value={form.leaveType}
                    onChange={(e) => {
                      setForm({ ...form, leaveType: e.target.value });
                      setTouched((t) => ({ ...t, leaveType: true }));
                    }}
                    error={touched.leaveType && !form.leaveType}
                    helperText={
                      touched.leaveType && !form.leaveType
                        ? "Please select a leave type"
                        : ""
                    }
                    SelectProps={{ displayEmpty: true }}
                    inputProps={{ "aria-label": "Leave type" }}
                    sx={{
                      ...inputSx,
                      "& .MuiSelect-select": {
                        color: form.leaveType
                          ? "inherit"
                          : isDark
                            ? "rgba(255,255,255,0.3)"
                            : "#9CA3AF",
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography
                        sx={{
                          color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF",
                          fontSize: "0.875rem",
                        }}
                      >
                        Select leave type
                      </Typography>
                    </MenuItem>
                    {typesLoading ? (
                      <MenuItem disabled sx={{ justifyContent: "center" }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2">Loading types…</Typography>
                      </MenuItem>
                    ) : (
                      leaveTypes.map((item) => (
                        <MenuItem
                          key={item.leaveType}
                          value={item.leaveType}
                          sx={{
                            fontSize: "0.875rem",
                            borderRadius: "6px",
                            mx: 0.5,
                            my: 0.25,
                            "&.Mui-selected": {
                              bgcolor: accentBlueSoft,
                              color: accentBlue,
                              fontWeight: 600,
                            },
                            "&.Mui-selected:hover": { bgcolor: accentBlueSoft },
                          }}
                        >
                          {item.leaveType}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Box>
              </Stack>
            </Box>

            {/* ── SECTION: Dates ── */}
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF",
                  }}
                >
                  {isHalfDay ? "Date" : "Date Range"}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: "1px",
                    bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                  }}
                />
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  size="small"
                  value={form.startDate}
                  InputLabelProps={{ shrink: true }}
                  onChange={handleStartDateChange}
                  onBlur={() => setTouched((t) => ({ ...t, startDate: true }))}
                  error={touched.startDate && !form.startDate}
                  helperText={
                    touched.startDate && !form.startDate ? "Required" : ""
                  }
                  inputProps={{
                    min: new Date().toISOString().split("T")[0],
                    "aria-label": "Start date",
                  }}
                  sx={inputSx}
                />
                {!isHalfDay && (
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    size="small"
                    value={form.endDate}
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    onBlur={() => setTouched((t) => ({ ...t, endDate: true }))}
                    error={
                      (touched.endDate && !form.endDate) || !!isEndBeforeStart
                    }
                    helperText={
                      isEndBeforeStart
                        ? "Must be after start date"
                        : touched.endDate && !form.endDate
                          ? "Required"
                          : ""
                    }
                    inputProps={{
                      min:
                        form.startDate ||
                        new Date().toISOString().split("T")[0],
                      "aria-label": "End date",
                    }}
                    sx={inputSx}
                  />
                )}
              </Stack>

              {/* Duration Summary */}
              <Collapse in={dayCount !== null && dayCount > 0} unmountOnExit>
                <Box
                  sx={{
                    mt: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1.25,
                    borderRadius: "10px",
                    bgcolor: accentBlueSoft,
                    border: "1px solid",
                    borderColor: accentBlueBorder,
                  }}
                >
                  <CalendarMonthRoundedIcon
                    sx={{ fontSize: 16, color: accentBlue, flexShrink: 0 }}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: accentBlue,
                    }}
                  >
                    {dayCount === 0.5
                      ? "0.5 day of leave"
                      : dayCount === 1
                        ? "1 day of leave"
                        : `${dayCount} days of leave`}
                  </Typography>
                </Box>
              </Collapse>
            </Box>

            {/* ── SECTION: Additional Info ── */}
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF",
                  }}
                >
                  Additional Info
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: "1px",
                    bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                  }}
                />
              </Box>

              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    mb: 1,
                  }}
                >
                  <Typography sx={fieldLabelSx} style={{ marginBottom: 0 }}>
                    Reason{" "}
                    <Box component="span" sx={{ color: "#EF4444", ml: 0.3 }}>
                      *
                    </Box>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color:
                        form.reason.length > 250
                          ? "#EF4444"
                          : isDark
                            ? "rgba(255,255,255,0.25)"
                            : "#D1D5DB",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {form.reason.length}/300
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, reason: true }))}
                  error={touched.reason && !form.reason.trim()}
                  helperText={
                    touched.reason && !form.reason.trim() ? "Reason is required" : ""
                  }
                  placeholder="Briefly explain why you need this leave…"
                  inputProps={{
                    maxLength: 300,
                    "aria-label": "Reason for leave",
                  }}
                  sx={{
                    ...inputSx,
                    "& .MuiOutlinedInput-root": {
                      ...inputSx["& .MuiOutlinedInput-root"],
                      alignItems: "flex-start",
                    },
                    "& textarea": { resize: "vertical", minHeight: 10 },
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* ── FOOTER ── */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
            bgcolor: isDark ? "#0A0C12" : "#FAFAFA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Left hint */}
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: isDark ? "rgba(255,255,255,0.25)" : "#9CA3AF",
            }}
          >
            <Box component="span" sx={{ color: "#EF4444" }}>
              *
            </Box>{" "}
            Required fields
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={onClose}
              aria-label="Cancel and close"
              sx={{
                borderRadius: "10px",
                px: 2.5,
                py: 1,
                fontSize: "0.82rem",
                fontWeight: 600,
                textTransform: "none",
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E5E7EB",
                color: isDark ? "rgba(255,255,255,0.6)" : "#6B7280",
                "&:hover": {
                  borderColor: isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB",
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!canSubmit}
              onClick={handleSubmit}
              aria-label="Submit leave request"
              startIcon={
                isLoading ? (
                  <CircularProgress
                    size={14}
                    sx={{ color: "rgba(255,255,255,0.7)" }}
                  />
                ) : null
              }
              sx={{
                borderRadius: "10px",
                px: 3,
                py: 1,
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "none",
                background: canSubmit
                  ? `linear-gradient(135deg, ${accentBlue} 0%, #1D4ED8 100%)`
                  : undefined,
                boxShadow: canSubmit
                  ? `0 4px 14px ${alpha(accentBlue, 0.35)}`
                  : "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: canSubmit
                    ? `0 6px 20px ${alpha(accentBlue, 0.45)}`
                    : "none",
                  transform: canSubmit ? "translateY(-1px)" : "none",
                },
                "&:active": { transform: "translateY(0)" },
                "&.Mui-disabled": {
                  background: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                  color: isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB",
                },
              }}
            >
              {isLoading ? "Submitting…" : "Submit Request"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
