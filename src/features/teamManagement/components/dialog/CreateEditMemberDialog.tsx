import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import WcIcon from "@mui/icons-material/Wc";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import ApartmentIcon from "@mui/icons-material/Apartment";
import TimelineIcon from "@mui/icons-material/Timeline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MemoryIcon from "@mui/icons-material/Memory";
import EventIcon from "@mui/icons-material/Event";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LockIcon from "@mui/icons-material/Lock";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  useGetCreateUserDropdownsQuery,
  useUpdateEmployeeMutation,
} from "../../api/teamManagement.api";
import type { UpdateEmployeeRequest } from "../../types/updateUser.types";

// ─────────────────────────────────────────────────────────────────────────────
// Form model
//
// One flat, typed shape instead of the previous `useState<any>({})`. Every
// optional field is a string (never null/undefined) so a cleared Autocomplete
// produces "" - which sp_update_user reads as "clear this column", where NULL
// means "leave unchanged". Sending null for a field the user just emptied is
// what made cleared values silently reappear after saving.
// ─────────────────────────────────────────────────────────────────────────────
interface MemberForm {
  userId: number;
  olmid: string;
  employeeName: string;
  emailId: string;
  mobileNo: string;
  gender: string;
  employmentType: string;
  vendorCompany: string;
  designation: string;
  jobLevel: string;
  officeLocation: string;
  deviceVendorCapability: string;
  dateOfJoining: string;
  roleCode: string;
}

const EMPTY_FORM: MemberForm = {
  userId: 0,
  olmid: "",
  employeeName: "",
  emailId: "",
  mobileNo: "",
  gender: "",
  employmentType: "",
  vendorCompany: "",
  designation: "",
  jobLevel: "",
  officeLocation: "",
  deviceVendorCapability: "",
  dateOfJoining: "",
  roleCode: "",
};

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"];

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function toForm(editData: Record<string, unknown> | undefined): MemberForm {
  if (!editData) return EMPTY_FORM;
  return {
    userId: Number(editData.userId ?? 0),
    olmid: str(editData.olmId ?? editData.olmid),
    employeeName: str(editData.employeeName),
    emailId: str(editData.emailId),
    mobileNo: str(editData.mobileNo),
    gender: str(editData.gender).toUpperCase(),
    employmentType: str(editData.employmentType).toUpperCase(),
    vendorCompany: str(editData.vendorCompany),
    designation: str(editData.designation),
    jobLevel: str(editData.jobLevel).toUpperCase(),
    officeLocation: str(editData.officeLocation),
    deviceVendorCapability: str(editData.deviceVendorCapability),
    // The API serialises LocalDate as yyyy-MM-dd, which is exactly what a
    // native date input wants; anything longer (a timestamp) is trimmed.
    dateOfJoining: str(editData.dateOfJoining).slice(0, 10),
    roleCode: str(editData.roleCode),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: MemberForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.employeeName.trim()) errors.employeeName = "Employee name is required";
  else if (form.employeeName.trim().length > 100) errors.employeeName = "Maximum 100 characters";

  if (!form.emailId.trim()) errors.emailId = "Email is required";
  else if (!EMAIL_RE.test(form.emailId.trim())) errors.emailId = "Enter a valid email address";
  else if (form.emailId.trim().length > 150) errors.emailId = "Maximum 150 characters";

  if (form.mobileNo && form.mobileNo.length !== 10)
    errors.mobileNo = "Mobile number must be 10 digits";

  if (!form.employmentType) errors.employmentType = "Employment type is required";

  if (form.dateOfJoining && Number.isNaN(Date.parse(form.dateOfJoining)))
    errors.dateOfJoining = "Enter a valid date";

  return errors;
}

/* ─────────────────────────────────── helpers ──────────────────────────── */
// Same numbered-step section header and field icon as AddMemberDialog, so the
// create and edit dialogs read as one pair.

const SectionLabel = ({ step, label, color }: { step: number; label: string; color: string }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        bgcolor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Typography variant="caption" fontWeight={700} color="#fff" lineHeight={1}>
        {step}
      </Typography>
    </Box>
    <Typography
      variant="overline"
      fontWeight={700}
      letterSpacing={1.4}
      color="text.secondary"
      sx={{ lineHeight: 1 }}
    >
      {label}
    </Typography>
  </Stack>
);

const FieldIcon = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      color: "text.disabled",
      mr: 0.5,
      "& .MuiSvgIcon-root": { fontSize: 16 },
    }}
  >
    {children}
  </Box>
);

interface Props {
  open: boolean;
  /** Called whenever the dialog should close — Cancel, the X, a backdrop click,
   *  and after a successful save. */
  onClose: () => void;
  /** Called only after the server confirms the update. Cache invalidation
   *  already refreshes the directory and the edited profile; use this for
   *  anything extra a host screen needs (closing a drawer, scrolling, …). */
  onSaved?: () => void;
  actorUserId: number;
  mode: "create" | "edit";
  editData?: any;
}

