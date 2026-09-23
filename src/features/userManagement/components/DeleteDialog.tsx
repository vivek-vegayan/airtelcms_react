import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Zoom,
  alpha,
} from "@mui/material";
import { WarningAmberRounded } from "@mui/icons-material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getAvatarColor, getInitials } from "../utils/userHelpers";
import { useUpdateUserStatusMutation } from "../../teamManagement/api/teamManagement.api";
import type { User } from "../types/user";

const ZoomTransition = forwardRef(function ZoomTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Zoom ref={ref} {...props} />;
});

export interface DeleteDialogProps {
  user: User | null;
  bulkUsers?: User[] | null;
  actorUserId: number;
  onClose: () => void;
  onDone: () => void;
}

// "Remove" is a soft status change (employee_status -> INACTIVE, with
// exit_type/exit_reason/date_of_leaving recorded on USER_MASTER) - there is
// no hard-delete path for a user record, matching sp_change_user_status.
export default function DeleteDialog({ user, bulkUsers, actorUserId, onClose, onDone }: DeleteDialogProps) {
  const isBulk = !user && !!bulkUsers?.length;
  const open = Boolean(user) || isBulk;

  const [dateOfLeaving, setDateOfLeaving] = useState("");
  const [exitType, setExitType] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [updateStatus, { isLoading }] = useUpdateUserStatusMutation();

  const resetAndClose = () => {
    setDateOfLeaving("");
    setExitType("");
    setExitReason("");
    setErrors({});
    onClose();
  };

  // sp_change_user_status refuses a leaving date in the past. Blocking it in
  // the picker keeps that rule from arriving as a server error after the user
  // has filled in the whole form.
  const today = dayjs().format("YYYY-MM-DD");

  const validate = () => {
    const next: Record<string, string> = {};
    if (!dateOfLeaving) next.dateOfLeaving = "Required";
    else if (dateOfLeaving < today) next.dateOfLeaving = "Must be today or a future date";
    if (!exitType) next.exitType = "Required";
    if (!exitReason.trim()) next.exitReason = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    const targets = isBulk ? bulkUsers! : [user!];

    // Each user is a separate call, so a failure part-way through leaves the
    // earlier ones already deactivated. Previously that threw out of the loop
    // and reported only the error — the users who *had* been removed went
    // unmentioned, and the list was refreshed by neither branch.
    const failures: { name: string; message: string }[] = [];

    for (const target of targets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await updateStatus({
          actorUserId,
          userId: target.userId,
          employeeStatus: "INACTIVE",
          dateOfLeaving,
          exitType,
          exitReason,
          replacementEmpOlmid: null,
          replacementEmpName: null,
        }).unwrap();
      } catch (err: any) {
        failures.push({
          name: target.name,
          message: err?.data?.message || "Failed to update user status.",
        });
      }
    }

    const succeeded = targets.length - failures.length;

    if (succeeded > 0) {
      toast.success(
        targets.length === 1 ? `${targets[0].name} removed` : `Removed ${succeeded} of ${targets.length} users`,
      );
      onDone();
    }

    if (failures.length > 0) {
      toast.error(
        failures.length === 1
          ? `${failures[0].name}: ${failures[0].message}`
          : `${failures.length} users could not be removed — ${failures[0].message}`,
      );
      // Leave the dialog open so the reason stays on screen and the remaining
      // targets can be retried without re-entering the exit details.
      return;
    }

    resetAndClose();
  };

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      TransitionComponent={ZoomTransition}
      PaperProps={{ sx: { borderRadius: "18px", p: 1, maxWidth: 420 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 700 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            bgcolor: (theme) => alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.18 : 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WarningAmberRounded color="error" />
        </Box>
        Remove {isBulk ? `${bulkUsers!.length} Users` : "User"}
      </DialogTitle>
      <DialogContent>
        {user && (
          <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
            <Avatar sx={{ bgcolor: getAvatarColor(user.id), width: 36, height: 36, fontSize: 13 }}>
              {getInitials(user.name)}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{user.name}</Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{user.employeeId}</Typography>
            </Box>
          </Stack>
        )}
        <Typography color="text.secondary" sx={{ fontSize: 13.5, mb: 2 }}>
          {isBulk
            ? `This deactivates ${bulkUsers!.length} selected users' system access. This cannot be undone from here.`
            : "This deactivates the user's system access. This cannot be undone from here."}
        </Typography>

        <Stack gap={1.5}>
          <TextField
            type="date"
            label="Date of Leaving"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: today }}
            value={dateOfLeaving}
            onChange={(e) => setDateOfLeaving(e.target.value)}
            error={!!errors.dateOfLeaving}
            helperText={errors.dateOfLeaving || "Today or later"}
          />
          <TextField
            select
            label="Exit Type"
            size="small"
            fullWidth
            value={exitType}
            onChange={(e) => setExitType(e.target.value)}
            error={!!errors.exitType}
            helperText={errors.exitType}
          >
            <MenuItem value="RESIGNATION">Resignation</MenuItem>
            <MenuItem value="TERMINATION">Termination</MenuItem>
            <MenuItem value="RETIREMENT">Retirement</MenuItem>
          </TextField>
          <TextField
            label="Exit Reason"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
            error={!!errors.exitReason}
            helperText={errors.exitReason}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={resetAndClose} variant="outlined" color="inherit" sx={{ borderRadius: "10px" }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={isLoading}
          sx={{ borderRadius: "10px", fontWeight: 700, minWidth: 100 }}
        >
          {isLoading ? <CircularProgress size={18} color="inherit" /> : "Remove"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
