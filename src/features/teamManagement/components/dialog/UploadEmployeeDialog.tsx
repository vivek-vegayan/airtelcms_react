import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
  Paper,
  LinearProgress,
  Chip,
  Fade,
  Divider,
  Step,
  StepLabel,
  Stepper,
  Alert,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloseIcon from "@mui/icons-material/Close";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";

import { useState, useMemo, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { type MRT_ColumnDef } from "material-react-table";
import { AppTable } from "../../../../components/ui/AppTable";
import {
  orgHierarchyApi,
  useLazyDownloadEmployeeTemplateQuery,
  useStartExcelUploadAsyncMutation,
  useGetUploadStatusQuery,
  useLazyGetUploadResultQuery,
  useLazyGetUploadErrorReportQuery,
  type ExcelUploadRowResult,
  type ExcelUploadJobStatus,
} from "../../api/teamManagement.api";

const TERMINAL_STATUSES: ExcelUploadJobStatus[] = [
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
];

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface Props {
  open: boolean;
  onClose: () => void;
}

/* ─── Steps ─────────────────────────────────────────────────────────────── */
const STEPS = ["Download Template", "Fill & Upload", "Review Results"];

/* ─── Column def ────────────────────────────────────────────────────────── */
const resultColumns: MRT_ColumnDef<ExcelUploadRowResult>[] = [
  { accessorKey: "rowNumber", header: "Row", size: 60 },
  { accessorKey: "olmid",     header: "OLMID", size: 120 },
  {
    accessorKey: "status",
    header: "Status",
    size: 100,
    Cell: ({ cell }) => {
      const v = cell.getValue<string>();
      return (
        <Chip
          label={v}
          size="small"
          color={v === "SUCCESS" ? "success" : "error"}
          sx={{ fontWeight: 600, letterSpacing: 0.3 }}
        />
      );
    },
  },
  { accessorKey: "message", header: "Message" },
];

/* ─── Component ─────────────────────────────────────────────────────────── */
export const UploadEmployeeDialog = ({ open, onClose }: Props) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep,   setActiveStep]   = useState(0);
  const [isDragging,   setIsDragging]   = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError,    setFileError]    = useState<string | null>(null);
  const [uploadId,     setUploadId]     = useState<string | null>(null);
  const [isTerminal,   setIsTerminal]   = useState(false);

  const [triggerDownload, { isFetching: isDownloading }] =
    useLazyDownloadEmployeeTemplateQuery();
  const [startUpload, { isLoading: isStartingUpload }] =
    useStartExcelUploadAsyncMutation();

  /* ── Poll progress until a terminal status is observed, then stop ── */
  const { data: uploadStatus } = useGetUploadStatusQuery(uploadId ?? "", {
    skip: !uploadId || isTerminal,
    pollingInterval: 1500,
  });

  const [fetchResult, { data: uploadResult }] = useLazyGetUploadResultQuery();
  const [fetchErrorReport, { isFetching: isDownloadingReport }] =
    useLazyGetUploadErrorReportQuery();

  useEffect(() => {
    if (uploadStatus && TERMINAL_STATUSES.includes(uploadStatus.status)) {
      setIsTerminal(true);
    }
  }, [uploadStatus]);

  useEffect(() => {
    if (uploadId && isTerminal) {
      fetchResult(uploadId);
      dispatch(orgHierarchyApi.util.invalidateTags(["EMPLOYEES"]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, isTerminal]);

  /* ── Row results merged from DB batch results + pre-DB validation errors ── */
  const resultData = useMemo<ExcelUploadRowResult[]>(() => {
    if (!uploadResult) return [];
    const validationRows: ExcelUploadRowResult[] = uploadResult.validationErrors.map((e) => ({
      rowNumber: e.rowNumber,
      olmid: e.olmid,
      status: "FAILED",
      message: `${e.columnName}: ${e.errorMessage}`,
    }));
    return [...uploadResult.rowResults, ...validationRows].sort(
      (a, b) => a.rowNumber - b.rowNumber,
    );
  }, [uploadResult]);

  /* ── Summary counts ── */
  const successCount = useMemo(
    () => resultData.filter((r) => r.status === "SUCCESS").length,
    [resultData],
  );
  const failedCount = useMemo(
    () => resultData.filter((r) => r.status !== "SUCCESS").length,
    [resultData],
  );

  /* ── Handlers ── */
  const handleDownloadTemplate = async () => {
    try {
      const blob = await triggerDownload().unwrap();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "Employee_Upload_Template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      // Automatically advance to step 2 after download
      setActiveStep(1);
    } catch {
      // download error handled by RTK Query
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

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const response = await startUpload(selectedFile).unwrap();
      setUploadId(response.uploadId);
      setIsTerminal(false);
      setActiveStep(2);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDownloadErrorReport = async () => {
    if (!uploadId) return;
    try {
      const blob = await fetchErrorReport(uploadId).unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Excel_Upload_Error_Report_${uploadId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // download error handled by RTK Query
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadId(null);
    setIsTerminal(false);
    setFileError(null);
    setActiveStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    setActiveStep(0);
    onClose();
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <TableChartOutlinedIcon color="primary" />
          <Typography fontWeight={700} fontSize={18}>
            Bulk Upload Employees
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={4}>

          {/* ── Stepper ── */}
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* ════════════════════════════════════════════════════════════
              STEP 0 — Download template
          ════════════════════════════════════════════════════════════ */}
          {activeStep === 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                borderRadius: 3,
                textAlign: "center",
                borderColor: "primary.main",
                borderStyle: "dashed",
                bgcolor: "primary.50",
              }}
            >
              <DownloadIcon sx={{ fontSize: 52, color: "primary.main", mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Start with the official template
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Download the pre-filled Excel template with all required dropdowns
                and hierarchy data already populated. Fill in your employee details
                and upload it back here.
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 4 }}
                >
                  {isDownloading ? "Downloading…" : "Download Template"}
                </Button>
                <Tooltip title="Skip if you already have the template">
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setActiveStep(1)}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                  >
                    I already have it
                  </Button>
                </Tooltip>
              </Stack>
            </Paper>
          )}

          {/* ════════════════════════════════════════════════════════════
              STEP 1 — Upload filled file
          ════════════════════════════════════════════════════════════ */}
          {activeStep === 1 && (
            <Stack spacing={3}>
              {/* Drag-and-drop zone */}
              <Box
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 5,
                  borderRadius: 3,
                  textAlign: "center",
                  border: "2px dashed",
                  borderColor: isDragging ? "primary.dark" : selectedFile ? "success.main" : "primary.main",
                  bgcolor: isDragging
                    ? "primary.100"
                    : selectedFile
                    ? "success.50"
                    : "grey.50",
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
                      File ready to upload
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {selectedFile.name} &nbsp;·&nbsp;{(selectedFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </>
                ) : (
                  <>
                    <UploadFileIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                    <Typography fontWeight={600}>
                      Drag & drop your filled Excel here
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      or click to browse &nbsp;·&nbsp; .xlsx only
                    </Typography>
                  </>
                )}
              </Box>

              {/* File error */}
              {fileError && (
                <Alert severity="error" onClose={() => setFileError(null)}>
                  {fileError}
                </Alert>
              )}

              {/* Selected file actions */}
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

              {/* Upload starting (brief - just the initial request round trip) */}
              {isStartingUpload && (
                <Fade in>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Uploading file…
                    </Typography>
                    <LinearProgress sx={{ borderRadius: 2 }} />
                  </Box>
                </Fade>
              )}

              {/* Go back to download */}
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
                sx={{ alignSelf: "flex-start", textTransform: "none" }}
              >
                {isDownloading ? "Downloading…" : "Re-download template"}
              </Button>
            </Stack>
          )}

          {/* ════════════════════════════════════════════════════════════
              STEP 2a — Live progress (non-terminal)
          ════════════════════════════════════════════════════════════ */}
          {activeStep === 2 && !isTerminal && (
            <Stack spacing={3} alignItems="center" sx={{ py: 5 }}>
              <Typography variant="h6" fontWeight={700}>
                {uploadStatus?.stage ?? "Starting upload…"}
              </Typography>

              <Box sx={{ width: "100%" }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadStatus?.percentComplete ?? 5}
                  sx={{ borderRadius: 2, height: 8 }}
                />
              </Box>

              <Stack direction="row" spacing={4} flexWrap="wrap" justifyContent="center">
                <Typography variant="body2" color="text.secondary">
                  Batch {uploadStatus?.currentBatch ?? 0} of {uploadStatus?.totalBatches || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {uploadStatus?.processedRows ?? 0} / {uploadStatus?.totalRows ?? 0} rows processed
                </Typography>
                {uploadStatus?.estimatedSecondsRemaining != null &&
                  uploadStatus.estimatedSecondsRemaining > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      ~{uploadStatus.estimatedSecondsRemaining}s remaining
                    </Typography>
                  )}
              </Stack>

              {uploadId && (
                <Chip label={`Upload ID: ${uploadId}`} size="small" variant="outlined" />
              )}
            </Stack>
          )}

          {/* ════════════════════════════════════════════════════════════
              STEP 2b — Results (terminal)
          ════════════════════════════════════════════════════════════ */}
          {activeStep === 2 && isTerminal && uploadResult && (
            <Stack spacing={3}>
              {/* Summary cards */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Paper
                  sx={{
                    flex: 1, p: 2.5, borderRadius: 3,
                    border: "1px solid", borderColor: "success.light",
                    bgcolor: "success.50",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 28 }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700} color="success.dark">
                        {successCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created successfully
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper
                  sx={{
                    flex: 1, p: 2.5, borderRadius: 3,
                    border: "1px solid", borderColor: failedCount ? "error.light" : "grey.200",
                    bgcolor: failedCount ? "error.50" : "grey.50",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <ErrorOutlineIcon
                      color={failedCount ? "error" : "disabled"}
                      sx={{ fontSize: 28 }}
                    />
                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        color={failedCount ? "error.dark" : "text.disabled"}
                      >
                        {failedCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed rows
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>

              {failedCount > 0 && (
                <Alert
                  severity="warning"
                  action={
                    uploadResult?.errorReportAvailable && (
                      <Button
                        size="small"
                        startIcon={<ArticleOutlinedIcon />}
                        onClick={handleDownloadErrorReport}
                        disabled={isDownloadingReport}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        {isDownloadingReport ? "Preparing…" : "Download Error Report"}
                      </Button>
                    )
                  }
                >
                  {failedCount} row{failedCount > 1 ? "s" : ""} failed. Fix the
                  highlighted issues and re-upload only the failed rows.
                </Alert>
              )}

              <Divider />

              {/* Results table */}
              <AppTable
                columns={resultColumns}
                data={resultData}
                enableTopToolbar={false}
                enablePagination
                initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>

      {/* ── Footer actions ── */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Close
        </Button>

        {activeStep === 1 && (
          <Button
            variant="contained"
            disabled={!selectedFile || isStartingUpload}
            onClick={handleUpload}
            startIcon={<UploadFileIcon />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3 }}
          >
            {isStartingUpload ? "Uploading…" : "Upload File"}
          </Button>
        )}

        {activeStep === 2 && isTerminal && (
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
