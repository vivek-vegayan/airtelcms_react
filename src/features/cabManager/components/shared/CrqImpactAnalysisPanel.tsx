import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FolderZipTwoToneIcon from "@mui/icons-material/FolderZipTwoTone";
import FolderOpenTwoToneIcon from "@mui/icons-material/FolderOpenTwoTone";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import { toast } from "react-toastify";
import { useTabColorTokens } from "../../../../style/theme";
import {
  errorMessage,
  formatImpactModifiedDate,
} from "../../../scheduler/types/impactBatch.types";
import { useGetImpactBatchStatusQuery } from "../../../scheduler/api/impactBatchApiSlice";
import { useLazyDownloadServiceCsvExcelQuery } from "../../api/cabManagerApiSlice";

// One accent per batch slot, purely presentational (theme independent so slots
// stay visually distinct in both light and dark mode).
const SLOT_ACCENTS = ["#1E6FD9", "#7C3AED", "#0891B2", "#0E9F6E"];

type Colors = ReturnType<typeof useTabColorTokens>;

interface CrqImpactAnalysisPanelProps {
  crqNo: string | null;
  /** CRQ's service code (the drawer's Overview "Service" row) - second argument
   *  to getCSVasperService.py, so Export Excel is disabled without it. */
  service?: string | null;
}

/** Matches the Content-Disposition name the backend sets, so the saved file is
 *  named the same whether the browser honours the header or this attribute. */
function buildExcelFileName(crqNo: string, service: string): string {
  return `Service_Impact_${crqNo}_${service}.xlsx`;
}

// ─────────────────────────────────────────────
// BATCH PILL — drawer-width variant of the scheduler's batch slot card:
// same data, laid out to scroll horizontally instead of wrapping into a grid.
// ─────────────────────────────────────────────
const BatchPill: React.FC<{
  label: string;
  sublabel: string;
  fileCount: number;
  modifiedLabel: string;
  isActive: boolean;
  colorMain: string;
  colors: Colors;
  onSelect: () => void;
}> = ({ label, sublabel, fileCount, modifiedLabel, isActive, colorMain, colors, onSelect }) => (
  <Paper
    elevation={0}
    onClick={onSelect}
    sx={{
      width: 146,
      flexShrink: 0,
      px: 1.25,
      py: 1,
      cursor: "pointer",
      borderRadius: colors.radiusL,
      border: `1.5px solid ${isActive ? colorMain : colors.border}`,
      bgcolor: isActive ? alpha(colorMain, colors.isDark ? 0.16 : 0.08) : colors.surface,
      transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
      "&:hover": { borderColor: colorMain, boxShadow: `0 4px 12px ${alpha(colorMain, 0.15)}` },
    }}
  >
    <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 0.6 }}>
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: colors.radius,
          bgcolor: isActive ? colorMain : alpha(colorMain, 0.14),
          color: isActive ? "#fff" : colorMain,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isActive ? <FolderOpenTwoToneIcon sx={{ fontSize: 12 }} /> : <FolderZipTwoToneIcon sx={{ fontSize: 12 }} />}
      </Box>
      <Typography
        noWrap
        sx={{ flex: 1, fontSize: "0.68rem", fontWeight: 800, letterSpacing: 0.3, color: isActive ? colorMain : colors.textSecondary }}
      >
        {label}
      </Typography>
      {isActive && <CheckRoundedIcon sx={{ fontSize: 12, color: colorMain }} />}
    </Stack>

    <Typography
      noWrap
      sx={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textDim }}
    >
      {sublabel}
    </Typography>

    <Tooltip title={`${fileCount} CSV file(s) on SFTP · last modified ${modifiedLabel}`} arrow>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.4 }}>
        <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: fileCount > 0 ? colors.success : colors.border, flexShrink: 0 }} />
        <Typography noWrap sx={{ fontSize: "0.6rem", fontWeight: 600, color: colors.textSecondary }}>
          {fileCount} file{fileCount === 1 ? "" : "s"} · {modifiedLabel}
        </Typography>
      </Stack>
    </Tooltip>
  </Paper>
);

/**
 * Impact Analysis batches for the All-CRQs drawer.
 *
 *   GET /impact/statuscsv/batch?crqNo=   -> which batches exist and each
 *   batch's SFTP `modifiedDate`.
 *
 * Export Excel posts the file names that listing reported to
 * /excel/impact-batchwise and saves the returned blob. Batches scroll
 * horizontally rather than wrapping into a grid, because the drawer is ~440px
 * of usable width instead of a half-screen dialog panel.
 *
 * The Key Impact Metrics block (per-category counts off
 * /crqworkflow/impactanalysis/batch, with a click-to-expand sub-entity
 * breakdown) used to sit between the batch strip and the export button. It was
 * dropped from this drawer on request; the scheduler's own Impact Analysis
 * review panel still has it, and that endpoint is untouched.
 *
 * This is a read-only view of what the scheduler produced: no "Refetch" (which
 * re-runs the script server-side) and no "Delta" compare - CAB reviews the
 * output here, it does not generate it.
 */
