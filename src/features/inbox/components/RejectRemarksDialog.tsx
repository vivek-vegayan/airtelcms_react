import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import type { RejectInputKind } from "../config/notificationActionConfig";
import { useGetCabRejectReasonsQuery } from "../../cabManager/api/cabManagerApiSlice";

interface RejectRemarksDialogProps {
  open: boolean;
  title: string;
  rejectInput: RejectInputKind;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: (remark: string, reasonText?: string) => void;
}

export function RejectRemarksDialog({
  open,
  title,
  rejectInput,
  isLoading,
  onCancel,
  onConfirm,
}: RejectRemarksDialogProps) {
  const [remark, setRemark] = useState("");
  const [reasonId, setReasonId] = useState<number | "">("");
  const { data: cabReasons = [] } = useGetCabRejectReasonsQuery(undefined, {
    skip: rejectInput !== "CAB_REASON_LIST" || !open,
  });

  const selectedReasonText = useMemo(
    () => cabReasons.find((r) => r.reasonId === reasonId)?.reasonText,
    [cabReasons, reasonId],
  );

  const isCabMode = rejectInput === "CAB_REASON_LIST";
  const canConfirm =
    remark.trim().length > 0 && (!isCabMode || reasonId !== "");

  const handleClose = () => {
    setRemark("");
    setReasonId("");
    onCancel();
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(remark.trim(), isCabMode ? selectedReasonText : undefined);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CancelOutlinedIcon color="error" fontSize="small" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Alert severity="warning" sx={{ fontSize: "0.8rem" }}>
            This action cannot be undone. Please provide a reason.
          </Alert>

          {isCabMode && (
            <FormControl fullWidth size="small">
              <InputLabel id="reject-reason-label">Reason</InputLabel>
              <Select
                labelId="reject-reason-label"
                label="Reason"
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value as number)}
              >
                {cabReasons.map((r) => (
                  <MenuItem key={r.reasonId} value={r.reasonId}>
                    {r.reasonText}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label={isCabMode ? "Additional comments" : "Rejection remarks"}
            placeholder="Explain why this request is being rejected"
            multiline
            minRows={3}
            fullWidth
            required
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />

          {remark.trim().length === 0 && (
            <Typography variant="caption" color="text.disabled">
              A remark is required to reject this request.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="error"
          disabled={!canConfirm || isLoading}
          onClick={handleConfirm}
        >
          {isLoading ? "Rejecting…" : "Confirm Rejection"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
