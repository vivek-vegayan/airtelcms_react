import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DeleteOutline } from "@mui/icons-material";
import { useNotifTokens } from "../style/notificationTokens";
import type { ApiNotificationSetting } from "../api/notificationApiSlice";

interface ConfirmDeleteDialogProps {
  open: boolean;
  /** Rule pending deletion; keep it set while closing so content doesn't flash. */
  rule: ApiNotificationSetting | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteDialog = ({
  open,
  rule,
  deleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) => {
  const theme = useTheme();
  const tk = useNotifTokens(theme);

  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: tk.radiusL, backgroundImage: "none" },
        },
      }}
    >
      <DialogContent sx={{ pt: 3.5, pb: 1.5 }}>
        <Stack alignItems="center" textAlign="center" gap={1.25}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: tk.dangerDim,
              border: `1px solid ${tk.dangerBorder}`,
              color: tk.danger,
            }}
          >
            <DeleteOutline sx={{ fontSize: 22 }} />
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
            Delete notification rule?
          </Typography>
          <Typography
            sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}
          >
            All role alerts for this event will stop immediately. The rule is
            deactivated, not erased — you can bring it back later with Bulk
            Enable under the Inactive filter.
          </Typography>
          {rule && (
            <Box
              sx={{
                width: "100%",
                px: 1.5,
                py: 1,
                borderRadius: tk.radius,
                bgcolor: tk.isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(13,27,42,0.03)",
                border: `1px solid ${tk.border}`,
              }}
            >
              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                {rule.moduleCode} · {rule.subModuleCode}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {rule.actionCode}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={deleting}
          sx={{ borderColor: tk.border, color: "text.secondary" }}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={deleting}
          startIcon={
            deleting ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <DeleteOutline sx={{ fontSize: 17 }} />
            )
          }
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
