import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { AnimatePresence, motion } from "framer-motion";
import type {
  MopAuditEntry,
  MopFinding,
  MopReviewWorkspace,
  MopVersionSummary,
} from "../../../../types/mopReview.types";
import {
  Lbl,
  ToneChip,
  VersionStatusChip,
  inputSx,
  outlineBtnSx,
  shortStamp,
  solidBtnSx,
} from "./mopUi";

/** Which icon an audit event earns, so the trail scans without being read. */
const auditVisual = (eventType: string, colors: any) => {
  if (eventType.includes("validated")) return { icon: CheckCircleRoundedIcon, tone: colors.success };
  if (eventType.includes("rejected")) return { icon: BlockRoundedIcon, tone: colors.danger };
  if (eventType.includes("finding")) return { icon: FlagRoundedIcon, tone: colors.warning };
  if (eventType.includes("review")) return { icon: VisibilityRoundedIcon, tone: colors.info };
  if (eventType.includes("uploaded")) return { icon: UploadFileOutlinedIcon, tone: colors.accent };
  return { icon: DescriptionOutlinedIcon, tone: colors.textDim };
};

type FindingFilter = "all" | "open" | "resolved";

interface MopReviewRailProps {
  data: MopReviewWorkspace;
  colors: any;
  tab: "findings" | "history";
  setTab: (tab: "findings" | "history") => void;
  reviewNote: string;
  setReviewNote: (value: string) => void;
  busy: boolean;
  onOpenComposer: () => void;
  onGoToPage: (page: number) => void;
  onOpenVersion: (versionId: number) => void;
  onToggleFinding: (finding: MopFinding) => void;
  onWithdrawFinding: (finding: MopFinding) => void;
  onOpenApprove: () => void;
  onOpenReject: () => void;
  /** Hovering a card lifts the matching page in the canvas. */
  onHoverFinding: (pageNo: number | null) => void;
}

/**
 * The right rail of the validation workspace: findings and history over a
 * pinned decision footer.
 *
 * Segmented tabs with live counts, a scrolling body, the composer trigger
 * pinned under the list, and the reviewer note plus the two decisions fixed
 * to the bottom - with a resolve-progress ring, filter chips, a search box once
 * the list is long enough to need one, and a version history drawn as a
 * timeline rather than a flat list.
 */
