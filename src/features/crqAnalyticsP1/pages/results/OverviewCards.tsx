import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { StatCard } from "../../../dashboard/components/StatCard";
import type { StatCardConfig, ToneKey } from "../../../dashboard/types/dashboard.types";
import { Num, Tag } from "../../components/P1Bits";
import { P1Card, P1Empty } from "../../components/P1Card";
import { P1Table, type P1Column } from "../../components/P1Table";
import { useP1 } from "../../hooks/useP1Context";
import type { P1Drill, P1PeriodRowDto, P1ResultsResponse, P1StepDto } from "../../types/crqAnalyticsP1.types";
import { exportP1Table } from "../../utils/p1Export";
import { DAY, STAGES, fmtN, num, parseDT, pct, stepInfo, sumBy } from "../../utils/p1Format";

export interface ResultsCardProps {
  data: P1ResultsResponse | undefined;
  loading: boolean;
  error: boolean;
}

const stepWindow = (b: P1StepDto) => ({ from: parseDT(b.bucketStart) ?? undefined, to: parseDT(b.bucketEnd) ?? undefined });

/* ══════════════ Key numbers ══════════════ */

interface Tile {
  config: StatCardConfig;
  drill: P1Drill;
}

export function KeyNumbersCard({ data, loading, error }: ResultsCardProps) {
  const { f, colors, openDrill } = useP1();
  const c = data?.keyNumbers;
  const steps = data?.steps ?? [];

  const finished = num(c?.done) + num(c?.cancelled) + num(c?.rejected) + num(c?.cancelTypeUnknown);
  const prevName = f.quickFilter === "custom" ? `${Math.round((f.range.hi - f.range.lo) / DAY)} days` : f.range.name.replace("Last ", "");
  /** Change against the same length of time just before; hidden when the data does not reach back that far. */
  const delta = (v: number | null | undefined, prev: number | null | undefined, upIsGood: boolean | null) => {
    if (prev == null || !num(prev)) return undefined;
    const change = Math.round(((num(v) - num(prev)) / num(prev)) * 100);
    const tone: ToneKey = upIsGood == null ? "info" : change >= 0 === upIsGood ? "success" : "danger";
    return { text: `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}%`, tone };
  };
  const trend = (pick: (s: P1StepDto) => number | null) => (steps.length > 1 ? steps.map((s) => num(pick(s))) : undefined);
  const ofFinished = (v: number | null | undefined) => `${pct(v, finished)}% of finished in range`;

  const rangeTiles: Tile[] = [
    {
      config: { key: "received", label: "Received", display: num(c?.received), sub: c?.prevReceived == null ? "No full earlier period to compare" : `vs previous ${prevName}`, tone: "accent", icon: "event", delta: delta(c?.received, c?.prevReceived, null), trend: trend((s) => s.received) },
      drill: { title: "Received", key: "RECEIVED" },
    },
    {
      config: { key: "done", label: "Done", display: num(c?.done), sub: ofFinished(c?.done), tone: "success", icon: "trending", delta: delta(c?.done, c?.prevDone, true), trend: trend((s) => s.done) },
      drill: { title: "Done", key: "ENDED", value: "DONE" },
    },
    {
      config: { key: "cancelled", label: "Cancelled", display: num(c?.cancelled), sub: ofFinished(c?.cancelled), tone: "warning", icon: "calendar", delta: delta(c?.cancelled, c?.prevCancelled, false), trend: trend((s) => s.cancelled) },
      drill: { title: "Cancelled", key: "ENDED", value: "CANCELLED" },
    },
    {
      config: { key: "rejected", label: "Rejected", display: num(c?.rejected), sub: ofFinished(c?.rejected), tone: "danger", icon: "calendar", delta: delta(c?.rejected, c?.prevRejected, false), trend: trend((s) => s.rejected) },
      drill: { title: "Rejected", key: "ENDED", value: "REJECTED" },
    },
  ];
  // Only shown while some stops still wait for a CANCEL_TYPE mapping.
  if (num(c?.cancelTypeUnknown) > 0) {
    rangeTiles.push({
      config: { key: "unknown", label: "Type not mapped yet", display: num(c?.cancelTypeUnknown), sub: "Stopped; cancel or reject not known", tone: "info", icon: "calendar" },
      drill: { title: "Stopped, type not mapped", key: "ENDED", value: "UNKNOWN" },
    });
  }

  const openDelta = c?.openAtStart == null ? null : num(c.openNow) - num(c.openAtStart);
  const nowTiles: Tile[] = [
    {
      config: {
        key: "open",
        label: "Open right now",
        display: num(c?.openNow),
        sub: openDelta == null ? "Counted now" : `${openDelta >= 0 ? "▲" : "▼"} ${fmtN(Math.abs(openDelta))} vs start of range`,
        tone: "info",
        icon: "clock",
      },
      drill: { title: "Open right now", key: "OPEN_SIDE", value: "ALL", now: true },
    },
    {
      config: { key: "assigned", label: "Assigned", display: num(c?.assignedNow), sub: `${pct(c?.assignedNow, c?.openNow)}% of open · a person is named on its stage`, tone: "success", icon: "event" },
      drill: { title: "Open · person named on current stage", key: "ASSIGNED", now: true },
    },
    {
      config: { key: "unassigned", label: "Unassigned", display: num(c?.unassignedNow), sub: `${pct(c?.unassignedNow, c?.openNow)}% of open · nobody named on its stage`, tone: "warning", icon: "clock" },
      drill: { title: "Open · nobody on current stage", key: "UNASSIGNED", now: true },
    },
  ];

  const row = (label: string, tag: "range" | "now", tiles: Tile[]) => (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: colors.tokens.textSecondary }}>{label}</Typography>
        <Tag kind={tag} text={tag === "range" ? f.range.short : undefined} />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0,1fr))", lg: `repeat(${tiles.length}, minmax(0,1fr))` }, gap: "14px" }}>
        {tiles.map(({ config, drill }) => {
          const clickable = typeof config.display === "number" && config.display > 0;
          return (
            <Box
              key={config.key}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => openDrill(drill) : undefined}
              onKeyDown={clickable ? (e) => e.key === "Enter" && openDrill(drill) : undefined}
              sx={{ cursor: clickable ? "pointer" : "default", borderRadius: "14px", "& .MuiCard-root": { cursor: "inherit" }, "&:focus-visible": { outline: `2px solid ${colors.tokens.accent}`, outlineOffset: 2 } }}
            >
              <StatCard config={config} colors={colors.tokens} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <P1Card title="Key numbers" info="r-kpis" loading={loading} error={error}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {row("In the date range", "range", rangeTiles)}
        {row("Right now", "now", nowTiles)}
      </Box>
    </P1Card>
  );
}

/* ══════════════ Executive summary ══════════════ */

const EXEC_BOXES = ["OPEN", "COMPLETED", "FAILED", "CANCELLED", "REJECTED", "RESCHEDULED", "UNKNOWN"] as const;
const EXEC_LABEL: Record<string, string> = {
  Total: "Total",
  OPEN: "Open",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  RESCHEDULED: "Rescheduled",
  UNKNOWN: "Type not mapped yet",
};

export function ExecutiveCard({ data, loading, error }: ResultsCardProps) {
  const { f, colors } = useP1();
  const t = colors.tokens;
  const [picked, setPicked] = useState<string>("Total");
  const exec = useMemo(() => data?.executive ?? [], [data]);

  const boxes = ["Total", ...EXEC_BOXES.filter((s) => s !== "UNKNOWN" || exec.some((e) => e.status === "UNKNOWN"))];
  const selected = boxes.includes(picked) ? picked : "Total";
  const of = (status: string) => exec.filter((e) => status === "Total" || e.status === status);
  const total = sumBy(exec, (e) => e.crqs);
  const selectedRows = of(selected);
  const selectedTotal = sumBy(selectedRows, (e) => e.crqs);
  const stripe: Record<string, string> = {
    OPEN: colors.received,
    COMPLETED: colors.done,
    FAILED: t.danger,
    CANCELLED: colors.cancelled,
    REJECTED: colors.rejected,
    RESCHEDULED: colors.rescheduled,
    UNKNOWN: colors.unknown,
  };
  const listValue = (stageNo: number | "") => `${selected === "Total" ? "ALL" : selected}|${stageNo}`;

  type SplitRow = { name: string };
  const columns: P1Column<SplitRow>[] = [
    { key: "group", header: "Group", cell: (r) => <b>{r.name}</b>, exportValue: (r) => r.name },
    ...STAGES.map((s): P1Column<SplitRow> => {
      const n = sumBy(selectedRows.filter((e) => e.stageNo === s.no), (e) => e.crqs);
      return {
        key: `s${s.no}`,
        header: s.label,
        align: "right",
        wrapHeader: true,
        cell: (r) => (
          <>
            <Num v={n} d={{ title: `${r.name} · ${s.label}`, key: "EXEC", value: listValue(s.no) }} />
            {n > 0 && <Box sx={{ fontSize: 11, color: t.textSecondary }}>{pct(n, selectedTotal)}%</Box>}
          </>
        ),
        exportValue: () => n,
      };
    }),
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (r) => <Num v={selectedTotal} bold d={{ title: `${r.name} · received in range`, key: "EXEC", value: listValue("") }} />,
      exportValue: () => selectedTotal,
    },
  ];
  const rows: SplitRow[] = [{ name: EXEC_LABEL[selected] }];

  return (
    <P1Card
      title="Executive summary"
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-exec"
      loading={loading}
      error={error}
      onExport={() => exportP1Table(`Executive summary ${EXEC_LABEL[selected]}`, columns, rows)}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: `repeat(${boxes.length}, minmax(0,1fr))` }, gap: 1 }}>
        {boxes.map((status) => {
          const n = sumBy(of(status), (e) => e.crqs);
          const active = selected === status;
          return (
            <Box
              key={status}
              component="button"
              type="button"
              aria-pressed={active}
              onClick={() => setPicked(status)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                cursor: "pointer",
                p: "10px 12px",
                borderRadius: t.radius,
                border: `1px solid ${active ? t.accent : t.border}`,
                borderTop: `3px solid ${stripe[status] ?? t.textSecondary}`,
                background: active ? t.accentDim : t.surface,
                "&:hover": { borderColor: t.borderHover },
                "&:focus-visible": { outline: `2px solid ${t.accent}`, outlineOffset: 1 },
              }}
            >
              <Box sx={{ fontSize: 12, color: t.textSecondary }}>{EXEC_LABEL[status]}</Box>
              <Box sx={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, lineHeight: 1.25 }}>{fmtN(n)}</Box>
              <Box sx={{ fontSize: 12, color: t.textSecondary }}>{status === "Total" ? "100%" : `${pct(n, total)}%`}</Box>
            </Box>
          );
        })}
      </Box>
      <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: t.textSecondary, mt: 2, mb: 0.75 }}>
        {EXEC_LABEL[selected]} — split by stage
      </Typography>
      <P1Table columns={columns} rows={rows} rowKey={(r) => r.name} />
    </P1Card>
  );
}

