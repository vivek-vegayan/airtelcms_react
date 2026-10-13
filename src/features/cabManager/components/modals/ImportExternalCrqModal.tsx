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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDownloadStaticTemplate } from "../../../../hooks/useDownloadStaticTemplate";
import { useAddExternalCrqsToCabSessionMutation } from "../../api/cabManagerApiSlice";
import type { AddCrqToSessionResult, ExternalCrqRow } from "../../types/types";
import { ImpactChip } from "../shared/Chips";
import { errMsg } from "../shared/errMsg";

const TEMPLATE_FILE_NAME = "External_CRQ_Upload_Template.xlsx";
/** Sheet the template keeps its rows on; any other workbook falls back to its first sheet. */
const UPLOAD_SHEET = "Upload";
const STEPS = ["Download Template", "Fill & Upload", "Review Results"];
const COLUMNS: (keyof ExternalCrqRow)[] = [
  "crq_no",
  "circle",
  "node_name",
  "type_of_activity",
  "change_impact",
];
const LABELS: Record<keyof ExternalCrqRow, string> = {
  crq_no: "CRQ No",
  circle: "Circle",
  node_name: "Node Name",
  type_of_activity: "Type of Activity",
  change_impact: "Change Impact",
};
const REQUIRED: (keyof ExternalCrqRow)[] = ["crq_no", "circle", "type_of_activity", "change_impact"];
const IMPACTS = ["SA", "NSA"];
/** The header row sits under the template's banner, so look a few rows down for it. */
const HEADER_SEARCH_ROWS = 5;
const MONO = { fontFamily: "'Roboto Mono', monospace" } as const;

interface ParsedRow {
  rowNumber: number;
  crq: ExternalCrqRow;
  /** Blocking problems — the row is not sent. */
  errors: string[];
  /** Already on this agenda; not sent, but not the user's mistake either. */
  alreadyTabled: boolean;
}

/** RFC 4180 CSV split — node_name routinely carries "host1, host2" in quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Every row of the workbook's Upload sheet as display text (formulas give their result). */
async function readXlsx(file: File): Promise<string[][]> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.getWorksheet(UPLOAD_SHEET) ?? wb.worksheets[0];
  if (!ws) return [];
  const grid: string[][] = [];
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= ws.columnCount; c++) cells.push(row.getCell(c).text ?? "");
    grid.push(cells);
  }
  return grid;
}

/** "Node Name\n(comma separated)", "CRQ No *" and "crq_no" all map to the same key. */
const headerKey = (h: string) =>
  h.replace(/\(.*?\)/gs, "").replace(/\*/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function buildRows(grid: string[][], tabled: Set<string>): { rows: ParsedRow[]; error?: string } {
  const headerIdx = grid
    .slice(0, HEADER_SEARCH_ROWS)
    .findIndex((cells) => cells.map(headerKey).includes("crq_no"));
  if (headerIdx < 0) {
    return { rows: [], error: "Could not find the header row (CRQ No, Circle, …). Please use the downloaded template." };
  }
  const header = grid[headerIdx].map(headerKey);
  const missing = COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    return { rows: [], error: `Missing column(s): ${missing.map((c) => LABELS[c]).join(", ")}. Please use the downloaded template.` };
  }

  const seen = new Set<string>();
  const rows: ParsedRow[] = [];
  grid.forEach((cells, i) => {
    if (i <= headerIdx) return;
    const crq = Object.fromEntries(
      COLUMNS.map((c) => [c, (cells[header.indexOf(c)] ?? "").trim()])
    ) as unknown as ExternalCrqRow;
    // The template pre-formats 200 rows; untouched ones are simply not CRQs.
    if (COLUMNS.every((c) => !crq[c])) return;
    crq.change_impact = crq.change_impact.toUpperCase();

    const errors = REQUIRED.filter((c) => !crq[c]).map((c) => `${LABELS[c]} is required`);
    if (crq.change_impact && !IMPACTS.includes(crq.change_impact)) {
      errors.push("Change Impact must be SA or NSA");
    }
    if (crq.crq_no) {
      if (seen.has(crq.crq_no)) errors.push("Duplicate CRQ No in file");
      seen.add(crq.crq_no);
    }
    rows.push({
      rowNumber: i + 1,
      crq,
      errors,
      alreadyTabled: tabled.has(crq.crq_no),
    });
  });
  if (rows.length === 0) return { rows: [], error: "The file has a header but no CRQ rows." };
  return { rows };
}

