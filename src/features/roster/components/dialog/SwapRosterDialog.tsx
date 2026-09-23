import React, { useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import dayjs from "dayjs";
import { shiftColorMap } from "../../constant/shiftColors";

interface CellData {
  userId: string;
  date: string;
  shiftId: number;
  shiftDisplay: string;
}

interface SwapRosterDialogProps {
  open: boolean;
  onClose: () => void;
  swapData: {
    cell1: CellData;
    cell2: CellData;
  } | null;
  onConfirm: (
    cell1: CellData,
    cell2: CellData,
    reason: string,
  ) => Promise<void>;
  onSwapSuccess: () => void;
}

const getShiftStyle = (shiftDisplay: string) =>
  shiftColorMap.get(shiftDisplay.charAt(0)) || {
    color: "#475569",
    background: "#F1F5F9",
  };

const EmployeeShiftCard: React.FC<{
  title: string;
  userId: string;
  date: string;
  currentShift: string;
  newShift: string;
}> = ({ title, userId, date, currentShift, newShift }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const currentShiftStyle = getShiftStyle(currentShift);
  const newShiftStyle = getShiftStyle(newShift);
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor,
        bgcolor: isDark ? "rgba(255,255,255,0.035)" : "#FFFFFF",
      }}
    >
      <Stack spacing={1.6}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography fontSize="0.9rem" fontWeight={700}>
            {title}
          </Typography>
          <Chip
            label="Selected"
            size="small"
            sx={{
              height: 22,
              fontSize: "0.68rem",
              fontWeight: 700,
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
            }}
          />
        </Stack>

        <Stack spacing={1.1}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                p: 0.65,
                borderRadius: 1.3,
                display: "flex",
                color: "#7C3AED",
                bgcolor: alpha("#7C3AED", isDark ? 0.16 : 0.1),
              }}
            >
              <BadgeIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Employee ID
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {userId}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                p: 0.65,
                borderRadius: 1.3,
                display: "flex",
                color: "#2563EB",
                bgcolor: alpha("#2563EB", isDark ? 0.16 : 0.1),
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Shift Date
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {dayjs(date).format("ddd, MMM D, YYYY")}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Divider />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 1,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Current
            </Typography>
            <Stack direction="row" spacing={0.8} alignItems="center" mt={0.3}>
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: currentShiftStyle.color,
                }}
              />
              <Typography variant="body2" fontWeight={700}>
                {currentShift}
              </Typography>
            </Stack>
          </Box>

          <SwapHorizIcon sx={{ color: "text.disabled", fontSize: 20 }} />

          <Box>
            <Typography variant="caption" color="text.secondary">
              Will Receive
            </Typography>
            <Stack direction="row" spacing={0.8} alignItems="center" mt={0.3}>
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: newShiftStyle.color,
                  boxShadow: `0 0 0 3px ${alpha(newShiftStyle.color, 0.16)}`,
                }}
              />
              <Typography
                variant="body2"
                fontWeight={700}
                color="primary.main"
              >
                {newShift}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export const SwapRosterDialog: React.FC<SwapRosterDialogProps> = ({
  open,
  onClose,
  swapData,
  onConfirm,
  onSwapSuccess,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!swapData || !reason.trim()) return;

    const { cell1, cell2 } = swapData;
    setIsLoading(true);

    try {
      await onConfirm(cell1, cell2, reason.trim());
      onSwapSuccess();
      onClose();
      setReason("");
    } catch (error) {
      console.error("Failed to swap shifts", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setReason("");
  };

  if (!swapData) return null;

  const { cell1, cell2 } = swapData;
  const accent = theme.palette.primary.main;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";

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
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(accent, 0.65),
      },
    },
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      transitionDuration={{ enter: 260, exit: 200 }}
      PaperProps={{
        elevation: 0,
        sx: {
          width: { xs: "100vw", sm: 520 },
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
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2.5,
            borderBottom: "1px solid",
            borderColor,
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1.75}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                bgcolor: accent,
                boxShadow: `0 10px 24px ${alpha(accent, 0.28)}`,
                flexShrink: 0,
              }}
            >
              <SwapHorizIcon sx={{ fontSize: 23 }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontSize="1.05rem" fontWeight={700} lineHeight={1.3}>
                Confirm Shift Swap
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.35 }}
              >
                Review both selected shifts before confirming the swap.
              </Typography>
            </Box>

            <IconButton
              onClick={handleClose}
              size="small"
              aria-label="Close swap roster drawer"
              disabled={isLoading}
              sx={{
                width: 32,
                height: 32,
                border: "1px solid",
                borderColor,
                borderRadius: 1.5,
                color: "text.secondary",
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
          <Typography sx={sectionTitleSx}>Swap Summary</Typography>

          <Box
            sx={{
              mb: 2.5,
              px: 2,
              py: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha(accent, isDark ? 0.28 : 0.18),
              bgcolor: alpha(accent, isDark ? 0.12 : 0.06),
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Employee {cell1.userId} will receive {cell2.shiftDisplay}, and
              employee {cell2.userId} will receive {cell1.shiftDisplay}.
            </Typography>
          </Box>

          <Stack spacing={2}>
            <EmployeeShiftCard
              title="Employee 1"
              userId={cell1.userId}
              date={cell1.date}
              currentShift={cell1.shiftDisplay}
              newShift={cell2.shiftDisplay}
            />

            <EmployeeShiftCard
              title="Employee 2"
              userId={cell2.userId}
              date={cell2.date}
              currentShift={cell2.shiftDisplay}
              newShift={cell1.shiftDisplay}
            />
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <Typography sx={sectionTitleSx}>Swap Reason</Typography>

            <TextField
              multiline
              minRows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              required
              placeholder="Explain why this shift swap is needed..."
              sx={inputSx}
            />
          </Box>
        </Box>

        <Divider />

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
          <Typography variant="caption" color="text.secondary">
            Reason is required before swapping.
          </Typography>

          <Stack direction="row" spacing={1.25} justifyContent="flex-end">
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={isLoading}
              color="inherit"
              sx={{ borderRadius: 1.5, fontWeight: 600, px: 2.25 }}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!reason.trim() || isLoading}
              disableElevation
              startIcon={
                isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
              sx={{ borderRadius: 1.5, fontWeight: 700, px: 3 }}
            >
              {isLoading ? "Swapping..." : "Confirm Swap"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};