export const MopReviewRail: React.FC<MopReviewRailProps> = ({
  data,
  colors,
  tab,
  setTab,
  reviewNote,
  setReviewNote,
  busy,
  onOpenComposer,
  onGoToPage,
  onOpenVersion,
  onToggleFinding,
  onWithdrawFinding,
  onOpenApprove,
  onOpenReject,
  onHoverFinding,
}) => {
  const [filter, setFilter] = useState<FindingFilter>("all");
  const [search, setSearch] = useState("");

  const openCount = data.openFindingCount;
  const total = data.findings.length;
  const resolved = total - openCount;
  const isValidated = data.mopStatus === "validated";

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.findings.filter((f) => {
      if (filter === "open" && f.state !== "open") return false;
      if (filter === "resolved" && f.state === "open") return false;
      if (!term) return true;
      return (
        f.description.toLowerCase().includes(term) ||
        f.findingRef.toLowerCase().includes(term) ||
        (f.stepRef ?? "").toLowerCase().includes(term)
      );
    });
  }, [data.findings, filter, search]);

  // The procedure refuses to validate while findings are open unless forced, so
  // the button says so rather than letting the click fail.
  const approveBlocked = openCount > 0;

  const tabSx = (active: boolean) => ({
    textTransform: "none" as const,
    fontSize: 12.5,
    fontWeight: 700,
    borderRadius: colors.radius,
    px: 1.5,
    py: 0.6,
    minWidth: 0,
    gap: 0.75,
    flex: 1,
    color: active ? colors.accent : colors.textSecondary,
    bgcolor: active ? colors.surface : "transparent",
    boxShadow: active ? colors.shadowCard : "none",
    border: `1px solid ${active ? colors.border : "transparent"}`,
    "&:hover": { bgcolor: active ? colors.surface : alpha(colors.textPrimary, 0.04) },
  });

  return (
    <Box
      sx={{
        width: { xs: 340, lg: 400 },
        flex: "none",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: colors.radiusL,
        overflow: "hidden",
      }}
    >
      {/* ── Progress header ─────────────────────────────────────── */}
      <Box
        sx={{
          flex: "none",
          px: 2,
          pt: 1.75,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.75,
        }}
      >
        <ProgressRing resolved={resolved} total={total} colors={colors} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
            {total === 0
              ? "No findings raised"
              : openCount === 0
                ? "All findings resolved"
                : `${openCount} finding${openCount === 1 ? "" : "s"} to resolve`}
          </Typography>
          <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
            {total === 0
              ? "Review the document, then decide."
              : `${resolved} of ${total} resolved on v${data.versionNo}`}
          </Typography>
        </Box>
      </Box>

      {/* ── Tabs (segmented) ────────────────────────────────────── */}
      <Box sx={{ px: 2, pb: 1.5, flex: "none", borderBottom: `1px solid ${colors.border}` }}>
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            p: 0.5,
            borderRadius: colors.radius,
            bgcolor: colors.surface2,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Button size="small" onClick={() => setTab("findings")} sx={tabSx(tab === "findings")}>
            <FlagRoundedIcon sx={{ fontSize: 16 }} />
            Findings
            {openCount > 0 && <ToneChip label={openCount} tone={colors.danger} sx={{ height: 18 }} />}
          </Button>
          <Button size="small" onClick={() => setTab("history")} sx={tabSx(tab === "history")}>
            <HistoryRoundedIcon sx={{ fontSize: 16 }} />
            History
            <ToneChip
              label={data.versions.length}
              tone={tab === "history" ? colors.accent : colors.textSecondary}
              sx={{ height: 18 }}
            />
          </Button>
        </Box>
      </Box>

      {/* ── Body ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === "findings" ? (
          <motion.div
            key="findings"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.16 }}
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
          >
            {total > 0 && (
              <Box sx={{ flex: "none", px: 2, pt: 1.5, display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                {(["all", "open", "resolved"] as FindingFilter[]).map((key) => {
                  const count = key === "all" ? total : key === "open" ? openCount : resolved;
                  const active = filter === key;
                  return (
                    <Chip
                      key={key}
                      size="small"
                      label={`${key[0].toUpperCase()}${key.slice(1)} · ${count}`}
                      onClick={() => setFilter(key)}
                      sx={{
                        height: 24,
                        fontSize: 11.5,
                        fontWeight: 700,
                        border: `1px solid ${active ? colors.accentBorder : colors.border}`,
                        bgcolor: active ? colors.accentDim : "transparent",
                        color: active ? colors.accent : colors.textSecondary,
                      }}
                    />
                  );
                })}
                {/* A search box earns its space only once scanning stops working. */}
                {total > 4 && (
                  <TextField
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search findings"
                    InputProps={{
                      startAdornment: (
                        <SearchRoundedIcon sx={{ fontSize: 15, mr: 0.75, color: colors.textDim }} />
                      ),
                      sx: { ...inputSx, fontSize: 12.5, height: 30 },
                    }}
                    sx={{ flex: "1 1 140px", minWidth: 120 }}
                  />
                )}
              </Box>
            )}

            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
              {visible.length === 0 ? (
                <Box
                  sx={{
                    border: `1px dashed ${colors.border}`,
                    borderRadius: colors.radius,
                    bgcolor: colors.surface2,
                    p: 3,
                    textAlign: "center",
                    color: colors.textSecondary,
                  }}
                >
                  <FlagRoundedIcon sx={{ fontSize: 26, color: colors.textDim, mb: 1 }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
                    {total === 0 ? "Nothing recorded yet" : "No findings match"}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, mt: 0.5 }}>
                    {total === 0
                      ? "If the document is fine, mark it validated."
                      : "Clear the filter or search to see the rest."}
                  </Typography>
                </Box>
              ) : (
                <AnimatePresence initial={false}>
                  {visible.map((f) => (
                    <motion.div
                      key={f.findingId}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <FindingCard
                        finding={f}
                        colors={colors}
                        canEdit={data.canEdit}
                        busy={busy}
                        onGoToPage={onGoToPage}
                        onToggle={onToggleFinding}
                        onWithdraw={onWithdrawFinding}
                        onHover={onHoverFinding}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </Box>

            {data.canEdit && (
              <Box sx={{ flex: "none", px: 2, pb: 1.5 }}>
                <Button
                  fullWidth
                  onClick={onOpenComposer}
                  disabled={busy}
                  startIcon={<AddRoundedIcon sx={{ fontSize: "18px !important" }} />}
                  sx={{
                    ...outlineBtnSx(colors, colors.accent),
                    py: 0.8,
                    borderStyle: "dashed",
                    bgcolor: colors.accentDim,
                  }}
                >
                  Add a finding
                </Button>
              </Box>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.16 }}
            style={{ flex: 1, minHeight: 0, overflow: "auto" }}
          >
            <Box sx={{ p: 2 }}>
              <Lbl colors={colors} sx={{ mb: 1 }}>
                Version history
              </Lbl>
              {data.versions.map((v) => (
                <VersionRow
                  key={v.versionId}
                  version={v}
                  colors={colors}
                  active={v.versionId === data.versionId}
                  onOpen={onOpenVersion}
                />
              ))}

              <Lbl colors={colors} sx={{ mt: 2.5, mb: 1 }}>
                Audit trail
              </Lbl>
              {data.audit.length === 0 ? (
                <Typography sx={{ fontSize: 12.5, color: colors.textDim }}>
                  Nothing recorded yet.
                </Typography>
              ) : (
                <Box sx={{ position: "relative", pl: 0.5 }}>
                  {data.audit.map((a, i) => (
                    <AuditRow
                      key={a.auditId}
                      entry={a}
                      colors={colors}
                      isLast={i === data.audit.length - 1}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Decision footer ─────────────────────────────────────── */}
      <Box sx={{ flex: "none", p: 2, borderTop: `1px solid ${colors.border}`, bgcolor: colors.surface2 }}>
        {isValidated && (
          <Box
            sx={{
              border: `1px solid ${colors.successBorder}`,
              bgcolor: colors.successDim,
              borderRadius: colors.radius,
              p: 1.25,
              display: "flex",
              gap: 1.25,
              alignItems: "center",
              mb: data.canEdit ? 1.5 : 0,
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 22, color: colors.success }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
                v{data.latestVersionNo} validated — released for execution.
              </Typography>
              <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
                Earlier versions locked read-only.
              </Typography>
            </Box>
          </Box>
        )}

        {data.canEdit && (
          <>
            <Lbl colors={colors} sx={{ mb: 0.5 }}>
              Reviewer note
            </Lbl>
            <TextField
              fullWidth
              size="small"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Optional, kept in the audit record"
              InputProps={{ sx: { ...inputSx, bgcolor: colors.surface } }}
              sx={{ mb: 1.5 }}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Tooltip
                arrow
                title={approveBlocked ? "Open findings must be resolved, or the decision overridden" : ""}
              >
                <span>
                  <Button
                    fullWidth
                    onClick={onOpenApprove}
                    disabled={busy}
                    startIcon={<CheckRoundedIcon sx={{ fontSize: "18px !important" }} />}
                    sx={{
                      ...(approveBlocked ? outlineBtnSx(colors, colors.success) : solidBtnSx(colors.success)),
                      py: 0.8,
                    }}
                  >
                    Validated OK
                  </Button>
                </span>
              </Tooltip>
              <Button
                fullWidth
                onClick={onOpenReject}
                disabled={busy}
                startIcon={<BlockRoundedIcon sx={{ fontSize: "17px !important" }} />}
                sx={{ ...outlineBtnSx(colors, colors.danger), py: 0.8 }}
              >
                Reject
              </Button>
            </Box>
            <Typography sx={{ fontSize: 11.5, mt: 1, color: colors.textSecondary }}>
              {approveBlocked
                ? `Resolve ${openCount} open finding${openCount === 1 ? "" : "s"} first, or override on confirm.`
                : `Releases v${data.latestVersionNo} for execution and locks earlier versions.`}
            </Typography>
          </>
        )}

        {!data.canEdit && !isValidated && (
          <Alert severity="info" sx={{ fontSize: 12.5, py: 0.25 }}>
            {data.viewingOld ? "Superseded version — read-only." : "This version can no longer be acted on."}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

/** Resolved-vs-total as a ring, so progress reads at a glance. */
const ProgressRing: React.FC<{ resolved: number; total: number; colors: any }> = ({
  resolved,
  total,
  colors,
}) => {
  const pct = total === 0 ? 0 : Math.round((resolved / total) * 100);
  const done = total > 0 && resolved === total;

  return (
    <Box sx={{ position: "relative", display: "inline-flex", flex: "none" }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={44}
        thickness={4}
        sx={{ color: alpha(colors.textPrimary, 0.08) }}
      />
      <CircularProgress
        variant="determinate"
        value={total === 0 ? 0 : pct}
        size={44}
        thickness={4}
        sx={{
          color: done ? colors.success : colors.accent,
          position: "absolute",
          left: 0,
          "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
        }}
      />
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        {done ? (
          <CheckRoundedIcon sx={{ fontSize: 20, color: colors.success }} />
        ) : (
          <Typography
            sx={{ fontSize: 11.5, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: colors.textPrimary }}
          >
            {total === 0 ? "—" : `${pct}%`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

/** One finding card - tone bar, page jump, and its two actions. */
const FindingCard: React.FC<{
  finding: MopFinding;
  colors: any;
  canEdit: boolean;
  busy: boolean;
  onGoToPage: (page: number) => void;
  onToggle: (f: MopFinding) => void;
  onWithdraw: (f: MopFinding) => void;
  onHover: (pageNo: number | null) => void;
}> = ({ finding, colors, canEdit, busy, onGoToPage, onToggle, onWithdraw, onHover }) => {
  const isOpen = finding.state === "open";
  const tone = isOpen ? colors.warning : colors.success;

  return (
    <Box
      onMouseEnter={() => onHover(finding.pageNo)}
      onMouseLeave={() => onHover(null)}
      sx={{
        position: "relative",
        border: `1px solid ${colors.border}`,
        borderRadius: colors.radius,
        bgcolor: isOpen ? colors.surface : colors.surface2,
        p: 1.5,
        pl: 1.75,
        overflow: "hidden",
        transition: "border-color 160ms ease, box-shadow 160ms ease",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: tone,
        },
        "&:hover": { borderColor: alpha(tone, 0.5), boxShadow: colors.shadowCard },
      }}
    >
      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
        <ToneChip label={finding.findingRef} tone={tone} />
        {finding.stepRef && (
          <Typography sx={{ fontSize: 11.5, color: colors.textSecondary }}>step {finding.stepRef}</Typography>
        )}
        {!isOpen && <CheckCircleRoundedIcon sx={{ fontSize: 15, color: colors.success, ml: 0.25 }} />}
        {finding.pageNo != null && (
          <Tooltip arrow title={`Go to page ${finding.pageNo}`}>
            <Chip
              size="small"
              icon={<DescriptionOutlinedIcon sx={{ fontSize: "13px !important" }} />}
              label={`p.${finding.pageNo}`}
              onClick={() => onGoToPage(finding.pageNo as number)}
              sx={{
                ml: "auto",
                height: 22,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: "transparent",
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
                "&:hover": { borderColor: colors.accentBorder, color: colors.accent, bgcolor: colors.accentDim },
              }}
            />
          </Tooltip>
        )}
      </Box>

      <Typography
        sx={{
          fontSize: 13,
          lineHeight: 1.5,
          mt: 1,
          color: colors.textPrimary,
          textDecoration: isOpen ? "none" : "line-through",
          opacity: isOpen ? 1 : 0.65,
        }}
      >
        {finding.description}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75 }}>
        <Typography sx={{ fontSize: 11, color: colors.textDim, fontVariantNumeric: "tabular-nums" }}>
          {finding.raisedBy ?? "—"} · {shortStamp(finding.raisedAt)}
        </Typography>
        {canEdit && (
          <Box sx={{ ml: "auto", display: "flex", gap: 0.25 }}>
            <Tooltip arrow title={isOpen ? "Mark resolved" : "Reopen"}>
              <span>
                <IconButton
                  size="small"
                  disabled={busy}
                  onClick={() => onToggle(finding)}
                  sx={{
                    borderRadius: colors.radius,
                    color: isOpen ? colors.success : colors.textSecondary,
                    "&:hover": { bgcolor: alpha(isOpen ? colors.success : colors.textPrimary, 0.08) },
                  }}
                >
                  {isOpen ? <CheckRoundedIcon sx={{ fontSize: 17 }} /> : <RestartAltRoundedIcon sx={{ fontSize: 17 }} />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip arrow title="Remove finding">
              <span>
                <IconButton
                  size="small"
                  disabled={busy}
                  onClick={() => onWithdraw(finding)}
                  sx={{
                    borderRadius: colors.radius,
                    color: colors.textSecondary,
                    "&:hover": { color: colors.danger, bgcolor: colors.dangerDim },
                  }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/** One version-history row, clickable to view that version read-only. */
const VersionRow: React.FC<{
  version: MopVersionSummary;
  colors: any;
  active: boolean;
  onOpen: (versionId: number) => void;
}> = ({ version, colors, active, onOpen }) => (
  <Box
    onClick={() => onOpen(version.versionId)}
    sx={{
      display: "grid",
      gridTemplateColumns: "36px 1fr auto",
      gap: 1,
      alignItems: "start",
      p: 1.25,
      mb: 0.75,
      cursor: "pointer",
      borderRadius: colors.radius,
      border: `1px solid ${active ? colors.accentBorder : colors.border}`,
      bgcolor: active ? colors.accentDim : "transparent",
      transition: "background-color 150ms ease, border-color 150ms ease",
      "&:hover": { bgcolor: active ? colors.accentDim : alpha(colors.textPrimary, 0.04) },
    }}
  >
    <Box
      sx={{
        height: 26,
        display: "grid",
        placeItems: "center",
        borderRadius: colors.radius,
        fontWeight: 800,
        fontSize: 12,
        fontVariantNumeric: "tabular-nums",
        bgcolor: active ? colors.accent : alpha(colors.textPrimary, 0.06),
        color: active ? "#fff" : colors.textSecondary,
      }}
    >
      v{version.versionNo}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>
        {version.uploadedBy ?? "Unknown"} ·{" "}
        <Box component="span" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 400 }}>
          {shortStamp(version.uploadedAt)}
        </Box>
      </Typography>
      <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
        {version.decisionNote || version.note || "—"}
      </Typography>
      {version.openFindingCount > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
          <FlagRoundedIcon sx={{ fontSize: 13, color: colors.warning }} />
          <Typography sx={{ fontSize: 11.5, color: colors.warning, fontWeight: 700 }}>
            {version.openFindingCount} open
          </Typography>
        </Box>
      )}
    </Box>
    <VersionStatusChip status={version.status} colors={colors} />
  </Box>
);

/** One audit line, drawn as a timeline node with an event-typed icon. */
const AuditRow: React.FC<{ entry: MopAuditEntry; colors: any; isLast: boolean }> = ({
  entry,
  colors,
  isLast,
}) => {
  const { icon: Icon, tone } = auditVisual(entry.eventType, colors);

  return (
    <Box sx={{ display: "flex", gap: 1.25, position: "relative" }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            border: `1px solid ${alpha(tone, 0.35)}`,
            bgcolor: alpha(tone, 0.12),
            flex: "none",
          }}
        >
          <Icon sx={{ fontSize: 13, color: tone }} />
        </Box>
        {!isLast && <Box sx={{ width: "1px", flex: 1, bgcolor: colors.border, minHeight: 12 }} />}
      </Box>
      <Box sx={{ pb: 1.5, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, fontVariantNumeric: "tabular-nums", color: colors.textDim }}>
          {shortStamp(entry.createdAt)}
          {entry.actorId ? ` · ${entry.actorId}` : ""}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: colors.textPrimary, lineHeight: 1.45 }}>
          {entry.detail ?? entry.eventType}
        </Typography>
      </Box>
    </Box>
  );
};

export default MopReviewRail;
