import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloseIcon from "@mui/icons-material/Close";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { type MRT_ColumnDef } from "material-react-table";
import { AppTable } from "../../../../../../components/ui/AppTable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  useParsePlanActivityExcelMutation,
  useUploadPlanActivityExcelMutation,
  type PlanActivityExcelParseResponse,
  type PlanActivityExcelRow,
  type PlanActivityExcelUploadSummary,
  type PlanActivityValidationError,
} from "../../api/planApiSlice";
import { useDownloadPlanActivityTemplate } from "../../hooks/useDownloadPlanActivityTemplate";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ["Select File", "Preview & Validate", "Upload Summary"];

export const UploadPlanActivityDialog = ({ open, onClose, onSuccess }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<PlanActivityExcelParseResponse | null>(null);
  const [uploadSummary, setUploadSummary] = useState<PlanActivityExcelUploadSummary | null>(null);

  const { download: downloadTemplate, isDownloading } = useDownloadPlanActivityTemplate();
  const [parseExcel, { isLoading: isParsing }] = useParsePlanActivityExcelMutation();
  const [uploadExcel, { isLoading: isUploading }] = useUploadPlanActivityExcelMutation();

  const invalidRowNumbers = useMemo(
    () => new Set((parseResult?.errors ?? []).map((e) => e.rowNumber)),
    [parseResult],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch {
      // download error surfaced via RTK Query state elsewhere
    }
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    if (!file.name.endsWith(".xlsx")) {
      setFileError("Only .xlsx files are accepted. Please use the downloaded template.");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleParse = async () => {
    if (!selectedFile) return;
    try {
      const response = await parseExcel(selectedFile).unwrap();
      setParseResult(response);
      setActiveStep(1);
    } catch (error) {
      console.error("Parse failed:", error);
      const msg = (error as any)?.data?.message || (error as any)?.message || "Failed to read the uploaded file.";
      setFileError(msg);
    }
  };

  const handleConfirmUpload = async () => {
    if (!parseResult) return;
    const validRows = parseResult.rows.filter((r) => !invalidRowNumbers.has(r.rowNumber));
    if (validRows.length === 0) return;
    try {
      const response = await uploadExcel(validRows).unwrap();
      setUploadSummary(response);
      setActiveStep(2);
      onSuccess();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileError(null);
    setParseResult(null);
    setUploadSummary(null);
    setActiveStep(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const exportValidationReport = async () => {
    if (!parseResult) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Validation Errors");
    ws.addRow(["Row", "Column", "Value", "Error"]);
    ws.getRow(1).font = { bold: true };
    parseResult.errors.forEach((e) => ws.addRow([e.rowNumber, e.column, e.value ?? "", e.error]));
    ws.columns.forEach((col) => (col.width = 28));
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Plan_Activity_Validation_Report_${Date.now()}.xlsx`);
  };

  const exportUploadReport = async () => {
    if (!uploadSummary) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Upload Results");
    ws.addRow(["Row", "Activity Name", "Status", "Message", "Plan ID", "Activity ID"]);
    ws.getRow(1).font = { bold: true };
    uploadSummary.results.forEach((r) =>
      ws.addRow([r.rowNumber, r.activityName, r.status, r.message, r.planId ?? "", r.activityId ?? ""]),
    );
    ws.columns.forEach((col) => (col.width = 24));
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Plan_Activity_Upload_Summary_${Date.now()}.xlsx`);
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const previewColumns = useMemo<MRT_ColumnDef<PlanActivityExcelRow>[]>(
    () => [
      { accessorKey: "rowNumber", header: "Row", size: 60 },
      {
        id: "rowStatus",
        header: "Status",
        size: 90,
        Cell: ({ row }) => {
          const invalid = invalidRowNumbers.has(row.original.rowNumber);
          return (
            <Chip
              label={invalid ? "Invalid" : "Valid"}
              size="small"
              color={invalid ? "error" : "success"}
              variant={invalid ? "filled" : "outlined"}
            />
          );
        },
      },
      { accessorKey: "verticalName", header: "Vertical", size: 130 },
      { accessorKey: "functionName", header: "Team Function", size: 140 },
      { accessorKey: "chmDomainName", header: "CHM Domain", size: 140 },
      { accessorKey: "chmSubDomainName", header: "CHM Sub Domain", size: 140 },
      { accessorKey: "layer", header: "Layer", size: 90 },
      { accessorKey: "planType", header: "Plan Type", size: 130 },
      { accessorKey: "vendorOem", header: "Vendor / OEM", size: 120 },
      { accessorKey: "changeImpact", header: "Impact", size: 80 },
      { accessorKey: "activityName", header: "Activity Name", size: 180 },
    ],
    [invalidRowNumbers],
  );

  const errorColumns = useMemo<MRT_ColumnDef<PlanActivityValidationError>[]>(
    () => [
      { accessorKey: "rowNumber", header: "Row", size: 60 },
      { accessorKey: "column", header: "Column", size: 180 },
      { accessorKey: "value", header: "Value", size: 160 },
      { accessorKey: "error", header: "Error", size: 320 },
    ],
    [],
  );

  const resultColumns = useMemo<MRT_ColumnDef<PlanActivityExcelUploadSummary["results"][number]>[]>(
    () => [
      { accessorKey: "rowNumber", header: "Row", size: 60 },
      { accessorKey: "activityName", header: "Activity Name", size: 180 },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        Cell: ({ cell }) => {
          const v = cell.getValue<string>();
          return <Chip label={v} size="small" color={v === "SUCCESS" ? "success" : "error"} sx={{ fontWeight: 600 }} />;
        },
      },
      { accessorKey: "message", header: "Message", size: 260 },
      { accessorKey: "planId", header: "Plan ID", size: 90 },
      { accessorKey: "activityId", header: "Activity ID", size: 120 },
    ],
    [],
  );

  const validCount = parseResult ? parseResult.validRowCount : 0;
  const invalidCount = parseResult ? parseResult.invalidRowCount : 0;

  // Rows skipped before upload, categorized by why they were invalid — a row
  // can land in more than one bucket (e.g. a bad hierarchy value AND a bad
  // team name), so counts are not a strict partition of invalidCount.
  const validationBreakdown = useMemo(() => {
    const HIERARCHY_COLUMNS = new Set(["Vertical", "Team Function", "CHM Domain", "CHM Sub Domain"]);
    const duplicateRows = new Set<number>();
    const hierarchyRows = new Set<number>();
    const teamRows = new Set<number>();
    (parseResult?.errors ?? []).forEach((e) => {
      if (e.error.toLowerCase().includes("duplicate")) duplicateRows.add(e.rowNumber);
      else if (HIERARCHY_COLUMNS.has(e.column)) hierarchyRows.add(e.rowNumber);
      else if (e.column.endsWith("Team")) teamRows.add(e.rowNumber);
    });
    return { duplicate: duplicateRows.size, hierarchy: hierarchyRows.size, team: teamRows.size };
  }, [parseResult]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <TableChartOutlinedIcon color="primary" />
          <Typography fontWeight={700} fontSize={18}>
            Bulk Upload Plan &amp; Activity
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* ── STEP 0 — Select file ── */}
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: 3,
                  textAlign: "center",
                  borderColor: "primary.main",
                  borderStyle: "dashed",
                  bgcolor: "primary.50",
                }}
              >
                <DownloadIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Start with the official template
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Download the template with cascading dropdowns for Vertical, Team
                  Function, CHM Domain / Sub Domain, Layer, Plan Type, Shift, Level
                  and Team already populated.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3 }}
                >
                  {isDownloading ? "Downloading…" : "Download Template"}
                </Button>
              </Paper>

              <Box
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 5,
                  borderRadius: 3,
                  textAlign: "center",
                  border: "2px dashed",
                  borderColor: isDragging ? "primary.dark" : selectedFile ? "success.main" : "primary.main",
                  bgcolor: isDragging ? "primary.100" : selectedFile ? "success.50" : "grey.50",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { bgcolor: "primary.50", borderColor: "primary.dark" },
                }}
              >
                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
                />
                {selectedFile ? (
                  <>
                    <CheckCircleOutlineIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                    <Typography fontWeight={600} color="success.main">
                      File ready
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {selectedFile.name} &nbsp;·&nbsp;{(selectedFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </>
                ) : (
                  <>
                    <UploadFileIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                    <Typography fontWeight={600}>Drag &amp; drop your filled Excel here</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      or click to browse &nbsp;·&nbsp; .xlsx only
                    </Typography>
                  </>
                )}
              </Box>

              {fileError && (
                <Alert severity="error" onClose={() => setFileError(null)}>
                  {fileError}
                </Alert>
              )}

              {selectedFile && (
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Chip
                    icon={<UploadFileIcon />}
                    label={selectedFile.name}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                  <Tooltip title="Remove file">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setFileError(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}

              {isParsing && (
                <Fade in>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Reading and validating rows…
                    </Typography>
                    <LinearProgress sx={{ borderRadius: 2 }} />
                  </Box>
                </Fade>
              )}
            </Stack>
          )}

          {/* ── STEP 1 — Preview & Validate ── */}
          {activeStep === 1 && parseResult && (
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Paper sx={{ flex: 1, p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="h5" fontWeight={700}>
                    {parseResult.totalRows}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Rows
                  </Typography>
                </Paper>
                <Paper sx={{ flex: 1, p: 2, borderRadius: 3, border: "1px solid", borderColor: "success.light", bgcolor: "success.50" }}>
                  <Typography variant="h5" fontWeight={700} color="success.dark">
                    {validCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valid Rows
                  </Typography>
                </Paper>
                <Paper
                  sx={{
                    flex: 1, p: 2, borderRadius: 3, border: "1px solid",
                    borderColor: invalidCount ? "error.light" : "grey.200",
                    bgcolor: invalidCount ? "error.50" : "grey.50",
                  }}
                >
                  <Typography variant="h5" fontWeight={700} color={invalidCount ? "error.dark" : "text.disabled"}>
                    {invalidCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Invalid Rows
                  </Typography>
                </Paper>
              </Stack>

              <Typography variant="subtitle2" fontWeight={700}>
                Preview
              </Typography>
              <AppTable
                columns={previewColumns}
                data={parseResult.rows}
                enableTopToolbar={false}
                enablePagination
                initialState={{ pagination: { pageSize: 5, pageIndex: 0 }, density: "compact" }}
              />

              {parseResult.errors.length > 0 && (
                <>
                  <Divider />
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <WarningAmberIcon color="warning" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={700}>
                        Validation Errors ({parseResult.errors.length})
                      </Typography>
                    </Box>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={exportValidationReport} sx={{ textTransform: "none" }}>
                      Export Validation Report
                    </Button>
                  </Box>
                  <Alert severity="warning">
                    {invalidCount} row{invalidCount > 1 ? "s" : ""} will be skipped. Fix them in the source file and
                    re-upload, or continue — valid rows will still be created.
                  </Alert>
                  <AppTable
                    columns={errorColumns}
                    data={parseResult.errors}
                    enableTopToolbar={false}
                    enablePagination
                    initialState={{ pagination: { pageSize: 5, pageIndex: 0 }, density: "compact" }}
                  />
                </>
              )}

              {isUploading && (
                <Fade in>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Uploading valid rows…
                    </Typography>
                    <LinearProgress sx={{ borderRadius: 2 }} />
                  </Box>
                </Fade>
              )}
            </Stack>
          )}

          {/* ── STEP 2 — Summary ── */}
          {activeStep === 2 && uploadSummary && (
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Paper sx={{ flex: 1, p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="h5" fontWeight={700}>
                    {parseResult?.totalRows ?? uploadSummary.totalRows}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Records
                  </Typography>
                </Paper>
                <Paper sx={{ flex: 1, p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "success.light", bgcolor: "success.50" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 28 }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700} color="success.dark">
                        {uploadSummary.successCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Successfully Uploaded
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
                <Paper
                  sx={{
                    flex: 1, p: 2.5, borderRadius: 3, border: "1px solid",
                    borderColor: uploadSummary.failedCount ? "error.light" : "grey.200",
                    bgcolor: uploadSummary.failedCount ? "error.50" : "grey.50",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <ErrorOutlineIcon color={uploadSummary.failedCount ? "error" : "disabled"} sx={{ fontSize: 28 }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700} color={uploadSummary.failedCount ? "error.dark" : "text.disabled"}>
                        {uploadSummary.failedCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed Records
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
                <Paper sx={{ flex: 1, p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="h5" fontWeight={700}>
                    {(uploadSummary.processingTimeMs / 1000).toFixed(2)}s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processing Time
                  </Typography>
                </Paper>
              </Stack>

              <Typography variant="subtitle2" fontWeight={700}>
                Rows Skipped Before Upload ({invalidCount})
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Paper
                  sx={{
                    flex: 1, p: 2, borderRadius: 3, border: "1px solid",
                    borderColor: validationBreakdown.duplicate ? "warning.light" : "grey.200",
                    bgcolor: validationBreakdown.duplicate ? "warning.50" : "grey.50",
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color={validationBreakdown.duplicate ? "warning.dark" : "text.disabled"}>
                    {validationBreakdown.duplicate}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duplicate Records
                  </Typography>
                </Paper>
                <Paper
                  sx={{
                    flex: 1, p: 2, borderRadius: 3, border: "1px solid",
                    borderColor: validationBreakdown.hierarchy ? "warning.light" : "grey.200",
                    bgcolor: validationBreakdown.hierarchy ? "warning.50" : "grey.50",
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color={validationBreakdown.hierarchy ? "warning.dark" : "text.disabled"}>
                    {validationBreakdown.hierarchy}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Invalid Hierarchy Records
                  </Typography>
                </Paper>
                <Paper
                  sx={{
                    flex: 1, p: 2, borderRadius: 3, border: "1px solid",
                    borderColor: validationBreakdown.team ? "warning.light" : "grey.200",
                    bgcolor: validationBreakdown.team ? "warning.50" : "grey.50",
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color={validationBreakdown.team ? "warning.dark" : "text.disabled"}>
                    {validationBreakdown.team}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Invalid Team Mapping
                  </Typography>
                </Paper>
              </Stack>

              <Box display="flex" justifyContent="flex-end">
                <Button size="small" startIcon={<DownloadIcon />} onClick={exportUploadReport} sx={{ textTransform: "none" }}>
                  Export Upload Report
                </Button>
              </Box>

              <Divider />

              <AppTable
                columns={resultColumns}
                data={uploadSummary.results}
                enableTopToolbar={false}
                enablePagination
                initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Close
        </Button>

        {activeStep === 0 && (
          <Button
            variant="contained"
            disabled={!selectedFile || isParsing}
            onClick={handleParse}
            startIcon={<UploadFileIcon />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3 }}
          >
            {isParsing ? "Reading…" : "Preview File"}
          </Button>
        )}

        {activeStep === 1 && (
          <Button
            variant="contained"
            disabled={validCount === 0 || isUploading}
            onClick={handleConfirmUpload}
            startIcon={<UploadFileIcon />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3 }}
          >
            {isUploading ? "Uploading…" : `Confirm Upload (${validCount})`}
          </Button>
        )}

        {activeStep === 2 && (
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Upload Another File
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
