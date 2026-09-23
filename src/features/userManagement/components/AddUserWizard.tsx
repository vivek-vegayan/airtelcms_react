import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Autocomplete,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Fade,
} from "@mui/material";
import {
  Close,
  Person,
  Work,
  AccountTree,
  FactCheck,
  CheckCircle,
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { AppStepper } from "../../../components/ui/AppStepper/AppStepper";
import RoleBadge from "./RoleBadge";
import {
  useAddNewEmployeeMutation,
  useGetCreateUserDropdownsQuery,
} from "../../teamManagement/api/teamManagement.api";
import { useGetOrgHierarchyByUserQuery } from "../../orgHierarchy/api/orgHierarchy.api";
import type { CreateEmployeeRequest } from "../../teamManagement/types/createUser.types";
import type { OrgFilterValues } from "../../orgHierarchy/types/orgHierarchy.types";

const STEPS = [
  { id: 1, label: "Basic Info", icon: <Person /> },
  { id: 2, label: "Employment", icon: <Work /> },
  { id: 3, label: "Hierarchy", icon: <AccountTree /> },
  { id: 4, label: "Review", icon: <FactCheck /> },
];

interface BasicForm {
  olmid: string;
  employeeName: string;
  emailId: string;
  mobileNo: string;
  employmentType: string;
  vendorCompany: string;
  designation: string;
  jobLevel: string;
  officeLocation: string;
  gender: string;
  deviceVendorCapability: string;
  dateOfJoining: string;
  roleCode: string;
}

const DEFAULT_FORM: BasicForm = {
  olmid: "",
  employeeName: "",
  emailId: "",
  mobileNo: "",
  employmentType: "",
  vendorCompany: "",
  designation: "",
  jobLevel: "",
  officeLocation: "",
  gender: "MALE",
  deviceVendorCapability: "",
  dateOfJoining: "",
  roleCode: "",
};

export interface AddUserWizardProps {
  open: boolean;
  onClose: () => void;
  actorUserId: number;
  onCreated: () => void;
}

export default function AddUserWizard({ open, onClose, actorUserId, onCreated }: AddUserWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<BasicForm>(DEFAULT_FORM);
  const [hierarchy, setHierarchy] = useState<OrgFilterValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: dropdowns, isLoading: dropdownsLoading } = useGetCreateUserDropdownsQuery();
  const { data: hierarchyData, isLoading: hierarchyLoading } = useGetOrgHierarchyByUserQuery();
  const [addEmployee, { isLoading: creating }] = useAddNewEmployeeMutation();

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setSuccess(false);
      setForm(DEFAULT_FORM);
      setHierarchy({});
      setErrors({});
    }
  }, [open]);

  const set = (key: keyof BasicForm) => (value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const verticals = hierarchyData?.data?.verticals ?? [];
  const functions = hierarchyData?.data?.teamFunction ?? [];
  const domains = hierarchyData?.data?.domains ?? [];
  const subDomains = hierarchyData?.data?.subDomains ?? [];

  const verticalOpts = useMemo(() => verticals.map((v) => ({ label: v.name, value: v.id })), [verticals]);
  const functionOpts = useMemo(
    () => functions.filter((f) => f.verticalId === hierarchy.vertical).map((f) => ({ label: f.name, value: f.id })),
    [functions, hierarchy.vertical],
  );
  const domainOpts = useMemo(
    () => domains.filter((d) => d.functionId === hierarchy.teamFunction).map((d) => ({ label: d.name, value: d.id })),
    [domains, hierarchy.teamFunction],
  );
  const subDomainOpts = useMemo(
    () => subDomains.filter((s) => s.domainId === hierarchy.domain).map((s) => ({ label: s.name, value: s.id })),
    [subDomains, hierarchy.domain],
  );

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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!/^[A-Za-z0-9]{8}$/.test(form.olmid)) newErrors.olmid = "8 alphanumeric characters";
      if (!form.employeeName.trim()) newErrors.employeeName = "Required";
      if (!/^[A-Za-z0-9._%+-]+@airtel\.com$/i.test(form.emailId)) newErrors.emailId = "Must end with @airtel.com";
      if (!/^[6-9]\d{9}$/.test(form.mobileNo)) newErrors.mobileNo = "10 digits, starting 6–9";
    }
    if (step === 1) {
      (["employmentType", "designation", "jobLevel", "officeLocation", "deviceVendorCapability"] as const).forEach(
        (f) => {
          if (!form[f]) newErrors[f] = "Required";
        },
      );
      if (!form.dateOfJoining) newErrors.dateOfJoining = "Required";
      if (!form.roleCode) newErrors.roleCode = "Required";
    }
    if (step === 2) {
      if (!hierarchy.vertical) newErrors.vertical = "Required";
      if (!hierarchy.teamFunction) newErrors.teamFunction = "Required";
      if (!hierarchy.domain) newErrors.domain = "Required";
      if (!hierarchy.subDomain) newErrors.subDomain = "Required";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the highlighted fields before continuing.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    const payload: CreateEmployeeRequest = {
      actorUserId,
      olmid: form.olmid,
      employeeName: form.employeeName,
      emailId: form.emailId,
      mobileNo: form.mobileNo,
      employmentType: form.employmentType,
      vendorCompany: form.vendorCompany,
      designation: form.designation,
      jobLevel: form.jobLevel,
      officeLocation: form.officeLocation,
      gender: form.gender as CreateEmployeeRequest["gender"],
      deviceVendorCapability: form.deviceVendorCapability,
      dateOfJoining: form.dateOfJoining,
      verticalId: hierarchy.vertical!,
      functionId: hierarchy.teamFunction!,
      domainId: hierarchy.domain!,
      subDomainId: hierarchy.subDomain!,
      roleId: 0,
      roleCode: form.roleCode,
    };
    try {
      // Reaching here means the API answered 2xx; every refusal is a 4xx/5xx
      // carrying { status: "Error", message }. The old check sniffed the
      // success text for the substring "success", so a procedure whose wording
      // did not happen to contain it was reported to the user as a failure
      // after the user had, in fact, been created.
      const res = await addEmployee(payload).unwrap();
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

  const busy = creating || dropdownsLoading || hierarchyLoading;
  const d = dropdowns;

  return (
    <Dialog
      open={open}
      onClose={success ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px" } }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          pt: 2.5,
          pb: 1,
        }}
      >
        <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Add New User</Typography>
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
              <Typography sx={{ fontSize: 17, fontWeight: 800, mt: 2 }}>
                User added successfully
              </Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>
                {form.employeeName} has been added to your organization.
              </Typography>
            </Box>
          ) : (
            <motion.div
              key={`step-${activeStep}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              <AppStepper steps={STEPS} activeStep={activeStep} sx={{ mb: 3 }} />

              {activeStep === 0 && (
                <Stack gap={2}>
                  <TextField
                    label="OLM ID"
                    size="small"
                    fullWidth
                    value={form.olmid}
                    onChange={(e) => set("olmid")(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8))}
                    error={!!errors.olmid}
                    helperText={errors.olmid || "8 alphanumeric characters"}
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
                    helperText={errors.emailId || "Must be @airtel.com"}
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
                </Stack>
              )}

              {activeStep === 1 && (
                <Stack gap={2}>
                  <Autocomplete
                    size="small"
                    options={d?.employmentTypes ?? []}
                    value={form.employmentType || null}
                    onChange={(_, v) => set("employmentType")(v ?? "")}
                    renderInput={(params) => (
                      <TextField {...params} label="Employment Type" error={!!errors.employmentType} helperText={errors.employmentType} />
                    )}
                  />
                  <Autocomplete
                    size="small"
                    options={d?.vendorCompanies ?? []}
                    value={form.vendorCompany || null}
                    freeSolo
                    onChange={(_, v) => set("vendorCompany")(v ?? "")}
                    onInputChange={(_, v) => set("vendorCompany")(v)}
                    renderInput={(params) => <TextField {...params} label="Vendor Company" />}
                  />
                  <Autocomplete
                    size="small"
                    options={d?.designations ?? []}
                    value={form.designation || null}
                    freeSolo
                    onChange={(_, v) => set("designation")(v ?? "")}
                    onInputChange={(_, v) => set("designation")(v)}
                    renderInput={(params) => (
                      <TextField {...params} label="Designation" error={!!errors.designation} helperText={errors.designation} />
                    )}
                  />
                  <Autocomplete
                    size="small"
                    options={d?.jobLevels ?? []}
                    value={form.jobLevel || null}
                    onChange={(_, v) => set("jobLevel")(v ?? "")}
                    renderInput={(params) => (
                      <TextField {...params} label="Job Level" error={!!errors.jobLevel} helperText={errors.jobLevel} />
                    )}
                  />
                  <Autocomplete
                    size="small"
                    options={d?.officeLocations ?? []}
                    value={form.officeLocation || null}
                    freeSolo
                    onChange={(_, v) => set("officeLocation")(v ?? "")}
                    onInputChange={(_, v) => set("officeLocation")(v)}
                    renderInput={(params) => (
                      <TextField {...params} label="Office Location" error={!!errors.officeLocation} helperText={errors.officeLocation} />
                    )}
                  />
                  <Autocomplete
                    size="small"
                    options={d?.deviceVendorCapabilities ?? []}
                    value={form.deviceVendorCapability || null}
                    freeSolo
                    onChange={(_, v) => set("deviceVendorCapability")(v ?? "")}
                    onInputChange={(_, v) => set("deviceVendorCapability")(v)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Device Vendor Capability"
                        error={!!errors.deviceVendorCapability}
                        helperText={errors.deviceVendorCapability}
                      />
                    )}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select value={form.gender} label="Gender" onChange={(e) => set("gender")(e.target.value)}>
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    type="date"
                    label="Date of Joining"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={form.dateOfJoining}
                    onChange={(e) => set("dateOfJoining")(e.target.value)}
                    error={!!errors.dateOfJoining}
                    helperText={errors.dateOfJoining}
                  />
                  <Autocomplete
                    size="small"
                    options={d?.roleCode ?? []}
                    value={form.roleCode || null}
                    onChange={(_, v) => set("roleCode")(v ?? "")}
                    renderInput={(params) => (
                      <TextField {...params} label="Role" error={!!errors.roleCode} helperText={errors.roleCode} />
                    )}
                  />
                </Stack>
              )}

              {activeStep === 2 && (
                <Stack gap={2}>
                  <Autocomplete
                    size="small"
                    options={verticalOpts}
                    loading={hierarchyLoading}
                    value={verticalOpts.find((v) => v.value === hierarchy.vertical) || null}
                    onChange={(_, v) => handleHierarchyChange("vertical", v?.value)}
                    isOptionEqualToValue={(a, b) => a.value === b.value}
                    renderInput={(params) => (
                      <TextField {...params} label="Vertical" error={!!errors.vertical} helperText={errors.vertical} />
                    )}
                  />
                  <Fade in={!!hierarchy.vertical}>
                    <Box>
                      <Autocomplete
                        size="small"
                        options={functionOpts}
                        disabled={!hierarchy.vertical}
                        value={functionOpts.find((f) => f.value === hierarchy.teamFunction) || null}
                        onChange={(_, v) => handleHierarchyChange("teamFunction", v?.value)}
                        isOptionEqualToValue={(a, b) => a.value === b.value}
                        renderInput={(params) => (
                          <TextField {...params} label="Team Function" error={!!errors.teamFunction} helperText={errors.teamFunction} />
                        )}
                      />
                    </Box>
                  </Fade>
                  <Fade in={!!hierarchy.teamFunction}>
                    <Box>
                      <Autocomplete
                        size="small"
                        options={domainOpts}
                        disabled={!hierarchy.teamFunction}
                        value={domainOpts.find((dm) => dm.value === hierarchy.domain) || null}
                        onChange={(_, v) => handleHierarchyChange("domain", v?.value)}
                        isOptionEqualToValue={(a, b) => a.value === b.value}
                        renderInput={(params) => (
                          <TextField {...params} label="Domain" error={!!errors.domain} helperText={errors.domain} />
                        )}
                      />
                    </Box>
                  </Fade>
                  <Fade in={!!hierarchy.domain}>
                    <Box>
                      <Autocomplete
                        size="small"
                        options={subDomainOpts}
                        disabled={!hierarchy.domain}
                        value={subDomainOpts.find((sd) => sd.value === hierarchy.subDomain) || null}
                        onChange={(_, v) => handleHierarchyChange("subDomain", v?.value)}
                        isOptionEqualToValue={(a, b) => a.value === b.value}
                        renderInput={(params) => (
                          <TextField {...params} label="Sub Domain" error={!!errors.subDomain} helperText={errors.subDomain} />
                        )}
                      />
                    </Box>
                  </Fade>
                </Stack>
              )}

              {activeStep === 3 && (
                <Stack gap={1.5}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "text.secondary" }}>
                    REVIEW DETAILS
                  </Typography>
                  {[
                    ["Full Name", form.employeeName || "—"],
                    ["OLM ID", form.olmid || "—"],
                    ["Email", form.emailId || "—"],
                    ["Mobile", form.mobileNo || "—"],
                    ["Designation", form.designation || "—"],
                    ["Vertical", verticalOpts.find((v) => v.value === hierarchy.vertical)?.label ?? "—"],
                    ["Team Function", functionOpts.find((f) => f.value === hierarchy.teamFunction)?.label ?? "—"],
                    ["Domain", domainOpts.find((dm) => dm.value === hierarchy.domain)?.label ?? "—"],
                    ["Sub Domain", subDomainOpts.find((sd) => sd.value === hierarchy.subDomain)?.label ?? "—"],
                  ].map(([label, val]) => (
                    <Stack key={label} direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{label}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{val}</Typography>
                    </Stack>
                  ))}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Role</Typography>
                    <RoleBadge role={form.roleCode} size="small" />
                  </Stack>
                </Stack>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {!success && (
        <Stack direction="row" justifyContent="space-between" px={3} pb={2.5} pt={1}>
          <Button
            onClick={activeStep === 0 ? onClose : handleBack}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: "10px" }}
          >
            {activeStep === 0 ? "Cancel" : "Back"}
          </Button>
          {activeStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} variant="contained" sx={{ borderRadius: "10px", fontWeight: 700 }}>
              Next
            </Button>
          ) : (
            <Button
              onClick={submit}
              variant="contained"
              color="success"
              disabled={busy}
              startIcon={<CheckCircle sx={{ fontSize: 18 }} />}
              sx={{ borderRadius: "10px", fontWeight: 700 }}
            >
              Add User
            </Button>
          )}
        </Stack>
      )}
    </Dialog>
  );
}