/**
 * Bulk-tables CRQs raised outside the portal onto a session's agenda from a
 * template workbook (or a CSV saved from it). The file is parsed and checked here so the user sees every bad row
 * before anything is sent; only clean rows go to the server.
 */
export function ImportExternalCrqModal({
  open,
  sessionId,
  alreadyTabled,
  onClose,
}: {
  open: boolean;
  sessionId: string;
  /** CRQ numbers already on this agenda — flagged in the preview and not re-sent. */
  alreadyTabled: string[];
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<AddCrqToSessionResult | null>(null);

  const { download, isDownloading } = useDownloadStaticTemplate(TEMPLATE_FILE_NAME);
  const [addExternal, { isLoading: isSubmitting }] = useAddExternalCrqsToCabSessionMutation();

  const tabled = useMemo(() => new Set(alreadyTabled), [alreadyTabled]);
  const validRows = rows.filter((r) => r.errors.length === 0 && !r.alreadyTabled);
  const invalidCount = rows.filter((r) => r.errors.length > 0).length;
  const tabledCount = rows.filter((r) => r.errors.length === 0 && r.alreadyTabled).length;

  const handleDownloadTemplate = async () => {
    try {
      await download();
      setActiveStep(1);
    } catch {
      toast.error("Template file could not be downloaded.");
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    setRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateAndSetFile = async (file: File) => {
    clearFile();
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
      setFileError("Only .xlsx or .csv files are accepted. Please use the downloaded template.");
      return;
    }
    let grid: string[][];
    try {
      if (name.endsWith(".xlsx")) {
        grid = await readXlsx(file);
      } else {
        const text = await file.text();
        grid = parseCsv(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
      }
    } catch {
      setFileError("The file could not be read. Make sure it is the downloaded template, saved as .xlsx or CSV.");
      return;
    }
    const parsed = buildRows(grid, tabled);
    if (parsed.error) {
      setFileError(parsed.error);
      return;
    }
    setSelectedFile(file);
    setRows(parsed.rows);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void validateAndSetFile(file);
  };

  const handleUpload = async () => {
    if (validRows.length === 0) return;
    try {
      const res = await addExternal({ sessionId, crqs: validRows.map((r) => r.crq) }).unwrap();
      setResult(res);
      setActiveStep(2);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleReset = () => {
    clearFile();
    setResult(null);
    setActiveStep(1);
  };

  const handleClose = () => {
    handleReset();
    setActiveStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <TableChartOutlinedIcon color="primary" />
          <Typography fontWeight={700} fontSize={18}>
            Add External CRQs to {sessionId}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={4}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* STEP 0 — Download template */}
          {activeStep === 0 && (
            <Paper
              variant="outlined"
              sx={{ p: 4, borderRadius: 3, textAlign: "center", borderColor: "primary.main", borderStyle: "dashed", bgcolor: "primary.50" }}
            >
              <DownloadIcon sx={{ fontSize: 52, color: "primary.main", mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Start with the official template
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Download the Excel template, fill one row per CRQ on the Upload sheet (Change
                Impact is SA or NSA) and upload it back here.
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

          {/* STEP 1 — Upload & preview */}
          {activeStep === 1 && (
            <Stack spacing={2.5}>
              <Box
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: selectedFile ? 2.5 : 5,
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
                  accept=".xlsx,.csv"
                  onChange={(e) => e.target.files?.[0] && void validateAndSetFile(e.target.files[0])}
                />
                {selectedFile ? (
                  <>
                    <CheckCircleOutlineIcon sx={{ fontSize: 36, color: "success.main", mb: 0.5 }} />
                    <Typography fontWeight={600} color="success.main">
                      {rows.length} row{rows.length === 1 ? "" : "s"} read — click to choose a different file
                    </Typography>
                  </>
                ) : (
                  <>
                    <UploadFileIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                    <Typography fontWeight={600}>Drag & drop your filled template here</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      or click to browse &nbsp;·&nbsp; .xlsx or .csv
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
                <>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip
                      icon={<UploadFileIcon />}
                      label={`${selectedFile.name} · ${(selectedFile.size / 1024).toFixed(1)} KB`}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                    <Tooltip title="Remove file">
                      <IconButton size="small" color="error" onClick={clearFile}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Box sx={{ flex: 1 }} />
                    <Chip size="small" color="success" label={`${validRows.length} ready`} />
                    {invalidCount > 0 && <Chip size="small" color="error" label={`${invalidCount} invalid`} />}
                    {tabledCount > 0 && <Chip size="small" variant="outlined" label={`${tabledCount} already tabled`} />}
                  </Box>

                  {invalidCount > 0 && (
                    <Alert severity="warning">
                      {invalidCount} row{invalidCount > 1 ? "s have" : " has"} errors and will be skipped.
                      Fix them in the file and re-upload, or continue with the valid rows only.
                    </Alert>
                  )}

                  <TableContainer sx={{ maxHeight: 300, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {["Row", "CRQ No", "Circle", "Node name", "Type of activity", "Impact", "Status"].map((h) => (
                            <TableCell
                              key={h}
                              sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "text.secondary", bgcolor: "background.paper" }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={r.rowNumber} sx={r.errors.length ? { bgcolor: "error.50" } : undefined}>
                            <TableCell sx={{ color: "text.secondary" }}>{r.rowNumber}</TableCell>
                            <TableCell sx={{ ...MONO, fontSize: 12.5 }}>{r.crq.crq_no || "—"}</TableCell>
                            <TableCell>{r.crq.circle || "—"}</TableCell>
                            <TableCell sx={{ ...MONO, fontSize: 11.5, color: "text.secondary" }}>{r.crq.node_name || "—"}</TableCell>
                            <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{r.crq.type_of_activity || "—"}</TableCell>
                            <TableCell>
                              {IMPACTS.includes(r.crq.change_impact) ? <ImpactChip impact={r.crq.change_impact as "SA" | "NSA"} /> : r.crq.change_impact || "—"}
                            </TableCell>
                            <TableCell>
                              {r.errors.length ? (
                                <Typography variant="caption" color="error.main">{r.errors.join("; ")}</Typography>
                              ) : r.alreadyTabled ? (
                                <Chip size="small" variant="outlined" label="Already tabled" sx={{ height: 20, fontSize: 11 }} />
                              ) : (
                                <Chip size="small" color="success" label="Ready" sx={{ height: 20, fontSize: 11 }} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {isSubmitting && (
                <Fade in>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>Adding CRQs to the agenda…</Typography>
                    <LinearProgress sx={{ borderRadius: 2 }} />
                  </Box>
                </Fade>
              )}

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

          {/* STEP 2 — Results */}
          {activeStep === 2 && result && (
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Paper sx={{ flex: 1, p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "success.light", bgcolor: "success.50" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 28 }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700} color="success.dark">{result.addedCount}</Typography>
                      <Typography variant="body2" color="text.secondary">Added to {result.cabId}</Typography>
                    </Box>
                  </Stack>
                </Paper>
                <Paper
                  sx={{
                    flex: 1, p: 2.5, borderRadius: 3, border: "1px solid",
                    borderColor: result.skippedCount ? "warning.light" : "grey.200",
                    bgcolor: result.skippedCount ? "warning.50" : "grey.50",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <ErrorOutlineIcon color={result.skippedCount ? "warning" : "disabled"} sx={{ fontSize: 28 }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700} color={result.skippedCount ? "warning.dark" : "text.disabled"}>
                        {result.skippedCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Skipped (already on agenda)</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>

              {result.skippedCrqList?.length > 0 && (
                <Alert severity="info">
                  Skipped: <Box component="span" sx={MONO}>{result.skippedCrqList.join(", ")}</Box>
                </Alert>
              )}
              {invalidCount + tabledCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {invalidCount + tabledCount} row(s) from the file were not sent — invalid or already tabled.
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {/* Why Submit is disabled — a file of only bad rows otherwise looks like the button just vanished. */}
        {activeStep === 1 && selectedFile && validRows.length === 0 && (
          <Typography variant="caption" color="error.main" sx={{ mr: "auto" }}>
            No new rows to submit — fix the highlighted rows, or every CRQ is already on this agenda.
          </Typography>
        )}
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
        {activeStep === 1 && (
          <Button
            variant="contained"
            disabled={validRows.length === 0 || isSubmitting}
            onClick={handleUpload}
            startIcon={<UploadFileIcon />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3 }}
          >
            {isSubmitting ? "Submitting…" : validRows.length ? `Submit ${validRows.length} CRQ(s)` : "Submit"}
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
}
