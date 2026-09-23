import {
  Dialog,
  DialogContent,
  Button,
  Stack,
  CircularProgress,
  Typography,
  Box,
  Grid,
  TextField,
  Autocomplete,
  Chip,
  IconButton,
  Fade,
  LinearProgress,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";

import CloseIcon from "@mui/icons-material/Close";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import ApartmentIcon from "@mui/icons-material/Apartment";
import TimelineIcon from "@mui/icons-material/Timeline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MemoryIcon from "@mui/icons-material/Memory";
import EventIcon from "@mui/icons-material/Event";
import GroupsIcon from "@mui/icons-material/Groups";
import HubIcon from "@mui/icons-material/Hub";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

import {
  useAddNewEmployeeMutation,
  useGetCreateUserDropdownsQuery,
} from "../../api/teamManagement.api";
import { useGetOrgHierarchyByUserQuery } from "../../../orgHierarchy/api/orgHierarchy.api";

import type { CreateEmployeeRequest } from "../../types/createUser.types";
import type { OrgFilterValues } from "../../../orgHierarchy/types/orgHierarchy.types";

/* ─────────────────────────────────── helpers ──────────────────────────── */

const filter = createFilterOptions<string>();

const SectionLabel = ({
  step,
  label,
  color,
}: {
  step: number;
  label: string;
  color: string;
}) => (
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
      <Typography
        variant="caption"
        fontWeight={700}
        color="#fff"
        lineHeight={1}
      >
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

/* ─────────────────────────────────── main ──────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
  actorUserId: number;
}

export const AddMemberDialog = ({ open, onClose, actorUserId }: Props) => {
  /* API */
  const { data: dropdownData, isLoading: dropdownLoading } =
    useGetCreateUserDropdownsQuery();
  const { data: hierarchyData, isLoading: hierarchyLoading } =
    useGetOrgHierarchyByUserQuery();
  const [addEmployee, { isLoading }] = useAddNewEmployeeMutation();

  /* form state */
  const initialForm: CreateEmployeeRequest = useMemo(
    () => ({
      olmid: "",
      employeeName: "",
      emailId: "",
      mobileNo: "",
      employmentType: "",
      vendorCompany: "",
      designation: "",
      jobLevel: "",
      officeLocation: "",
      gender: "Male",
      deviceVendorCapability: "",
      dateOfJoining: "",
      password: "",
      roleId: 5,
      verticalId: 0,
      functionId: 0,
      domainId: 0,
      subDomainId: 0,
      roleCode: "",
    }),
    [actorUserId],
  );

  const [form, setForm] = useState<CreateEmployeeRequest>(initialForm);
  const [hierarchy, setHierarchy] = useState<OrgFilterValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setForm(initialForm);
    setHierarchy({});
    setErrors({});
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  /* validation */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const required: (keyof CreateEmployeeRequest)[] = [
      "olmid",
      "employeeName",
      "emailId",
      "mobileNo",
      "employmentType",
      "vendorCompany",
      "designation",
      "jobLevel",
      "officeLocation",
      "deviceVendorCapability",
      "dateOfJoining",
      "roleCode",
    ];
    required.forEach((f) => {
      if (!form[f] || String(form[f]).trim() === "") newErrors[f] = "Required";
    });
    if (form.olmid && !/^[A-Za-z0-9]{8}$/.test(form.olmid))
      newErrors.olmid = "Must be exactly 8 alphanumeric characters";
    if (form.emailId && !/^[A-Za-z0-9._%+-]+@airtel\.com$/i.test(form.emailId))
      newErrors.emailId = "Must end with @airtel.com";
    if (form.mobileNo && !/^[6-9]\d{9}$/.test(form.mobileNo))
      newErrors.mobileNo = "10 digits, starting 6–9";
    if (!hierarchy.vertical) newErrors.vertical = "Required";
    if (!hierarchy.teamFunction) newErrors.teamFunction = "Required";
    if (!hierarchy.domain) newErrors.domain = "Required";
    if (!hierarchy.subDomain) newErrors.subDomain = "Required";
    if (!form.roleCode) newErrors.roleCode = "Required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the highlighted fields before submitting.");
      return false;
    }
    return true;
  };

  /* submit */
  const handleSubmit = async () => {
    if (!validateForm()) return;
    const payload: CreateEmployeeRequest = {
      ...form,
      actorUserId,
      verticalId: hierarchy.vertical!,
      functionId: hierarchy.teamFunction!,
      domainId: hierarchy.domain!,
      subDomainId: hierarchy.subDomain!,
    };
    try {
      const res = await addEmployee(payload).unwrap();
      if (res.message?.toLowerCase().includes("success")) {
        toast.success("Employee created successfully");
        resetForm();
        onClose();
      } else {
        toast.error(res.message || "Creation failed");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create employee.");
    }
  };

  /* field helpers */
  const upd = (key: keyof CreateEmployeeRequest) => (value: any) =>
    setForm((p: any) => ({ ...p, [key]: value }));

  /**
   * freeSolo Autocomplete:
   * - onChange   → fires when user selects an option from the dropdown list
   * - onInputChange → fires when user types freely (custom value not in list)
   * - filterOptions → appends an "Add …" hint when no match is found
   */
  const auto = (
    label: string,
    icon: React.ReactNode,
    options: string[],
    value: string | undefined,
    key: keyof CreateEmployeeRequest,
    err?: string,
  ) => (
    <Autocomplete
      size="small"
      options={options || []}
      value={value || null}
      freeSolo
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      /* sync state when user picks a dropdown option */
      onChange={(_, v) => upd(key)(v ?? "")}
      /* sync state when user types custom text */
      onInputChange={(_, v) => upd(key)(v)}
      /* show "Add '…'" hint when no match */
      filterOptions={(opts, params) => {
        const filtered = filter(opts, params);
        const { inputValue } = params;
        const isExisting = opts.some(
          (o) => inputValue.toLowerCase() === o.toLowerCase(),
        );
        if (inputValue !== "" && !isExisting) {
          filtered.push(`${inputValue}`);
        }
        return filtered;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!err}
          helperText={err}
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

  /* hierarchy helpers */
  const verticals = hierarchyData?.data?.verticals ?? [];
  const functions = hierarchyData?.data?.teamFunction ?? [];
  const domains = hierarchyData?.data?.domains ?? [];
  const subDomains = hierarchyData?.data?.subDomains ?? [];

  const verticalOpts = useMemo(
    () => verticals.map((v: any) => ({ label: v.name, value: v.id })),
    [verticals],
  );
  const functionOpts = useMemo(
    () =>
      functions
        .filter((f: any) => f.verticalId === hierarchy.vertical)
        .map((f: any) => ({ label: f.name, value: f.id })),
    [functions, hierarchy.vertical],
  );
  const domainOpts = useMemo(
    () =>
      domains
        .filter((d: any) => d.functionId === hierarchy.teamFunction)
        .map((d: any) => ({ label: d.name, value: d.id })),
    [domains, hierarchy.teamFunction],
  );
  const subDomainOpts = useMemo(
    () =>
      subDomains
        .filter((s: any) => s.domainId === hierarchy.domain)
        .map((s: any) => ({ label: s.name, value: s.id })),
    [subDomains, hierarchy.domain],
  );

  const handleHierarchyChange = (
    key: keyof OrgFilterValues,
    value?: number | null,
  ) => {
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

  const busy = isLoading || dropdownLoading || hierarchyLoading;

  /* ──────────── render ──────────── */
  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      fullWidth
      maxWidth="sm"
      TransitionProps={{ timeout: 280 }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      {/* ── loading bar ── */}
      {busy && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            height: 2,
          }}
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
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
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
            }}
          >
            <PersonAddAltIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              Add New Team Member
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Fill in the details below to onboard a new employee
            </Typography>
          </Box>
        </Stack>

        <IconButton
          size="small"
          onClick={() => {
            resetForm();
            onClose();
          }}
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── body ── */}
      <DialogContent sx={{ px: 3, py: 3, bgcolor: "grey.50" }}>
        <Stack spacing={3}>
          {/* ── section 1: basic info ── */}
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
                  required
                  fullWidth
                  value={form.olmid || ""}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      olmid: e.target.value
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .slice(0, 8),
                    }))
                  }
                  error={!!errors.olmid}
                  helperText={errors.olmid || "8 alphanumeric characters"}
                  inputProps={{ maxLength: 8 }}
                  InputProps={{
                    endAdornment: form.olmid ? (
                      <Chip
                        label={`${form.olmid.length}/8`}
                        size="small"
                        sx={{ height: 18, fontSize: 10, mr: -0.5 }}
                        color={form.olmid.length === 8 ? "success" : "default"}
                      />
                    ) : undefined,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  size="small"
                  label="Employee Name"
                  fullWidth
                  value={form.employeeName || ""}
                  onChange={(e) => upd("employeeName")(e.target.value)}
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
                  fullWidth
                  value={form.emailId || ""}
                  onChange={(e) => upd("emailId")(e.target.value)}
                  error={!!errors.emailId}
                  helperText={errors.emailId || "Must be @airtel.com"}
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
                  value={form.mobileNo || ""}
                  onChange={(e) =>
                    upd("mobileNo")(
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
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
            </Grid>
          </Box>

          {/* ── section 2: employment details ── */}
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
                {auto(
                  "Employment Type",
                  <WorkIcon />,
                  dropdownData?.employmentTypes || [],
                  form.employmentType,
                  "employmentType",
                  errors.employmentType,
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                {auto(
                  "Vendor Company",
                  <BusinessIcon />,
                  dropdownData?.vendorCompanies || [],
                  form.vendorCompany,
                  "vendorCompany",
                  errors.vendorCompany,
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                {auto(
                  "Designation",
                  <ApartmentIcon />,
                  dropdownData?.designations || [],
                  form.designation,
                  "designation",
                  errors.designation,
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                {auto(
                  "Job Level",
                  <TimelineIcon />,
                  dropdownData?.jobLevels || [],
                  form.jobLevel,
                  "jobLevel",
                  errors.jobLevel,
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                {auto(
                  "Office Location",
                  <LocationOnIcon />,
                  dropdownData?.officeLocations || [],
                  form.officeLocation,
                  "officeLocation",
                  errors.officeLocation,
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                {auto(
                  "Device Vendor Capability",
                  <MemoryIcon />,
                  dropdownData?.deviceVendorCapabilities || [],
                  form.deviceVendorCapability,
                  "deviceVendorCapability",
                  errors.deviceVendorCapability,
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                {auto(
                  "Role Code",
                  <AdminPanelSettingsIcon />,
                  dropdownData?.roleCode || [],
                  form.roleCode,
                  "roleCode",
                  errors.roleCode,
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  size="small"
                  type="date"
                  label="Date of Joining"
                  fullWidth
                  value={form.dateOfJoining || ""}
                  onChange={(e) => upd("dateOfJoining")(e.target.value)}
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

          {/* ── section 3: org hierarchy ── */}
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              p: 2.5,
            }}
          >
            <SectionLabel
              step={3}
              label="Organisation Hierarchy"
              color="#059669"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  size="small"
                  options={verticalOpts}
                  loading={hierarchyLoading}
                  value={
                    verticalOpts.find((v) => v.value === hierarchy.vertical) ||
                    null
                  }
                  onChange={(_, v) =>
                    handleHierarchyChange("vertical", v?.value)
                  }
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vertical"
                      error={!!errors.vertical}
                      helperText={errors.vertical}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <FieldIcon>
                              <ApartmentIcon />
                            </FieldIcon>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Fade in={!!hierarchy.vertical} timeout={300}>
                  <Box>
                    <Autocomplete
                      size="small"
                      options={functionOpts}
                      disabled={!hierarchy.vertical}
                      value={
                        functionOpts.find(
                          (f) => f.value === hierarchy.teamFunction,
                        ) || null
                      }
                      onChange={(_, v) =>
                        handleHierarchyChange("teamFunction", v?.value)
                      }
                      getOptionLabel={(o) => o.label}
                      isOptionEqualToValue={(a, b) => a.value === b.value}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Team Function"
                          error={!!errors.teamFunction}
                          helperText={errors.teamFunction}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <FieldIcon>
                                  <GroupsIcon />
                                </FieldIcon>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Box>
                </Fade>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Fade in={!!hierarchy.teamFunction} timeout={300}>
                  <Box>
                    <Autocomplete
                      size="small"
                      options={domainOpts}
                      disabled={!hierarchy.teamFunction}
                      value={
                        domainOpts.find((d) => d.value === hierarchy.domain) ||
                        null
                      }
                      onChange={(_, v) =>
                        handleHierarchyChange("domain", v?.value)
                      }
                      getOptionLabel={(o) => o.label}
                      isOptionEqualToValue={(a, b) => a.value === b.value}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Domain"
                          error={!!errors.domain}
                          helperText={errors.domain}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <FieldIcon>
                                  <HubIcon />
                                </FieldIcon>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Box>
                </Fade>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Fade in={!!hierarchy.domain} timeout={300}>
                  <Box>
                    <Autocomplete
                      size="small"
                      options={subDomainOpts}
                      disabled={!hierarchy.domain}
                      value={
                        subDomainOpts.find(
                          (s) => s.value === hierarchy.subDomain,
                        ) || null
                      }
                      onChange={(_, v) =>
                        handleHierarchyChange("subDomain", v?.value)
                      }
                      getOptionLabel={(o) => o.label}
                      isOptionEqualToValue={(a, b) => a.value === b.value}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Sub Domain"
                          error={!!errors.subDomain}
                          helperText={errors.subDomain}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <FieldIcon>
                                  <AccountTreeIcon />
                                </FieldIcon>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Box>
                </Fade>
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
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="caption" color="text.disabled">
          All fields marked as required must be filled
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="medium"
            onClick={() => {
              resetForm();
              onClose();
            }}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 500 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            size="medium"
            onClick={handleSubmit}
            disabled={busy}
            disableElevation
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              minWidth: 140,
              px: 3,
            }}
          >
            {isLoading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "Add Member"
            )}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};
