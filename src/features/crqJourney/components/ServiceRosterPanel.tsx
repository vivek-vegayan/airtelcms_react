import React, { useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Link,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import KeyboardDoubleArrowUpRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowUpRounded";
import type { CrqJourneyScope, PendingApprovalView, ServiceRosterRow } from "../types/crqJourney.types";
import type { ServiceRosterSummary } from "../utils/crqJourney.utils";
import {
  approverInitials,
  approverLabel,
  approverLevelLabel,
  getApprovalStatusConfig,
  telHref,
} from "../utils/crqJourney.utils";

// ─────────────────────────────────────────────────────────────────────────────
//  "Who owns this service, and who is holding it up" — result sets 2 and 3 of
//  sp_get_crq_journey_page, merged into one line per CAB service.
//
//  The flow canvas already shows WHICH services are pending; a ~90px card has
//  no room to say who decides them, let alone who to ring about one. Those are
//  the two things a CAB manager looking at a stalled CRQ actually needs, so
//  they get a panel rather than a tooltip: an OLM ID has to be readable and
//  copyable, and a phone number has to be dialable.
//
//  Before 2026-09-08 the procedure only reported the PENDING services, so this
//  panel could only ever list those. The SPOC result set added that day covers
//  every service on the CRQ, decided or not, which is what lets this show the
//  full roster — open work first, then the decided ones, dimmed. Since
//  2026-09-09 the approval set carries each service's own Status too, so the
//  roster no longer has to infer a decision from the journey rows.
//
//  That same revision turned the single approver into an L1 → L2 → L3 ladder
//  with one live rung. Only the live rung's person is named in the cell — they
//  are who to chase — with the rung itself as a chip beside them and the full
//  path in the tooltip: an escalation that has run out of configured rungs is a
//  CRQ nobody is going to approve, and it should be visible before the timer is.
//
//  Columns are exactly what the procedure gives, with the service code resolved
//  to its display name upstream. There is still no circle, domain or email
//  here, because the procedure does not return them and it is not being changed.
//
//  Two renderings of the same rows, matching how CrqFlowCanvas / CrqFlowStacked
//  already split at `md`: a scannable table on desktop, stacked cards below it.
//
//  Sits BELOW the flow canvas. The canvas auto-fits into whatever viewport
//  height is left under its own top edge, so it has to be told to leave room —
//  hence `serviceRosterReserve` below and the panel's `open` state living in the
//  page rather than in here.
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceRosterPanelProps {
  roster: ServiceRosterSummary;
  /** Result set 4 — shown as scope chips in the header; omitted when the proc returned none. */
  scope?: CrqJourneyScope | null;
  /** Controlled: the page owns this so it can reserve the matching canvas height. */
  open: boolean;
  onToggle: () => void;
}

// ─── Height budget, shared with the canvas above ─────────────────────────────
//
// The canvas needs to know how tall this panel will be BEFORE either is laid
// out, so these are the real numbers from the sx below rather than a measured
// height — a measured one would oscillate (see CrqFlowCanvas.bottomReserve).
// Keep them in step with the styles they describe; being a few px out only
// costs a few px of diagram, never correctness.
const HEADER_H = 40; // py 0.85 + a 24px icon + bottom border
const NOTE_H = 50; // the "nothing pending" / "no services" StatusNote
const TABLE_HEAD_H = 26; // sticky column-heading row + its border
const TABLE_ROW_H = 48; // py 0.85 + the tallest two-line cell (approver / SPOC)
/** Cap on the scrollable body, so a CRQ with many services can't crowd out the diagram. */
const BODY_MAX_MD = 224;
const BODY_MAX_XS = 320;
/** The page column's flex gap between the canvas and this panel. */
const STACK_GAP = 8;

/**
 * Vertical space the panel is about to occupy, for CrqFlowCanvas's
 * `bottomReserve`. Pure function of the data and the open flag — no DOM read,
 * so it cannot feed back into the scale it influences.
 */
export const serviceRosterReserve = (roster: ServiceRosterSummary, open: boolean): number => {
  // Nothing was reported at all — the panel renders nothing, so it costs nothing.
  if (!roster.rows.length && !roster.empty && !roster.allDecided) return 0;
  if (!open) return HEADER_H + STACK_GAP;
  if (!roster.rows.length) return HEADER_H + NOTE_H + STACK_GAP;

  const body = Math.min(BODY_MAX_MD, TABLE_HEAD_H + roster.rows.length * TABLE_ROW_H);
  return HEADER_H + body + STACK_GAP;
};

/**
 * Pending services first, then the decided ones, each group keeping the order
 * the procedure gave it (the service master's Sort_Order). Open work is what
 * the panel exists to surface; a decided service is reference material.
 */
const sortRoster = (rows: ServiceRosterRow[]): ServiceRosterRow[] =>
  rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const openA = a.row.status === "pending" ? 0 : 1;
      const openB = b.row.status === "pending" ? 0 : 1;
      // An escalated approval is the oldest open work on the page, so it leads.
      const escA = a.row.approver?.escalated ? 0 : 1;
      const escB = b.row.approver?.escalated ? 0 : 1;
      return openA - openB || escA - escB || a.index - b.index;
    })
    .map((entry) => entry.row);

