import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
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
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FitScreenRoundedIcon from "@mui/icons-material/FitScreenRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import KeyboardRoundedIcon from "@mui/icons-material/KeyboardRounded";
import RotateRightRoundedIcon from "@mui/icons-material/RotateRightRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { useTabColorTokens } from "../../../../../../style/theme";
import { MopReviewRail } from "./MopReviewRail";
import {
  ActionDialog,
  ActionFooter,
  Lbl,
  VersionStatusChip,
  inputSx,
  outlineBtnSx,
  shortStamp,
  solidBtnSx,
} from "./mopUi";
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

/**
 * The fullscreen MOP validation workspace: the stored document under a
 * page/zoom toolbar on the left, and a rail carrying findings, version
 * history, the audit trail and the two decisions on the right.
 *
 * Styled as a sibling of `StageReviewDialog` - the same canvas colour, the
 * same header row, and rounded surface cards from `useTabColorTokens` - so
 * opening it from the MOP Validate panel reads as going one level deeper
 * rather than into a different app.
 *
 * The document is rendered by pdf.js (`MopPdfCanvas`) rather than handed to the
 * browser's viewer in an iframe, which is what MOP Create does. The extra cost
 * buys the three things this screen cannot work without: the real page count,
 * control of which page is shown - so a finding's "p.4" can actually go there -
 * and a click target on the page itself, which is the flag gesture.
 *
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
    { skip: !open || !crqNo, refetchOnMountOrArgChange: true },
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
  const showPager = !isExcel && Boolean(data?.documentAttached);

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
    borderRadius: colors.radius,
    color: colors.textSecondary,
    "&:hover": { bgcolor: alpha(colors.accent, 0.08), color: colors.accent },
    "&.Mui-disabled": { color: colors.textDim },
  };

  /** Rounded segment that groups related toolbar controls. */
  const toolGroupSx = {
    display: "flex",
    alignItems: "center",
    gap: 0.25,
    p: 0.25,
    borderRadius: colors.radius,
    border: `1px solid ${colors.border}`,
    bgcolor: colors.surface2,
  };

  const zoomLabel = zoom === "fit" ? "Fit" : `${zoom}%`;
  const stepZoom = (delta: number) =>
    setZoom((z) => {
      const base = z === "fit" ? 100 : z;
      return Math.min(200, Math.max(70, base + delta));
    });

  const cardSx = {
    bgcolor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: colors.radiusL,
    overflow: "hidden",
  };

  const facts: Array<{ label: string; value: React.ReactNode; grow?: boolean }> = [
    {
      label: "Viewing",
      value: (
        <>
          v{data?.versionNo ?? "—"}
          <Box component="span" sx={{ fontWeight: 400, color: colors.textSecondary }}>
            {" "}
            of {data?.versions.length ?? 0}
          </Box>
        </>
      ),
    },
    {
      label: "Window",
      value: data?.windowStart
        ? `${shortStamp(data.windowStart)}${data.windowEnd ? ` – ${shortStamp(data.windowEnd)}` : ""}`
        : "—",
    },
    { label: "Reviewer", value: data?.currentReviewerId ?? "—" },
    { label: "Document", value: data?.fileName ?? "—", grow: true },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      keepMounted={false}
      PaperProps={{
        elevation: 0,
        sx: {
          // Same canvas as StageReviewDialog, the dialog this opens from.
          bgcolor: colors.isDark ? "#131419" : "#F4F5F7",
          backgroundImage: "none",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <Box
          sx={{
            flex: "none",
            px: 2.5,
            py: 1.5,
            bgcolor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                flex: "none",
                display: "grid",
                placeItems: "center",
                borderRadius: colors.radius,
                bgcolor: colors.accentDim,
                border: `1px solid ${colors.accentBorder}`,
                color: colors.accent,
              }}
            >
              <FactCheckOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: colors.textPrimary }}>
                  MOP Validate —{" "}
                  <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {data?.crqNo ?? crqNo}
                  </Box>
                </Typography>
                {data?.versionStatus && <VersionStatusChip status={data.versionStatus} colors={colors} />}
              </Box>
              <Typography
                sx={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {isLoading ? <Skeleton width={220} /> : (data?.title ?? "—")}
              </Typography>
            </Box>
            <Tooltip arrow title="Close (Esc)">
              <IconButton onClick={onClose} size="small" aria-label="Close">
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Facts strip - the same divided one-liner as MopVersionStrip. */}
          <Box
            sx={{
              mt: 1.25,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "stretch",
              rowGap: 1,
              px: 1.75,
              py: 0.9,
              borderRadius: colors.radius,
              border: `1px solid ${colors.border}`,
              bgcolor: colors.surface2,
            }}
          >
            {facts.map((f, i) => (
              <React.Fragment key={f.label}>
                {i > 0 && <Box aria-hidden sx={{ width: "1px", bgcolor: colors.border, mx: 1.75 }} />}
                <Box sx={{ minWidth: 0, flex: f.grow ? "1 1 180px" : "0 1 auto" }}>
                  <Lbl colors={colors}>{f.label}</Lbl>
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      lineHeight: 1.5,
                      fontVariantNumeric: "tabular-nums",
                      color: colors.textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isLoading ? <Skeleton width={80} /> : f.value}
                  </Typography>
                </Box>
              </React.Fragment>
            ))}
          </Box>
        </Box>

        <Box sx={{ height: 2, flex: "none" }}>
          {isFetching && <LinearProgress sx={{ height: 2 }} />}
        </Box>

        <AnimatePresence>
          {actionError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box sx={{ px: 2, pt: 1.5 }}>
                <Alert severity="error" onClose={() => setActionError(null)} sx={{ fontSize: 12.5 }}>
                  {actionError}
                </Alert>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Body ────────────────────────────────────────────────── */}
        {isLoading ? (
          <Box sx={{ flex: 1, display: "flex", gap: 2, p: 2, minHeight: 0 }}>
            <Skeleton variant="rounded" sx={{ flex: 1, height: "100%", borderRadius: colors.radiusL }} />
            <Box sx={{ ...cardSx, width: 400, p: 2 }}>
              <Skeleton height={54} />
              <Skeleton height={40} sx={{ mt: 1 }} />
              <Skeleton variant="rounded" height={110} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" height={110} sx={{ mt: 1 }} />
            </Box>
          </Box>
        ) : isError || !data ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="warning" sx={{ fontSize: 13 }}>
              The MOP review for {crqNo} could not be loaded.
            </Alert>
          </Box>
        ) : !data.mopExists || !data.versionId ? (
          <Box sx={{ flex: 1, p: 2, display: "flex", minHeight: 0 }}>
            <EmptyCard
              colors={colors}
              title={data.mopExists ? "No version to review" : "No MOP to validate"}
              body={
                data.mopExists
                  ? "This MOP exists but carries no version, so there is nothing to validate."
                  : `MOP Create has not run for ${crqNo} yet. Once the MOP is created, its first version appears here.`
              }
            />
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", gap: 2, p: 2 }}>
            {/* ── Document pane ─────────────────────────────────── */}
            <Box sx={{ ...cardSx, flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {data.viewingOld && (
                <Alert
                  severity="warning"
                  icon={<HistoryRoundedIcon fontSize="small" />}
                  sx={{ borderRadius: 0, fontSize: 12.5, py: 0.25, alignItems: "center", flex: "none" }}
                  action={
                    <Button
                      size="small"
                      onClick={() => setVersionId(data.latestVersionId ?? null)}
                      sx={outlineBtnSx(colors, colors.warning)}
                    >
                      Go to v{data.latestVersionNo}
                    </Button>
                  }
                >
                  <strong>Read-only.</strong> You are viewing a superseded version.
                </Alert>
              )}

              {/* Toolbar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  borderBottom: `1px solid ${colors.border}`,
                  flexWrap: "wrap",
                  flex: "none",
                }}
              >
                {showPager && (
                  <>
                    <Box sx={toolGroupSx}>
                      <Tooltip arrow title="Previous page (←)">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => goPage(pageNo - 1)}
                            disabled={pageNo <= 1}
                            sx={toolIconSx}
                          >
                            <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          minWidth: 64,
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
                    </Box>

                    <Box sx={toolGroupSx}>
                      <Tooltip arrow title="Zoom out">
                        <IconButton size="small" onClick={() => stepZoom(-10)} sx={toolIconSx}>
                          <ZoomOutRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          minWidth: 40,
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
                          sx={{
                            ...toolIconSx,
                            ...(zoom === "fit" && { color: colors.accent, bgcolor: colors.accentDim }),
                          }}
                        >
                          <FitScreenRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip arrow title="Rotate">
                        <IconButton size="small" onClick={() => setRotation((r) => (r + 90) % 360)} sx={toolIconSx}>
                          <RotateRightRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </>
                )}

                <Tooltip arrow title="Download the MOP">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleDownload}
                      disabled={!blob}
                      sx={{ ...toolIconSx, border: `1px solid ${colors.border}` }}
                    >
                      <DownloadRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Box sx={{ flex: 1 }} />

                <Tooltip
                  arrow
                  title={canFlag ? "Click the page to flag it · ← → to page · F to flag" : ""}
                >
                  <Box
                    sx={{
                      display: { xs: "none", lg: "flex" },
                      alignItems: "center",
                      gap: 0.5,
                      fontSize: 11.5,
                      color: colors.textDim,
                    }}
                  >
                    <KeyboardRoundedIcon sx={{ fontSize: 15 }} />
                    {canFlag ? "← → page · F flag" : "Read-only"}
                  </Box>
                </Tooltip>

                {canFlag && (
                  <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    onClick={openComposer}
                    startIcon={<FlagRoundedIcon sx={{ fontSize: "16px !important" }} />}
                    sx={solidBtnSx(colors.accent)}
                  >
                    Flag page {pageNo}
                  </Button>
                )}
              </Box>

              {/* Canvas */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: colors.isDark ? alpha("#fff", 0.02) : "#EEF0F3",
                }}
              >
                {!data.documentAttached ? (
                  <EmptyCard
                    colors={colors}
                    bare
                    title="No document uploaded"
                    body={`${
                      data.fileName
                        ? `The MOP record expects "${data.fileName}", but nothing has been uploaded on the MOP Create stage yet.`
                        : "Nothing has been uploaded on the MOP Create stage yet."
                    } Findings can still be recorded against this version.`}
                  />
                ) : isLegacyXls ? (
                  <EmptyCard
                    colors={colors}
                    bare
                    title="Legacy .xls workbook"
                    body="This format cannot be rendered in the browser. Download it to open in Excel."
                    action={
                      <Button
                        size="small"
                        onClick={handleDownload}
                        disabled={!blob}
                        startIcon={<DownloadRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={outlineBtnSx(colors)}
                      >
                        Download workbook
                      </Button>
                    }
                  />
                ) : isExcel ? (
                  <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: 2 }}>
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
        icon={<FlagRoundedIcon />}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.85,
            mb: 2,
            borderRadius: colors.radius,
            border: `1px solid ${colors.accentBorder}`,
            bgcolor: colors.accentDim,
          }}
        >
          <DescriptionOutlinedIcon sx={{ fontSize: 16, color: colors.accent }} />
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
          InputProps={{ sx: inputSx }}
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
          InputProps={{ sx: inputSx }}
          sx={{ mb: 2.5 }}
        />

        <ActionFooter
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
        kicker="Confirm validation"
        title={`Release v${data?.latestVersionNo ?? "—"} for execution?`}
        accent={colors.success}
        icon={<CheckRoundedIcon />}
      >
        <Typography sx={{ fontSize: 13, color: colors.textSecondary, mb: 2, lineHeight: 1.55 }}>
          <Box component="span" sx={{ fontWeight: 700, color: colors.textPrimary, fontVariantNumeric: "tabular-nums" }}>
            {crqNo}
          </Box>{" "}
          v{data?.latestVersionNo} becomes the only executable version. Earlier versions stay in
          history, read-only.
        </Typography>

        {(data?.openFindingCount ?? 0) > 0 && (
          <Alert severity="warning" sx={{ fontSize: 12.5, mb: 2 }}>
            {data?.openFindingCount} finding(s) are still open. The procedure refuses this unless it is
            overridden, and the override is recorded in the audit trail.
          </Alert>
        )}

        <ActionFooter
          colors={colors}
          confirmLabel="Confirm"
          confirmTone={colors.success}
          confirmDisabled={(data?.openFindingCount ?? 0) > 0}
          busy={isValidating}
          onConfirm={() => handleApprove(false)}
          onCancel={() => setApproveOpen(false)}
          extra={
            (data?.openFindingCount ?? 0) > 0 ? (
              <Button
                onClick={() => handleApprove(true)}
                disabled={isValidating}
                startIcon={<BlockRoundedIcon sx={{ fontSize: "16px !important" }} />}
                sx={outlineBtnSx(colors, colors.warning)}
              >
                Override &amp; validate
              </Button>
            ) : null
          }
        />
      </ActionDialog>

      {/* ── Reject ────────────────────────────────────────────────── */}
      <ActionDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        colors={colors}
        kicker="Reject version"
        title={`Send v${data?.latestVersionNo ?? "—"} back for correction`}
        accent={colors.danger}
        icon={<BlockRoundedIcon />}
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
          InputProps={{ sx: inputSx }}
          sx={{ mb: 2.5 }}
        />
        <ActionFooter
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

/** Centered "nothing to show" state; `bare` drops the card frame inside a card. */
const EmptyCard: React.FC<{
  colors: any;
  title: string;
  body: string;
  action?: React.ReactNode;
  bare?: boolean;
}> = ({ colors, title, body, action, bare }) => (
  <Stack
    spacing={1.25}
    sx={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      p: 4,
      ...(!bare && {
        bgcolor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: colors.radiusL,
      }),
    }}
  >
    <Box
      sx={{
        width: 52,
        height: 52,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        bgcolor: alpha(colors.textPrimary, 0.05),
      }}
    >
      <DescriptionOutlinedIcon sx={{ fontSize: 26, color: colors.textDim }} />
    </Box>
    <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{title}</Typography>
    <Typography sx={{ fontSize: 12.5, color: colors.textSecondary, maxWidth: 420 }}>{body}</Typography>
    {action}
  </Stack>
);

export default MopReviewWorkspaceDialog;
