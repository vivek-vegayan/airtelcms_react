import React from "react";
import { Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { useTabColorTokens } from "../../style/theme";

/** Structural shape shared by every feature-local confirm-dialog state
 * (e.g. orgConfig's `OrgConfirmDialogState`, globalAdminSetting's
 * `ConfirmDialogState`) — any object matching this satisfies the prop,
 * so each feature keeps its own state type. */
export interface ConfirmDialogState {
  open: boolean;
  title: string;
  body: string;
  onConfirm: () => void;
  confirmLabel?: string;
}

interface ConfirmDialogProps {
  state: ConfirmDialogState;
  onClose: () => void;
  c: ReturnType<typeof useTabColorTokens>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onClose, c }) => {
  const btnSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    height: 30,
    px: "11px",
    borderRadius: "7px",
    fontSize: "0.78rem",
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.1s",
  };

  return (
    <Dialog
      open={state.open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { bgcolor: c.surface, border: `1px solid ${c.border}`, borderRadius: "12px" } }}
    >
      <DialogTitle sx={{ fontSize: "1rem", fontWeight: 600, color: c.textPrimary, pb: 1 }}>{state.title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: "0.82rem", color: c.textSecondary }}>{state.body}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
        <Box component="button" onClick={onClose} sx={{ ...btnSx, border: `1px solid ${c.border}`, bgcolor: "transparent", color: c.textSecondary }}>
          Cancel
        </Box>
        <Box component="button" onClick={state.onConfirm} sx={{ ...btnSx, border: `1px solid ${c.danger}`, bgcolor: c.danger, color: "#fff" }}>
          {state.confirmLabel ?? "Confirm"}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
