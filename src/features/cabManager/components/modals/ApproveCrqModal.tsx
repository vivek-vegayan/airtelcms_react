// import {
//   Alert,
//   Box,
//   Button,
//   Dialog, DialogActions, DialogContent, DialogTitle,
//   TextField,
//   Typography,
// } from "@mui/material";
// import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
// import { useState } from "react";
// import { useApproveCrqMutation } from "../../api/cabManagerApiSlice";
// import { errMsg } from "../shared/errMsg";

// export function ApproveCrqModal({ open, crqId, onClose }: { open: boolean; crqId: string | null; onClose: () => void }) {
//   const [comment, setComment] = useState("");
//   const [approve, { isLoading, isError, error }] = useApproveCrqMutation();

//   const submit = async () => {
//     if (!crqId) return;
//     try {
//       await approve({ crqId, comment }).unwrap();
//       setComment("");
//       onClose();
//     } catch { /* error surfaced from mutation state */ }
//   };

//   return (
//     <Dialog open={open && !!crqId} onClose={onClose} maxWidth="xs" fullWidth>
//       <DialogTitle>
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//           <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#E8F5E9", color: "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <CheckCircleOutlineIcon />
//           </Box>
//           Approve CRQ
//         </Box>
//       </DialogTitle>
//       <DialogContent>
//         <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
//           You're approving <Box component="span" sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 500 }}>{crqId}</Box>.
//           This action will advance the CRQ to the next stage.
//         </Typography>
//         <Alert severity="warning" sx={{ mb: 2 }}>
//           Before approving, verify the date of execution and the attached impact analysis.
//         </Alert>
//         <TextField
//           fullWidth
//           multiline
//           minRows={3}
//           label="Comments (optional)"
//           placeholder="Add a note for the audit trail…"
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//         />
//         {isError && <Alert severity="error" sx={{ mt: 2 }}>{errMsg(error)}</Alert>}
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={onClose}>Cancel</Button>
//         <Button variant="contained" color="success" onClick={submit} disabled={isLoading} startIcon={<CheckCircleOutlineIcon />}>
//           {isLoading ? "Approving…" : "Confirm Approval"}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }










import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useState } from "react";
import { toast } from "react-toastify";
import { useApproveCrqMutation } from "../../api/cabManagerApiSlice";

type ApproveCrqModalProps = {
  open: boolean;
  serviceApprovalId: number | null;
  crqNo: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ApproveCrqModal({
  open,
  serviceApprovalId,
  crqNo,
  onClose,
  onSuccess,
}: ApproveCrqModalProps) {
  const [comment, setComment] = useState("");
  // SPOC assignment - sp_approve_cab_crq takes these as p_spoc_name /
  // p_spoc_mob_no / p_spoc_email. All three are mandatory: the endpoint answers
  // 409 when any is blank, so the form blocks the submit rather than round-trip
  // for that error.
  const [spocName, setSpocName] = useState("");
  const [spocMobNo, setSpocMobNo] = useState("");
  const [spocEmail, setSpocEmail] = useState("");

  const name = spocName.trim();
  const mobNo = spocMobNo.trim();
  const email = spocEmail.trim();

  // Format errors only show once something is typed, so an untouched form is
  // not red on open - the disabled submit is what holds it back until filled.
  const mobInvalid = mobNo !== "" && !/^[0-9]{10}$/.test(mobNo);
  const emailInvalid = email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const spocIncomplete = !name || !mobNo || !email;

  const [approve, { isLoading }] = useApproveCrqMutation();

  const submit = async () => {
    if (serviceApprovalId == null || spocIncomplete || mobInvalid || emailInvalid) return;

    try {
      const result = await approve({
        serviceApprovalId,
        comment,
        spocName: name,
        spocMobNo: mobNo,
        spocEmail: email,
      }).unwrap();

      if (result.status === "Success") {
        toast.success(result.message);
        setComment("");
        setSpocName("");
        setSpocMobNo("");
        setSpocEmail("");
        onSuccess ? onSuccess() : onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to approve CRQ.");
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
              bgcolor: "#E8F5E9",
              color: "#2E7D32",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleOutlineIcon />
          </Box>
          Approve CRQ
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 2 }}
        >
          You're approving{" "}
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
          . This action will advance the CRQ to the next stage.
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          Before approving, verify the date of execution and the attached
          impact analysis.
        </Alert>

        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            fontWeight: 700,
            display: "block",
            mb: 1,
          }}
        >
          SPOC Assign
        </Typography>

        <TextField
          fullWidth
          required
          size="small"
          label="SPOC Name"
          placeholder="e.g. Rahul Sharma"
          InputLabelProps={{ shrink: true }}
          value={spocName}
          onChange={(e) => setSpocName(e.target.value)}
          sx={{ mb: 1.5 }}
        />

        <TextField
          fullWidth
          required
          size="small"
          label="SPOC Mobile No"
          placeholder="10-digit mobile number"
          InputLabelProps={{ shrink: true }}
          inputProps={{ maxLength: 15, inputMode: "numeric" }}
          value={spocMobNo}
          onChange={(e) => setSpocMobNo(e.target.value)}
          error={mobInvalid}
          helperText={mobInvalid ? "Enter a 10-digit mobile number." : ""}
          sx={{ mb: 1.5 }}
        />

        <TextField
          fullWidth
          required
          size="small"
          label="SPOC Email"
          placeholder="name@airtel.com"
          InputLabelProps={{ shrink: true }}
          value={spocEmail}
          onChange={(e) => setSpocEmail(e.target.value)}
          error={emailInvalid}
          helperText={emailInvalid ? "Enter a valid email address." : ""}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Comments (optional)"
          placeholder="Add a note for the audit trail…"
          InputLabelProps={{ shrink: true }}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          color="success"
          onClick={submit}
          disabled={isLoading || spocIncomplete || mobInvalid || emailInvalid}
          startIcon={<CheckCircleOutlineIcon />}
        >
          {isLoading ? "Approving..." : "Confirm Approval"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
