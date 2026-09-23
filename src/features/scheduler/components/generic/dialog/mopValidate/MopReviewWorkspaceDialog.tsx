import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FitScreenRoundedIcon from "@mui/icons-material/FitScreenRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RotateRightRoundedIcon from "@mui/icons-material/RotateRightRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { useTabColorTokens } from "../../../../../../style/theme";
import { Lbl, MopReviewRail, shortStamp, versionTone } from "./MopReviewRail";
import type { PageFindingMarker } from "./MopPdfCanvas";
import { MopExcelPreview } from "../mopCreate/MopExcelPreview";
import { useGetMopCreatePdfQuery } from "../../../../api/mopDocumentApiSlice";
import {
  useAddMopFindingMutation,
  useGetMopReviewWorkspaceQuery,
  useRejectMopVersionMutation,
  useSetMopFindingStateMutation,
  useValidateMopVersionMutation,
} from "../../../../api/mopReviewApiSlice";
import { MOP_EXTENSION } from "../../../../types/mopDocument.types";
import { MOP_VERSION_STATUS_LABEL } from "../../../../types/mopValidate.types";
import type { MopFinding } from "../../../../types/mopReview.types";

/**
 * pdf.js is ~430KB and nothing else in the app renders a PDF this way, so the
 * canvas is split out and fetched on the first Validate click rather than at
 * app start. `vite.config.ts` gives it its own 'pdfjs' chunk for the same
 * reason - without that, manualChunks would fold it into the shared vendor
 * bundle and the lazy boundary would buy nothing.
 */
const MopPdfCanvas = React.lazy(() =>
  import("./MopPdfCanvas").then((m) => ({ default: m.MopPdfCanvas })),
);

interface MopReviewWorkspaceDialogProps {
  crqNo: string;
  open: boolean;
  onClose: () => void;
}

/** Square status tag, the design's shape. Filled reads as a decided state. */
const Tag: React.FC<{ label: string; tone: string; filled?: boolean }> = ({ label, tone, filled }) => (
  <Box
    component="span"
    sx={{
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: "0.02em",
      px: 1,
      py: 0.35,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
      border: `1px solid ${tone}`,
      color: filled ? "#fff" : tone,
      bgcolor: filled ? tone : alpha(tone, 0.1),
    }}
  >
    {label}
  </Box>
);

/**
 * The fullscreen MOP validation workspace, from the "MOP Phase 1 - Core"
 * design's Validate view: the stored document under a page/zoom toolbar on the
 * left, and a 420px rail carrying findings, version history, the audit trail
 * and the two decisions on the right.
 *
 * The document is rendered by pdf.js (`MopPdfCanvas`) rather than handed to the
 * browser's viewer in an iframe, which is what MOP Create does. The extra cost
 * buys the three things this screen cannot work without: the real page count,
 * control of which page is shown - so a finding's "p.4" can actually go there -
 * and a click target on the page itself, which is the design's flag gesture.
 *
 * One honest departure from the design: it flags individual parsed MOP steps.
 * A real MOP is a PDF or workbook out of `SP_GET_CRQ_MOP_CREATE_PDF` whose steps
 * cannot be parsed, so a finding anchors to a page, with an optional free-text
 * step reference. Nothing here invents step text.
 *
 * Reviewer identities are OLM ids, not names: `app_user` is empty in every
 * environment, so a name column would always resolve to null.
 */