// ─── Copy-to-clipboard monospace value (OLM ID, phone number) ────────────────
const CopyableValue: React.FC<{ value: string; label: string; href?: string | null }> = ({
  value,
  label,
  href,
}) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => undefined
    );
  };

  const chipSx = {
    fontFamily: "Roboto Mono, monospace",
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.2px",
    color: "text.secondary",
    background: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.09 : 0.05),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "5px",
    px: "5px",
    py: "1px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textDecoration: "none",
    display: "inline-block",
    maxWidth: "100%",
  } as const;

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, minWidth: 0, maxWidth: "100%" }}>
      {href ? (
        // A dialable contact is worth one tap on a phone; the digits stay
        // selectable either way.
        <Tooltip title={`Call ${value}`} arrow enterDelay={500}>
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            sx={{ ...chipSx, color: theme.palette.primary.main, "&:hover": { textDecoration: "none" } }}
          >
            {value}
          </Link>
        </Tooltip>
      ) : (
        <Box component="span" sx={chipSx}>
          {value}
        </Box>
      )}
      <Tooltip title={copied ? "Copied" : `Copy ${label}`} arrow>
        <IconButton size="small" onClick={handleCopy} sx={{ p: "2px", color: "text.disabled" }}>
          {copied ? (
            <CheckRoundedIcon sx={{ fontSize: 12, color: theme.palette.success.main }} />
          ) : (
            <ContentCopyRoundedIcon sx={{ fontSize: 11 }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

/**
 * The whole L1 → L2 → L3 ladder as one tooltip, with the live rung marked.
 *
 * The cell itself only has room for the person who owes the decision NOW, but
 * "who is next if this stalls again" is the other half of an escalation, and a
 * rung nobody is configured on is exactly the gap worth knowing about before
 * the timer runs out. Both live here rather than costing a third line.
 */
const ChainTooltip: React.FC<{ approver: PendingApprovalView }> = ({ approver }) => (
  <>
    Escalation path
    {approver.chain.map((rung) => (
      <React.Fragment key={rung.level}>
        <br />
        {rung.current ? "▸ " : "  "}
        {approverLevelLabel(rung)}
        {rung.current ? " — with them now" : ""}
      </React.Fragment>
    ))}
  </>
);

/** Which rung of the ladder the approval is sitting on; amber once it has escalated. */
const LevelChip: React.FC<{ approver: PendingApprovalView; muted: boolean }> = ({
  approver,
  muted,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const color = muted
    ? theme.palette.text.disabled
    : approver.escalated
      ? theme.palette.warning.main
      : theme.palette.text.secondary;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "1px",
        flexShrink: 0,
        height: 15,
        px: "4px",
        borderRadius: "4px",
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: "0.3px",
        lineHeight: 1,
        color,
        background: alpha(color, isDark ? 0.18 : 0.1),
      }}
    >
      {approver.escalated && <KeyboardDoubleArrowUpRoundedIcon sx={{ fontSize: 11 }} />}
      {approver.currentLevel}
    </Box>
  );
};

// ─── Approver identity (avatar + live rung + name + OLM ID) ──────────────────
const ApproverIdentity: React.FC<{ row: ServiceRosterRow }> = ({ row }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { approver } = row;

  // A service the approval set never listed. Nothing is known about who decides
  // it, so it says nothing rather than guessing.
  if (!approver) {
    return (
      <Typography sx={{ fontSize: 11.5, color: "text.disabled", lineHeight: 1.3 }}>
        {row.status ? "Decision recorded" : "—"}
      </Typography>
    );
  }

  // A decided service owes nobody a decision. Its ladder is still shown — it is
  // the record of who signed off — but muted, and never flagged as a config gap:
  // "no approver configured" beside an Approved badge reads as a contradiction,
  // and chasing an approver for a closed decision is wasted effort.
  const isPending = row.status === "pending";
  const isGap = isPending && !approver.configured;

  const seedColor = isGap
    ? theme.palette.warning.main
    : isPending
      ? theme.palette.primary.main
      : theme.palette.text.disabled;

  return (
    <Tooltip title={<ChainTooltip approver={approver} />} arrow enterDelay={400}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.3px",
            color: seedColor,
            background: alpha(seedColor, isDark ? 0.2 : 0.11),
            border: `1px solid ${alpha(seedColor, 0.3)}`,
          }}
        >
          {approver.configured ? (
            approverInitials(approver)
          ) : (
            <PersonOffRoundedIcon sx={{ fontSize: 14 }} />
          )}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          {approver.configured ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: isPending ? "text.primary" : "text.secondary",
                    lineHeight: 1.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {approverLabel(approver)}
                </Typography>
                <LevelChip approver={approver} muted={!isPending} />
              </Box>
              {approver.approverOlmId && (
                <CopyableValue value={approver.approverOlmId} label="OLM ID" />
              )}
            </>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: isGap ? theme.palette.warning.main : "text.disabled",
                    lineHeight: 1.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  No approver configured
                </Typography>
                <LevelChip approver={approver} muted={!isPending} />
              </Box>
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "text.disabled",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {/* L1 is the approval config; L2/L3 are the escalation config. Naming the
                    right table is the difference between a fixable gap and a wild goose
                    chase. Kept to one line so the row stays the height the canvas above
                    budgeted for it (see TABLE_ROW_H). */}
                {approver.currentLevel} missing from{" "}
                {approver.currentLevel === "L1" ? "approval" : "escalation"} config
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Tooltip>
  );
};

