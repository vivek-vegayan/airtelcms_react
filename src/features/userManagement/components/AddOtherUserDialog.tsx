import { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Close, CheckCircle } from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  useAddNewOtherEmployeeMutation,
  useGetCreateUserDropdownsQuery,
} from "../../teamManagement/api/teamManagement.api";
import type { CreateOtherEmployeeRequest } from "../../teamManagement/types/createUser.types";

interface OtherForm {
  olmid: string;
  employeeName: string;
  emailId: string;
  mobileNo: string;
  roleCode: string;
}

const DEFAULT_FORM: OtherForm = {
  olmid: "",
  employeeName: "",
  emailId: "",
  mobileNo: "",
  roleCode: "",
};

export interface AddOtherUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddOtherUserDialog({ open, onClose, onCreated }: AddOtherUserDialogProps) {
  const [form, setForm] = useState<OtherForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const { data: dropdowns } = useGetCreateUserDropdownsQuery();
  const [addOtherEmployee, { isLoading: creating }] = useAddNewOtherEmployeeMutation();

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setErrors({});
      setSuccess(false);
    }
  }, [open]);

  const set = (key: keyof OtherForm) => (value: string) => setForm((p) => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.olmid.trim()) newErrors.olmid = "Required";
    if (!form.employeeName.trim()) newErrors.employeeName = "Required";
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.emailId)) newErrors.emailId = "Invalid email format";
    if (!form.mobileNo.trim()) newErrors.mobileNo = "Required";
    if (!form.roleCode) newErrors.roleCode = "Required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the highlighted fields before continuing.");
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    const payload: CreateOtherEmployeeRequest = {
      olmid: form.olmid,
      employeeName: form.employeeName,
      emailId: form.emailId,
      mobileNo: form.mobileNo,
      roleCode: form.roleCode,
    };
    try {
      // Reaching here means the API answered 2xx; every refusal is a 4xx/5xx
      // carrying { status: "Error", message }. The old check sniffed the
      // success text for the substring "success", so a procedure whose wording
      // did not happen to contain it was reported to the user as a failure
      // after the user had, in fact, been created.
      const res = await addOtherEmployee(payload).unwrap();
      if (res.status && res.status !== "Success") {
        toast.error(res.message || "Creation failed");
        return;
      }
      toast.success(res.message || `${form.employeeName} was created successfully.`);
      setSuccess(true);
      onCreated();
      setTimeout(() => onClose(), 1100);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create user.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={success ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px" } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pt: 2.5, pb: 1 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Add Other User</Typography>
        {!success && (
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      <DialogContent sx={{ pt: 1 }}>
        <AnimatePresence mode="wait">
          {success ? (
            <Box
              component={motion.div}
              key="success"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              sx={{ py: 6, textAlign: "center" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                <CheckCircle sx={{ fontSize: 72, color: "success.main" }} />
              </motion.div>
              <Typography sx={{ fontSize: 17, fontWeight: 800, mt: 2 }}>User added successfully</Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>
                {form.employeeName} has been added to your organization.
              </Typography>
            </Box>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <Stack gap={2}>
                <TextField
                  label="OLM ID"
                  size="small"
                  fullWidth
                  value={form.olmid}
                  onChange={(e) => set("olmid")(e.target.value)}
                  error={!!errors.olmid}
                  helperText={errors.olmid}
                />
                <TextField
                  label="Full Name"
                  size="small"
                  fullWidth
                  value={form.employeeName}
                  onChange={(e) => set("employeeName")(e.target.value)}
                  error={!!errors.employeeName}
                  helperText={errors.employeeName}
                />
                <TextField
                  label="Email Address"
                  size="small"
                  fullWidth
                  value={form.emailId}
                  onChange={(e) => set("emailId")(e.target.value)}
                  error={!!errors.emailId}
                  helperText={errors.emailId}
                />
                <TextField
                  label="Mobile Number"
                  size="small"
                  fullWidth
                  value={form.mobileNo}
                  onChange={(e) => set("mobileNo")(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  error={!!errors.mobileNo}
                  helperText={errors.mobileNo}
                />
                <Autocomplete
                  size="small"
                  options={dropdowns?.roleCode ?? []}
                  value={form.roleCode || null}
                  onChange={(_, v) => set("roleCode")(v ?? "")}
                  renderInput={(params) => (
                    <TextField {...params} label="Role" error={!!errors.roleCode} helperText={errors.roleCode} />
                  )}
                />
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {!success && (
        <Stack direction="row" justifyContent="flex-end" gap={1.5} px={3} pb={2.5} pt={1}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: "10px" }}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            variant="contained"
            color="success"
            disabled={creating}
            startIcon={<CheckCircle sx={{ fontSize: 18 }} />}
            sx={{ borderRadius: "10px", fontWeight: 700 }}
          >
            Add User
          </Button>
        </Stack>
      )}
    </Dialog>
  );
}
