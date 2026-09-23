import {
  Grid,
  Card,
  // Typography,
  TextField,
  Autocomplete,
  // Box,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

// import BadgeIcon from "@mui/icons-material/Badge";
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

import type { CreateEmployeeRequest } from "../../types/createUser.types";
import type { CreateUserDropdownResponse } from "../../api/teamManagement.api";

interface Props {
  form: CreateEmployeeRequest;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
  dropdownData?: CreateUserDropdownResponse;
  mode?: "create" | "edit";
}

export const EmployeeBasicForm = ({
  form,
  setForm,
  errors,
  dropdownData,
  mode,
}: Props) => {
  const updateField = (key: keyof CreateEmployeeRequest) => (value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderAuto = (
    label: string,
    icon: React.ReactNode,
    options: string[],
    value: string | undefined,
    key: keyof CreateEmployeeRequest,
    error?: string,
  ) => (
    <Autocomplete
      size="small"
      options={options || []}
      value={value || null}
      onChange={(_, v) => updateField(key)(v)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {icon}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );

  return (
    <Card
      elevation={0}
      sx={{
        p: 1,
        borderRadius: 3,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <Grid container spacing={1.5}>
        {/* OLM ID */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* <TextField
            size="small"
            label="OLM ID"
            fullWidth
            value={form.olmid || ""}
            onChange={(e) =>
              updateField("olmid")(
                e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8),
              )
            }
            error={!!errors.olmid}
            helperText={errors.olmid}
            InputProps={{
              startAdornment: <BadgeIcon sx={{ mr: 1 }} />,
            }}
          /> */}

          <TextField
            label="OLM ID"
            required
            fullWidth
            size="small"
            value={form.olmid || ""}
            disabled={mode === "edit"}
            onChange={(e) =>
              setForm((prev: any) => ({
                ...prev,
                olmid: e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8),
              }))
            }
            error={!!errors.olmid}
            helperText={errors.olmid}
          />
        </Grid>

        {/* Name */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            size="small"
            label="Employee Name"
            fullWidth
            value={form.employeeName || ""}
            onChange={(e) => updateField("employeeName")(e.target.value)}
            error={!!errors.employeeName}
            helperText={errors.employeeName}
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1 }} />,
            }}
          />
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            size="small"
            label="Email"
            fullWidth
            value={form.emailId || ""}
            onChange={(e) => updateField("emailId")(e.target.value)}
            error={!!errors.emailId}
            helperText={errors.emailId}
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1 }} />,
            }}
          />
        </Grid>

        {/* Mobile */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            size="small"
            label="Mobile"
            fullWidth
            value={form.mobileNo || ""}
            onChange={(e) =>
              updateField("mobileNo")(
                e.target.value.replace(/\D/g, "").slice(0, 10),
              )
            }
            error={!!errors.mobileNo}
            helperText={errors.mobileNo}
            InputProps={{
              startAdornment: <PhoneIphoneIcon sx={{ mr: 1 }} />,
            }}
          />
        </Grid>

        {/* Employment Type */}
        <Grid size={{ xs: 12, md: 6 }}>
          {renderAuto(
            "Employment Type",
            <WorkIcon sx={{ mr: 1 }} />,
            dropdownData?.employmentTypes || [],
            form.employmentType,
            "employmentType",
            errors.employmentType,
          )}
        </Grid>

        {/* Vendor */}
        <Grid size={{ xs: 12, md: 6 }}>
          {renderAuto(
            "Vendor Company",
            <BusinessIcon sx={{ mr: 1 }} />,
            dropdownData?.vendorCompanies || [],
            form.vendorCompany,
            "vendorCompany",
            errors.vendorCompany,
          )}
        </Grid>

        {/* Designation */}
        <Grid size={{ xs: 12, md: 6 }}>
          {renderAuto(
            "Designation",
            <ApartmentIcon sx={{ mr: 1 }} />,
            dropdownData?.designations || [],
            form.designation,
            "designation",
            errors.designation,
          )}
        </Grid>

        {/* Job Level */}
        <Grid size={{ xs: 12, md: 6 }}>
          {renderAuto(
            "Job Level",
            <TimelineIcon sx={{ mr: 1 }} />,
            dropdownData?.jobLevels || [],
            form.jobLevel,
            "jobLevel",
            errors.jobLevel,
          )}
        </Grid>

        {/* Office Location */}
        <Grid size={{ xs: 12, md: 6 }}>
          {renderAuto(
            "Office Location",
            <LocationOnIcon sx={{ mr: 1 }} />,
            dropdownData?.officeLocations || [],
            form.officeLocation,
            "officeLocation",
            errors.officeLocation,
          )}
        </Grid>

        {/* Device Capability */}
        <Grid size={{ xs: 12, md: 6 }}>
          {renderAuto(
            "Device Vendor Capability",
            <MemoryIcon sx={{ mr: 1 }} />,
            dropdownData?.deviceVendorCapabilities || [],
            form.deviceVendorCapability,
            "deviceVendorCapability",
            errors.deviceVendorCapability,
          )}
        </Grid>
        {/* RoleCode */}
        <Grid size={{ xs: 12, md: 6 }}>
          {renderAuto(
            "Role Code",
            <AdminPanelSettingsIcon sx={{ mr: 1 }} />,
            dropdownData?.roleCode || [],
            form.roleCode,
            "roleCode",
            errors.roleCode,
          )}
        </Grid>

        {/* DOJ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            size="small"
            type="date"
            label="Date Of Joining"
            fullWidth
            value={form.dateOfJoining || ""}
            onChange={(e) => updateField("dateOfJoining")(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={!!errors.dateOfJoining}
            helperText={errors.dateOfJoining}
            InputProps={{
              startAdornment: <EventIcon sx={{ mr: 1 }} />,
            }}
          />
        </Grid>
      </Grid>
    </Card>
  );
};