// ─── SPOC identity (recorded owner + dialable contact) ───────────────────────
const SpocIdentity: React.FC<{ row: ServiceRosterRow }> = ({ row }) => {
  const theme = useTheme();

  // An empty SPOC is not an error: Spoc_Name / Spoc_Contact are optional columns
  // that stay null until somebody records a contact. It reads as "not recorded",
  // never as a warning — unlike a missing approver, which really is a config gap.
  if (!row.spocs.length) {
    return (
      <Typography sx={{ fontSize: 11.5, color: "text.disabled", lineHeight: 1.3 }}>
        Not recorded
      </Typography>
    );
  }

  const [primary, ...rest] = row.spocs;
  const href = telHref(primary.contact);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Box
        sx={{
          width: 26,
          height: 26,
          flexShrink: 0,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.info.main,
          background: alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.18 : 0.1),
        }}
      >
        <SupportAgentRoundedIcon sx={{ fontSize: 15 }} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
          <Tooltip title={primary.name ?? "Contact recorded without a name"} arrow enterDelay={500}>
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 600,
                color: primary.name ? "text.primary" : "text.secondary",
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {primary.name ?? "Unnamed contact"}
            </Typography>
          </Tooltip>

          {/* More than one distinct contact on the same service is rare but real
              — one CRQ_CAB_SERVICE_TBL row per circle. Don't hide the others. */}
          {rest.length > 0 && (
            <Tooltip
              arrow
              title={rest
                .map((s) => [s.name, s.contact].filter(Boolean).join(" · ") || "Unnamed contact")
                .join("\n")}
            >
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 700,
                  color: theme.palette.info.main,
                  background: alpha(theme.palette.info.main, 0.12),
                  borderRadius: "999px",
                  px: "5px",
                }}
              >
                +{rest.length}
              </Box>
            </Tooltip>
          )}
        </Box>

        {primary.contact ? (
          <CopyableValue value={primary.contact} label="contact" href={href} />
        ) : (
          <Typography sx={{ fontSize: 10.5, color: "text.disabled", lineHeight: 1.3 }}>
            No contact number
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ─── Service identity (proper name + raw code) ───────────────────────────────
const ServiceIdentity: React.FC<{ row: ServiceRosterRow; spocSetMissing: boolean }> = ({
  row,
  spocSetMissing,
}) => {
  const theme = useTheme();
  // The code chip earns its place only when it says something the name doesn't.
  // The current service master spells every name exactly like its code, so on
  // live data this is usually false — and an unresolved code is already showing
  // as the label itself.
  const showCode = row.nameResolved && row.serviceName.toUpperCase() !== row.serviceCode.toUpperCase();

  return (
    <Box sx={{ minWidth: 0 }}>
      <Tooltip
        title={
          row.nameResolved
            ? row.serviceName
            : `Service code ${row.serviceCode} — no name on record`
        }
        arrow
        enterDelay={500}
      >
        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.serviceName}
        </Typography>
      </Tooltip>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: "2px", minWidth: 0 }}>
        {showCode && (
          <Box
            component="span"
            sx={{
              fontFamily: "Roboto Mono, monospace",
              fontSize: 10,
              fontWeight: 600,
              color: theme.palette.primary.main,
              background: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.09),
              borderRadius: "5px",
              px: "5px",
              py: "1px",
            }}
          >
            {row.serviceCode}
          </Box>
        )}

        {/* A service missing from a SPOC set that WAS reported is one whose code
            has left CRQ_CAB_SERVICE_MASTER: it is genuinely open work, but the
            procedure can tell us nothing else about it, so say so instead of
            showing three unexplained empty cells. When no SPOC set came back at
            all the row proves nothing about the master, so it stays quiet. */}
        {!row.inSpocSet && !spocSetMissing && (
          <Tooltip
            arrow
            title={`${row.serviceCode} is not in the current service master, so no SPOC or decision detail is returned for it`}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "text.disabled" }}>
              not in master
            </Typography>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

