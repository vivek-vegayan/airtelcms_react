import {
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAssignSpocMutation } from "../../api/cabManagerApiSlice";

type AssignSpocModalProps = {
  open: boolean;
  crqId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AssignSpocModal({ open, crqId, onClose, onSuccess }: AssignSpocModalProps) {
  const [spocOlmId, setSpocOlmId] = useState("");
  const [assign, { isLoading }] = useAssignSpocMutation();

  const submit = async () => {
    if (!crqId || !spocOlmId) return;
    try {
      const result = await assign({ crqId, spocOlmId }).unwrap();
      if (result.status === "Success") {
        toast.success(result.message);
        setSpocOlmId("");
        onSuccess ? onSuccess() : onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to assign SPOC.");
    }
  };

  return (
    <Dialog open={open && !!crqId} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign SPOC</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Enter the OLM ID of the SPOC who owns approval coordination for this CRQ.
        </Typography>
        <TextField
          fullWidth required
          label="SPOC OLM ID"
          placeholder="e.g. B0093363"
          InputLabelProps={{ shrink: true }}
          value={spocOlmId}
          onChange={(e) => setSpocOlmId(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={isLoading || !spocOlmId}>
          {isLoading ? "Assigning..." : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
