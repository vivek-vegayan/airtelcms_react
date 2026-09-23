import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

interface ApproveConfirmDialogProps {
  open: boolean;
  title: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ApproveConfirmDialog({
  open,
  title,
  isLoading,
  onCancel,
  onConfirm,
}: ApproveConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CheckCircleOutlineIcon color="success" fontSize="small" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Alert severity="info" sx={{ fontSize: "0.8rem" }}>
            Are you sure you want to approve this request? This action cannot
            be undone.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="success"
          disabled={isLoading}
          onClick={onConfirm}
        >
          {isLoading ? "Approving…" : "Confirm Approval"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