/* ══════════════ Summary by period ══════════════ */

const PERIOD_ITEMS: Record<string, { label: string; key: string; value: string }> = {
  RECEIVED: { label: "Received", key: "RECEIVED", value: "" },
  DONE_PLANNED_NIGHT: { label: "Done on planned night", key: "ENDED", value: "DONE_FIRST_NIGHT" },
  DONE_AFTER_RESCHEDULE: { label: "Done after reschedule", key: "ENDED", value: "DONE_AFTER_RESCHEDULE" },
  CANCELLED: { label: "Cancelled", key: "ENDED", value: "CANCELLED" },
  REJECTED: { label: "Rejected", key: "ENDED", value: "REJECTED" },
  CANCEL_TYPE_UNKNOWN: { label: "Type not mapped yet", key: "ENDED", value: "UNKNOWN" },
  FAILED: { label: "Failed (FAIL recorded)", key: "FAILED", value: "" },
  RESCHEDULED: { label: "Rescheduled", key: "RESCHEDULED", value: "" },
};

export function PeriodCard({ data, loading, error }: ResultsCardProps) {
  const { f, colors } = useP1();
  const t = colors.tokens;

  type Win = { preset: string; label: string; count: (x: P1PeriodRowDto) => number | null; from: (x: P1PeriodRowDto) => number; days: number | null };
  const windows: Win[] = [
    { preset: "24h", label: "Last 24 h", count: (x) => x.last24h, from: (x) => parseDT(x.from24h) ?? f.now - DAY, days: 1 },
    { preset: "1w", label: "Last 7 days", count: (x) => x.last7d, from: (x) => parseDT(x.from7d) ?? f.now - 7 * DAY, days: 7 },
    { preset: "30d", label: "Last 30 days", count: (x) => x.last30d, from: (x) => parseDT(x.from30d) ?? f.now - 30 * DAY, days: 30 },
  ];
  if (f.quickFilter === "custom") windows.push({ preset: "custom", label: `Selected: ${f.range.label}`, count: (x) => x.selected, from: () => f.range.lo, days: null });

  const rows = (data?.periods ?? []).filter((x) => PERIOD_ITEMS[x.item] && (x.item !== "CANCEL_TYPE_UNKNOWN" || windows.some((w) => num(w.count(x)) > 0)));

  const columns: P1Column<P1PeriodRowDto>[] = [
    { key: "item", header: "Item", cell: (x) => <b>{PERIOD_ITEMS[x.item].label}</b>, exportValue: (x) => PERIOD_ITEMS[x.item].label },
    ...windows.map((w): P1Column<P1PeriodRowDto> => {
      const current = w.preset === f.quickFilter;
      return {
        key: w.preset,
        header: current ? `${w.label} ●` : w.label,
        exportHeader: w.label,
        align: "right",
        headSx: current ? { color: t.accent } : undefined,
        cellSx: () => (current ? { background: t.accentDim } : undefined),
        cell: (x) => {
          const item = PERIOD_ITEMS[x.item];
          // The procedure returns the exact windows it counted; the click re-uses them.
          const to = w.days == null ? f.range.hi : (parseDT(x.windowEnd) ?? f.now);
          return <Num v={w.count(x)} d={{ title: `${item.label} — ${w.label}`, key: item.key, value: item.value, sub: w.days == null ? f.range.label : w.label, from: w.from(x), to }} />;
        },
        exportValue: (x) => num(w.count(x)),
      };
    }),
  ];

  return (
    <P1Card title="Summary by period" info="r-period" loading={loading} error={error} onExport={() => exportP1Table("Summary by period", columns, rows)}>
      {rows.length ? <P1Table columns={columns} rows={rows} rowKey={(x) => x.item} /> : <P1Empty />}
    </P1Card>
  );
}

