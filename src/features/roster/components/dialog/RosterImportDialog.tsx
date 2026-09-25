import { useRef, useState } from "react";
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
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useAppDispatch } from "../../../../app/hooks";
import {
  rosterApiSlice,
  useGetShiftDropdownQuery,
  useImportRosterShiftsMutation,
  type RosterImportEmployee,
  type RosterImportResponse,
} from "../../api/rosterApiSlice";
import { orgHierarchyApi } from "../../../orgHierarchy/api/orgHierarchy.api";
import { getMonthRange } from "../../utils/dateRange.utils";
import {
  downloadRosterTemplate,
  parseRosterImportFile,
  type RosterImportParseResult,
} from "../../utils/rosterImport";
import type { UserRoster } from "../../types/monthlyRoster.type";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Week / month currently on screen (used for the "Current view" template). */
  startDate: string;
  endDate: string;
  domainId?: number;
  subDomainId?: number;
}

type Step = "upload" | "review" | "done";
type ParsedFile = RosterImportParseResult & { startDate: string; endDate: string };

const PREVIEW_LIMIT = 200;
const UPCOMING_MONTHS = 12;
/** Same "fetch everyone" page size Team Management uses for this endpoint. */
const FETCH_ALL_EMPLOYEES = 2000;

const datesBetween = (start: string, end: string) => {
  const dates: string[] = [];
  for (let d = dayjs(start); !d.isAfter(dayjs(end), "day"); d = d.add(1, "day")) {
    dates.push(d.format("YYYY-MM-DD"));
  }
  return dates;
};

const formatRange = (start: string, end: string) =>
  `${dayjs(start).format("DD MMM YYYY")} – ${dayjs(end).format("DD MMM YYYY")}`;

