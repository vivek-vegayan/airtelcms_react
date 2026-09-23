import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { useTabColorTokens } from "../../../../style/theme";
import { useGetOrgHierarchyByUserQuery } from "../../../orgHierarchy/api/orgHierarchy.api";
import { crqStatusPalette, WORKFLOW_STAGES } from "../../constants/workflowStages";
import {
  useLazySearchCrqGloballyQuery,
  type CrqGlobalSearchHit,
} from "../../api/crqGlobalSearchApiSlice";
import { resolveCrqRoute, resolveStageIndexFromEnum } from "../../util/crqStageRouting";
import type { OrgFilterValues } from "../../../orgHierarchy/types/orgHierarchy.types";

export interface GlobalCrqSearchResolved {
  hit: CrqGlobalSearchHit;
  /** 0-based index of the workflow step to switch to. */
  stepIndex: number;
  stageLabel: string;
  /** Filter-bar values targeting the CRQ's own org scope. */
  filters: OrgFilterValues;
}

interface GlobalCrqSearchProps {
  /**
   * Called once a hit has been fully resolved to a stage + org scope. The
   * parent performs the actual navigation (filter retarget + step change) -
   * this component never routes on its own.
   */
  onResolved: (resolved: GlobalCrqSearchResolved) => void;
}

/** How many hits the dropdown will show. */
const RESULT_LIMIT = 8;
/** Matches the debounce used by the cockpit's own CRQ list search. */
const DEBOUNCE_MS = 300;
/** Below this, a partial CRQ number matches too much to be useful. */
const MIN_QUERY_LENGTH = 3;
/** Matches OrgFilterSelect's control height so the row lines up exactly. */
const FIELD_HEIGHT = 32;
/** Resting width; grows on focus so long CRQ numbers stay readable. */
const FIELD_WIDTH = 260;
const FIELD_WIDTH_FOCUSED = 380;
/** The dropdown needs more room than the collapsed field. */
const PANEL_WIDTH = 400;
/** How long the "jumped to" confirmation chip stays up. */
const CONFIRM_MS = 5000;

/**
 * Global CRQ Search for the CRQ Workflow.
 *
 * Type a CRQ number, and the CRQ is located across *every* domain and
 * sub-domain (the rest of the workflow only ever sees the scope currently
 * chosen in the filter bar). The stage it is really in - read from
 * CRQ_MASTER_TBL.current_stage via GET /crqworkflow/search - decides which of
 * the existing 7 steps opens; nothing about the destination is assumed.
 *
 * This component only *reports* a resolved destination via `onResolved`. It
 * performs no navigation and touches no workflow state, so the existing
 * workflow behaves exactly as before when the search is not used.
 */