/* ══════════════ Daily status summary ══════════════ */

type StepKey = "received" | "ccbStopped" | "ccbClosed" | "movedToSe" | "ccbPendingAtEnd" | "seStopped" | "seClosed" | "sePendingAtEnd";
interface DailyRow {
  section: string;
  activity: string;
  field: StepKey;
  strong?: boolean;
  drill: (b: P1StepDto) => Pick<P1Drill, "key" | "value" | "from" | "to">;
}

const DAILY_ROWS: DailyRow[] = [
  { section: "Total", activity: "Total CR submitted", field: "received", strong: true, drill: (b) => ({ key: "RECEIVED", ...stepWindow(b) }) },
  { section: "CCB bin", activity: "CR rejected / cancelled by CCB", field: "ccbStopped", drill: (b) => ({ key: "CANCEL_SIDE", value: "CCB|STOPPED", ...stepWindow(b) }) },
  { section: "CCB bin", activity: "CR completed / closed by CCB", field: "ccbClosed", drill: (b) => ({ key: "SIDE_CLOSED", value: "CCB", ...stepWindow(b) }) },
  { section: "CCB bin", activity: "CR with MOP transferred to SE bin", field: "movedToSe", drill: (b) => ({ key: "MOVED_TO_SE", ...stepWindow(b) }) },
  { section: "CCB bin", activity: "Total pending CRQ in CCB bin", field: "ccbPendingAtEnd", strong: true, drill: (b) => ({ key: "OPEN_AT", value: `${b.bucketEnd}|CCB` }) },
  { section: "SE bin", activity: "CR rejected / cancelled by SE", field: "seStopped", drill: (b) => ({ key: "CANCEL_SIDE", value: "SE|STOPPED", ...stepWindow(b) }) },
  { section: "SE bin", activity: "CR completed / closed by SE", field: "seClosed", drill: (b) => ({ key: "SIDE_CLOSED", value: "SE", ...stepWindow(b) }) },
  { section: "SE bin", activity: "Total pending CRQ in SE bin", field: "sePendingAtEnd", strong: true, drill: (b) => ({ key: "OPEN_AT", value: `${b.bucketEnd}|SE` }) },
];

