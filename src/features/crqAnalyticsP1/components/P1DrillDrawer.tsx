import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Drawer, IconButton, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { toast } from "react-toastify";
import { EmptyOrErrorState } from "../../crqAnalytics/components/EmptyOrErrorState";
import { useLazyGetP1CrqListQuery } from "../api/crqAnalyticsP1Api";
import { useP1 } from "../hooks/useP1Context";
import type { P1CrqListParams, P1CrqRowDto, P1Drill } from "../types/crqAnalyticsP1.types";
import { exportP1Objects } from "../utils/p1Export";
import { DAY, fdt, fmtN, h1, toSql } from "../utils/p1Format";
import { ResultPill, StageTracker } from "./P1Bits";
import { P1JourneyPanel } from "./P1JourneyPanel";

const PAGE_SIZE = 50;
/** CRQ_AN_SP_LIST caps p_limit at 1000; "copy all" / "download" page through at that size. */
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
  /** Opens the scheduler's full CRQ Journey page for this CRQ. */
  onOpenFullJourney: (crqNo: string) => void;
}

/**
 * Right-hand drawer with the CRQs behind a clicked number (CRQ_AN_SP_LIST, paged) and, for a
 * clicked CRQ, its analytics journey (CRQ_AN_SP_JOURNEY).
 */
export function P1DrillDrawer({ drill, onClose, onOpenFullJourney }: Props) {
  const { f, colors } = useP1();
  const t = colors.tokens;
  const [fetchList] = useLazyGetP1CrqListQuery();

  const [rows, setRows] = useState<P1CrqRowDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [journeyCrq, setJourneyCrq] = useState<string | null>(null);
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
    setJourneyCrq(null);
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

  const copyAll = () =>
    runBulk(async (all) => {
      await navigator.clipboard.writeText(all.map((r) => r.crqNo).join("\n"));
      toast.success(`Copied ${fmtN(all.length)} CRQ number${all.length === 1 ? "" : "s"}`);
    });
  const downloadAll = () => runBulk((all) => exportP1Objects(drill?.title ?? "CRQ list", all, EXPORT_HEADERS));

  const when = drill ? (drill.sub ?? (drill.now || NOW_KEYS.includes(drill.key) ? "Now" : f.range.label)) : "";
  const subtitle = [when, f.filterText, drill && !journeyCrq && !loading ? `${fmtN(total)} CRQ${total === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ");

  return (
    <Drawer
      anchor="right"
      open={drill != null}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 680 }, maxWidth: "100%", background: t.surface, backgroundImage: "none" } } }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, p: "16px 20px", borderBottom: `1px solid ${t.border}` }}>
        {journeyCrq && (
          <IconButton size="small" onClick={() => setJourneyCrq(null)} aria-label="Back to the list" sx={{ mt: "-2px" }}>
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: t.textPrimary, overflowWrap: "anywhere" }}>
            {journeyCrq ?? drill?.title}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: t.textSecondary, mt: "3px" }}>{journeyCrq ? `From: ${drill?.title ?? ""}` : subtitle}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: "12px 20px 20px" }}>
        {journeyCrq ? (
          <P1JourneyPanel crqNo={journeyCrq} />
        ) : failed ? (
          <EmptyOrErrorState kind="error" message={failed} />
        ) : loading && !rows.length ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={26} />
          </Box>
        ) : !rows.length ? (
          <EmptyOrErrorState kind="empty" message="No CRQs behind this number." />
        ) : (
          <>
            {rows.map((r, i) => (
              <Box
                key={`${r.crqNo}-${r.task ?? ""}-${i}`}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, py: "10px", borderBottom: `1px solid ${t.border}` }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ fontSize: 13 }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setJourneyCrq(r.crqNo)}
                      sx={{ all: "unset", cursor: "pointer", fontWeight: 700, color: t.accent, "&:hover": { textDecoration: "underline" } }}
                    >
                      {r.crqNo}
                    </Box>
                    <Box component="span" sx={{ color: t.textSecondary }}>
                      {" "}
                      · {r.team ?? "—"} · {r.circle ?? "—"}
                    </Box>
                  </Box>
                  <Box sx={{ fontSize: 12, color: t.textSecondary, mt: "4px", lineHeight: 1.5 }}>
                    <StageTracker stageNo={r.stageNo} result={r.result} /> &nbsp;{r.stageLabel}
                    {r.task ? (
                      <>
                        {" · "}
                        <Box component="b" sx={{ color: t.textPrimary }}>
                          {r.task}
                        </Box>{" "}
                        {h1(r.taskHours)} h by {r.person ?? "—"} · {fdt(r.taskDoneAt)}
                      </>
                    ) : (
                      <>
                        {r.night ? ` · slot ${fdt(r.night)}` : ""}
                        {r.result === "OPEN" && r.person ? ` · with ${r.person}` : ""}
                        {r.cancelReason ? ` · ${r.cancelReason}` : ""}
                      </>
                    )}
                  </Box>
                </Box>
                <ResultPill result={r.result} currentStatus={r.currentStatus} />
              </Box>
            ))}
            {rows.length < total && (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5 }}>
                <Button size="small" variant="outlined" disabled={loading} onClick={() => drill && void loadPage(drill, rows.length)} sx={{ textTransform: "none" }}>
                  {loading ? "Loading…" : `Show ${Math.min(PAGE_SIZE, total - rows.length)} more (${fmtN(rows.length)} of ${fmtN(total)})`}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, p: "12px 20px", borderTop: `1px solid ${t.border}` }}>
        {journeyCrq ? (
          <>
            <Button
              size="small"
              variant="outlined"
              sx={{ textTransform: "none" }}
              onClick={() => navigator.clipboard.writeText(journeyCrq).then(() => toast.success("Copied 1 CRQ number"))}
            >
              Copy CRQ number
            </Button>
            <Button size="small" variant="contained" sx={{ textTransform: "none" }} onClick={() => onOpenFullJourney(journeyCrq)}>
              Open full CRQ journey
            </Button>
          </>
        ) : (
          rows.length > 0 && (
            <>
              <Button size="small" variant="outlined" disabled={bulkBusy} onClick={copyAll} sx={{ textTransform: "none" }}>
                Copy CRQ numbers
              </Button>
              <Button size="small" variant="contained" disabled={bulkBusy} onClick={downloadAll} sx={{ textTransform: "none" }}>
                {bulkBusy ? "Preparing…" : "Download these (Excel)"}
              </Button>
            </>
          )
        )}
      </Box>
    </Drawer>
  );
}