export const GlobalCrqSearch: React.FC<GlobalCrqSearchProps> = ({ onResolved }) => {
  const theme = useTheme();
  const c = useTabColorTokens(theme);

  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  /** Set when a hit was found but could not be routed (see crqStageRouting). */
  const [routeError, setRouteError] = useState<string | null>(null);
  /**
   * Last successful jump, shown as a compact chip beside the field so a stage
   * switch never looks unexplained. Self-clearing, and rendered inside this
   * row, so confirming the jump costs no extra vertical space.
   */
  const [confirmed, setConfirmed] = useState<GlobalCrqSearchResolved | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: orgData } = useGetOrgHierarchyByUserQuery();
  const [runSearch, { data: hits, isFetching, isError, error }] =
    useLazySearchCrqGloballyQuery();

  const results = useMemo(() => hits ?? [], [hits]);
  const query = input.trim();
  const tooShort = query.length > 0 && query.length < MIN_QUERY_LENGTH;

  // Debounced fetch - same 300ms the cockpit's CRQ list search uses.
  useEffect(() => {
    const next = input.trim();
    if (next.length < MIN_QUERY_LENGTH) {
      setTerm("");
      return;
    }
    const t = setTimeout(() => setTerm(next), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (!term) return;
    runSearch({ crqNo: term, limit: RESULT_LIMIT });
    setOpen(true);
  }, [term, runSearch]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Keep the highlighted row in view during keyboard navigation.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (hit: CrqGlobalSearchHit) => {
      const route = resolveCrqRoute(hit, orgData?.data);
      if (!route.ok) {
        // Every unroutable case is reported rather than silently falling back
        // to step 1, which would misrepresent the CRQ's real stage.
        setRouteError(route.message);
        return;
      }
      setRouteError(null);
      setOpen(false);
      setInput("");
      setTerm("");
      const resolved: GlobalCrqSearchResolved = {
        hit,
        stepIndex: route.stepIndex,
        stageLabel: route.stageLabel,
        filters: route.filters,
      };
      setConfirmed(resolved);
      onResolved(resolved);
    },
    [orgData, onResolved],
  );

  // Auto-dismiss the confirmation chip so it can't linger over later work.
  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => setConfirmed(null), CONFIRM_MS);
    return () => clearTimeout(t);
  }, [confirmed]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || !results.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[activeIndex];
      if (hit) handleSelect(hit);
    }
  };

  const clear = () => {
    setInput("");
    setTerm("");
    setRouteError(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown =
    open && query.length >= MIN_QUERY_LENGTH && (isFetching || isError || results.length >= 0);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      {/* One compact row: confirmation chip + search field. Everything
          transient (hint, routing error, results) is overlaid rather than
          stacked, so this never grows past the filter bar's own height. */}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ position: "relative" }}>
        {/* ── "Jumped to" confirmation, inline ────────────────────────── */}
        {confirmed && (
          <Tooltip
            title={`Opened ${confirmed.hit.crqNo} at ${confirmed.stageLabel}${
              confirmed.hit.domainName
                ? ` — ${confirmed.hit.domainName}${
                    confirmed.hit.subDomainName ? ` / ${confirmed.hit.subDomainName}` : ""
                  }`
                : ""
            }`}
          >
            <Chip
              size="small"
              icon={<CheckCircleRoundedIcon sx={{ fontSize: 13 }} />}
              label={confirmed.stageLabel}
              onDelete={() => setConfirmed(null)}
              deleteIcon={<CloseRoundedIcon sx={{ fontSize: 13 }} />}
              sx={{
                height: 22,
                maxWidth: 190,
                fontSize: 10.5,
                fontWeight: 600,
                bgcolor: c.successDim,
                color: c.success,
                border: `1px solid ${c.successBorder}`,
                "& .MuiChip-icon": { color: c.success, ml: 0.5 },
                "& .MuiChip-deleteIcon": { color: c.success, opacity: 0.7 },
                "& .MuiChip-label": { px: 0.6 },
              }}
            />
          </Tooltip>
        )}

        {/* ── Search field ────────────────────────────────────────────── */}
        <Box sx={{ position: "relative" }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              height: FIELD_HEIGHT,
              width: open ? FIELD_WIDTH_FOCUSED : FIELD_WIDTH,
              maxWidth: "100%",
              px: 1,
              borderRadius: c.radius,
              border: `1px solid ${open ? c.accentBorder : c.border}`,
              bgcolor: c.surface,
              transition: "width .18s ease, border-color .18s",
              "&:hover": { borderColor: c.borderHover },
            }}
          >
            <TravelExploreRoundedIcon
              sx={{ fontSize: 16, color: open ? c.accent : c.textDim, flexShrink: 0 }}
            />
            <InputBase
              inputRef={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setRouteError(null);
              }}
              onFocus={() => query.length >= MIN_QUERY_LENGTH && setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Global CRQ search"
              title="Search any CRQ number across all domains and jump to its current stage"
              inputProps={{ "aria-label": "Global CRQ search" }}
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: "0.8rem",
                color: c.textPrimary,
                "& input::placeholder": { color: c.textDim, opacity: 1 },
              }}
            />
            {isFetching && (
              <CircularProgress size={12} sx={{ color: c.accent, flexShrink: 0 }} />
            )}
            {!!input && !isFetching && (
              <IconButton
                size="small"
                onClick={clear}
                aria-label="Clear CRQ search"
                sx={{ p: 0.25, color: c.textDim, flexShrink: 0 }}
              >
                <CloseRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Stack>

          {/* ── Hint / routing error - overlaid, not stacked ───────────── */}
          {(routeError || tooShort) && (
            <Box
              sx={{
                position: "absolute",
                zIndex: 1300,
                top: "calc(100% + 4px)",
                right: 0,
                width: PANEL_WIDTH,
                maxWidth: "90vw",
                px: 1.25,
                py: 0.75,
                borderRadius: c.radius,
                border: `1px solid ${routeError ? c.warningBorder : c.border}`,
                bgcolor: c.surface,
                boxShadow: c.shadowCard,
              }}
            >
              <Typography
                sx={{ fontSize: 11.5, color: routeError ? c.warning : c.textSecondary }}
              >
                {routeError ?? `Enter at least ${MIN_QUERY_LENGTH} characters of the CRQ number.`}
              </Typography>
            </Box>
          )}

          {/* ── Results dropdown ────────────────────────────────────────── */}
          {showDropdown && (
            <Box
              ref={listRef}
              sx={{
                position: "absolute",
                zIndex: 1300,
                top: "calc(100% + 4px)",
                right: 0,
                width: PANEL_WIDTH,
                maxWidth: "90vw",
                maxHeight: 340,
                overflowY: "auto",
                borderRadius: c.radiusL,
                border: `1px solid ${c.border}`,
                bgcolor: c.surface,
                boxShadow: c.shadowElevated,
              }}
            >
              {isFetching ? (
                <EmptyRow c={c} text="Searching…" />
              ) : isError ? (
                <EmptyRow c={c} tone="danger" text={resolveApiErrorMessage(error)} />
              ) : results.length === 0 ? (
                <EmptyRow c={c} text={`No CRQ found matching "${query}".`} />
              ) : (
                results.map((hit, idx) => (
                  <ResultRow
                    key={hit.crqNo ?? idx}
                    hit={hit}
                    idx={idx}
                    active={idx === activeIndex}
                    c={c}
                    onHover={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(hit)}
                  />
                ))
              )}
            </Box>
          )}
        </Box>
      </Stack>
    </ClickAwayListener>
  );
};

