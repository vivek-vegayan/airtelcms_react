// give me proper UI for this 

import { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import CloseIcon from "@mui/icons-material/Close";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import EventNoteIcon from "@mui/icons-material/EventNote";
import dayjs from "dayjs";
import { shiftColorMap } from "./shiftColorMap";
import { DatePillStrip } from "./Datepillstrip";

interface EditRosterDialogProps {
  open: boolean;
  onClose: () => void;
  editData: { shift: any; date: string; userId: string } | null;
  onSave: (
    userId: string,
    date: string,
    newShiftId: number,
    newAssignActivity: number,
    newAvailableMinutes: number,
    reason: string,
  ) => Promise<{ status?: string; message?: string } | void>;
  saving?: boolean;
  shiftOptions: { shiftId: number; shiftRange: string }[];
  weekDates?: string[];
  allUsers?: any[];
}

export const EditRosterDialog = ({
  open,
  onClose,
  editData,
  onSave,
  saving = false,
  shiftOptions,
  weekDates = [],
  allUsers = [],
}: EditRosterDialogProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ── Form state ──────────────────────────────────────────────────────────
  const [selectedShift, setSelectedShift] = useState<number>(0);
  const [assignActivity, setAssignActivity] = useState<number | "">("");
  const [availableMinutes, setAvailableMinutes] = useState<number | "">("");
  const [reason, setReason] = useState("");

  // ── Date navigation state (driven by pill strip) ─────────────────────────
  const [activeDate, setActiveDate] = useState<string>("");

  // Reset form whenever dialog opens or date changes via pill strip
  useEffect(() => {
    if (!open || !editData) return;
    setActiveDate(editData.date);
  }, [open, editData?.date, editData?.userId]);

  // When activeDate changes (pill strip click), reload form fields from that day's roster
  useEffect(() => {
    if (!activeDate || !editData) return;

    // Find the user in allUsers to get their roster for the new date
    const user = allUsers.find((u) => String(u.userId) === String(editData.userId));
    const dayShift = user?.roster?.[activeDate];

    setSelectedShift(dayShift?.shiftId ?? editData.shift?.shiftId ?? 0);
    setAssignActivity(
      dayShift?.assignActCount !== undefined
        ? dayShift.assignActCount
        : editData.shift?.assignActCount !== undefined
        ? editData.shift.assignActCount
        : "",
    );
    setAvailableMinutes(
      dayShift?.availableMins !== undefined
        ? dayShift.availableMins
        : editData.shift?.availableMins !== undefined
        ? editData.shift.availableMins
        : "",
    );
    setReason("");
  }, [activeDate]);

  // ── Pill strip data ───────────────────────────────────────────────────────
  // Build shift-code-by-date and activity-count-by-date for the current user
  const { shiftCodeByDate, activityCountByDate } = (() => {
    if (!editData || !allUsers.length) return { shiftCodeByDate: {}, activityCountByDate: {} };
    const user = allUsers.find((u) => String(u.userId) === String(editData.userId));
    if (!user) return { shiftCodeByDate: {}, activityCountByDate: {} };

    const shiftCodes: Record<string, string> = {};
    const actCounts: Record<string, number> = {};
    weekDates.forEach((d) => {
      const r = user.roster?.[d];
      if (r) {
        shiftCodes[d] = r.shiftDisplay?.charAt(0) || "";
        actCounts[d] = r.assignActCount ?? 0;
      }
    });
    return { shiftCodeByDate: shiftCodes, activityCountByDate: actCounts };
  })();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isReasonValid = reason.trim().length > 0;

  const handleSave = async () => {
    if (!editData || !isReasonValid || selectedShift === 0) return;
    try {
      await onSave(
        editData.userId,
        activeDate || editData.date,
        selectedShift,
        Number(assignActivity || 0),
        Number(availableMinutes || 0),
        reason.trim(),
      );
    } catch (error) {
      console.error("Edit dialog save failed", error);
    }
  };

  if (!editData) return null;

  const accent = theme.palette.primary.main;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const subtleBg = isDark ? "rgba(255,255,255,0.035)" : "#F8FAFC";

  const selectedShiftOption = shiftOptions.find((o) => o.shiftId === selectedShift);
  const selectedShiftStyle = selectedShiftOption
    ? shiftColorMap.get(selectedShiftOption.shiftRange.charAt(0)) || { color: "#475569", background: "#F1F5F9" }
    : null;

  const sectionTitleSx = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    mb: 1.5,
    color: "text.secondary",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    "&::after": { content: '""', flex: 1, height: "1px", bgcolor: borderColor },
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF",
      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(accent, 0.65) },
    },
  };

  const numberInputProps = { min: 0 };
  const preventNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 260, exit: 200 }}
      PaperProps={{
        elevation: 0,
        sx: {
          width: { xs: "100vw", sm: 460 },
          bgcolor: "background.paper",
          backgroundImage: "none",
          borderLeft: "1px solid",
          borderColor,
          boxShadow: isDark ? "-24px 0 64px rgba(0,0,0,0.55)" : "-24px 0 64px rgba(15,23,42,0.12)",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* ── Header ── */}
        <Box sx={{ px: 3, pt: 3, pb: 2.5, borderBottom: "1px solid", borderColor }}>
          <Stack direction="row" alignItems="flex-start" spacing={1.75}>
            <Box
              sx={{
                width: 42, height: 42, borderRadius: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFFFFF", bgcolor: accent,
                boxShadow: `0 10px 24px ${alpha(accent, 0.28)}`,
                flexShrink: 0,
              }}
            >
              <EditCalendarIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontSize="1.05rem" fontWeight={700} lineHeight={1.3}>
                Modify Shift
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                Update roster details for the selected employee.
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                width: 32, height: 32, border: "1px solid", borderColor, borderRadius: 1.5,
                color: "text.secondary",
                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6", color: "text.primary" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* ── Date pill strip ── */}
        {weekDates.length > 1 && (
          <DatePillStrip
            dates={weekDates}
            selectedDate={activeDate || editData.date}
            onDateChange={setActiveDate}
            shiftCodeByDate={shiftCodeByDate}
            activityCountByDate={activityCountByDate}
          />
        )}

        {/* ── Body ── */}
        <Box
          sx={{
            flex: 1, overflowY: "auto", px: 3, py: 3,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": { bgcolor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1", borderRadius: 8 },
          }}
        >
          <Typography sx={sectionTitleSx}>Roster Context</Typography>

          <Box sx={{ bgcolor: subtleBg, border: "1px solid", borderColor, borderRadius: 2, p: 2, mb: 3 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 0.75, bgcolor: alpha("#2563EB", isDark ? 0.16 : 0.1), borderRadius: 1.5, display: "flex" }}>
                  <EventNoteIcon sx={{ fontSize: 18, color: "#2563EB" }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Shift Date</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {dayjs(activeDate || editData.date).format("dddd, MMM D, YYYY")}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 0.75, bgcolor: alpha("#7C3AED", isDark ? 0.16 : 0.1), borderRadius: 1.5, display: "flex" }}>
                  <BadgeIcon sx={{ fontSize: 18, color: "#7C3AED" }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Employee ID</Typography>
                  <Typography variant="body2" fontWeight={700}>{editData.userId}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          <Typography sx={sectionTitleSx}>Shift Details</Typography>

          {selectedShiftOption && selectedShiftStyle && (
            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, border: "1px solid", borderColor: alpha(selectedShiftStyle.color, 0.25), bgcolor: alpha(selectedShiftStyle.color, isDark ? 0.12 : 0.08) }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: selectedShiftStyle.color, boxShadow: `0 0 0 3px ${alpha(selectedShiftStyle.color, 0.16)}`, flexShrink: 0 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Current selection</Typography>
                  <Typography variant="body2" fontWeight={700}>{selectedShiftOption.shiftRange}</Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
            Assign New Shift
          </Typography>

          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel id="shift-select-label">Select Shift</InputLabel>
            <Select
              labelId="shift-select-label"
              value={selectedShift}
              label="Select Shift"
              onChange={(e) => setSelectedShift(Number(e.target.value))}
              renderValue={(value) => {
                const shift = shiftOptions.find((o) => o.shiftId === value);
                if (!shift) return "Select Shift";
                const style = shiftColorMap.get(shift.shiftRange.charAt(0)) || { color: "#475569" };
                return (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: style.color }} />
                    <Typography variant="body2" fontWeight={500}>{shift.shiftRange}</Typography>
                  </Stack>
                );
              }}
            >
              {shiftOptions.map((shift) => {
                const style = shiftColorMap.get(shift.shiftRange.charAt(0)) || { color: "#475569", background: "#F1F5F9" };
                return (
                  <MenuItem key={shift.shiftId} value={shift.shiftId} sx={{ py: 1.25 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: style.color, boxShadow: `0 0 0 2px ${style.background}` }} />
                      <Typography variant="body2" fontWeight={500}>{shift.shiftRange}</Typography>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
            <TextField
              label="Assign Activity Count"
              fullWidth size="small" type="number"
              value={assignActivity}
              inputProps={numberInputProps}
              sx={inputSx}
              onKeyDown={preventNegative}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") { setAssignActivity(""); return; }
                const num = Number(val);
                if (!isNaN(num) && num >= 0) setAssignActivity(num);
              }}
            />
            <TextField
              label="Available Minutes"
              fullWidth size="small" type="number"
              value={availableMinutes}
              inputProps={numberInputProps}
              sx={inputSx}
              onKeyDown={preventNegative}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") { setAvailableMinutes(""); return; }
                const num = Number(val);
                if (!isNaN(num) && num >= 0) setAvailableMinutes(num);
              }}
            />
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <Typography sx={sectionTitleSx}>Change Reason</Typography>
            <TextField
              label="Reason" fullWidth size="small" required multiline minRows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={!isReasonValid && reason !== ""}
              helperText={!isReasonValid && reason !== "" ? "Reason is required" : ""}
              sx={inputSx}
            />
          </Box>
        </Box>

        <Divider />

        {/* ── Footer ── */}
        <Box
          sx={{
            px: 3, py: 2,
            bgcolor: isDark ? "rgba(0,0,0,0.18)" : "#F8FAFC",
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            borderTop: "1px solid", borderColor,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Reason is required before updating.
          </Typography>
          <Stack direction="row" spacing={1.25} justifyContent="flex-end">
            <Button onClick={onClose} variant="outlined" color="inherit" sx={{ fontWeight: 600, borderRadius: 1.5, px: 2.25 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disableElevation
              startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
              sx={{ fontWeight: 700, borderRadius: 1.5, px: 3 }}
              disabled={selectedShift === 0 || saving || !isReasonValid}
            >
              {saving ? "Updating..." : "Confirm Update"}
              sujit thorat
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};