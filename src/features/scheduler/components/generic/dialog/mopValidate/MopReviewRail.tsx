import React, { useMemo, useState } from "react";
import {
  Alert,
  Badge,
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
import { AnimatePresence, motion } from "framer-motion";
import type {
  MopAuditEntry,
  MopFinding,
  MopReviewWorkspace,
  MopVersionSummary,
} from "../../../../types/mopReview.types";
import { MOP_VERSION_STATUS_LABEL } from "../../../../types/mopValidate.types";

/** `2026-08-28T11:40:00` -> `28 Aug 11:40`, the design's compact stamp. */
export const shortStamp = (value: string | null | undefined): string => {
  if (!value) return "—";
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return value;
  return `${at.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${at.toLocaleTimeString(
    "en-GB",
    { hour: "2-digit", minute: "2-digit", hour12: false },
  )}`;
};

/** The design's uppercase micro-label, as a component - there is no global `.lbl`. */
export const Lbl: React.FC<{ children: React.ReactNode; colors: any; sx?: any }> = ({
  children,
  colors,
  sx,
}) => (
  <Typography
    sx={{
      fontSize: 10,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontWeight: 700,
      color: alpha(colors.textPrimary, 0.55),
      ...sx,
    }}
  >
    {children}
  </Typography>
);

/** Status -> colour, shared by the version rows and the header tag. */
export const versionTone = (status: string | null | undefined, colors: any): string => {
  if (status === "validated") return colors.success;
  if (status === "rejected") return colors.danger;
  if (status === "superseded") return colors.textDim;
  return colors.accent;
};

/** Which icon an audit event earns, so the trail scans without being read. */
const auditVisual = (eventType: string, colors: any) => {
  if (eventType.includes("validated")) return { icon: CheckCircleRoundedIcon, tone: colors.success };
  if (eventType.includes("rejected")) return { icon: BlockRoundedIcon, tone: colors.danger };
  if (eventType.includes("finding")) return { icon: FlagRoundedIcon, tone: colors.warning };
  if (eventType.includes("review")) return { icon: VisibilityRoundedIcon, tone: colors.info };
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
 * Keeps the design's structure - segmented tabs with live counts, a scrolling
 * body, the composer trigger pinned under the list, and the reviewer note plus
 * the two decisions fixed to the bottom - and adds what a reviewer working a
 * real queue needs: a resolve-progress ring, filter chips, a search box once the
 * list is long enough to need one, and a version history drawn as a timeline
 * rather than a flat list.
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
    borderRadius: 0,
    px: 1.5,
    py: 0.85,
    minWidth: 0,
    gap: 0.75,
    flex: 1,
    border: `2px solid ${active ? colors.textPrimary : "transparent"}`,
    bgcolor: active ? colors.textPrimary : "transparent",
    color: active ? colors.bg : colors.textPrimary,
    "&:hover": { bgcolor: active ? colors.textPrimary : alpha(colors.textPrimary, 0.06) },
  });

  return (
    <Box
      sx={{
        width: 420,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: colors.surface,
        borderLeft: `2px solid ${colors.border}`,
      }}
    >
      {/* ── Progress header ─────────────────────────────────────── */}
      <Box
        sx={{
          flex: "none",
          px: 2,
          pt: 2,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <ProgressRing resolved={resolved} total={total} colors={colors} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: colors.textPrimary }}>
            {total === 0
              ? "No findings raised"
              : openCount === 0
                ? "All findings resolved"
                : `${openCount} finding${openCount === 1 ? "" : "s"} to resolve`}
          </Typography>
          <Typography sx={{ fontSize: 12, color: alpha(colors.textPrimary, 0.62) }}>
            {total === 0
              ? "Review the document, then decide."
              : `${resolved} of ${total} resolved on v${data.versionNo}`}
          </Typography>
        </Box>
      </Box>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 0.5, p: 1.25, flex: "none", borderBottom: `2px solid ${colors.border}` }}>
        <Button size="small" onClick={() => setTab("findings")} sx={tabSx(tab === "findings")}>
          <Badge
            badgeContent={openCount}
            color="error"
            sx={{ "& .MuiBadge-badge": { fontSize: 9, height: 15, minWidth: 15 } }}
          >
            <FlagRoundedIcon sx={{ fontSize: 16 }} />
          </Badge>
          Findings
        </Button>
        <Button size="small" onClick={() => setTab("history")} sx={tabSx(tab === "history")}>
          <HistoryRoundedIcon sx={{ fontSize: 16 }} />
          History
          <Box component="span" sx={{ fontVariantNumeric: "tabular-nums", opacity: 0.75 }}>
            {data.versions.length}
          </Box>
        </Button>
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
              <Box sx={{ flex: "none", px: 2, pt: 1.5, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {(["all", "open", "resolved"] as FindingFilter[]).map((key) => {
                  const count = key === "all" ? total : key === "open" ? openCount : resolved;
                  const active = filter === key;
                  return (
                    <Chip
                      key={key}
                      size="small"
                      label={`${key[0].toUpperCase()}${key.slice(1)} ${count}`}
                      onClick={() => setFilter(key)}
                      sx={{
                        height: 24,
                        fontSize: 11.5,
                        fontWeight: 700,
                        borderRadius: 0,
                        border: `1px solid ${active ? colors.accent : colors.border}`,
                        bgcolor: active ? alpha(colors.accent, 0.12) : "transparent",
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
                      sx: { borderRadius: 0, fontSize: 12.5, height: 30 },
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
                    p: 3,
                    textAlign: "center",
                    color: alpha(colors.textPrimary, 0.6),
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
              <Box sx={{ flex: "none", p: 1.5, borderTop: `2px solid ${colors.border}` }}>
                <Button
                  fullWidth
                  onClick={onOpenComposer}
                  disabled={busy}
                  startIcon={<AddRoundedIcon sx={{ fontSize: "18px !important" }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    py: 0.9,
                    borderRadius: 0,
                    border: `2px solid ${colors.textPrimary}`,
                    color: colors.textPrimary,
                    "&:hover": { bgcolor: alpha(colors.textPrimary, 0.06) },
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
              <Lbl colors={colors} sx={{ mb: 1.25 }}>
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

              <Lbl colors={colors} sx={{ mt: 3, mb: 1.25 }}>
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
      <Box sx={{ flex: "none", p: 2, borderTop: `2px solid ${colors.textPrimary}`, bgcolor: colors.surface }}>
        {isValidated && (
          <Box
            sx={{
              border: `2px solid ${colors.success}`,
              bgcolor: alpha(colors.success, 0.08),
              p: 1.5,
              display: "flex",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 20, color: colors.success }} />
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: colors.textPrimary }}>
                v{data.latestVersionNo} validated — released for execution.
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: alpha(colors.textPrimary, 0.65) }}>
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
              InputProps={{ sx: { borderRadius: 0, fontSize: 13 } }}
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
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: 13,
                      py: 0.9,
                      borderRadius: 0,
                      bgcolor: approveBlocked ? alpha(colors.success, 0.16) : colors.success,
                      color: approveBlocked ? colors.success : "#fff",
                      border: `2px solid ${colors.success}`,
                      "&:hover": {
                        bgcolor: approveBlocked ? alpha(colors.success, 0.24) : colors.success,
                        filter: "brightness(1.06)",
                      },
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
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 13,
                  py: 0.9,
                  borderRadius: 0,
                  border: `2px solid ${colors.danger}`,
                  color: colors.danger,
                  "&:hover": { bgcolor: alpha(colors.danger, 0.08) },
                }}
              >
                Reject
              </Button>
            </Box>
            <Typography sx={{ fontSize: 12, mt: 1, color: alpha(colors.textPrimary, 0.6) }}>
              {approveBlocked
                ? `Resolve ${openCount} open finding${openCount === 1 ? "" : "s"} first, or override on confirm.`
                : `Releases v${data.latestVersionNo} for execution and locks earlier versions.`}
            </Typography>
          </>
        )}

        {!data.canEdit && !isValidated && (
          <Alert severity="info" icon={false} sx={{ fontSize: 12.5, py: 0.5, borderRadius: 0 }}>
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
        size={46}
        thickness={4}
        sx={{ color: alpha(colors.textPrimary, 0.1) }}
      />
      <CircularProgress
        variant="determinate"
        value={total === 0 ? 0 : pct}
        size={46}
        thickness={4}
        sx={{
          color: done ? colors.success : colors.accent,
          position: "absolute",
          left: 0,
          "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        {done ? (
          <CheckRoundedIcon sx={{ fontSize: 20, color: colors.success }} />
        ) : (
          <Typography
            sx={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: colors.textPrimary }}
          >
            {total === 0 ? "—" : `${pct}%`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

/** One finding card - accent bar, page jump, and its two actions. */
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
  const tone = isOpen ? colors.accent : colors.success;

  return (
    <Box
      onMouseEnter={() => onHover(finding.pageNo)}
      onMouseLeave={() => onHover(null)}
      sx={{
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${tone}`,
        bgcolor: isOpen ? colors.surface : alpha(colors.textPrimary, 0.02),
        p: 1.5,
        transition: "border-color 160ms ease, box-shadow 160ms ease",
        "&:hover": { borderColor: alpha(tone, 0.6), boxShadow: colors.shadowCard },
      }}
    >
      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
        <Box
          sx={{
            fontWeight: 800,
            fontSize: 11,
            fontVariantNumeric: "tabular-nums",
            px: 0.75,
            py: 0.2,
            bgcolor: alpha(tone, 0.14),
            color: tone,
          }}
        >
          {finding.findingRef}
        </Box>
        {finding.stepRef && (
          <Typography sx={{ fontSize: 11.5, color: colors.textDim }}>step {finding.stepRef}</Typography>
        )}
        {!isOpen && (
          <CheckCircleRoundedIcon sx={{ fontSize: 15, color: colors.success, ml: 0.25 }} />
        )}
        {finding.pageNo != null && (
          <Tooltip arrow title={`Go to page ${finding.pageNo}`}>
            <Button
              size="small"
              onClick={() => onGoToPage(finding.pageNo as number)}
              sx={{
                ml: "auto",
                minWidth: 0,
                px: 0.75,
                py: 0.2,
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 0,
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
              }}
            >
              p.{finding.pageNo}
            </Button>
          </Tooltip>
        )}
      </Box>

      <Typography
        sx={{
          fontSize: 13.5,
          lineHeight: 1.5,
          mt: 1,
          color: colors.textPrimary,
          textDecoration: isOpen ? "none" : "line-through",
          opacity: isOpen ? 1 : 0.65,
        }}
      >
        {finding.description}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
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
                  sx={{ color: isOpen ? colors.success : colors.textSecondary }}
                >
                  {isOpen ? (
                    <CheckRoundedIcon sx={{ fontSize: 17 }} />
                  ) : (
                    <RestartAltRoundedIcon sx={{ fontSize: 17 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip arrow title="Remove finding">
              <span>
                <IconButton
                  size="small"
                  disabled={busy}
                  onClick={() => onWithdraw(finding)}
                  sx={{ color: colors.textSecondary, "&:hover": { color: colors.danger } }}
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
}> = ({ version, colors, active, onOpen }) => {
  const tone = versionTone(version.status, colors);

  return (
    <Box
      onClick={() => onOpen(version.versionId)}
      sx={{
        display: "grid",
        gridTemplateColumns: "40px 1fr auto",
        gap: 1,
        alignItems: "start",
        p: 1.25,
        mb: 0.5,
        cursor: "pointer",
        border: `1px solid ${active ? alpha(colors.accent, 0.5) : colors.border}`,
        bgcolor: active ? alpha(colors.accent, 0.07) : "transparent",
        transition: "background-color 150ms ease, border-color 150ms ease",
        "&:hover": { bgcolor: alpha(colors.textPrimary, 0.05) },
      }}
    >
      <Box
        sx={{
          fontWeight: 800,
          fontSize: 13,
          fontVariantNumeric: "tabular-nums",
          color: active ? colors.accent : alpha(colors.textPrimary, 0.6),
        }}
      >
        v{version.versionNo}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, color: colors.textPrimary }}>
          {version.uploadedBy ?? "Unknown"} ·{" "}
          <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {shortStamp(version.uploadedAt)}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: alpha(colors.textPrimary, 0.62) }}>
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
      <Box
        sx={{
          fontSize: 10.5,
          fontWeight: 700,
          px: 0.75,
          py: 0.25,
          border: `1px solid ${tone}`,
          color: tone,
          whiteSpace: "nowrap",
        }}
      >
        {MOP_VERSION_STATUS_LABEL[version.status] ?? version.status}
      </Box>
    </Box>
  );
};

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
            width: 22,
            height: 22,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${alpha(tone, 0.5)}`,
            bgcolor: alpha(tone, 0.12),
            flex: "none",
          }}
        >
          <Icon sx={{ fontSize: 13, color: tone }} />
        </Box>
        {!isLast && <Box sx={{ width: "1px", flex: 1, bgcolor: colors.border, minHeight: 12 }} />}
      </Box>
      <Box sx={{ pb: 1.5, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 11.5, fontVariantNumeric: "tabular-nums", color: alpha(colors.textPrimary, 0.55) }}
        >
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
