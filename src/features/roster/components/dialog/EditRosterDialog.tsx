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
  InputAdornment,
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
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import dayjs from "dayjs";
import { shiftColorMap } from "../../constant/shiftColors";

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
}

export const EditRosterDialog = ({
  open,
  onClose,
  editData,
  onSave,
  saving = false,
  shiftOptions,
}: EditRosterDialogProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [selectedShift, setSelectedShift] = useState<number>(0);
  const [assignActivity, setAssignActivity] = useState<number | "">("");
  const [availableMinutes, setAvailableMinutes] = useState<number | "">("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open || !editData) return;

    setSelectedShift(editData.shift?.shiftId ?? 0);
    setAssignActivity(
      editData.shift?.assignActCount !== undefined
        ? editData.shift.assignActCount
        : "",
    );
    setAvailableMinutes(
      editData.shift?.availableMins !== undefined
        ? editData.shift.availableMins
        : "",
    );
    setReason("");
  }, [open, editData]);

  const isReasonValid = reason.trim().length > 0;

  const handleSave = async () => {
    if (!editData) return;

    if (!isReasonValid) {
      return;
    }

    if (selectedShift === 0) {
      return;
    }

    try {
      await onSave(
        editData.userId,
        editData.date,
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
  const accentDark = theme.palette.primary.dark;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const subtleBg = isDark ? "rgba(255,255,255,0.035)" : "#F8FAFC";
  const selectedShiftOption = shiftOptions.find(
    (option) => option.shiftId === selectedShift,
  );
  const selectedShiftStyle = selectedShiftOption
    ? shiftColorMap.get(selectedShiftOption.shiftRange.charAt(0)) || {
        color: "#475569",
        background: "#F1F5F9",
      }
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
    "&::after": {
      content: '""',
      flex: 1,
      height: "1px",
      bgcolor: borderColor,
    },
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF",
      transition: "border-color .15s ease, box-shadow .15s ease",
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(accent, 0.65),
      },
      "&.Mui-focused": {
        boxShadow: `0 0 0 3px ${alpha(accent, 0.14)}`,
      },
    },
  };

  const numberInputProps = { min: 0 };
  const preventNegativeNumberInput = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (["e", "E", "+", "-"].includes(event.key)) {
      event.preventDefault();
    }
  };

  // Meta row used inside the roster-context card.
  const MetaRow = ({
    icon,
    iconColor,
    label,
    value,
  }: {
    icon: React.ReactNode;
    iconColor: string;
    label: string;
    value: React.ReactNode;
  }) => (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1.75,
          bgcolor: alpha(iconColor, isDark ? 0.18 : 0.1),
          color: iconColor,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.secondary",
            fontSize: "0.66rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ mt: 0.15 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={{ enter: 260, exit: 200 }}
      PaperProps={{
        elevation: 0,
        sx: {
          width: { xs: "100vw", sm: 480 },
          bgcolor: "background.paper",
          backgroundImage: "none",
          borderLeft: "1px solid",
          borderColor,
          boxShadow: isDark
            ? "-24px 0 64px rgba(0,0,0,0.55)"
            : "-24px 0 64px rgba(15,23,42,0.12)",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* ---------- Header ---------- */}
        <Box
          sx={{
            position: "relative",
            px: 3,
            pt: 3,
            pb: 2.5,
            borderBottom: "1px solid",
            borderColor,
            background: isDark
              ? `linear-gradient(135deg, ${alpha(accent, 0.16)} 0%, ${alpha(
                  accent,
                  0,
                )} 58%)`
              : `linear-gradient(135deg, ${alpha(accent, 0.1)} 0%, ${alpha(
                  accent,
                  0,
                )} 58%)`,
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                boxShadow: `0 10px 24px ${alpha(accent, 0.32)}`,
                flexShrink: 0,
              }}
            >
              <EditCalendarIcon sx={{ fontSize: 22 }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontSize="1.08rem" fontWeight={700} lineHeight={1.3}>
                Modify Shift
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.35 }}
              >
                Update roster details for the selected employee.
              </Typography>
            </Box>

            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close edit roster drawer"
              sx={{
                width: 32,
                height: 32,
                border: "1px solid",
                borderColor,
                borderRadius: 1.5,
                color: "text.secondary",
                bgcolor: "background.paper",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                  color: "text.primary",
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* ---------- Body ---------- */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            py: 3,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
              borderRadius: 8,
            },
          }}
        >
          <Typography sx={sectionTitleSx}>Roster Context</Typography>

          <Box
            sx={{
              bgcolor: subtleBg,
              border: "1px solid",
              borderColor,
              borderRadius: 2.5,
              p: 2,
              mb: 3,
            }}
          >
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              <MetaRow
                icon={<EventNoteIcon sx={{ fontSize: 18 }} />}
                iconColor="#2563EB"
                label="Shift Date"
                value={dayjs(editData.date).format("dddd, MMM D, YYYY")}
              />
              <MetaRow
                icon={<BadgeIcon sx={{ fontSize: 18 }} />}
                iconColor="#7C3AED"
                label="Employee ID"
                value={editData.userId}
              />
            </Stack>
          </Box>

          <Typography sx={sectionTitleSx}>Shift Details</Typography>

          {selectedShiftOption && selectedShiftStyle && (
            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                mb: 2,
                pl: 2.25,
                pr: 1.75,
                py: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: alpha(selectedShiftStyle.color, 0.28),
                bgcolor: alpha(selectedShiftStyle.color, isDark ? 0.12 : 0.07),
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  bgcolor: selectedShiftStyle.color,
                },
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: selectedShiftStyle.color,
                    boxShadow: `0 0 0 3px ${alpha(
                      selectedShiftStyle.color,
                      0.16,
                    )}`,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "text.secondary",
                      fontSize: "0.66rem",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Selected Shift
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedShiftOption.shiftRange}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="text.primary"
            sx={{ mb: 1 }}
          >
            Assign New Shift
          </Typography>

          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel id="shift-select-label">Select Shift</InputLabel>
            <Select
              labelId="shift-select-label"
              value={selectedShift}
              label="Select Shift"
              onChange={(e) => setSelectedShift(Number(e.target.value))}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 0.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor,
                    boxShadow: isDark
                      ? "0 16px 40px rgba(0,0,0,0.5)"
                      : "0 16px 40px rgba(15,23,42,0.12)",
                    "& .MuiMenuItem-root.Mui-selected": {
                      bgcolor: alpha(accent, isDark ? 0.18 : 0.1),
                      "&:hover": {
                        bgcolor: alpha(accent, isDark ? 0.24 : 0.16),
                      },
                    },
                  },
                },
              }}
              renderValue={(value) => {
                const shift = shiftOptions.find((opt) => opt.shiftId === value);

                if (!shift) return "Select Shift";

                const shiftCode = shift.shiftRange;
                const shiftStyle = shiftColorMap.get(shiftCode.charAt(0)) || {
                  color: "#475569",
                  background: "#F1F5F9",
                };

                return (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: shiftStyle.color,
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {shiftCode}
                    </Typography>
                  </Stack>
                );
              }}
            >
              {shiftOptions.map((shift) => {
                const shiftCode = shift.shiftRange;
                const shiftStyle = shiftColorMap.get(shiftCode.charAt(0)) || {
                  color: "#475569",
                  background: "#F1F5F9",
                };

                return (
                  <MenuItem
                    key={shift.shiftId}
                    value={shift.shiftId}
                    sx={{ py: 1.25, borderRadius: 1.5, mx: 0.5, my: 0.25 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: shiftStyle.color,
                          boxShadow: `0 0 0 2px ${shiftStyle.background}`,
                        }}
                      />
                      <Typography variant="body2" fontWeight={500}>
                        {shiftCode}
                      </Typography>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
            <TextField
              label="Assign Activity Count"
              fullWidth
              size="small"
              type="number"
              value={assignActivity}
              inputProps={numberInputProps}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TaskAltRoundedIcon
                      sx={{ fontSize: 18, color: "text.disabled" }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
              onKeyDown={preventNegativeNumberInput}
              onChange={(e) => {
                const val = e.target.value;

                if (val === "") {
                  setAssignActivity("");
                  return;
                }

                const num = Number(val);
                if (!isNaN(num) && num >= 0) {
                  setAssignActivity(num);
                }
              }}
            />

            <TextField
              label="Available Minutes"
              fullWidth
              size="small"
              type="number"
              value={availableMinutes}
              inputProps={numberInputProps}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccessTimeRoundedIcon
                      sx={{ fontSize: 18, color: "text.disabled" }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary">
                      min
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
              onKeyDown={preventNegativeNumberInput}
              onChange={(e) => {
                const val = e.target.value;

                if (val === "") {
                  setAvailableMinutes("");
                  return;
                }

                const num = Number(val);
                if (!isNaN(num) && num >= 0) {
                  setAvailableMinutes(num);
                }
              }}
            />
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <Typography sx={sectionTitleSx}>Change Reason</Typography>
            <TextField
              label="Reason"
              placeholder="Explain why this shift is being changed…"
              fullWidth
              size="small"
              required
              multiline
              minRows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={!isReasonValid && reason !== ""}
              helperText={
                !isReasonValid && reason !== "" ? "Reason is required" : ""
              }
              sx={inputSx}
            />
          </Box>
        </Box>

        <Divider />

        {/* ---------- Footer ---------- */}
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: isDark ? "rgba(0,0,0,0.18)" : "#F8FAFC",
            display: "flex",
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            borderTop: "1px solid",
            borderColor,
          }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: isReasonValid
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                flexShrink: 0,
              }}
            />
          
          </Stack>

          <Stack direction="row" spacing={1.25} justifyContent="flex-end">
            <Button
              onClick={onClose}
              variant="outlined"
              color="inherit"
              sx={{
                fontWeight: 600,
                borderRadius: 1.5,
                px: 2.5,
                textTransform: "none",
                borderColor,
                color: "text.secondary",
                "&:hover": {
                  borderColor: isDark ? "rgba(255,255,255,0.2)" : "#CBD5E1",
                  bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              variant="contained"
              disableElevation
              startIcon={
                saving ? <CircularProgress color="inherit" size={16} /> : null
              }
              disabled={selectedShift === 0 || saving || !isReasonValid}
              sx={{
                fontWeight: 700,
                borderRadius: 1.5,
                px: 3,
                textTransform: "none",
                color: "#FFFFFF",
                background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                boxShadow: `0 10px 24px ${alpha(accent, 0.3)}`,
                transition: "box-shadow .15s ease, transform .05s ease",
                "&:hover": {
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                  boxShadow: `0 12px 28px ${alpha(accent, 0.42)}`,
                },
                "&:active": { transform: "translateY(1px)" },
                "&.Mui-disabled": {
                  background: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
                  color: isDark ? "rgba(255,255,255,0.4)" : "#94A3B8",
                  boxShadow: "none",
                },
              }}
            >
              {saving ? "Updating..." : "Confirm Update"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};