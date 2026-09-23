import {
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAssignFeMutation } from "../../api/cabManagerApiSlice";

type AssignFeModalProps = {
  open: boolean;
  crqId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AssignFeModal({ open, crqId, onClose, onSuccess }: AssignFeModalProps) {
  const [fieldEngineerOlmId, setFieldEngineerOlmId] = useState("");
  const [assign, { isLoading }] = useAssignFeMutation();

  const submit = async () => {
    if (!crqId || !fieldEngineerOlmId) return;
    try {
      const result = await assign({ crqId, fieldEngineerOlmId }).unwrap();
      if (result.status === "Success") {
        toast.success(result.message);
        setFieldEngineerOlmId("");
        onSuccess ? onSuccess() : onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to assign Field Engineer.");
    }
  };

  return (
    <Dialog open={open && !!crqId} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign Field Engineer</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Enter the OLM ID of the field engineer who'll execute this CRQ on-site.
        </Typography>
        <TextField
          fullWidth required
          label="Field Engineer OLM ID"
          placeholder="e.g. B0093363"
          InputLabelProps={{ shrink: true }}
          value={fieldEngineerOlmId}
          onChange={(e) => setFieldEngineerOlmId(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={isLoading || !fieldEngineerOlmId}>
          {isLoading ? "Assigning..." : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