export const RosterImportDialog = ({ open, onClose, startDate, endDate, domainId, subDomainId }: Props) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [period, setPeriod] = useState("view"); // "view" or "YYYY-MM"
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [result, setResult] = useState<RosterImportResponse | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: shiftOptions = [], isFetching: loadingShifts } = useGetShiftDropdownQuery(
    { subDomainId: subDomainId ?? 0 },
    { skip: !open || subDomainId == null },
  );
  const [importRosterShifts, { isLoading: isSaving }] = useImportRosterShiftsMutation();

  const monthOptions = Array.from({ length: UPCOMING_MONTHS }, (_, i) =>
    dayjs().startOf("month").add(i, "month"),
  );

  /* ── Load roster for any period (falls back to an empty roster) ───── */

  const fetchRoster = async (startDate: string, endDate: string) => {
    const request = dispatch(
      rosterApiSlice.endpoints.getRosterView.initiate({
        domainId: domainId ?? 0,
        subDomainId: subDomainId ?? 0,
        startDate,
        endDate,
      }),
    );
    try {
      const res = await request.unwrap();
      return res?.success !== false ? res?.data ?? [] : [];
    } catch {
      return []; // "Roster not generated for selected range"
    } finally {
      request.unsubscribe();
    }
  };

  const fetchEmployees = async (): Promise<UserRoster[]> => {
    const request = dispatch(
      orgHierarchyApi.endpoints.getEmployeesBySubDomain.initiate({
        domainId,
        subDomainId: subDomainId ?? 0,
        employeeStatus: "ACTIVE",
        page: 0,
        size: FETCH_ALL_EMPLOYEES,
      }),
    );
    try {
      const res = await request.unwrap();
      return (res?.content ?? []).map((e) => ({
        userId: e.userId,
        olmid: e.olmId,
        employeeName: e.employeeName,
        jobLevel: e.jobLevel,
        mobileNo: "",
        officeLocation: e.officeLocation ?? "",
        roster: {},
      }));
    } finally {
      request.unsubscribe();
    }
  };

  /**
   * Every active employee of the sub domain, with their roster for the period
   * where it exists. The roster API only returns employees who already have
   * a row in that range, so a partly filled month would otherwise hide
   * everyone else from the template and the upload.
   */
  const loadRoster = async (startDate: string, endDate: string) => {
    const roster = await fetchRoster(startDate, endDate);
    const employees = await fetchEmployees();

    const rosterByUser = new Map(roster.map((u) => [u.userId, u]));
    const users = employees.map((e) => rosterByUser.get(e.userId) ?? e);

    // Keep anyone who has a roster but isn't in the active list.
    roster.forEach((u) => {
      if (!employees.some((e) => e.userId === u.userId)) users.push(u);
    });

    if (users.length === 0) {
      throw new Error("No active employees found for the selected Sub Domain.");
    }
    return { users, generated: roster.length > 0 };
  };

  /* ── Handlers ─────────────────────────────────────────────────────── */

  const reset = () => {
    setStep("upload");
    setFile(null);
    setFileError(null);
    setParsed(null);
    setResult(null);
    setSaveError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (isSaving) return;
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      // Load the chosen period (empty shifts if the roster isn't generated).
      const range = period === "view" ? { startDate, endDate } : getMonthRange(dayjs(`${period}-01`));
      const { users, generated } = await loadRoster(range.startDate, range.endDate);
      await downloadRosterTemplate({
        users,
        dates: datesBetween(range.startDate, range.endDate),
        shiftOptions,
      });

      if (!generated) {
        toast.info(
          `Roster for ${formatRange(range.startDate, range.endDate)} isn't generated yet – downloaded an empty template.`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate template");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFile = async (selected?: File) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setFileError("Only .xlsx files are supported.");
      return;
    }

    setFile(selected);
    setFileError(null);
    setIsParsing(true);
    try {
      const data = await parseRosterImportFile(selected, {
        shiftOptions,
        loadRoster: async (start, end) => (await loadRoster(start, end)).users,
      });
      setParsed(data);
      setStep("review");
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Could not read the file.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;

    // Group the changed cells by employee: one entry per employee.
    const byEmployee = new Map<string, RosterImportEmployee>();
    parsed.changes.forEach((change) => {
      if (!byEmployee.has(change.olmid)) {
        byEmployee.set(change.olmid, { olmId: change.olmid, shifts: [] });
      }
      byEmployee.get(change.olmid)!.shifts.push({
        shiftDate: change.date,
        shiftId: change.shiftId,
      });
    });

    setSaveError(null);
    try {
      const res = await importRosterShifts(Array.from(byEmployee.values())).unwrap();
      setResult(res);
      setStep("done");
      if (res.failedEmployees === 0) {
        toast.success(`Roster saved for ${res.savedEmployees} employee(s)`);
      } else {
        toast.warning(`${res.savedEmployees} saved, ${res.failedEmployees} failed`);
      }
    } catch (e: any) {
      console.error("Roster import save failed", e);
      const message = e?.data?.message || e?.error || "Failed to save roster";
      setSaveError(e?.status ? `Save failed (HTTP ${e.status}): ${message}` : message);
      toast.error(message);
    }
  };

  const totalChanges = parsed?.changes.length ?? 0;

  /* ── UI ───────────────────────────────────────────────────────────── */

  return (
    <Dialog
      open={open}
      // Only the X / Close buttons close it – a stray click outside shouldn't lose the upload.
      onClose={(_, reason) => reason !== "backdropClick" && handleClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography fontWeight={700} fontSize={18}>
            Import Roster
          </Typography>
          {parsed && (
            <Typography variant="caption" color="text.secondary">
              {formatRange(parsed.startDate, parsed.endDate)}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={handleClose} disabled={isSaving}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* ── Step 1: download template + upload ── */}
        {step === "upload" && (
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: "center", borderStyle: "dashed" }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                1. Download the template
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                It's pre-filled with the current roster (empty if the roster isn't generated yet).
                Fill the future dates using the shift dropdown, then upload it below.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                <TextField
                  select
                  size="small"
                  label="Period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  sx={{ minWidth: 240, textAlign: "left" }}
                >
                  <MenuItem value="view">
                    Current view · {formatRange(startDate, endDate)}
                  </MenuItem>
                  {monthOptions.map((m) => (
                    <MenuItem key={m.format("YYYY-MM")} value={m.format("YYYY-MM")}>
                      {m.format("MMMM YYYY")}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading || loadingShifts}
                  sx={{ textTransform: "none" }}
                >
                  {isDownloading ? "Preparing…" : "Download Template"}
                </Button>
              </Stack>
            </Paper>

            <Box
              onClick={() => !isParsing && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files?.[0]);
              }}
              sx={{
                p: 4,
                borderRadius: 3,
                textAlign: "center",
                border: "2px dashed",
                borderColor: "divider",
                cursor: "pointer",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = ""; // so picking the same file again still triggers onChange
                }}
              />
              <UploadFileIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
              <Typography fontWeight={600}>2. Drag &amp; drop the filled template here</Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse · .xlsx only
              </Typography>
              {file && <Chip label={file.name} size="small" variant="outlined" sx={{ mt: 1.5 }} />}
            </Box>

            {isParsing && <LinearProgress />}
            {fileError && <Alert severity="error">{fileError}</Alert>}
          </Stack>
        )}

        {/* ── Step 2: review ── */}
        {step === "review" && parsed && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <SummaryTile label="Shifts to save" value={totalChanges} color="primary.main" />
              <SummaryTile label="Unchanged" value={parsed.unchangedCount} color="text.secondary" />
              <SummaryTile label="Skipped (issues)" value={parsed.issues.length} color="error.main" />
            </Stack>

            {parsed.issues.length > 0 && (
              <Alert severity="warning">
                <Box component="ul" sx={{ m: 0, pl: 2, maxHeight: 140, overflow: "auto" }}>
                  {parsed.issues.slice(0, PREVIEW_LIMIT).map((issue, i) => (
                    <li key={i}>
                      <Typography variant="caption">
                        Row {issue.row} · {issue.column}: {issue.message}
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Alert>
            )}

            {totalChanges === 0 ? (
              <Alert severity="info">No shift changes found in the file.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Current</TableCell>
                      <TableCell>New</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsed.changes.slice(0, PREVIEW_LIMIT).map((c) => (
                      <TableRow key={`${c.userId}-${c.date}`}>
                        <TableCell>
                          {c.employeeName}{" "}
                          <Typography component="span" variant="caption" color="text.secondary">
                            ({c.olmid})
                          </Typography>
                        </TableCell>
                        <TableCell>{dayjs(c.date).format("ddd, DD MMM")}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{c.fromShift}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{c.toShift}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {totalChanges > PREVIEW_LIMIT && (
              <Typography variant="caption" color="text.secondary">
                Showing first {PREVIEW_LIMIT} of {totalChanges} shifts.
              </Typography>
            )}

            {isSaving && <LinearProgress />}
            {saveError && <Alert severity="error">{saveError}</Alert>}
          </Stack>
        )}

        {/* ── Step 3: result ── */}
        {step === "done" && result && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <SummaryTile label="Employees saved" value={result.savedEmployees} color="success.main" />
              <SummaryTile label="Employees failed" value={result.failedEmployees} color="error.main" />
            </Stack>
            {result.errors.length === 0 ? (
              <Alert severity="success">Roster saved. The roster view has been refreshed.</Alert>
            ) : (
              <Alert severity="error">
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      <Typography variant="caption">{err}</Typography>
                    </li>
                  ))}
                </Box>
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === "review" ? (
          <>
            <Button onClick={reset} disabled={isSaving} sx={{ textTransform: "none" }}>
              Choose another file
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving || totalChanges === 0}
              sx={{ textTransform: "none" }}
            >
              {isSaving ? "Saving…" : `Save ${totalChanges} shift(s)`}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} sx={{ textTransform: "none" }}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const SummaryTile = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <Paper variant="outlined" sx={{ flex: 1, p: 1.5, borderRadius: 2 }}>
    <Typography variant="h5" fontWeight={700} color={color}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Paper>
);
