import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Box, CircularProgress, Drawer, IconButton, LinearProgress, Skeleton, Tooltip, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import KeyboardRoundedIcon from "@mui/icons-material/KeyboardRounded";
import { toast } from "react-toastify";
import { EmptyOrErrorState } from "../../crqAnalytics/components/EmptyOrErrorState";
import { useLazyGetP1CrqListQuery } from "../api/crqAnalyticsP1Api";
import { useP1 } from "../hooks/useP1Context";
import type { P1CrqListParams, P1CrqRowDto, P1Drill } from "../types/crqAnalyticsP1.types";
import { exportP1Objects } from "../utils/p1Export";
import { canWriteClipboard, copyShortcut, writeClipboard } from "../utils/p1Clipboard";
import { DAY, fmtN, toSql } from "../utils/p1Format";
import { P1CrqCard, P1CrqCardSkeleton } from "./P1CrqCard";

const PAGE_SIZE = 50;
/** CRQ_AN_SP_LIST caps p_limit at 1000; "download" pages through at that size. */
const BULK_PAGE = 1000;
const BULK_MAX = 20_000;

/** Keys that count "right now": the list subtitle says Now instead of the range. */
const NOW_KEYS = ["OPEN_SIDE", "TEAM_OPEN", "AGE_BAND", "SLOT_LAPSE", "ASSIGNED", "UNASSIGNED"];

const EXPORT_HEADERS: Record<string, string> = {
  crqNo: "CRQ No",
  team: "Team",
  domainName: "Domain",
  circle: "Circle",
  region: "Region",
  shift: "Shift",
  stageLabel: "Stage",
  side: "Side",
  currentStatus: "Current status",
  result: "Result",
  createdAt: "Received",
  ccbDoneAt: "Moved to SE",
  endAt: "Ended",
  ageDays: "Age (days)",
  night: "Booked slot",
  engineerName: "Engineer",
  rescheduleCount: "Reschedules",
  cancelReason: "Cancel / reject reason",
  person: "Person",
  task: "Task",
  taskDoneAt: "Task finished",
  taskHours: "Task hours",
  taskHoldHours: "Task on-hold hours",
};

interface Props {
  drill: P1Drill | null;
  onClose: () => void;
  /** A clicked CRQ opens the scheduler's CRQ Journey page, the same as on CRQ Analytics. */
  onOpenJourney: (crqNo: string) => void;
}

/**
 * Right-hand drawer with the CRQs behind a clicked number (CRQ_AN_SP_LIST, paged). Clicking a
 * CRQ opens its CRQ Journey page.
 */