/** Decision state — the same three hues the approval cards in the canvas use. */
const StatusPill: React.FC<{ row: ServiceRosterRow }> = ({ row }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!row.status) {
    return <Typography sx={{ fontSize: 11.5, color: "text.disabled" }}>Unknown</Typography>;
  }

  const cfg = getApprovalStatusConfig(isDark)[row.status];

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        px: "8px",
        borderRadius: "999px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: cfg.color,
        background: cfg.iconBg,
        border: `1px solid ${cfg.borderColor}`,
      }}
    >
      {cfg.label}
    </Box>
  );
};

/** How many pending CRQ_CAB_SERVICE_TBL rows this one line stands for. */
const PendingCountBadge: React.FC<{ count: number }> = ({ count }) => {
  const theme = useTheme();

  if (count === 0) return <Typography sx={{ fontSize: 11.5, color: "text.disabled" }}>—</Typography>;

  return (
    <Tooltip
      title={count > 1 ? `${count} pending rows for this service` : "1 pending row"}
      arrow
      enterDelay={400}
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 22,
          height: 20,
          px: "6px",
          borderRadius: "999px",
          fontSize: 11,
          fontWeight: 700,
          color: theme.palette.warning.main,
          background: alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.2 : 0.11),
        }}
      >
        {count}
      </Box>
    </Tooltip>
  );
};