export const CrqImpactAnalysisPanel: React.FC<CrqImpactAnalysisPanelProps> = ({ crqNo, service }) => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  // The user's explicit pick, if any - resolved against the listing below, so
  // it can never point at a batch the server didn't report.
  const [pickedBatchNo, setPickedBatchNo] = useState<number | null>(null);

  const {
    data: batchStatus,
    isFetching: batchesLoading,
    error: batchesError,
  } = useGetImpactBatchStatusQuery({ crqNo: crqNo as string }, { skip: !crqNo });

  const batches = useMemo(() => batchStatus ?? [], [batchStatus]);

  // An unset or no-longer-listed pick (new CRQ, re-run that changed the batch
  // set) falls back to the newest batch, which is the run people care about.
  const selectedBatch = useMemo(() => {
    if (!batches.length) return null;
    return batches.find((b) => b.batchNo === pickedBatchNo) ?? batches[batches.length - 1];
  }, [batches, pickedBatchNo]);

  const selectedBatchNo = selectedBatch?.batchNo ?? null;

  const [triggerDownload, { isFetching: downloading }] = useLazyDownloadServiceCsvExcelQuery();

  const handleDownload = async () => {
    if (!crqNo || !service) return;
    try {
      // One call: the backend runs getCSVasperService.py for this CRQ + service
      // and streams back the workbook built from its stdout. Nothing is stored
      // remotely, so there is no generate-then-fetch handshake to do here.
      const blob = await triggerDownload({ crqNo, service }).unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildExcelFileName(crqNo, service);
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Service impact Excel downloaded.");
    } catch (err) {
      // The script can legitimately return no rows (404) - that is worth saying
      // out loud, otherwise the button just looks broken.
      const status = (err as { status?: number })?.status;
      toast.error(
        status === 404
          ? `No impacted circuits found for ${crqNo} / ${service}.`
          : "Failed to generate the service impact Excel.",
      );
    }
  };

  if (!crqNo) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* ── Batch Selection ── */}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
        <LayersRoundedIcon sx={{ fontSize: 14, color: colors.textSecondary }} />
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: colors.textPrimary }}>Batch Selection</Typography>
        <Chip
          label={
            batchesLoading && !batches.length
              ? "Loading…"
              : `${batches.length} batch${batches.length === 1 ? "" : "es"}`
          }
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: batches.length > 0 ? colors.successDim : colors.surface2,
            color: batches.length > 0 ? colors.success : colors.textDim,
          }}
        />
      </Stack>

      {batchesLoading && !batches.length ? (
        <Stack alignItems="center" py={2} spacing={0.75}>
          <CircularProgress size={18} sx={{ color: colors.accent }} />
          <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>Discovering batches…</Typography>
        </Stack>
      ) : !batches.length ? (
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1.25,
            borderRadius: colors.radiusL,
            border: `1px dashed ${colors.border}`,
            bgcolor: colors.surface2,
          }}
        >
          <FolderZipTwoToneIcon sx={{ fontSize: 17, color: colors.textDim, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: 600 }}>
            {errorMessage(batchesError, "No impact analysis batch files found for this CRQ yet.")}
          </Typography>
        </Paper>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: "auto",
            pb: 0.5,
            // The drawer is far narrower than the scheduler's panel, so batches
            // scroll sideways rather than wrapping into unreadably short cards.
            "&::-webkit-scrollbar": { height: 5 },
            "&::-webkit-scrollbar-thumb": { bgcolor: colors.border, borderRadius: 3 },
          }}
        >
          {batches.map((batch, index) => (
            <BatchPill
              key={batch.key}
              label={batch.label}
              sublabel={batch.sublabel}
              fileCount={batch.files.length}
              modifiedLabel={formatImpactModifiedDate(batch.modifiedDate)}
              isActive={selectedBatchNo === batch.batchNo}
              colorMain={SLOT_ACCENTS[index % SLOT_ACCENTS.length]}
              colors={colors}
              onSelect={() => setPickedBatchNo(batch.batchNo)}
            />
          ))}
        </Stack>
      )}

      {/* ── Active batch breadcrumb + export ── */}
      <Paper
        elevation={0}
        sx={{
          mt: 0.5,
          px: 1.5,
          py: 1.1,
          borderRadius: colors.radiusL,
          border: `1px solid ${colors.border}`,
          bgcolor: colors.surface2,
        }}
      >
        <Typography sx={{ fontSize: 11, color: colors.textSecondary, fontWeight: 600, mb: 1, display: "block" }}>
          Active batch:{" "}
          <Box component="span" sx={{ color: colors.textPrimary, fontWeight: 800 }}>
            {selectedBatch ? selectedBatch.label : "—"}
          </Box>
          {selectedBatch && (
            <Box component="span" sx={{ color: colors.textDim, ml: 0.6 }}>
              ({selectedBatch.files.length} file{selectedBatch.files.length === 1 ? "" : "s"} ·{" "}
              {formatImpactModifiedDate(selectedBatch.modifiedDate)})
            </Box>
          )}
        </Typography>
        <Button
          fullWidth
          size="small"
          variant="contained"
          startIcon={downloading ? <CircularProgress size={13} color="inherit" /> : <FileDownloadRoundedIcon sx={{ fontSize: 15 }} />}
          onClick={handleDownload}
          // Gated on the service, not the batch - the export runs the script
          // for this CRQ + service and no longer reads the selected batch.
          disabled={downloading || !service}
          sx={{ fontSize: 11.5, textTransform: "none", bgcolor: colors.accent, borderRadius: colors.radiusL }}
        >
          {downloading ? "Preparing…" : "Export Excel"}
        </Button>
      </Paper>
    </Box>
  );
};

export default CrqImpactAnalysisPanel;
