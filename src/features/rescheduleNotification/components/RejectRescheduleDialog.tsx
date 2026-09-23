import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useTheme } from "@mui/material/styles";
import type { RescheduleNotification } from "../types/rescheduleNotification.types";
import { useTabColorTokens } from "../../../style/theme";

interface RejectRescheduleDialogProps {
  notification: RescheduleNotification | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
}

export function RejectRescheduleDialog({
  notification,
  onClose,
  onConfirm,
}: RejectRescheduleDialogProps) {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmedReason = reason.trim();
  const hasError = touched && trimmedReason.length === 0;

  const handleClose = () => {
    setReason("");
    setTouched(false);
    onClose();
  };

  const handleConfirm = () => {
    setTouched(true);
    if (!notification || trimmedReason.length === 0) return;
    onConfirm(notification.id, trimmedReason);
    setReason("");
    setTouched(false);
  };

  return (
    <Dialog
      open={!!notification}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: colors.radiusL, background: colors.surface } } }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "error.light",
              color: "error.dark",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CancelOutlinedIcon />
          </Box>
          Reject Reschedule Request
        </Box>
      </DialogTitle>
      {notification && (
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Rejecting the reschedule request for{" "}
            <Box
              component="span"
              sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 600 }}
            >
              {notification.crqNo}
            </Box>{" "}
            keeps its current execution time unchanged.
          </Typography>
          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            label="Rejection reason"
            placeholder="Explain why this reschedule request is being rejected…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            error={hasError}
            helperText={hasError ? "Rejection reason is required." : " "}
          />
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<CancelOutlinedIcon />}
          onClick={handleConfirm}
        >
          Confirm Rejection
        </Button>
      </DialogActions>
    </Dialog>
  );
}
