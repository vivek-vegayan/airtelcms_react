import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Divider,
  IconButton,
  Avatar,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { toast } from "react-toastify";
import { useUpdateUserStatusMutation } from "../../api/teamManagement.api";
import { useState } from "react";

/* ================= PROPS ================= */

interface Props {
  open: boolean;
  onClose: () => void;
  actorUserId: number;
  userId: number;
  employeeName: string;
  employeeOlmId: string;
}

export const ExitEmployeeDialog = ({
  open,
  onClose,
  actorUserId,
  userId,
  employeeName,
  employeeOlmId,
}: Props) => {

  const [updateStatus, { isLoading }] = useUpdateUserStatusMutation();

  /* ================= DEFAULT FORM ================= */

  const defaultFormState = {
    dateOfLeaving: "",
    exitType: "",
    exitReason: "",
    replacementEmpOlmid: "",
    replacementEmpName: "",
  };

  const [form, setForm] = useState(defaultFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ================= RESET ================= */

  const resetForm = () => {
    setForm(defaultFormState);
    setErrors({});
  };

  /* ================= VALIDATE ================= */

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.dateOfLeaving)
      newErrors.dateOfLeaving = "Date of Leaving is required";

    if (!form.exitType)
      newErrors.exitType = "Exit Type is required";

    if (!form.exitReason)
      newErrors.exitReason = "Exit Reason is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const res = await updateStatus({
        actorUserId,
        userId,
        employeeStatus: "INACTIVE",
        dateOfLeaving: form.dateOfLeaving,
        exitType: form.exitType,
        exitReason: form.exitReason,
        replacementEmpOlmid: form.replacementEmpOlmid || null,
        replacementEmpName: form.replacementEmpName || null,
      }).unwrap();

      if (res.status === "Success") {
        toast.success(res.message);
        resetForm();   // ⭐ RESET AFTER SUCCESS
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update employee status.");
    }
  };

  /* ================= UI ================= */

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();   // ⭐ RESET ON CLOSE
        onClose();
      }}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* ================= HEADER ================= */}

      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          background: "linear-gradient(90deg,#DC2626,#B91C1C)",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "#fff", color: "#DC2626" }}>
            {employeeName?.charAt(0)}
          </Avatar>

          <Box>
            <Typography fontWeight={600} fontSize={15}>
              {employeeName}
            </Typography>
            <Typography fontSize={12} sx={{ opacity: 0.8 }}>
              OLM ID : {employeeOlmId}
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={() => {
            resetForm();
            onClose();
          }}
          size="small"
          sx={{
            color: "#fff",
            backgroundColor: "rgba(255,255,255,0.2)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ================= BODY ================= */}

      <DialogContent
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 3,
          py: 2,

          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "#F1F5F9" },
          "&::-webkit-scrollbar-thumb": {
            background: "#CBD5E1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#94A3B8",
          },
        }}
      >
        <Stack spacing={3}>

          {/* WARNING */}

          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
            }}
          >
            <WarningAmberRoundedIcon sx={{ color: "#DC2626" }} />
            <Typography fontSize={13} color="#991B1B">
              This action will deactivate employee system access permanently
            </Typography>
          </Box>

          {/* EXIT INFO */}

          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
            }}
          >
            <Typography fontSize={12} fontWeight={600} mb={2} color="#64748B">
              EXIT INFORMATION
            </Typography>

            <Stack spacing={2}>
              <TextField
                type="date"
                label="Date of Leaving"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={form.dateOfLeaving}
                onChange={(e) =>
                  setForm({ ...form, dateOfLeaving: e.target.value })
                }
                error={!!errors.dateOfLeaving}
                helperText={errors.dateOfLeaving}
              />

              <TextField
                select
                label="Exit Type"
                fullWidth
                size="small"
                value={form.exitType}
                onChange={(e) =>
                  setForm({ ...form, exitType: e.target.value })
                }
                error={!!errors.exitType}
                helperText={errors.exitType}
                SelectProps={{ native: true }}
              >
                <option value="" />
                <option value="RESIGNATION">Resignation</option>
                <option value="TERMINATION">Termination</option>
                <option value="RETIREMENT">Retirement</option>
              </TextField>

              <TextField
                label="Exit Reason"
                fullWidth
                size="small"
                multiline
                rows={3}
                value={form.exitReason}
                onChange={(e) =>
                  setForm({ ...form, exitReason: e.target.value })
                }
                error={!!errors.exitReason}
                helperText={errors.exitReason}
              />
            </Stack>
          </Box>

          {/* REPLACEMENT */}

          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: "#FFFFFF",
              border: "1px dashed #E2E8F0",
            }}
          >
            <Typography fontSize={12} fontWeight={600} mb={2} color="#64748B">
              REPLACEMENT (OPTIONAL)
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Replacement OLM ID"
                fullWidth
                size="small"
                value={form.replacementEmpOlmid}
                onChange={(e) =>
                  setForm({ ...form, replacementEmpOlmid: e.target.value })
                }
              />

              <TextField
                label="Replacement Employee Name"
                fullWidth
                size="small"
                value={form.replacementEmpName}
                onChange={(e) =>
                  setForm({ ...form, replacementEmpName: e.target.value })
                }
              />
            </Stack>
          </Box>

        </Stack>
      </DialogContent>

      <Divider />

      {/* ================= FOOTER ================= */}

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => {
            resetForm();
            onClose();
          }}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderColor: "#CBD5E1",
            color: "#334155",
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          sx={{
            textTransform: "none",
            backgroundColor: "#DC2626",
            "&:hover": { backgroundColor: "#B91C1C" },
            minWidth: 140,
          }}
        >
          {isLoading ? (
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          ) : (
            "Confirm Exit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
