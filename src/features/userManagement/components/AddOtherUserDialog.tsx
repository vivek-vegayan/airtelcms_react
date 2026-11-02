import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  AccountTree,
  AdminPanelSettings,
  Apartment,
  Badge,
  CheckCircle,
  ChevronRight,
  Close,
  Email,
  Groups,
  Hub,
  Person,
  PersonAddAlt1,
  Phone,
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  useAddNewOtherEmployeeMutation,
  useGetCreateUserDropdownsQuery,
} from "../../teamManagement/api/teamManagement.api";
import { useGetOrgHierarchyByUserQuery } from "../../orgHierarchy/api/orgHierarchy.api";
import type { CreateOtherEmployeeRequest } from "../../teamManagement/types/createUser.types";
import type { OrgFilterValues } from "../../orgHierarchy/types/orgHierarchy.types";

type Option = { label: string; value: number };

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
  const theme = useTheme();
  const [form, setForm] = useState<OtherForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  // Hierarchy is optional for other users; any level left blank is sent as null.
  const [hierarchy, setHierarchy] = useState<OrgFilterValues>({});

  const { data: dropdowns } = useGetCreateUserDropdownsQuery();
  const { data: hierarchyData, isLoading: hierarchyLoading } = useGetOrgHierarchyByUserQuery();
  const [addOtherEmployee, { isLoading: creating }] = useAddNewOtherEmployeeMutation();

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setHierarchy({});
      setErrors({});
      setSuccess(false);
    }
  }, [open]);

  const set = (key: keyof OtherForm) => (value: string) => setForm((p) => ({ ...p, [key]: value }));

  const verticals = hierarchyData?.data?.verticals ?? [];
  const functions = hierarchyData?.data?.teamFunction ?? [];
  const domains = hierarchyData?.data?.domains ?? [];
  const subDomains = hierarchyData?.data?.subDomains ?? [];

  const verticalOpts = useMemo<Option[]>(() => verticals.map((v) => ({ label: v.name, value: v.id })), [verticals]);
  const functionOpts = useMemo<Option[]>(
    () => functions.filter((f) => f.verticalId === hierarchy.vertical).map((f) => ({ label: f.name, value: f.id })),
    [functions, hierarchy.vertical],
  );
  const domainOpts = useMemo<Option[]>(
    () => domains.filter((d) => d.functionId === hierarchy.teamFunction).map((d) => ({ label: d.name, value: d.id })),
    [domains, hierarchy.teamFunction],
  );
  const subDomainOpts = useMemo<Option[]>(
    () => subDomains.filter((s) => s.domainId === hierarchy.domain).map((s) => ({ label: s.name, value: s.id })),
    [subDomains, hierarchy.domain],
  );

  // Changing a level clears every level below it.
  const handleHierarchyChange = (key: keyof OrgFilterValues, value?: number | null) => {
    const next: OrgFilterValues = { ...hierarchy };
    if (!value) delete next[key];
    else next[key] = value;
    if (key === "vertical") {
      delete next.teamFunction;
      delete next.domain;
      delete next.subDomain;
    }
    if (key === "teamFunction") {
      delete next.domain;
      delete next.subDomain;
    }
    if (key === "domain") delete next.subDomain;
    setHierarchy(next);
  };

  const hierarchyFields: {
    key: keyof OrgFilterValues;
    label: string;
    icon: ReactNode;
    options: Option[];
    disabled: boolean;
  }[] = [
    { key: "vertical", label: "Vertical", icon: <Apartment />, options: verticalOpts, disabled: false },
    { key: "teamFunction", label: "Team Function", icon: <Groups />, options: functionOpts, disabled: !hierarchy.vertical },
    { key: "domain", label: "Domain", icon: <Hub />, options: domainOpts, disabled: !hierarchy.teamFunction },
    { key: "subDomain", label: "Sub Domain", icon: <AccountTree />, options: subDomainOpts, disabled: !hierarchy.domain },
  ];

  // Labels of the levels picked so far, shown as a breadcrumb under the hierarchy fields.
  const hierarchyPath = hierarchyFields
    .map(({ key, options }) => options.find((o) => o.value === hierarchy[key])?.label)
    .filter(Boolean) as string[];

  const initials =
    form.employeeName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || null;

  // Pasted emails often carry spaces, non-breaking/zero-width chars or a "mailto:" prefix.
  const cleanEmail = (v: string) =>
    v.replace(/[\s ​-‍﻿]+/g, "").replace(/^mailto:/i, "");

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const email = cleanEmail(form.emailId);
    if (!form.olmid.trim()) newErrors.olmid = "Required";
    if (!form.employeeName.trim()) newErrors.employeeName = "Required";
    if (!email) newErrors.emailId = "Required";
    else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) newErrors.emailId = "Invalid email format";
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
      olmid: form.olmid.trim(),
      employeeName: form.employeeName.trim(),
      emailId: cleanEmail(form.emailId),
      mobileNo: form.mobileNo.trim(),
      roleCode: form.roleCode,
      verticalId: hierarchy.vertical ?? null,
      functionId: hierarchy.teamFunction ?? null,
      domainId: hierarchy.domain ?? null,
      subDomainId: hierarchy.subDomain ?? null,
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

  const iconAdornment = (icon: ReactNode) => (
    <InputAdornment position="start" sx={{ color: "text.secondary", "& svg": { fontSize: 18 } }}>
      {icon}
    </InputAdornment>
  );

  const sectionSx = {
    p: 2,
    borderRadius: "14px",
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.4 : 0.6),
  };

  const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px" } };

  const SectionHeader = ({ icon, title, caption, extra }: { icon: ReactNode; title: string; caption: string; extra?: ReactNode }) => (
    <Stack direction="row" alignItems="center" gap={1.25} mb={1.75}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: "9px",
          display: "grid",
          placeItems: "center",
          color: "primary.main",
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          "& svg": { fontSize: 17 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
        <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{caption}</Typography>
      </Box>
      {extra}
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onClose={success ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.75,
          px: 3,
          py: 2.25,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
            theme.palette.success.main,
            0.08,
          )} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Avatar
          sx={{
            width: 46,
            height: 46,
            fontSize: 16,
            fontWeight: 800,
            color: "#fff",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
            boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          {initials ?? <PersonAddAlt1 />}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>Add Other User</Typography>
          <Typography noWrap sx={{ fontSize: 12.5, color: "text.secondary" }}>
            {form.employeeName.trim()
              ? `${form.employeeName.trim()}${form.olmid.trim() ? ` · ${form.olmid.trim()}` : ""}`
              : "Create a login for a user outside the team roster"}
          </Typography>
        </Box>
        {!success && (
          <IconButton size="small" onClick={onClose} sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      <DialogContent sx={{ pt: "20px !important", pb: 1 }}>
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
                {/* ── Basic details ── */}
                <Box sx={sectionSx}>
                  <SectionHeader icon={<Person />} title="Basic Details" caption="Identity and contact information" />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.75 }}>
                    <TextField
                      label="OLM ID"
                      size="small"
                      fullWidth
                      required
                      sx={fieldSx}
                      value={form.olmid}
                      onChange={(e) => set("olmid")(e.target.value)}
                      error={!!errors.olmid}
                      helperText={errors.olmid}
                      InputProps={{ startAdornment: iconAdornment(<Badge />) }}
                    />
                    <TextField
                      label="Full Name"
                      size="small"
                      fullWidth
                      required
                      sx={fieldSx}
                      value={form.employeeName}
                      onChange={(e) => set("employeeName")(e.target.value)}
                      error={!!errors.employeeName}
                      helperText={errors.employeeName}
                      InputProps={{ startAdornment: iconAdornment(<Person />) }}
                    />
                    <TextField
                      label="Email Address"
                      size="small"
                      fullWidth
                      required
                      sx={fieldSx}
                      value={form.emailId}
                      onChange={(e) => set("emailId")(e.target.value)}
                      error={!!errors.emailId}
                      helperText={errors.emailId}
                      InputProps={{ startAdornment: iconAdornment(<Email />) }}
                    />
                    <TextField
                      label="Mobile Number"
                      size="small"
                      fullWidth
                      required
                      sx={fieldSx}
                      value={form.mobileNo}
                      onChange={(e) => set("mobileNo")(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      error={!!errors.mobileNo}
                      helperText={errors.mobileNo ?? (form.mobileNo ? `${form.mobileNo.length}/10` : undefined)}
                      InputProps={{ startAdornment: iconAdornment(<Phone />) }}
                    />
                  </Box>
                </Box>

                {/* ── Access ── */}
                <Box sx={sectionSx}>
                  <SectionHeader icon={<AdminPanelSettings />} title="Access" caption="Decides what this user can see and do" />
                  <Autocomplete
                    size="small"
                    options={dropdowns?.roleCode ?? []}
                    value={form.roleCode || null}
                    onChange={(_, v) => set("roleCode")(v ?? "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Role"
                        required
                        sx={fieldSx}
                        error={!!errors.roleCode}
                        helperText={errors.roleCode}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              {iconAdornment(<AdminPanelSettings />)}
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Box>

                {/* ── Organization hierarchy (optional) ── */}
                <Box sx={sectionSx}>
                  <SectionHeader
                    icon={<AccountTree />}
                    title="Organization Hierarchy"
                    caption="Map the user to a team scope"
                    extra={
                      <Chip
                        label="Optional"
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: 11, fontWeight: 600, color: "text.secondary" }}
                      />
                    }
                  />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.75 }}>
                    {hierarchyFields.map(({ key, label, icon, options, disabled }) => (
                      <Autocomplete
                        key={key}
                        size="small"
                        options={options}
                        loading={hierarchyLoading}
                        disabled={disabled}
                        value={options.find((o) => o.value === hierarchy[key]) ?? null}
                        onChange={(_, v) => handleHierarchyChange(key, v?.value)}
                        getOptionLabel={(o) => o.label}
                        isOptionEqualToValue={(a, b) => a.value === b.value}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={label}
                            sx={fieldSx}
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <>
                                  {iconAdornment(icon)}
                                  {params.InputProps.startAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    ))}
                  </Box>

                  <Stack
                    direction="row"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={0.5}
                    sx={{
                      mt: 1.75,
                      px: 1.25,
                      py: 0.9,
                      borderRadius: "10px",
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px dashed ${alpha(theme.palette.primary.main, 0.25)}`,
                      minHeight: 36,
                    }}
                  >
                    {hierarchyPath.length === 0 ? (
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                        No hierarchy selected. The user will be created without a team scope.
                      </Typography>
                    ) : (
                      hierarchyPath.map((name, i) => (
                        <Stack key={name + i} direction="row" alignItems="center" gap={0.5}>
                          {i > 0 && <ChevronRight sx={{ fontSize: 16, color: "text.disabled" }} />}
                          <Chip
                            label={name}
                            size="small"
                            color="primary"
                            variant={i === hierarchyPath.length - 1 ? "filled" : "outlined"}
                            sx={{ height: 22, fontSize: 11.5, fontWeight: 600 }}
                          />
                        </Stack>
                      ))
                    )}
                  </Stack>
                </Box>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {!success && (
        <>
          <Divider />
          <Stack direction="row" alignItems="center" gap={1.5} px={3} py={2}>
            <Typography sx={{ flex: 1, fontSize: 11.5, color: "text.secondary" }}>
              Fields marked * are required. The OLM ID is used as the login.
            </Typography>
            <Button
              onClick={onClose}
              variant="outlined"
              color="inherit"
              disabled={creating}
              sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              variant="contained"
              color="success"
              disabled={creating}
              startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <PersonAddAlt1 sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: "10px",
                fontWeight: 700,
                textTransform: "none",
                px: 2.5,
                boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.3)}`,
              }}
            >
              {creating ? "Adding…" : "Add User"}
            </Button>
          </Stack>
        </>
      )}
    </Dialog>
  );
}