export const MopReviewWorkspaceDialog: React.FC<MopReviewWorkspaceDialogProps> = ({
  crqNo,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  const [versionId, setVersionId] = useState<number | null>(null);
  const [tab, setTab] = useState<"findings" | "history">("findings");
  const [pageNo, setPageNo] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [rotation, setRotation] = useState(0);
  const [reviewNote, setReviewNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [highlightedPage, setHighlightedPage] = useState<number | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [draftFinding, setDraftFinding] = useState("");
  const [draftStep, setDraftStep] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, isError, isFetching } = useGetMopReviewWorkspaceQuery(
    { crqNo, versionId },
    { skip: !open || !crqNo },
  );

  const [addFinding, { isLoading: isAdding }] = useAddMopFindingMutation();
  const [setFindingState, { isLoading: isSettingState }] = useSetMopFindingStateMutation();
  const [validateVersion, { isLoading: isValidating }] = useValidateMopVersionMutation();
  const [rejectVersion, { isLoading: isRejecting }] = useRejectMopVersionMutation();

  const busy = isAdding || isSettingState || isValidating || isRejecting;

  // Fetched only once the workspace confirms bytes exist - otherwise the
  // endpoint 404s, which would read as a load failure rather than "not
  // uploaded yet".
  const {
    data: blob,
    isFetching: isFetchingDoc,
    isError: isDocError,
    refetch: refetchDoc,
  } = useGetMopCreatePdfQuery(crqNo, { skip: !open || !data?.documentAttached });

  const documentType = data?.documentType ?? null;
  const isExcel = documentType === "XLSX" || documentType === "XLS";
  const isLegacyXls = documentType === "XLS";
  const canFlag = Boolean(data?.canEdit);

  // Reopening on another CRQ must not inherit the previous one's version,
  // page, zoom or drafts.
  useEffect(() => {
    if (!open) return;
    setVersionId(null);
    setTab("findings");
    setPageNo(1);
    setPageCount(0);
    setZoom("fit");
    setRotation(0);
    setReviewNote("");
    setActionError(null);
    setHighlightedPage(null);
    setComposerOpen(false);
    setDraftFinding("");
    setDraftStep("");
    setApproveOpen(false);
    setRejectOpen(false);
    setRejectReason("");
  }, [open, crqNo]);

  const goPage = useCallback(
    (next: number) => setPageNo((p) => Math.min(Math.max(1, next), pageCount || p)),
    [pageCount],
  );

  const openComposer = useCallback(() => {
    setDraftFinding("");
    setDraftStep("");
    setComposerOpen(true);
  }, []);

  // Keyboard shortcuts, the difference between clicking through a 40-page MOP
  // and reading one. Suppressed while a dialog or a text field has focus so
  // they never eat a keystroke meant for an input.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (composerOpen || approveOpen || rejectOpen) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPage(pageNo - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goPage(pageNo + 1);
      } else if (e.key.toLowerCase() === "f" && canFlag) {
        e.preventDefault();
        openComposer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, composerOpen, approveOpen, rejectOpen, pageNo, goPage, canFlag, openComposer]);

  /** Per-page finding counts, for the badge drawn on the canvas. */
  const markers = useMemo<PageFindingMarker[]>(() => {
    const byPage = new Map<number, PageFindingMarker>();
    (data?.findings ?? []).forEach((f) => {
      if (f.pageNo == null) return;
      const existing = byPage.get(f.pageNo) ?? { pageNo: f.pageNo, openCount: 0, totalCount: 0 };
      existing.totalCount += 1;
      if (f.state === "open") existing.openCount += 1;
      byPage.set(f.pageNo, existing);
    });
    return [...byPage.values()];
  }, [data?.findings]);

  const statusTone = versionTone(data?.versionStatus, colors);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setActionError(null);
    try {
      await fn();
      toast.success(success);
      return true;
    } catch (e: any) {
      // The backend forwards each procedure's own SIGNAL text ("Open findings
      // exist - resolve them, or validate with override"), which is the only
      // way the reviewer learns why a write was refused.
      setActionError(e?.data?.message ?? "The action could not be completed.");
      return false;
    }
  };

  const handleAddFinding = async () => {
    if (!data?.versionId || !draftFinding.trim()) return;
    const ok = await run(
      () =>
        addFinding({
          crqNo,
          versionId: data.versionId as number,
          pageNo,
          stepRef: draftStep.trim() || null,
          description: draftFinding.trim(),
        }).unwrap(),
      "Finding added.",
    );
    if (ok) {
      setComposerOpen(false);
      setDraftFinding("");
      setDraftStep("");
    }
  };

  const handleToggleFinding = (finding: MopFinding) =>
    run(
      () =>
        setFindingState({
          crqNo,
          findingId: finding.findingId,
          state: finding.state === "open" ? "resolved" : "open",
        }).unwrap(),
      finding.state === "open" ? `${finding.findingRef} resolved.` : `${finding.findingRef} reopened.`,
    );

  const handleWithdrawFinding = (finding: MopFinding) =>
    run(
      () => setFindingState({ crqNo, findingId: finding.findingId, state: "withdrawn" }).unwrap(),
      `${finding.findingRef} removed.`,
    );

  const handleApprove = async (force: boolean) => {
    if (!data?.versionId) return;
    const ok = await run(
      () =>
        validateVersion({
          crqNo,
          versionId: data.versionId as number,
          note: reviewNote.trim() || undefined,
          force,
        }).unwrap(),
      `v${data.versionNo} validated OK.`,
    );
    if (ok) setApproveOpen(false);
  };

  const handleReject = async () => {
    if (!data?.versionId || !rejectReason.trim()) return;
    const ok = await run(
      () =>
        rejectVersion({
          crqNo,
          versionId: data.versionId as number,
          reason: rejectReason.trim(),
        }).unwrap(),
      `v${data.versionNo} rejected.`,
    );
    if (ok) {
      setRejectOpen(false);
      setRejectReason("");
    }
  };

  const handleDownload = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${crqNo}-mop.${MOP_EXTENSION[documentType ?? "PDF"]}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const toolIconSx = {
    width: 30,
    height: 30,
    borderRadius: 0,
    color: colors.textPrimary,
    "&:hover": { bgcolor: alpha(colors.textPrimary, 0.08) },
  };

  const zoomLabel = zoom === "fit" ? "Fit" : `${zoom}%`;
  const stepZoom = (delta: number) =>
    setZoom((z) => {
      const base = z === "fit" ? 100 : z;
      return Math.min(200, Math.max(70, base + delta));
    });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: colors.bg, backgroundImage: "none" } }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <Box
          sx={{
            flex: "none",
            px: 3,
            py: 1.5,
            bgcolor: colors.surface,
            borderBottom: `2px solid ${colors.border}`,
            // A hairline of accent along the top edge, so the fullscreen
            // takeover reads as a distinct surface rather than a blank page.
            boxShadow: `inset 0 3px 0 0 ${colors.accent}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <FlagRoundedIcon sx={{ fontSize: 20, color: colors.accent }} />
            <Lbl colors={colors}>Validate MOP</Lbl>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 19,
                fontVariantNumeric: "tabular-nums",
                color: colors.textPrimary,
              }}
            >
              {data?.crqNo ?? crqNo}
            </Typography>
            {data?.versionStatus && (
              <Tag
                label={MOP_VERSION_STATUS_LABEL[data.versionStatus] ?? data.versionStatus}
                tone={statusTone}
                filled={data.versionStatus === "validated" || data.versionStatus === "rejected"}
              />
            )}
            <Typography
              sx={{
                fontSize: 14,
                color: alpha(colors.textPrimary, 0.7),
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                flex: "1 1 200px",
              }}
            >
              {isLoading ? <Skeleton width={220} /> : (data?.title ?? "—")}
            </Typography>
            <Tooltip arrow title="Close (Esc)">
              <IconButton onClick={onClose} size="small" sx={toolIconSx} aria-label="Close">
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: "flex", gap: 3, mt: 1, flexWrap: "wrap", alignItems: "baseline" }}>
            <HeaderFact label="Viewing" colors={colors}>
              v{data?.versionNo ?? "—"}{" "}
              <Box component="span" sx={{ fontWeight: 400, color: alpha(colors.textPrimary, 0.6) }}>
                of {data?.versions.length ?? 0}
              </Box>
            </HeaderFact>
            <HeaderFact label="Window" colors={colors}>
              {data?.windowStart ? shortStamp(data.windowStart) : "—"}
              {data?.windowEnd ? ` – ${shortStamp(data.windowEnd)}` : ""}
            </HeaderFact>
            <HeaderFact label="Reviewer" colors={colors}>
              {data?.currentReviewerId ?? "—"}
            </HeaderFact>
            <HeaderFact label="Document" colors={colors}>
              {data?.fileName ?? "—"}
            </HeaderFact>
          </Box>
        </Box>

        {isFetching && <LinearProgress sx={{ height: 2, flex: "none" }} />}

        <AnimatePresence>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert
                severity="error"
                onClose={() => setActionError(null)}
                sx={{ fontSize: 12.5, borderRadius: 0 }}
              >
                {actionError}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Body ────────────────────────────────────────────────── */}
        {isLoading ? (
          <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
            <Box sx={{ flex: 1, p: 3 }}>
              <Skeleton variant="rectangular" height="100%" />
            </Box>
            <Box sx={{ width: 420, p: 2, borderLeft: `2px solid ${colors.border}` }}>
              <Skeleton height={54} />
              <Skeleton height={40} sx={{ mt: 1 }} />
              <Skeleton variant="rectangular" height={110} sx={{ mt: 2 }} />
              <Skeleton variant="rectangular" height={110} sx={{ mt: 1 }} />
            </Box>
          </Box>
        ) : isError || !data ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="warning" sx={{ fontSize: 13, borderRadius: 0 }}>
              The MOP review for {crqNo} could not be loaded.
            </Alert>
          </Box>
        ) : !data.mopExists || !data.versionId ? (
          <Stack
            spacing={1.5}
            sx={{ flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center", p: 4 }}
          >
            <DescriptionOutlinedIcon sx={{ fontSize: 36, color: colors.textDim }} />
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary }}>
              {data.mopExists ? "No version to review" : "No MOP to validate"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: colors.textDim, maxWidth: 430 }}>
              {data.mopExists
                ? "This MOP exists but carries no version, so there is nothing to validate."
                : `MOP Create has not run for ${crqNo} yet. Once the MOP is created, its first version appears here.`}
            </Typography>
          </Stack>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
            {/* ── Document pane ─────────────────────────────────── */}
            <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {data.viewingOld && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 3,
                    py: 1,
                    bgcolor: alpha(colors.warning, 0.12),
                    borderBottom: `1px solid ${alpha(colors.warning, 0.4)}`,
                    fontSize: 13,
                    flex: "none",
                  }}
                >
                  <HistoryRoundedIcon sx={{ fontSize: 17, color: colors.warning }} />
                  <Typography sx={{ fontSize: 13, color: colors.textPrimary }}>
                    <strong>Read-only.</strong> Superseded version.
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setVersionId(data.latestVersionId ?? null)}
                    sx={{
                      ml: "auto",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: 12.5,
                      borderRadius: 0,
                      color: colors.textPrimary,
                    }}
                  >
                    Go to v{data.latestVersionNo}
                  </Button>
                </Box>
              )}

              {/* Toolbar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 2,
                  py: 0.75,
                  borderBottom: `1px solid ${colors.border}`,
                  bgcolor: colors.surface,
                  flexWrap: "wrap",
                  flex: "none",
                }}
              >
                <Tooltip arrow title="Previous page (←)">
                  <span>
                    <IconButton size="small" onClick={() => goPage(pageNo - 1)} disabled={pageNo <= 1} sx={toolIconSx}>
                      <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 78,
                    textAlign: "center",
                    color: colors.textPrimary,
                  }}
                >
                  {pageCount ? `${pageNo} / ${pageCount}` : `${pageNo}`}
                </Typography>
                <Tooltip arrow title="Next page (→)">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => goPage(pageNo + 1)}
                      disabled={pageCount > 0 && pageNo >= pageCount}
                      sx={toolIconSx}
                    >
                      <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                <Tooltip arrow title="Zoom out">
                  <IconButton size="small" onClick={() => stepZoom(-10)} sx={toolIconSx}>
                    <ZoomOutRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 44,
                    textAlign: "center",
                    color: colors.textPrimary,
                  }}
                >
                  {zoomLabel}
                </Typography>
                <Tooltip arrow title="Zoom in">
                  <IconButton size="small" onClick={() => stepZoom(10)} sx={toolIconSx}>
                    <ZoomInRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip arrow title="Fit to width">
                  <IconButton
                    size="small"
                    onClick={() => setZoom("fit")}
                    sx={{ ...toolIconSx, color: zoom === "fit" ? colors.accent : colors.textPrimary }}
                  >
                    <FitScreenRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip arrow title="Rotate">
                  <IconButton size="small" onClick={() => setRotation((r) => (r + 90) % 360)} sx={toolIconSx}>
                    <RotateRightRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                <Tooltip arrow title="Download the MOP">
                  <span>
                    <IconButton size="small" onClick={handleDownload} disabled={!blob} sx={toolIconSx}>
                      <DownloadRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>

                {canFlag && (
                  <Button
                    size="small"
                    onClick={openComposer}
                    startIcon={<FlagRoundedIcon sx={{ fontSize: "16px !important" }} />}
                    sx={{
                      ml: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: 12.5,
                      borderRadius: 0,
                      px: 1.25,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      "&:hover": { borderColor: colors.accent, color: colors.accent },
                    }}
                  >
                    Flag page {pageNo}
                  </Button>
                )}

                <Typography
                  sx={{ ml: "auto", fontSize: 12, color: alpha(colors.textPrimary, 0.55), pl: 1 }}
                >
                  {canFlag ? "Click the page to flag it · ← → to page · F to flag" : "Read-only"}
                </Typography>
              </Box>

              {/* Canvas */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: alpha(colors.textPrimary, 0.05),
                }}
              >
                {!data.documentAttached ? (
                  <Stack
                    spacing={1.25}
                    sx={{ flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center", p: 4 }}
                  >
                    <DescriptionOutlinedIcon sx={{ fontSize: 34, color: colors.textDim }} />
                    <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: colors.textPrimary }}>
                      No document uploaded
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: colors.textDim, maxWidth: 400 }}>
                      {data.fileName
                        ? `The MOP record expects "${data.fileName}", but nothing has been uploaded on the MOP Create stage yet.`
                        : "Nothing has been uploaded on the MOP Create stage yet."}{" "}
                      Findings can still be recorded against this version.
                    </Typography>
                  </Stack>
                ) : isLegacyXls ? (
                  <Stack
                    spacing={1.5}
                    sx={{ flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center", p: 4 }}
                  >
                    <Typography sx={{ fontSize: 14.5, fontWeight: 800, color: colors.textPrimary }}>
                      Legacy .xls workbook
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: colors.textDim, maxWidth: 400 }}>
                      This format cannot be rendered in the browser. Download it to open in Excel.
                    </Typography>
                    <Button
                      size="small"
                      onClick={handleDownload}
                      disabled={!blob}
                      startIcon={<DownloadRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: 0 }}
                    >
                      Download workbook
                    </Button>
                  </Stack>
                ) : isExcel ? (
                  <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: 3 }}>
                    <MopExcelPreview
                      blob={blob}
                      isFetching={isFetchingDoc}
                      isError={isDocError}
                      onRetry={refetchDoc}
                      colors={colors}
                    />
                  </Box>
                ) : (
                  <React.Suspense
                    fallback={
                      <Stack sx={{ flex: 1, alignItems: "center", justifyContent: "center" }} spacing={1.5}>
                        <CircularProgress size={24} />
                        <Typography sx={{ fontSize: 12.5, color: colors.textDim, fontWeight: 600 }}>
                          Loading viewer…
                        </Typography>
                      </Stack>
                    }
                  >
                    <MopPdfCanvas
                      blob={blob}
                      isFetching={isFetchingDoc}
                      isError={isDocError}
                      onRetry={refetchDoc}
                      pageNo={pageNo}
                      onPageChange={setPageNo}
                      onPageCount={setPageCount}
                      zoom={zoom}
                      rotation={rotation}
                      onFlagPage={canFlag ? openComposer : null}
                      markers={markers}
                      highlightedPage={highlightedPage}
                      colors={colors}
                    />
                  </React.Suspense>
                )}
              </Box>
            </Box>

            {/* ── Rail ──────────────────────────────────────────── */}
            <MopReviewRail
              data={data}
              colors={colors}
              tab={tab}
              setTab={setTab}
              reviewNote={reviewNote}
              setReviewNote={setReviewNote}
              busy={busy}
              onOpenComposer={openComposer}
              onGoToPage={goPage}
              onOpenVersion={(id) => setVersionId(id)}
              onToggleFinding={handleToggleFinding}
              onWithdrawFinding={handleWithdrawFinding}
              onOpenApprove={() => setApproveOpen(true)}
              onOpenReject={() => setRejectOpen(true)}
              onHoverFinding={setHighlightedPage}
            />
          </Box>
        )}
      </Box>

      {/* ── Finding composer ──────────────────────────────────────── */}
      <ActionDialog
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        colors={colors}
        kicker={`New finding · v${data?.versionNo ?? "—"}`}
        title="What is wrong?"
        accent={colors.accent}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.85,
            mb: 2,
            border: `1px solid ${colors.border}`,
            bgcolor: alpha(colors.accent, 0.06),
          }}
        >
          <FlagRoundedIcon sx={{ fontSize: 16, color: colors.accent }} />
          <Typography sx={{ fontSize: 12.5, color: colors.textPrimary }}>
            Attaching to <strong>page {pageNo}</strong>
            {draftStep.trim() ? (
              <>
                {" · step "}
                <strong>{draftStep.trim()}</strong>
              </>
            ) : null}
          </Typography>
        </Box>

        <Lbl colors={colors} sx={{ mb: 0.5 }}>
          Step reference (optional)
        </Lbl>
        <TextField
          fullWidth
          size="small"
          value={draftStep}
          onChange={(e) => setDraftStep(e.target.value)}
          placeholder="e.g. 15"
          InputProps={{ sx: { borderRadius: 0, fontSize: 13 } }}
          sx={{ mb: 2 }}
        />

        <Lbl colors={colors} sx={{ mb: 0.5 }}>
          Description
        </Lbl>
        <TextField
          fullWidth
          multiline
          rows={4}
          autoFocus
          value={draftFinding}
          onChange={(e) => setDraftFinding(e.target.value)}
          placeholder="What is wrong with this step, and what should it say instead"
          InputProps={{ sx: { borderRadius: 0, fontSize: 13 } }}
          sx={{ mb: 2.5 }}
        />

        <DialogActions
          colors={colors}
          confirmLabel="Add finding"
          confirmTone={colors.accent}
          confirmDisabled={!draftFinding.trim()}
          busy={isAdding}
          onConfirm={handleAddFinding}
          onCancel={() => setComposerOpen(false)}
        />
      </ActionDialog>

      {/* ── Approve ───────────────────────────────────────────────── */}
      <ActionDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        colors={colors}
        kicker="Confirm"
        title={`Release v${data?.latestVersionNo ?? "—"} for execution?`}
        accent={colors.success}
      >
        <Typography sx={{ fontSize: 14, color: colors.textPrimary, mb: 2 }}>
          <Box component="span" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {crqNo}
          </Box>{" "}
          v{data?.latestVersionNo} becomes the only executable version. Earlier versions stay in
          history, read-only.
        </Typography>

        {(data?.openFindingCount ?? 0) > 0 && (
          <Alert severity="warning" sx={{ fontSize: 12.5, borderRadius: 0, mb: 2 }}>
            {data?.openFindingCount} finding(s) are still open. The procedure refuses this unless it is
            overridden, and the override is recorded in the audit trail.
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            onClick={() => handleApprove(false)}
            disabled={isValidating || (data?.openFindingCount ?? 0) > 0}
            startIcon={isValidating ? <CircularProgress size={13} color="inherit" /> : undefined}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 0,
              px: 2,
              bgcolor: colors.success,
              color: "#fff",
              "&:hover": { bgcolor: colors.success, filter: "brightness(1.08)" },
            }}
          >
            Confirm
          </Button>
          {(data?.openFindingCount ?? 0) > 0 && (
            <Button
              onClick={() => handleApprove(true)}
              disabled={isValidating}
              startIcon={<BlockRoundedIcon sx={{ fontSize: "16px !important" }} />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 0,
                px: 2,
                border: `2px solid ${colors.warning}`,
                color: colors.warning,
              }}
            >
              Override &amp; validate
            </Button>
          )}
          <Button
            onClick={() => setApproveOpen(false)}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 0, color: colors.textSecondary }}
          >
            Cancel
          </Button>
        </Box>
      </ActionDialog>

      {/* ── Reject ────────────────────────────────────────────────── */}
      <ActionDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        colors={colors}
        kicker="Reject"
        title={`Send v${data?.latestVersionNo ?? "—"} back for correction`}
        accent={colors.danger}
      >
        <Lbl colors={colors} sx={{ mb: 0.5 }}>
          Reason (kept in history)
        </Lbl>
        <TextField
          fullWidth
          multiline
          rows={3}
          autoFocus
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Why this version cannot go forward"
          InputProps={{ sx: { borderRadius: 0, fontSize: 13 } }}
          sx={{ mb: 2.5 }}
        />
        <DialogActions
          colors={colors}
          confirmLabel="Reject version"
          confirmTone={colors.danger}
          confirmDisabled={!rejectReason.trim()}
          busy={isRejecting}
          onConfirm={handleReject}
          onCancel={() => setRejectOpen(false)}
        />
      </ActionDialog>
    </Dialog>
  );
};

/** One labelled fact in the header strip. */
const HeaderFact: React.FC<{ label: string; colors: any; children: React.ReactNode }> = ({
  label,
  colors,
  children,
}) => (
  <Box sx={{ display: "flex", gap: 0.75, alignItems: "baseline", minWidth: 0 }}>
    <Lbl colors={colors}>{label}</Lbl>
    <Typography
      sx={{
        fontSize: 13,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color: colors.textPrimary,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Typography>
  </Box>
);

/**
 * Shared shell for the three confirm dialogs - the design's square 2px frame
 * with a coloured top rule that tells approve from reject before the text is
 * read.
 */
const ActionDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  colors: any;
  kicker: string;
  title: string;
  accent: string;
  children: React.ReactNode;
}> = ({ open, onClose, colors, kicker, title, accent, children }) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        width: "min(520px, 100%)",
        borderRadius: 0,
        border: `2px solid ${colors.textPrimary}`,
        borderTop: `4px solid ${accent}`,
        backgroundImage: "none",
      },
    }}
  >
    <Box sx={{ p: 2.5 }}>
      <Lbl colors={colors}>{kicker}</Lbl>
      <Typography sx={{ fontSize: 20, fontWeight: 800, mt: 0.5, mb: 2, color: colors.textPrimary }}>
        {title}
      </Typography>
      {children}
    </Box>
  </Dialog>
);

/** Confirm + Cancel pair, shared by the composer and the reject dialog. */
const DialogActions: React.FC<{
  colors: any;
  confirmLabel: string;
  confirmTone: string;
  confirmDisabled: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ colors, confirmLabel, confirmTone, confirmDisabled, busy, onConfirm, onCancel }) => (
  <Box sx={{ display: "flex", gap: 1 }}>
    <Button
      onClick={onConfirm}
      disabled={confirmDisabled || busy}
      startIcon={busy ? <CircularProgress size={13} color="inherit" /> : undefined}
      sx={{
        textTransform: "none",
        fontWeight: 800,
        borderRadius: 0,
        px: 2,
        bgcolor: confirmTone,
        color: "#fff",
        "&:hover": { bgcolor: confirmTone, filter: "brightness(1.08)" },
      }}
    >
      {confirmLabel}
    </Button>
    <Button
      onClick={onCancel}
      sx={{ textTransform: "none", fontWeight: 700, borderRadius: 0, color: colors.textSecondary }}
    >
      Cancel
    </Button>
  </Box>
);

export default MopReviewWorkspaceDialog;
