import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useTheme } from "@mui/material/styles";
import type { RescheduleNotification } from "../types/rescheduleNotification.types";
import { formatExecutionTime } from "../utils/rescheduleNotification.utils";
import { useTabColorTokens } from "../../../style/theme";

interface ApproveRescheduleDialogProps {
  notification: RescheduleNotification | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function ApproveRescheduleDialog({
  notification,
  onClose,
  onConfirm,
}: ApproveRescheduleDialogProps) {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  return (
    <Dialog
      open={!!notification}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: colors.radiusL, background: colors.surface } } }}
    >
      <DialogTitle id="approve-reschedule-title">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "success.light",
              color: "success.dark",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleOutlineIcon />
          </Box>
          Approve Reschedule Request
        </Box>
      </DialogTitle>
      {notification && (
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Approve the new execution time for{" "}
            <Box
              component="span"
              sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 600 }}
            >
              {notification.crqNo}
            </Box>
            ?
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Current execution time
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatExecutionTime(notification.currentExecutionTime)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Proposed execution time
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                {formatExecutionTime(notification.rescheduledExecutionTime)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleOutlineIcon />}
          onClick={() => notification && onConfirm(notification.id)}
        >
          Confirm Approval
        </Button>
      </DialogActions>
    </Dialog>
  );
}