export const CreateEditMemberDialog = ({
  open,
  onClose,
  onSaved,
  actorUserId,
  editData,
}: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: dropdownData, isLoading: dropdownLoading } = useGetCreateUserDropdownsQuery();
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();

  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<MemberForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset from `editData` only when the dialog opens (or targets a different
  // user). Keying on the object identity instead would wipe in-progress edits
  // every time the underlying profile query refetched in the background.
  const targetUserId = Number(editData?.userId ?? 0);

  useEffect(() => {
    if (!open) return;
    const next = toForm(editData);
    setForm(next);
    setBaseline(next);
    setErrors({});
    setServerError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetUserId]);

  const set = <K extends keyof MemberForm>(key: K, value: MemberForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key as string] ? { ...prev, [key]: "" } : prev));
    setServerError(null);
  };

  const changedCount = useMemo(
    () =>
      (Object.keys(EMPTY_FORM) as (keyof MemberForm)[]).filter((k) => form[k] !== baseline[k])
        .length,
    [form, baseline],
  );
  const dirty = changedCount > 0;

  const handleSave = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    if (!dirty) {
      toast.info("Nothing to save — no fields were changed.");
      return;
    }

    const payload: UpdateEmployeeRequest = {
      actorUserId,
      userId: form.userId,
      employeeName: form.employeeName.trim(),
      emailId: form.emailId.trim(),
      mobileNo: form.mobileNo,
      employmentType: form.employmentType as UpdateEmployeeRequest["employmentType"],
      vendorCompany: form.vendorCompany,
      designation: form.designation,
      jobLevel: form.jobLevel,
      officeLocation: form.officeLocation,
      gender: form.gender as UpdateEmployeeRequest["gender"],
      deviceVendorCapability: form.deviceVendorCapability,
      dateOfJoining: form.dateOfJoining,
      dateOfLeaving: null,
      replacementEmpOlmid: null,
      replacementEmpName: null,
      // Blank keeps the current role — the procedure only reassigns when a
      // code is sent, and it validates that code against ROLE_MASTER.
      roleCode: form.roleCode || null,
    };

    setServerError(null);

    try {
      const res = await updateEmployee(payload).unwrap();

      // The API answers 4xx/5xx for a refusal, so reaching here is a success;
      // `status` is still honoured in case a procedure ever reports inline.
      if (res?.status && res.status !== "Success") {
        const message = res.message || "The update was rejected.";
        setServerError(message);
        toast.error(message);
        return;
      }

      toast.success(res?.message || `${form.employeeName.trim()} was updated successfully.`);
      setBaseline(form);
      onSaved?.();
      onClose();
    } catch (err: any) {
      // Backend shape is { status: "Error", message } for every handled
      // failure; the rest are network/parse errors with no body.
      const message =
        err?.data?.message ||
        err?.error ||
        (typeof err?.status === "number"
          ? `Update failed (HTTP ${err.status}). Please try again.`
          : "Update failed. Please check your connection and try again.");
      setServerError(message);
      toast.error(message);
    }
  };

  const handleClose = () => {
    if (updating) return;
    onClose();
  };

  const d = dropdownData;
  const busy = updating || dropdownLoading;

  const prettyRole = (code: string) =>
    code
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const autoField = (
    label: string,
    icon: React.ReactNode,
    options: string[] | undefined,
    key: keyof MemberForm,
    opts?: { required?: boolean; format?: (v: string) => string },
  ) => (
    <Autocomplete
      size="small"
      options={options ?? []}
      value={(form[key] as string) || null}
      onChange={(_, v) => set(key, (v ?? "") as MemberForm[typeof key])}
      getOptionLabel={(o) => (opts?.format ? opts.format(o) : o)}
      disabled={busy}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={opts?.required}
          error={!!errors[key as string]}
          helperText={errors[key as string]}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <FieldIcon>{icon}</FieldIcon>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen={fullScreen}
      maxWidth="sm"
      TransitionProps={{ timeout: 280 }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: fullScreen ? 0 : "16px",
          border: fullScreen ? "none" : "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          // Fits the viewport rather than guessing at 90vh: the body is the
          // only part that scrolls, so the header and the action bar stay
          // reachable on a short window and on a phone.
          display: "flex",
          flexDirection: "column",
          height: fullScreen ? "100%" : "auto",
          maxHeight: fullScreen ? "100%" : "calc(100vh - 64px)",
        },
      }}
    >
      {busy && (
        <LinearProgress
          sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, height: 2 }}
        />
      )}

      {/* ── header ── */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <EditNoteIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>
                Edit Team Member
              </Typography>
              {dirty && (
                <Chip
                  label={`${changedCount} unsaved`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.warning.main, isDark ? 0.2 : 0.14),
                    color: isDark ? theme.palette.warning.light : theme.palette.warning.dark,
                  }}
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {form.employeeName
                ? `${form.employeeName} · ${form.olmid}`
                : "Update the employee's information below"}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          size="small"
          onClick={handleClose}
          disabled={updating}
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── body ── */}
      <DialogContent
        sx={{
          px: 3,
          py: 3,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          // `grey.50` was a fixed near-white, which stayed near-white on the
          // dark theme and turned the whole body into a light slab.
          bgcolor: isDark ? theme.palette.background.default : "grey.50",
        }}
      >
        <Stack spacing={3}>
          {/* Info banner */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1.5,
              // `primary.50` / `primary.100` are not slots on this theme's
              // palette, so both resolved to undefined and the banner rendered
              // with no fill and no border at all.
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
              borderRadius: "10px",
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, isDark ? 0.32 : 0.2),
            }}
          >
            <LockIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              OLM ID and organisation hierarchy are locked and cannot be changed.
            </Typography>
          </Box>

          {serverError && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: "10px", fontSize: 12.5 }}>
              {serverError}
            </Alert>
          )}

          {/* Section 1: Basic Info */}
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
            }}
          >
            <SectionLabel step={1} label="Basic Information" color="#4F46E5" />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  size="small"
                  label="OLM ID"
                  fullWidth
                  disabled
                  value={form.olmid}
                  InputProps={{
                    endAdornment: (
                      <Chip
                        label="Locked"
                        size="small"
                        icon={<LockIcon />}
                        sx={{ height: 20, fontSize: 10 }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  size="small"
                  label="Employee Name"
                  required
                  fullWidth
                  disabled={busy}
                  value={form.employeeName}
                  onChange={(e) => set("employeeName", e.target.value)}
                  error={!!errors.employeeName}
                  helperText={errors.employeeName}
                  InputProps={{
                    startAdornment: (
                      <FieldIcon>
                        <PersonIcon />
                      </FieldIcon>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  size="small"
                  label="Email"
                  required
                  fullWidth
                  disabled={busy}
                  value={form.emailId}
                  onChange={(e) => set("emailId", e.target.value)}
                  error={!!errors.emailId}
                  helperText={errors.emailId}
                  InputProps={{
                    startAdornment: (
                      <FieldIcon>
                        <EmailIcon />
                      </FieldIcon>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  size="small"
                  label="Mobile Number"
                  fullWidth
                  disabled={busy}
                  value={form.mobileNo}
                  onChange={(e) => set("mobileNo", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  error={!!errors.mobileNo}
                  helperText={errors.mobileNo}
                  InputProps={{
                    startAdornment: (
                      <FieldIcon>
                        <PhoneIphoneIcon />
                      </FieldIcon>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {autoField("Gender", <WcIcon />, GENDER_OPTIONS, "gender", {
                  format: (v) => v.charAt(0) + v.slice(1).toLowerCase(),
                })}
              </Grid>
            </Grid>
          </Box>

          {/* Section 2: Employment */}
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
            }}
          >
            <SectionLabel step={2} label="Employment Details" color="#0891B2" />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                {autoField("Employment Type", <WorkIcon />, d?.employmentTypes, "employmentType", {
                  required: true,
                })}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {autoField("Vendor Company", <BusinessIcon />, d?.vendorCompanies, "vendorCompany")}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {autoField("Designation", <ApartmentIcon />, d?.designations, "designation")}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {autoField("Job Level", <TimelineIcon />, d?.jobLevels, "jobLevel")}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {autoField(
                  "Office Location",
                  <LocationOnIcon />,
                  d?.officeLocations,
                  "officeLocation",
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {autoField(
                  "Device Vendor Capability",
                  <MemoryIcon />,
                  d?.deviceVendorCapabilities,
                  "deviceVendorCapability",
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  size="small"
                  type="date"
                  label="Date of Joining"
                  fullWidth
                  disabled={busy}
                  value={form.dateOfJoining}
                  onChange={(e) => set("dateOfJoining", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.dateOfJoining}
                  helperText={errors.dateOfJoining}
                  InputProps={{
                    startAdornment: (
                      <FieldIcon>
                        <EventIcon />
                      </FieldIcon>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Section 3: Access */}
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
            }}
          >
            <SectionLabel step={3} label="Access & Role" color="#7C3AED" />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                {autoField("Role Code", <AdminPanelSettingsIcon />, d?.roleCode, "roleCode", {
                  format: prettyRole,
                })}
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>

      {/* ── footer ── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexShrink: 0,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="caption" color="text.disabled" sx={{ display: { xs: "none", sm: "block" } }}>
          {dirty ? "You have unsaved changes" : "All fields marked as required must be filled"}
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ ml: "auto" }}>
          <Button
            variant="outlined"
            size="medium"
            onClick={handleClose}
            disabled={updating}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={handleSave}
            disabled={busy || !dirty}
            disableElevation
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              minWidth: 140,
              px: 3,
            }}
          >
            {updating ? <CircularProgress size={18} color="inherit" /> : "Save Changes"}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};
