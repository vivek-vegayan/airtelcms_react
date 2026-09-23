// import {
//   Alert,
//   Box,
//   Button,
//   Dialog, DialogActions, DialogContent, DialogTitle,
//   MenuItem,
//   TextField,
//   Typography,
// } from "@mui/material";
// import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
// import { useState } from "react";
// import { useRejectCrqMutation } from "../../api/cabManagerApiSlice";
// import { DEFAULT_REJECT_REASONS } from "../../data/cabManager.mock";
// import { errMsg } from "../shared/errMsg";

// export function RejectCrqModal({ open, crqId, onClose }: { open: boolean; crqId: string | null; onClose: () => void }) {
//   const [reason, setReason] = useState("");
//   const [comment, setComment] = useState("");
//   const [reject, { isLoading, isError, error }] = useRejectCrqMutation();

//   const submit = async () => {
//     if (!crqId || !reason || !comment) return;
//     try {
//       await reject({ crqId, reason, comment }).unwrap();
//       setReason(""); setComment("");
//       onClose();
//     } catch { /* error surfaced */ }
//   };

//   return (
//     <Dialog open={open && !!crqId} onClose={onClose} maxWidth="xs" fullWidth>
//       <DialogTitle>
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//           <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#FDECEA", color: "#D32F2F", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <CancelOutlinedIcon />
//           </Box>
//           Reject CRQ
//         </Box>
//       </DialogTitle>
//       <DialogContent>
//         <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
//           Rejecting <Box component="span" sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 500 }}>{crqId}</Box> terminates the approval process.
//           A new CRQ must be raised to proceed.
//         </Typography>
//         <TextField
//           select fullWidth required
//           label="Reason for rejection"
//           value={reason}
//           onChange={(e) => setReason(e.target.value)}
//           sx={{ mb: 2 }}
//         >
//           <MenuItem value="">— Select reason —</MenuItem>
//           {DEFAULT_REJECT_REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
//         </TextField>
//         <TextField
//           fullWidth required multiline minRows={3}
//           label="Additional comments"
//           placeholder="Explain the rejection so the raiser can address it…"
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//         />
//         {isError && <Alert severity="error" sx={{ mt: 2 }}>{errMsg(error)}</Alert>}
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={onClose}>Cancel</Button>
//         <Button variant="contained" color="error" onClick={submit} disabled={isLoading || !reason || !comment}>
//           {isLoading ? "Rejecting…" : "Confirm Rejection"}
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
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  useGetCabRejectReasonsQuery,
  useRejectCrqMutation,
} from "../../api/cabManagerApiSlice";

type RejectCrqModalProps = {
  open: boolean;
  serviceApprovalId: number | null;
  crqNo: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RejectCrqModal({
  open,
  serviceApprovalId,
  crqNo,
  onClose,
  onSuccess,
}: RejectCrqModalProps) {
  const [reasonId, setReasonId] = useState<number | "">("");
  const [comment, setComment] = useState("");

  const { data: reasons, isLoading: reasonsLoading } =
    useGetCabRejectReasonsQuery(undefined, { skip: !open });
  const [reject, { isLoading }] = useRejectCrqMutation();

  const submit = async () => {
    if (serviceApprovalId == null || !reasonId || !comment) return;

    try {
      const result = await reject({
        serviceApprovalId,
        reasonId,
        comment,
      }).unwrap();

      if (result.status === "Success") {
        toast.success(result.message);
        setReasonId("");
        setComment("");
        onSuccess ? onSuccess() : onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reject CRQ.");
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
              bgcolor: "#FDECEA",
              color: "#D32F2F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CancelOutlinedIcon />
          </Box>
          Reject CRQ
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 2 }}
        >
          Rejecting{" "}
          <Box
            component="span"
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              color: "primary.main",
              fontWeight: 500,
            }}
          >
            {crqNo}
          </Box>{" "}
          terminates the approval process. A new CRQ must be raised to
          proceed.
        </Typography>

        <TextField
          select
          fullWidth
          required
          label="Reason for rejection"
          InputLabelProps={{ shrink: true }}
          value={reasonId}
          onChange={(e) => setReasonId(Number(e.target.value))}
          disabled={reasonsLoading}
          sx={{ mb: 2 }}
        >
          <MenuItem value="">— Select reason —</MenuItem>

          {reasons?.map((r) => (
            <MenuItem key={r.reasonId} value={r.reasonId}>
              {r.reasonText}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          required
          multiline
          minRows={3}
          label="Additional comments"
          placeholder="Explain the rejection so the raiser can address it…"
          InputLabelProps={{ shrink: true }}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          color="error"
          onClick={submit}
          disabled={
            isLoading ||
            serviceApprovalId == null ||
            !reasonId ||
            !comment
          }
        >
          {isLoading ? "Rejecting..." : "Confirm Rejection"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
