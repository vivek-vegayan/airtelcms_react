import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { toast } from "react-toastify";
import { useTabColorTokens } from "../../../style/theme";
import { errMsg } from "../../cabManager/components/shared/errMsg";
import { formatWindow } from "../../scheduler/sub-feature/cancelledCrq/cancelledCrqFormat";
import { useReassignTimeMutation } from "../api/crqReassignApi";
import { toDate, toLocalInput, toSqlDateTime } from "../utils/crqReassign.utils";

export interface TimeTarget {
  crqNo: string;
  engineer: string;
  blockStart: string | null;
  blockEnd: string | null;
}

interface Props {
  target: TimeTarget | null;
  batchId: string | null;
  onClose: () => void;
  onBatch: (batchId: string | null) => void;
}

/**
 * Moves the placed EXECUTION window inside the same shift (CRQ_SP_REASSIGN_TIME).
 * The shift date itself never changes here — the proc rejects that.
 */
export const TimeChangeDialog = ({ target, batchId, onClose, onBatch }: Props) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  // The caller keys this dialog on the target, so these seed once per opened block.
  const [start, setStart] = useState(() => toLocalInput(target?.blockStart));
  const [end, setEnd] = useState(() => toLocalInput(target?.blockEnd));
  const [keepDuration, setKeepDuration] = useState(true);
  const [reassignTime, { isLoading }] = useReassignTimeMutation();

  const startDate = toDate(start);
  const endDate = toDate(end);
  const valid = !!startDate && (keepDuration || (!!endDate && endDate > startDate));

  const submit = async () => {
    if (!target || !startDate) return;
    try {
      const res = await reassignTime({
        crqNo: target.crqNo,
        stage: "EXECUTION",
        newStart: toSqlDateTime(startDate),
        keepDuration,
        newEnd: keepDuration || !endDate ? null : toSqlDateTime(endDate),
        batchId,
      }).unwrap();
      onBatch(res.batchId);
      toast.success(res.message);
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 800, color: tk.textPrimary }}>
          Change execution time — {target?.crqNo}
        </Typography>
        <Typography sx={{ fontSize: 12, color: tk.textSecondary }}>
          {target?.engineer} · now {formatWindow(target?.blockStart, target?.blockEnd)}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          <TextField
            type="datetime-local"
            size="small"
            label="New start"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={keepDuration} onChange={(e) => setKeepDuration(e.target.checked)} />}
            label={<Typography sx={{ fontSize: 13 }}>Keep duration</Typography>}
          />
          {!keepDuration && (
            <TextField
              type="datetime-local"
              size="small"
              label="New end"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              error={!!endDate && !!startDate && endDate <= startDate}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!valid || isLoading} onClick={submit} sx={{ textTransform: "none" }}>
          Move
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimeChangeDialog;