export function P1DrillDrawer({ drill, onClose, onOpenJourney }: Props) {
  const { f, colors } = useP1();
  const t = colors.tokens;
  const [fetchList] = useLazyGetP1CrqListQuery();

  const [rows, setRows] = useState<P1CrqRowDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  /** On a plain-HTTP page: the CRQ numbers waiting for the user's Ctrl+C (with how many there are). */
  const [pendingCopy, setPendingCopy] = useState<{ text: string; count: number } | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  // Guards against a slow response of an earlier click landing in a newer list.
  const requestId = useRef(0);

  const listParams = useCallback(
    (d: P1Drill, offset: number, limit: number): P1CrqListParams => {
      const from = d.noRange ? f.now - 3650 * DAY : (d.from ?? f.range.lo);
      const to = d.noRange ? f.now + DAY : (d.to ?? f.range.hi);
      return {
        ...f.filterParams,
        ...(d.team != null ? { subDomain: String(d.team) } : {}),
        from: toSql(from),
        to: toSql(to),
        key: d.key,
        value: d.value == null ? "" : String(d.value),
        offset,
        limit,
      };
    },
    [f.filterParams, f.now, f.range.lo, f.range.hi],
  );

  const loadPage = useCallback(
    async (d: P1Drill, offset: number) => {
      const id = ++requestId.current;
      setLoading(true);
      setFailed(null);
      try {
        const res = await fetchList(listParams(d, offset, PAGE_SIZE)).unwrap();
        if (id !== requestId.current) return;
        setRows((prev) => (offset === 0 ? res.rows : [...prev, ...res.rows]));
        setTotal(res.totalRows);
      } catch (err) {
        if (id !== requestId.current) return;
        const message = (err as { data?: { message?: string } })?.data?.message;
        setFailed(message ?? "Couldn't load the CRQ list.");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [fetchList, listParams],
  );

  // A new click starts a fresh list. Only `drill` drives this: the filters cannot change while
  // the drawer is open, and re-running on them would refetch a list the user is reading.
  useEffect(() => {
    setRows([]);
    setTotal(0);
    setPendingCopy(null);
    if (drill) void loadPage(drill, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drill]);

  const fetchAll = async (d: P1Drill): Promise<P1CrqRowDto[]> => {
    const out: P1CrqRowDto[] = [];
    const cap = Math.min(total, BULK_MAX);
    for (let offset = 0; offset < cap; offset += BULK_PAGE) {
      const res = await fetchList(listParams(d, offset, BULK_PAGE)).unwrap();
      out.push(...res.rows);
      if (!res.rows.length) break;
    }
    return out;
  };

  const runBulk = async (action: (all: P1CrqRowDto[]) => Promise<void>) => {
    if (!drill) return;
    setBulkBusy(true);
    try {
      await action(await fetchAll(drill));
      if (total > BULK_MAX) toast.info(`Only the first ${fmtN(BULK_MAX)} CRQs were included.`);
    } catch {
      toast.error("Couldn't fetch the full list.");
    } finally {
      setBulkBusy(false);
    }
  };

  const downloadAll = () => runBulk((all) => exportP1Objects(drill?.title ?? "CRQ list", all, EXPORT_HEADERS));

  /** Every CRQ number of this list, one per line, each once (task lists can repeat a CRQ). */
  const allNumbers = async (d: P1Drill): Promise<{ text: string; count: number }> => {
    const all = rows.length >= total ? rows : await fetchAll(d);
    const numbers = [...new Set(all.map((r) => r.crqNo))];
    return { text: numbers.join("\n"), count: numbers.length };
  };
  const copiedToast = (count: number) => {
    toast.success(`Copied ${fmtN(count)} CRQ number${count === 1 ? "" : "s"}`);
    if (total > BULK_MAX) toast.info(`Only the first ${fmtN(BULK_MAX)} CRQs were included.`);
  };

  // HTTPS / localhost: copy straight away. Plain HTTP (or the browser refused): get the numbers
  // ready and ask for Ctrl+C, which the copy-event handler below fills in.
  const copyAll = async () => {
    if (!drill) return;
    setCopyBusy(true);
    const numbers = allNumbers(drill);
    numbers.catch(() => undefined); // handled below; avoids an "unhandled rejection" warning meanwhile
    try {
      if (canWriteClipboard() && (await writeClipboard(numbers.then((n) => n.text)))) {
        copiedToast((await numbers).count);
        return;
      }
      setPendingCopy(await numbers);
    } catch {
      toast.error("Couldn't fetch the full list.");
    } finally {
      setCopyBusy(false);
    }
  };

  // Ctrl+C while the hint is showing puts the CRQ numbers on the clipboard (standard `copy` event).
  useEffect(() => {
    if (!pendingCopy) return;
    const hint = hintRef.current;
    // Select the hint itself, so every browser treats Ctrl+C as a copy (Safari needs a selection).
    const selection = window.getSelection();
    if (hint && selection) {
      const range = document.createRange();
      range.selectNodeContents(hint);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    const onCopy = (e: ClipboardEvent) => {
      const sel = window.getSelection();
      const ownSelection = !!sel?.toString() && !(hint && sel?.anchorNode && hint.contains(sel.anchorNode));
      if (ownSelection || !e.clipboardData) return; // the user is copying text they selected themselves
      e.clipboardData.setData("text/plain", pendingCopy.text);
      e.preventDefault();
      copiedToast(pendingCopy.count);
      setPendingCopy(null);
    };
    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
    // copiedToast only reads `total`, which cannot change while the hint is showing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCopy]);

  // Load the next page when the end of the list scrolls into view (instead of a "Show more" button).
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = rows.length < total;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!drill || !sentinel || !hasMore || loading || failed) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadPage(drill, rows.length);
      },
      { root: listRef.current, rootMargin: "240px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [drill, hasMore, loading, failed, rows.length, loadPage]);

  const when = drill ? (drill.sub ?? (drill.now || NOW_KEYS.includes(drill.key) ? "Now" : f.range.label)) : "";
  const chips = [when, ...(f.filterText ? f.filterText.split(" · ") : [])].filter(Boolean);

  const headerButton = (props: { title: string; label: string; onClick: () => void; busy?: boolean; icon: ReactNode }) => (
    <Tooltip title={props.busy ? "Working…" : props.title} arrow>
      {/* span: a disabled button cannot show a tooltip */}
      <span style={{ display: "inline-flex" }}>
        <IconButton
          size="small"
          onClick={props.onClick}
          disabled={props.busy}
          aria-label={props.label}
          sx={{
            width: 34,
            height: 34,
            borderRadius: "9px",
            border: `1px solid ${t.border}`,
            color: t.textSecondary,
            "&:hover": { color: t.accent, borderColor: t.accentBorder, background: t.accentDim },
          }}
        >
          {props.busy ? <CircularProgress size={16} /> : props.icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Drawer
      anchor="right"
      open={drill != null}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: { xs: "100%", sm: 720 }, maxWidth: "100%", background: t.surface, backgroundImage: "none", display: "flex", flexDirection: "column" },
        },
      }}
    >
      {/* ── header: two rows ── */}
      <Box sx={{ p: "14px 22px 12px", borderBottom: `1px solid ${t.border}` }}>
        {/* row 1: title, count, actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1.25 }}>
            <Typography
              component="h2"
              title={drill?.title}
              sx={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-.01em", color: t.textPrimary, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {drill?.title}
            </Typography>
            {drill && !failed && (
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: "4px",
                  px: 1,
                  py: "2px",
                  borderRadius: t.radiusPill,
                  background: t.accentDim,
                  border: `1px solid ${t.accentBorder}`,
                }}
              >
                {loading && !rows.length ? (
                  <Skeleton variant="text" width={28} height={18} />
                ) : (
                  <Box component="b" sx={{ fontSize: 13, fontWeight: 700, color: t.accent }}>
                    {fmtN(total)}
                  </Box>
                )}
                <Box component="span" sx={{ fontSize: 11.5, fontWeight: 600, color: t.textSecondary }}>
                  CRQ{total === 1 ? "" : "s"}
                </Box>
              </Box>
            )}
          </Box>
          {rows.length > 0 &&
            headerButton({
              title: "Copy CRQ numbers",
              label: "Copy the CRQ numbers of this list",
              onClick: () => void copyAll(),
              busy: copyBusy,
              icon: <ContentCopyRoundedIcon sx={{ fontSize: 17 }} />,
            })}
          {rows.length > 0 &&
            headerButton({
              title: "Download these (Excel)",
              label: "Download these CRQs (Excel)",
              onClick: downloadAll,
              busy: bulkBusy,
              icon: <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />,
            })}
          {headerButton({ title: "Close", label: "Close", onClick: onClose, icon: <CloseRoundedIcon sx={{ fontSize: 18 }} /> })}
        </Box>

        {/* row 2: window + filter chips, then the sort note */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", mt: 1 }}>
          {chips.map((c, i) => (
            <Box
              key={c + i}
              component="span"
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                px: "9px",
                py: "2px",
                borderRadius: t.radiusPill,
                border: `1px solid ${i === 0 ? t.infoBorder : t.border}`,
                background: i === 0 ? t.infoDim : t.surface2,
                color: i === 0 ? t.accent : t.textSecondary,
              }}
            >
              {c}
            </Box>
          ))}
          <Typography component="span" sx={{ fontSize: 11.5, color: t.textDim, ml: "auto" }}>
            Most recent first
          </Typography>
        </Box>
      </Box>

      {pendingCopy && (
        <Box
          role="status"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            m: "12px 22px 0",
            p: "10px 12px",
            borderRadius: t.radius,
            border: `1px solid ${t.infoBorder}`,
            background: t.infoDim,
            color: t.textPrimary,
            fontSize: 13,
          }}
        >
          <KeyboardRoundedIcon sx={{ fontSize: 20, color: t.info }} />
          <Box ref={hintRef} sx={{ flex: 1, "&::selection, & *::selection": { background: "transparent" } }}>
            Press <b>{copyShortcut()}</b> to copy all {fmtN(pendingCopy.count)} CRQ number{pendingCopy.count === 1 ? "" : "s"}
          </Box>
          <IconButton size="small" onClick={() => setPendingCopy(null)} aria-label="Cancel copying">
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* ── cards ── */}
      <Box ref={listRef} sx={{ flex: 1, overflow: "auto", p: "12px 22px", background: t.bg, display: "flex", flexDirection: "column", gap: 1 }}>
        {failed ? (
          <EmptyOrErrorState kind="error" message={failed} />
        ) : loading && !rows.length ? (
          [0, 1, 2, 3].map((i) => <P1CrqCardSkeleton key={i} />)
        ) : !rows.length ? (
          <EmptyOrErrorState kind="empty" message="No CRQs behind this number." />
        ) : (
          <>
            {rows.map((r, i) => (
              <P1CrqCard key={`${r.crqNo}-${r.task ?? ""}-${i}`} row={r} onOpen={onOpenJourney} />
            ))}
            {hasMore && (
              <Box ref={sentinelRef}>
                <P1CrqCardSkeleton />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── footer: how much is loaded ── */}
      {rows.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, p: "10px 22px 14px", borderTop: `1px solid ${t.border}`, background: t.surface }}>
          <Typography sx={{ fontSize: 12, color: t.textSecondary, whiteSpace: "nowrap" }}>
            {hasMore ? (
              <>
                Showing <b>{fmtN(rows.length)}</b> of <b>{fmtN(total)}</b> · more load as you scroll
              </>
            ) : (
              <>
                All <b>{fmtN(total)}</b> CRQ{total === 1 ? "" : "s"} shown
              </>
            )}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={total ? Math.min(100, (rows.length / total) * 100) : 100}
            sx={{ flex: 1, height: 4, borderRadius: 2, background: t.trackOff }}
          />
        </Box>
      )}
    </Drawer>
  );
}