// ─── Resolved / empty states ─────────────────────────────────────────────────
const StatusNote: React.FC<{
  icon: React.ElementType;
  color: string;
  title: string;
  subtitle: string;
}> = ({ icon: Icon, color, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: { xs: 1.5, md: 2 }, py: 1.25 }}>
    <Box
      sx={{
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: "9px",
        background: alpha(color, 0.12),
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon sx={{ fontSize: 17 }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: "text.secondary", lineHeight: 1.35 }}>
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

// ─── Header chips ────────────────────────────────────────────────────────────
const ScopeChip: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        height: 21,
        px: "7px",
        borderRadius: "999px",
        border: `1px solid ${theme.palette.divider}`,
        color: "text.secondary",
        maxWidth: 180,
        minWidth: 0,
      }}
    >
      <Icon sx={{ fontSize: 12, flexShrink: 0 }} />
      <Typography
        sx={{
          fontSize: 10.5,
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

const GRID_TEMPLATE = "minmax(120px, 1.2fr) 86px 48px minmax(150px, 1.5fr) minmax(140px, 1.4fr)";
const COLUMN_HEADS = ["Service", "Status", "Open", "Current Approver (OLM ID)", "SPOC"];

export const ServiceRosterPanel: React.FC<ServiceRosterPanelProps> = ({
  roster,
  scope,
  open,
  onToggle,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isCompact = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });

  const { rows, pendingServices, totalPending, unconfigured, escalated, withSpoc, empty, allDecided } =
    roster;

  // An older database, or a call that returned only the journey rows: nothing to
  // show and no gap to report, so the panel stays out of the layout entirely.
  if (!rows.length && !empty && !allDecided) return null;

  const accent = pendingServices > 0 ? theme.palette.warning.main : theme.palette.success.main;

  const headline =
    pendingServices > 0
      ? `${pendingServices} of ${rows.length} service${rows.length === 1 ? "" : "s"} awaiting approval`
      : rows.length
        ? "All service approvals decided"
        : empty
          ? "No CAB services linked"
          : "All service approvals decided";

  const sorted = sortRoster(rows);

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 3px rgba(16,40,70,0.05)",
        overflow: "hidden",
      }}
    >
      {/* ── header: always one compact row, so a collapsed panel costs ~40px ── */}
      <Box
        onClick={onToggle}
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 0.85,
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, md: 1.25 },
          flexWrap: "wrap",
          cursor: "pointer",
          userSelect: "none",
          background: alpha(accent, isDark ? 0.1 : 0.05),
          borderBottom: open ? `1px solid ${theme.palette.divider}` : "none",
          transition: "background 0.2s ease",
          "&:hover": { background: alpha(accent, isDark ? 0.15 : 0.08) },
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: "8px",
            background: alpha(accent, isDark ? 0.22 : 0.13),
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HowToRegRoundedIcon sx={{ fontSize: 14 }} />
        </Box>

        <Typography
          sx={{
            fontSize: { xs: 12.5, md: 13.5 },
            fontWeight: 700,
            color: "text.primary",
            lineHeight: 1.3,
          }}
        >
          Service Approvals &amp; SPOC
        </Typography>

        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            height: 21,
            px: "8px",
            borderRadius: "999px",
            fontSize: 11,
            fontWeight: 700,
            color: accent,
            background: theme.palette.background.paper,
            border: `1px solid ${alpha(accent, 0.3)}`,
            whiteSpace: "nowrap",
          }}
        >
          {headline}
        </Box>

        {totalPending > pendingServices && (
          <Typography sx={{ fontSize: 11, color: "text.secondary", whiteSpace: "nowrap" }}>
            {totalPending} open rows
          </Typography>
        )}

        {/* SPOC coverage, so the gap is visible without expanding the panel. */}
        {rows.length > 0 && (
          <Tooltip
            arrow
            title={
              withSpoc === rows.length
                ? "Every service has a SPOC recorded"
                : `${rows.length - withSpoc} service${rows.length - withSpoc === 1 ? "" : "s"} have no SPOC recorded on CRQ_CAB_SERVICE_TBL`
            }
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: withSpoc === rows.length ? "text.secondary" : theme.palette.info.main,
              }}
            >
              <SupportAgentRoundedIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {withSpoc}/{rows.length} SPOC
              </Typography>
            </Box>
          </Tooltip>
        )}

        {escalated > 0 && (
          <Tooltip
            arrow
            title={`Escalated past the first approver: ${sorted
              .filter((r) => r.status === "pending" && r.approver?.escalated)
              .map((r) => `${r.serviceName} (now ${r.approver?.currentLevel})`)
              .join(", ")}`}
          >
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: theme.palette.warning.main }}
            >
              <KeyboardDoubleArrowUpRoundedIcon sx={{ fontSize: 15 }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {escalated} escalated
              </Typography>
            </Box>
          </Tooltip>
        )}

        {unconfigured > 0 && (
          <Tooltip
            arrow
            title={`Nobody is configured on the current escalation level for: ${sorted
              .filter((r) => r.status === "pending" && r.approver && !r.approver.configured)
              .map((r) => `${r.serviceName} (${r.approver?.currentLevel})`)
              .join(", ")}`}
          >
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: theme.palette.warning.main }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {unconfigured} unassigned
              </Typography>
            </Box>
          </Tooltip>
        )}

        <Box
          sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", minWidth: 0 }}
        >
          {scope?.domainName && <ScopeChip icon={PublicRoundedIcon} label={scope.domainName} />}
          {scope?.subDomainName && <ScopeChip icon={LayersRoundedIcon} label={scope.subDomainName} />}
          <ExpandMoreRoundedIcon
            sx={{
              fontSize: 19,
              color: "text.secondary",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        {!rows.length && empty && (
          <StatusNote
            icon={InfoOutlinedIcon}
            color={theme.palette.info.main}
            title="No CAB services linked"
            subtitle="No service is linked to this CRQ, so no service approval is required."
          />
        )}

        {!rows.length && !empty && (
          <StatusNote
            icon={CheckCircleRoundedIcon}
            color={theme.palette.success.main}
            title="Nothing is waiting on an approver"
            subtitle="Every CAB service linked to this CRQ has already been approved or rejected."
          />
        )}

        {rows.length > 0 && (
          // Capped so a CRQ with many services scrolls inside the panel instead
          // of squeezing the auto-fitting flow canvas above it.
          <Box sx={{ maxHeight: { xs: BODY_MAX_XS, md: BODY_MAX_MD }, overflowY: "auto" }}>
            {isCompact ? (
              /* ── stacked cards: five columns would be ~70px each below md ── */
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1.5 }}>
                {sorted.map((row) => (
                  <Box
                    key={`${row.serviceCode}-${row.status ?? "unknown"}-${row.approver?.currentLevel ?? "L1"}-${row.approver?.approverOlmId ?? "none"}`}
                    sx={{
                      border: `1px solid ${
                        row.status === "pending" && row.approver && !row.approver.configured
                          ? alpha(theme.palette.warning.main, 0.4)
                          : theme.palette.divider
                      }`,
                      borderRadius: "10px",
                      p: 1.25,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      minWidth: 0,
                      opacity: row.status === "pending" ? 1 : 0.85,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, minWidth: 0 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <ServiceIdentity row={row} spocSetMissing={roster.spocSetMissing} />
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                        <StatusPill row={row} />
                        {row.pendingCount > 0 && <PendingCountBadge count={row.pendingCount} />}
                      </Box>
                    </Box>

                    <Box sx={{ pt: 1, borderTop: `1px dashed ${theme.palette.divider}`, minWidth: 0 }}>
                      <ApproverIdentity row={row} />
                    </Box>

                    <Box sx={{ pt: 1, borderTop: `1px dashed ${theme.palette.divider}`, minWidth: 0 }}>
                      <SpocIdentity row={row} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              /* ── desktop table ── */
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: GRID_TEMPLATE,
                    gap: 1.5,
                    px: 2,
                    py: 0.75,
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    background: theme.palette.background.paper,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {COLUMN_HEADS.map((h) => (
                    <Typography
                      key={h}
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        color: "text.disabled",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </Typography>
                  ))}
                </Box>

                {sorted.map((row, idx) => (
                  <Box
                    key={`${row.serviceCode}-${row.status ?? "unknown"}-${row.approver?.currentLevel ?? "L1"}-${row.approver?.approverOlmId ?? "none"}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: GRID_TEMPLATE,
                      gap: 1.5,
                      alignItems: "center",
                      px: 2,
                      py: 0.85,
                      borderBottom: idx === sorted.length - 1 ? "none" : `1px solid ${theme.palette.divider}`,
                      // A missing approver is the one row a reader must not skim
                      // past, so it carries its own left edge. A decided service
                      // is reference material and steps back instead.
                      borderLeft:
                        row.status === "pending" && row.approver && !row.approver.configured
                          ? `3px solid ${theme.palette.warning.main}`
                          : "3px solid transparent",
                      opacity: row.status === "pending" ? 1 : 0.85,
                      transition: "background 0.15s ease",
                      "&:hover": { background: alpha(theme.palette.text.primary, isDark ? 0.04 : 0.02) },
                    }}
                  >
                    <ServiceIdentity row={row} spocSetMissing={roster.spocSetMissing} />
                    <StatusPill row={row} />
                    <PendingCountBadge count={row.pendingCount} />
                    <ApproverIdentity row={row} />
                    <SpocIdentity row={row} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Collapse>
    </Box>
  );
};
