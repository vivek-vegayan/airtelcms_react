// import {
//   Alert,
//   Box,
//   Button,
//   Dialog, DialogActions, DialogContent, DialogTitle,
//   TextField,
//   Typography,
// } from "@mui/material";
// import ReplayIcon from "@mui/icons-material/Replay";
// import { useState } from "react";
// import { useRescheduleCrqMutation } from "../../api/cabManagerApiSlice";
// import { errMsg } from "../shared/errMsg";

// export function RescheduleCrqModal({ open, crqId, onClose }: { open: boolean; crqId: string | null; onClose: () => void }) {
//   const [newDate, setNewDate] = useState("");
//   const [newWindow, setNewWindow] = useState("");
//   const [reason, setReason] = useState("");
//   const [reschedule, { isLoading, isError, error }] = useRescheduleCrqMutation();

//   const submit = async () => {
//     if (!crqId || !newDate || !newWindow || !reason) return;
//     try {
//       await reschedule({ crqId, newDate, newWindow, reason }).unwrap();
//       setNewDate(""); setNewWindow(""); setReason("");
//       onClose();
//     } catch { /* error surfaced */ }
//   };

//   return (
//     <Dialog open={open && !!crqId} onClose={onClose} maxWidth="xs" fullWidth>
//       <DialogTitle>
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//           <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#FFF4E5", color: "#ED6C02", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <ReplayIcon />
//           </Box>
//           Schedule CRQ
//         </Box>
//       </DialogTitle>
//       <DialogContent>
//         <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
//           Set a new execution date and maintenance window for{" "}
//           <Box component="span" sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 500 }}>{crqId}</Box>.
//         </Typography>

//         <TextField
//           fullWidth required
//           type="date"
//           label="New date"
//           InputLabelProps={{ shrink: true }}
//           value={newDate}
//           onChange={(e) => setNewDate(e.target.value)}
//           sx={{ mb: 2 }}
//         />
//         <TextField
//           fullWidth required
//           label="Maintenance window"
//           placeholder="e.g. 02:00 – 04:30 IST"
//           value={newWindow}
//           onChange={(e) => setNewWindow(e.target.value)}
//           sx={{ mb: 2 }}
//         />
//         <TextField
//           fullWidth required
//           multiline minRows={2}
//           label="Reason"
//           value={reason}
//           onChange={(e) => setReason(e.target.value)}
//         />
//         {isError && <Alert severity="error" sx={{ mt: 2 }}>{errMsg(error)}</Alert>}
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={onClose}>Cancel</Button>
//         <Button variant="contained" onClick={submit} disabled={isLoading || !newDate || !newWindow || !reason}>
//           {isLoading ? "Scheduling…" : "Confirm"}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }











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
import ReplayIcon from "@mui/icons-material/Replay";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRescheduleCrqMutation } from "../../api/cabManagerApiSlice";
import { todayIso } from "../shared/todayIso";

type RescheduleCrqModalProps = {
  open: boolean;
  serviceApprovalId: number | null;
  crqNo: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RescheduleCrqModal({
  open,
  serviceApprovalId,
  crqNo,
  onClose,
  onSuccess,
}: RescheduleCrqModalProps) {
  const [newDate, setNewDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  const [reschedule, { isLoading }] = useRescheduleCrqMutation();

  const minDate = todayIso();
  // Also guards typed/pasted values - the input's `min` only constrains the picker.
  const isPastDate = !!newDate && newDate < minDate;

  // An end before the start is allowed: overnight windows (22:00 – 02:00) are normal.
  const isSameTime = !!startTime && startTime === endTime;
  const now = new Date();
  const nowHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isPastStart = newDate === minDate && !!startTime && startTime < nowHHmm;
  const windowInvalid = !startTime || !endTime || isSameTime || isPastStart;

  // Same string format the backend has always received from the free-text field.
  const newWindow = `${startTime} – ${endTime} IST`;

  const submit = async () => {
    if (
      serviceApprovalId == null ||
      !newDate ||
      windowInvalid ||
      !reason ||
      isPastDate
    ) {
      return;
    }

    try {
      const result = await reschedule({
        serviceApprovalId,
        newDate,
        newWindow,
        reason,
      }).unwrap();

      if (result.status === "Success") {
        toast.success(result.message);
        setNewDate("");
        setStartTime("");
        setEndTime("");
        setReason("");
        onSuccess ? onSuccess() : onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reschedule CRQ.");
    }
  };

  return (
    <Dialog
      open={open && serviceApprovalId != null}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "#FFF4E5",
              color: "#ED6C02",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReplayIcon />
          </Box>

          Schedule CRQ
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 2 }}
        >
          Set a new execution date and maintenance window for{" "}
          <Box
            component="span"
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              color: "primary.main",
              fontWeight: 500,
            }}
          >
            {crqNo}
          </Box>
          .
        </Typography>

        <TextField
          fullWidth
          required
          type="date"
          label="New date"
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: minDate }}
          error={isPastDate}
          helperText={isPastDate ? "Pick today or a future date." : " "}
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          sx={{ mb: 1 }}
        />

        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
          Maintenance window (IST)
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
          <TextField
            fullWidth
            required
            type="time"
            label="Start time"
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            error={isPastStart}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <TextField
            fullWidth
            required
            type="time"
            label="End time"
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            error={isSameTime}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{ display: "block", mb: 2, color: isPastStart || isSameTime ? "error.main" : "text.secondary" }}
        >
          {isPastStart
            ? "Start time has already passed today."
            : isSameTime
              ? "End time must differ from start time."
              : startTime && endTime
                ? `${newWindow}${endTime < startTime ? " (ends next day)" : ""}`
                : " "}
        </Typography>

        <TextField
          fullWidth
          required
          multiline
          minRows={2}
          label="Reason"
          InputLabelProps={{ shrink: true }}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={submit}
          disabled={
            isLoading ||
            serviceApprovalId == null ||
            !newDate ||
            windowInvalid ||
            !reason ||
            isPastDate
          }
        >
          {isLoading ? "Scheduling..." : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