type Tokens = ReturnType<typeof useTabColorTokens>;

/**
 * Turns an RTK Query error into something a user can act on. Falls back to a
 * generic message rather than rendering a raw object.
 */
function resolveApiErrorMessage(error: unknown): string {
  const status = (error as any)?.status;
  if (status === 401 || status === 403) {
    return "You don't have permission to search CRQs.";
  }
  if (status === 404) {
    return "CRQ search is unavailable on this server.";
  }
  const msg = (error as any)?.data?.message;
  return typeof msg === "string" && msg.trim()
    ? msg
    : "CRQ search failed. Please try again.";
}

const EmptyRow: React.FC<{ c: Tokens; text: string; tone?: "danger" }> = ({
  c,
  text,
  tone,
}) => (
  <Box sx={{ px: 2, py: 1.75 }}>
    <Typography sx={{ fontSize: 12.5, color: tone === "danger" ? c.danger : c.textSecondary }}>
      {text}
    </Typography>
  </Box>
);

interface ResultRowProps {
  hit: CrqGlobalSearchHit;
  idx: number;
  active: boolean;
  c: Tokens;
  onHover: () => void;
  onClick: () => void;
}

const ResultRow: React.FC<ResultRowProps> = ({ hit, idx, active, c, onHover, onClick }) => {
  // Stage label comes from the shared 7-stage descriptor list, so the chip
  // always reads exactly as the stepper does. An enum with no page shows the
  // raw value rather than a plausible-looking wrong stage.
  const stageIdx = resolveStageIndexFromEnum(hit.currentStage);
  const stageLabel =
    stageIdx >= 0 ? WORKFLOW_STAGES[stageIdx].label : (hit.currentStage ?? "Unknown stage");
  const routable = stageIdx >= 0;

  const status = crqStatusPalette(hit.currentStatus, c);

  const scope = [hit.domainName, hit.subDomainName].filter(Boolean).join(" / ");

  return (
    <Box
      data-idx={idx}
      onMouseEnter={onHover}
      onClick={onClick}
      sx={{
        px: 1.75,
        py: 1.25,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: active ? c.selectedRow : "transparent",
        borderLeft: `2px solid ${active ? c.selectedBar : "transparent"}`,
        borderBottom: `1px solid ${c.border}`,
        "&:last-of-type": { borderBottom: "none" },
        transition: "background .12s",
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.35 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: c.textPrimary,
              fontFamily: "monospace",
            }}
          >
            {hit.crqNo}
          </Typography>
          {hit.planNumber && (
            <Typography sx={{ fontSize: 11, color: c.textDim }}>· {hit.planNumber}</Typography>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.6} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={stageLabel}
            sx={{
              height: 18,
              fontSize: 10.5,
              fontWeight: 600,
              bgcolor: routable ? c.accentDim : c.trackOff,
              color: routable ? c.accent : c.textSecondary,
              border: `1px solid ${routable ? c.accentBorder : c.border}`,
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
          <Chip
            size="small"
            label={hit.crqStatus || status.label}
            sx={{
              height: 18,
              fontSize: 10.5,
              fontWeight: 600,
              bgcolor: status.bg,
              color: status.fg,
              border: `1px solid ${status.border}`,
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
          {scope && (
            <Typography sx={{ fontSize: 10.5, color: c.textDim }}>{scope}</Typography>
          )}
        </Stack>
      </Box>

      <ArrowForwardRoundedIcon
        sx={{ fontSize: 16, color: active ? c.accent : c.textDim, flexShrink: 0 }}
      />
    </Box>
  );
};

export default GlobalCrqSearch;