export function DailyStatusCard({ data, loading, error }: ResultsCardProps) {
  const { f } = useP1();
  const steps = useMemo(() => data?.steps ?? [], [data]);
  const info = useMemo(() => stepInfo(steps), [steps]);

  const columns: P1Column<DailyRow>[] = [
    {
      key: "activity",
      header: "Activity",
      cell: (r, i) => (
        <>
          {(i === 0 || DAILY_ROWS[i - 1].section !== r.section) && <Box sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", opacity: 0.7 }}>{r.section}</Box>}
          <Box component="span" sx={{ fontWeight: r.strong ? 700 : 400 }}>
            {r.activity}
          </Box>
        </>
      ),
      exportValue: (r) => `${r.section}: ${r.activity}`,
    },
    ...steps.map(
      (b, i): P1Column<DailyRow> => ({
        key: `b${b.bucketNo}`,
        header: info.labels[i],
        exportHeader: info.tips[i],
        align: "right",
        cell: (r) => (num(b[r.field]) ? <Num v={b[r.field]} bold={r.strong} d={{ title: `${r.activity} · ${info.tips[i]}`, sub: info.tips[i], ...r.drill(b) }} /> : ""),
        exportValue: (r) => num(b[r.field]),
      }),
    ),
  ];

  return (
    <P1Card
      title="Daily status summary"
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-daily"
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Daily status summary", columns, DAILY_ROWS)}
    >
      {steps.length ? <P1Table columns={columns} rows={DAILY_ROWS} rowKey={(r) => r.field} stickyFirst /> : <P1Empty />}
    </P1Card>
  );
}
