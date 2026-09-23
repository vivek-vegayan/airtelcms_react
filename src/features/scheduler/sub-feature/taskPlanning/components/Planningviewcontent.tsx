import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SendIcon from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  navy: "#0d1b2a",
  navyMid: "#1b2e45",
  accent: "#1560bd",
  accentL: "#e8f0fc",
  border: "#d8dde8",
  borderH: "#8fa0bc",
  bg: "#f4f6fa",
  surface: "#ffffff",
  label: "#5a6680",
  placeholder: "#9ba8be",
  text: "#0d1b2a",
  muted: "#7a869a",
  rowBg: "#f9fafc",
  radius: "6px",
  inputH: "34px",
  font: "'IBM Plex Sans', 'Segoe UI', sans-serif",
};

// ─── Styled atoms ─────────────────────────────────────────────────────────────
const Wrap = styled(Box)({
  fontFamily: T.font,
  background: T.bg,
  minHeight: "100vh",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "24px 20px",
});

const Card = styled(Paper)({
  background: T.surface,
  borderRadius: "10px",
  border: `1px solid ${T.border}`,
  boxShadow: "0 2px 12px rgba(13,27,42,0.07)",
  width: "100%",
  maxWidth: "1120px",
  overflow: "hidden",
});

const CardHeader = styled(Box)({
  background: T.navy,
  padding: "14px 24px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
});

const CardBody = styled(Box)({
  padding: "20px 24px 18px",
});

const SectionLabel = styled(Typography)({
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.9px",
  textTransform: "uppercase",
  color: T.muted,
  marginBottom: "8px",
  marginTop: "2px",
});

// Shared input overrides
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: T.radius,
    background: T.rowBg,
    fontSize: "12.5px",
    height: T.inputH,
    transition: "border-color 0.15s, background 0.15s",
    "& fieldset": { borderColor: T.border },
    "&:hover fieldset": { borderColor: T.borderH },
    "&.Mui-focused fieldset": { borderColor: T.accent, borderWidth: "1.5px" },
    "&.Mui-focused": { background: "#fff" },
  },
  "& .MuiInputLabel-root": {
    fontSize: "12px",
    color: T.placeholder,
    transform: "translate(12px, 8px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(12px, -7px) scale(0.82)",
      color: T.label,
    },
    "&.Mui-focused": { color: T.accent },
  },
  "& .MuiOutlinedInput-input": {
    padding: "0 12px",
    color: T.text,
    height: T.inputH,
    boxSizing: "border-box",
  },
};

const selectSx = {
  ...inputSx,
  "& .MuiSelect-select": {
    padding: "0 12px",
    height: T.inputH,
    lineHeight: T.inputH,
    display: "flex",
    alignItems: "center",
    fontSize: "12.5px",
    color: T.text,
  },
};

const FField = ({ label, value, onChange }) => (
  <TextField
    label={label}
    value={value}
    onChange={onChange}
    fullWidth
    size="small"
    sx={inputSx}
  />
);

const FSelect = ({ label, value, onChange, options }) => (
  <FormControl fullWidth size="small" sx={selectSx}>
    <InputLabel>{label}</InputLabel>
    <Select value={value} onChange={onChange} label={label}>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value} sx={{ fontSize: "12.5px" }}>
          {o.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// ─── Grid helpers ─────────────────────────────────────────────────────────────
const Row = ({ cols = "repeat(3,1fr)", children }) => (
  <Box
    sx={{ display: "grid", gridTemplateColumns: cols, gap: "10px", mb: "10px" }}
  >
    {children}
  </Box>
);

// ─── Component ────────────────────────────────────────────────────────────────
const INIT = {
  assignedGroup: "Deployment-TNG",
  neLabel: "",
  planType: "",
  activitySequence: "",
  planActivityDetails: "",
  locationCode: "",
  taskProfileType: "",
  state: "",
  changeImpact: "",
  nodeType: "",
  vendor: "",
  workArea: "",
  remedyBin: "",
  taskActivity: "",
  remark: "",
  assignedDepartment: "",
  planPdf: null,
};

export const PlanningViewContent = () => {
  const [form, setForm] = useState(INIT);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const reset = () => setForm(INIT);
  const submit = () => console.log("Submit:", form);
  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm((f) => ({ ...f, planPdf: file }));
  };

  return (
    <>
      <Card elevation={0}>
        {/* ── Header bar ── */}
     

        <CardBody>
          {/* ── Section: Identification ── */}
          <SectionLabel>Identification</SectionLabel>
          <Row>
            <FField
              label="Assigned Group"
              value={form.assignedGroup}
              onChange={set("assignedGroup")}
            />
            <FField
              label="NE Label"
              value={form.neLabel}
              onChange={set("neLabel")}
            />
            <FField
              label="Plan Type"
              value={form.planType}
              onChange={set("planType")}
            />
          </Row>

          <Row>
            <FField
              label="Activity Sequence"
              value={form.activitySequence}
              onChange={set("activitySequence")}
            />
            <FField
              label="Plan Activity Details"
              value={form.planActivityDetails}
              onChange={set("planActivityDetails")}
            />
            <FField
              label="Location Code"
              value={form.locationCode}
              onChange={set("locationCode")}
            />
          </Row>

          <Divider sx={{ my: "14px", borderColor: "#edf0f7" }} />

          {/* ── Section: Configuration ── */}
          <SectionLabel>Configuration</SectionLabel>
          <Row>
            <FSelect
              label="Task Profile Type"
              value={form.taskProfileType}
              onChange={set("taskProfileType")}
              options={[
                { value: "standard", label: "Standard" },
                { value: "express", label: "Express" },
                { value: "critical", label: "Critical Path" },
              ]}
            />
            <FField label="State" value={form.state} onChange={set("state")} />
            <FSelect
              label="Change Impact"
              value={form.changeImpact}
              onChange={set("changeImpact")}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
          </Row>

          <Row>
            <FSelect
              label="Node Type"
              value={form.nodeType}
              onChange={set("nodeType")}
              options={[
                { value: "core", label: "Core" },
                { value: "edge", label: "Edge" },
                { value: "access", label: "Access" },
              ]}
            />
            <FSelect
              label="Vendor"
              value={form.vendor}
              onChange={set("vendor")}
              options={[
                { value: "cisco", label: "Cisco" },
                { value: "nokia", label: "Nokia" },
                { value: "huawei", label: "Huawei" },
                { value: "ericsson", label: "Ericsson" },
              ]}
            />
            <FField
              label="Work Area"
              value={form.workArea}
              onChange={set("workArea")}
            />
          </Row>

          <Divider sx={{ my: "14px", borderColor: "#edf0f7" }} />

          {/* ── Section: Task & Remarks ── */}
          <SectionLabel>Task &amp; Remarks</SectionLabel>
          <Row cols="1fr 1fr 1fr">
            <FField
              label="Remedy Bin"
              value={form.remedyBin}
              onChange={set("remedyBin")}
            />
            <FField
              label="Task Activity"
              value={form.taskActivity}
              onChange={set("taskActivity")}
            />

            {/* PDF Upload */}
            <Box>
              <input
                type="file"
                accept="application/pdf"
                id="pdf-input"
                style={{ display: "none" }}
                onChange={onFile}
              />
              <label htmlFor="pdf-input">
                <Box
                  sx={{
                    height: T.inputH,
                    border: `1.5px dashed ${form.planPdf ? T.accent : T.border}`,
                    borderRadius: T.radius,
                    background: form.planPdf ? T.accentL : T.rowBg,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    px: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": { borderColor: T.accent, background: T.accentL },
                  }}
                >
                  <UploadFileIcon
                    sx={{
                      fontSize: "14px",
                      color: form.planPdf ? T.accent : T.placeholder,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontFamily: T.font,
                      color: form.planPdf ? T.accent : T.placeholder,
                      fontWeight: form.planPdf ? 600 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {form.planPdf
                      ? `${form.planPdf.name.length > 22 ? form.planPdf.name.slice(0, 22) + "…" : form.planPdf.name} · ${(form.planPdf.size / 1024).toFixed(0)}KB`
                      : "Choose Plan PDF"}
                  </Typography>
                </Box>
              </label>
            </Box>
          </Row>

          <Row cols="1fr 1fr 1fr">
            <FField
              label="Remark"
              value={form.remark}
              onChange={set("remark")}
            />
            <FSelect
              label="Assigned Department"
              value={form.assignedDepartment}
              onChange={set("assignedDepartment")}
              options={[
                { value: "noc", label: "NOC" },
                { value: "operations", label: "Operations" },
                { value: "engineering", label: "Engineering" },
                { value: "planning", label: "Planning" },
              ]}
            />
            <Box /> {/* spacer */}
          </Row>

          {/* ── Footer ── */}
          <Divider sx={{ mt: "14px", mb: "14px", borderColor: "#edf0f7" }} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{ fontSize: "11px", color: T.muted, fontFamily: T.font }}
            >
              * All fields are optional unless marked required
            </Typography>
            <Box sx={{ display: "flex", gap: "8px" }}>
              <Button
                onClick={reset}
                startIcon={
                  <RestartAltIcon sx={{ fontSize: "14px !important" }} />
                }
                sx={{
                  fontFamily: T.font,
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "none",
                  color: T.muted,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radius,
                  px: "14px",
                  py: "5px",
                  height: "32px",
                  "&:hover": { background: "#f4f6fa", borderColor: T.borderH },
                }}
              >
                Reset
              </Button>
              <Button
                onClick={submit}
                endIcon={<SendIcon sx={{ fontSize: "13px !important" }} />}
                sx={{
                  fontFamily: T.font,
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "none",
                  background: T.navy,
                  color: "#fff",
                  borderRadius: T.radius,
                  px: "20px",
                  py: "5px",
                  height: "32px",
                  letterSpacing: "0.3px",
                  boxShadow: "0 2px 8px rgba(13,27,42,0.25)",
                  "&:hover": {
                    background: T.accent,
                    boxShadow: "0 3px 12px rgba(21,96,189,0.4)",
                  },
                  transition: "all 0.18s ease",
                }}
              >
                Submit Plan
              </Button>
            </Box>
          </Box>
        </CardBody>
      </Card>
    </>
  );
};

export default PlanningViewContent;
