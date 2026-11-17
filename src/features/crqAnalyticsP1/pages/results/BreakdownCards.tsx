import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Num, Seg, Tag } from "../../components/P1Bits";
import { P1BarChart } from "../../components/P1BarChart";
import { P1Card, P1Empty } from "../../components/P1Card";
import { P1Table, type P1Column } from "../../components/P1Table";
import { useP1 } from "../../hooks/useP1Context";
import type { P1BreakdownResponse, P1DayNightDto, P1Drill, P1GeoStatusDto, P1ShiftKind, P1TrendDayDto } from "../../types/crqAnalyticsP1.types";
import { exportP1Table } from "../../utils/p1Export";
import { dayLabel, fmtN, monthSlots, num, pct, sumBy } from "../../utils/p1Format";
import { MONTH_OPTIONS } from "./FlowStopCards";

export interface BreakdownCardProps {
  data: P1BreakdownResponse | undefined;
  loading: boolean;
  error: boolean;
}

type GeoTab = "circle" | "region";
const GEO_OPTIONS = [
  { value: "circle" as GeoTab, label: "Circle" },
  { value: "region" as GeoTab, label: "Region" },
];

/* ══════════════ 17 · CRQ trend — last 7 days ══════════════ */

type TrendKey = "received" | "closed" | "cancelled" | "rejected";

export function Trend7Card({ data, loading, error }: BreakdownCardProps) {
  const { colors, openDrill } = useP1();
  const t = colors.tokens;
  const rows = data?.trend7 ?? [];
  const series: { key: TrendKey; type: string; label: string; color: string }[] = [
    { key: "received", type: "RECEIVED", label: "Received", color: colors.received },
    { key: "closed", type: "CLOSED", label: "Closed", color: colors.done },
    { key: "cancelled", type: "CANCELLED", label: "Cancelled", color: colors.cancelled },
    { key: "rejected", type: "REJECTED", label: "Rejected", color: colors.rejected },
  ];
  const drillOf = (x: P1TrendDayDto, type: string, label: string): P1Drill => ({ title: `${label} · ${dayLabel(x.day)}`, key: "TREND_DAY", value: `${x.day}|${type}`, sub: dayLabel(x.day), noRange: true });

  const columns: P1Column<P1TrendDayDto>[] = [
    { key: "day", header: "Day", cell: (x) => dayLabel(x.day), exportValue: (x) => x.day, foot: "Total" },
    ...series.map(
      (s): P1Column<P1TrendDayDto> => ({
        key: s.key,
        header: s.label,
        align: "right",
        cell: (x) => <Num v={x[s.key]} d={drillOf(x, s.type, s.label)} />,
        exportValue: (x) => num(x[s.key]),
        foot: fmtN(sumBy(rows, (x) => x[s.key])),
      }),
    ),
    { key: "open", header: "Open at day end", align: "right", cell: (x) => <Num v={x.openAtEnd} bold d={drillOf(x, "OPEN", "Open at day end")} />, exportValue: (x) => num(x.openAtEnd), foot: "" },
  ];

  return (
    <P1Card
      title="CRQ trend — last 7 days"
      tag={<Tag kind="own" text="Last 7 days" />}
      info="r-trend7"
      legend={series.map((s) => ({ label: s.label, color: s.color }))}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("CRQ trend last 7 days", columns, rows)}
      chart={
        rows.length ? (
          <>
            <P1BarChart
              labels={rows.map((x) => dayLabel(x.day))}
              ariaLabel="Received, closed, cancelled and rejected per day, last 7 days"
              series={series.map((s) => ({ label: s.label, color: s.color, data: rows.map((x) => num(x[s.key])), onClick: (i) => openDrill(drillOf(rows[i], s.type, s.label)) }))}
              extraTip={(i) => [["Open at day end", fmtN(num(rows[i].openAtEnd))]]}
            />
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: t.textSecondary, mt: 1.5 }}>Open at day end</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(4, minmax(0,1fr))", md: "repeat(7, minmax(0,1fr))" }, gap: 1 }}>
              {rows.map((x) => (
                <Box
                  key={x.day}
                  component="button"
                  type="button"
                  disabled={!num(x.openAtEnd)}
                  onClick={() => openDrill(drillOf(x, "OPEN", "Open at day end"))}
                  sx={{
                    all: "unset",
                    boxSizing: "border-box",
                    cursor: num(x.openAtEnd) ? "pointer" : "default",
                    p: "8px 10px",
                    borderRadius: t.radius,
                    border: `1px solid ${t.border}`,
                    background: t.surface2,
                    "&:hover": { borderColor: t.accent },
                    "&:focus-visible": { outline: `2px solid ${t.accent}` },
                  }}
                >
                  <Box sx={{ fontSize: 11, color: t.textSecondary }}>{dayLabel(x.day)}</Box>
                  <Box sx={{ fontSize: 17, fontWeight: 800, color: t.textPrimary }}>{fmtN(num(x.openAtEnd))}</Box>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <P1Empty />
        )
      }
      table={<P1Table columns={columns} rows={rows} rowKey={(x) => x.day} />}
    />
  );
}

/* ══════════════ 12 / 13 · Circle-wise / region-wise CRQ analytics ══════════════ */

type GeoKey = "received" | "done" | "openNow" | "cancelled" | "rejected" | "failed" | "rescheduled";
const GEO_COLS: { key: GeoKey; label: string; status: string }[] = [
  { key: "received", label: "Received", status: "RECEIVED" },
  { key: "done", label: "Done", status: "DONE" },
  { key: "openNow", label: "Open now", status: "OPEN" },
  { key: "cancelled", label: "Cancelled", status: "CANCELLED" },
  { key: "rejected", label: "Rejected", status: "REJECTED" },
  { key: "failed", label: "Failed", status: "FAILED" },
  { key: "rescheduled", label: "Rescheduled", status: "RESCHEDULED" },
];

export function GeoStatusCard({ data, loading, error }: BreakdownCardProps) {
  const { f, colors, openDrill } = useP1();
  const [tab, setTab] = useState<GeoTab>("circle");
  const isRegion = tab === "region";
  const rows = (isRegion ? data?.regionStatus : data?.circleStatus) ?? [];
  const name = (x: P1GeoStatusDto) => (isRegion ? x.region : x.circle) ?? "Not set";
  const drillOf = (x: P1GeoStatusDto, c: (typeof GEO_COLS)[number]): P1Drill => ({
    title: `${name(x)} · ${c.label}`,
    key: isRegion ? "REGION_STATUS" : "CIRCLE_STATUS",
    value: `${name(x)}|${c.status}`,
    now: c.status === "OPEN",
  });
  const chartSeries = [
    { col: GEO_COLS[0], color: colors.received },
    { col: GEO_COLS[1], color: colors.done },
    { col: GEO_COLS[2], color: colors.openNow },
  ];

  const columns: P1Column<P1GeoStatusDto>[] = [
    { key: "name", header: isRegion ? "Region" : "Circle", cell: (x) => <b>{name(x)}</b>, exportValue: name, foot: "Total" },
    ...(isRegion ? [] : [{ key: "region", header: "Region", cell: (x: P1GeoStatusDto) => x.region ?? "—", exportValue: (x: P1GeoStatusDto) => x.region ?? "", foot: "" }]),
    ...GEO_COLS.map(
      (c): P1Column<P1GeoStatusDto> => ({
        key: c.key,
        header: c.status === "OPEN" ? (
          <>
            {c.label} <Tag kind="now" />
          </>
        ) : (
          c.label
        ),
        exportHeader: c.label,
        align: "right",
        cell: (x) => <Num v={x[c.key]} bold={c.key === "received"} d={drillOf(x, c)} />,
        exportValue: (x) => num(x[c.key]),
        foot: fmtN(sumBy(rows, (x) => x[c.key])),
      }),
    ),
  ];

  return (
    <P1Card
      title={isRegion ? "Region-wise CRQ analytics" : "Circle-wise CRQ analytics"}
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-geo"
      legend={chartSeries.map((s) => ({ label: s.col.label, color: s.color }))}
      right={<Seg value={tab} options={GEO_OPTIONS} onChange={setTab} ariaLabel="Group by" />}
      loading={loading}
      error={error}
      onExport={() => exportP1Table(isRegion ? "Region-wise CRQ analytics" : "Circle-wise CRQ analytics", columns, rows)}
      chart={
        rows.length ? (
          <P1BarChart
            labels={rows.map(name)}
            ariaLabel={`Received, done and open per ${tab}`}
            series={chartSeries.map((s) => ({ label: s.col.label, color: s.color, data: rows.map((x) => num(x[s.col.key])), onClick: (i) => openDrill(drillOf(rows[i], s.col)) }))}
            extraTip={(i) => GEO_COLS.slice(3).map((c): [string, string] => [c.label, fmtN(num(rows[i][c.key]))])}
          />
        ) : (
          <P1Empty />
        )
      }
      table={rows.length ? <P1Table columns={columns} rows={rows} rowKey={name} /> : <P1Empty />}
    />
  );
}

/* ══════════════ 10 · Circle & team breakdown ══════════════ */

export function CircleTeamCard({ data, loading, error }: BreakdownCardProps) {
  const { f, colors } = useP1();
  const [tab, setTab] = useState<GeoTab>("circle");
  const isRegion = tab === "region";
  const src = useMemo(() => data?.circleTeam ?? [], [data]);

  const grid = useMemo(() => {
    const groupOf = (x: (typeof src)[number]) => (isRegion ? x.region || "Region not set" : x.circle || "Circle not set");
    const cells = new Map<string, number>();
    const groupTotal = new Map<string, number>();
    const teamTotal = new Map<string, { teamId: number | null; team: string; n: number }>();
    src.forEach((x) => {
      const g = groupOf(x);
      const tk = String(x.teamId);
      cells.set(`${tk}|${g}`, (cells.get(`${tk}|${g}`) ?? 0) + num(x.crqs));
      groupTotal.set(g, (groupTotal.get(g) ?? 0) + num(x.crqs));
      const tt = teamTotal.get(tk) ?? { teamId: x.teamId, team: x.team, n: 0 };
      tt.n += num(x.crqs);
      teamTotal.set(tk, tt);
    });
    const groups = [...groupTotal].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([g]) => g);
    const teams = [...teamTotal.values()].sort((a, b) => b.n - a.n);
    const max = Math.max(1, ...cells.values());
    return { groups, teams, cells, groupTotal, max, total: sumBy(src, (x) => x.crqs) };
  }, [src, isRegion]);

  const key = isRegion ? "REGION_TEAM" : "CIRCLE_TEAM";
  const plural = isRegion ? "regions" : "circles";
  const drillOf = (group: string, teamId: number | null, team?: string): P1Drill => ({
    title: `${group === "ALL" ? `All ${plural}` : group}${team ? ` · ${team}` : ""} · received`,
    key,
    value: `${group}|${teamId ?? ""}`,
  });
  type Row = (typeof grid.teams)[number];
  const cell = (r: Row, g: string) => grid.cells.get(`${r.teamId}|${g}`) ?? 0;

  const columns: P1Column<Row>[] = [
    { key: "team", header: "Team", cell: (r) => <b>{r.team}</b>, exportValue: (r) => r.team, foot: "Total" },
    ...grid.groups.map(
      (g): P1Column<Row> => ({
        key: g,
        header: g,
        align: "right",
        cellSx: (r) => ({ background: colors.shade(cell(r, g) / grid.max) }),
        // The "Not set" team has no id to filter on, so only its totals are clickable.
        cell: (r) => <Num v={cell(r, g)} color={colors.tokens.textPrimary} d={r.teamId == null ? undefined : drillOf(g, r.teamId, r.team)} />,
        exportValue: (r) => cell(r, g),
        foot: <Num v={grid.groupTotal.get(g)} d={drillOf(g, null)} />,
      }),
    ),
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (r) => <Num v={r.n} bold d={r.teamId == null ? undefined : drillOf("ALL", r.teamId, r.team)} />,
      exportValue: (r) => r.n,
      foot: <Num v={grid.total} d={drillOf("ALL", null)} />,
    },
  ];

  return (
    <P1Card
      title={isRegion ? "Region & team breakdown — CRQs received" : "Circle & team breakdown — CRQs received"}
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-ct"
      right={<Seg value={tab} options={GEO_OPTIONS} onChange={setTab} ariaLabel="Group by" />}
      loading={loading}
      error={error}
      onExport={() => exportP1Table(isRegion ? "Region and team breakdown" : "Circle and team breakdown", columns, grid.teams)}
    >
      {grid.teams.length ? <P1Table columns={columns} rows={grid.teams} rowKey={(r) => String(r.teamId)} stickyFirst /> : <P1Empty message="No CRQs received in this range." />}
    </P1Card>
  );
}

/* ══════════════ 14 · Day / Night comparison ══════════════ */

type DnKey = "closed" | "completed" | "cancelled" | "rejected" | "failed";
const DN_COLS: { key: DnKey; label: string; status: string }[] = [
  { key: "closed", label: "Closed", status: "CLOSED" },
  { key: "completed", label: "Completed", status: "COMPLETED" },
  { key: "cancelled", label: "Cancelled", status: "CANCELLED" },
  { key: "rejected", label: "Rejected", status: "REJECTED" },
  { key: "failed", label: "Failed", status: "FAILED" },
];

export function DayNightCard({ data, loading, error }: BreakdownCardProps) {
  const { f, colors, openDrill } = useP1();
  const byShift = (s: P1ShiftKind) => data?.dayNight.find((x) => x.shift === s);
  const allShifts: { shift: P1ShiftKind; label: string; color: string }[] = [
    { shift: "DAY", label: "Day", color: colors.day },
    { shift: "NIGHT", label: "Night (N shift)", color: colors.night },
    { shift: "NO_SLOT", label: "No slot", color: colors.cancelled },
  ];
  // "No slot" only appears when some stopped CRQ never got a slot.
  const shifts = allShifts.filter((s) => s.shift !== "NO_SLOT" || DN_COLS.some((c) => num(byShift("NO_SLOT")?.[c.key]) > 0));
  const drillOf = (s: (typeof allShifts)[number], c: (typeof DN_COLS)[number]): P1Drill => ({ title: `${s.label} · ${c.label}`, key: "DAYNIGHT", value: `${s.shift}|${c.status}` });
  const any = (data?.dayNight ?? []).some((x) => DN_COLS.some((c) => num(x[c.key])));

  type Row = (typeof allShifts)[number];
  const columns: P1Column<Row>[] = [
    {
      key: "shift",
      header: "Shift",
      cell: (s) => (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: "2px", background: s.color }} />
          {s.label}
        </Box>
      ),
      exportValue: (s) => s.label,
    },
    ...DN_COLS.map(
      (c): P1Column<Row> => ({ key: c.key, header: c.label, align: "right", cell: (s) => <Num v={byShift(s.shift)?.[c.key]} d={drillOf(s, c)} />, exportValue: (s) => num(byShift(s.shift)?.[c.key]) }),
    ),
  ];

  return (
    <P1Card
      title="Day / Night comparison by status"
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-dn"
      legend={shifts.map((s) => ({ label: s.label, color: s.color }))}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Day Night comparison", columns, shifts)}
      chart={
        any ? (
          <P1BarChart
            labels={DN_COLS.map((c) => c.label)}
            ariaLabel="Day and night CRQs by status"
            series={shifts.map((s) => ({ label: s.label, color: s.color, data: DN_COLS.map((c) => num(byShift(s.shift)?.[c.key as keyof P1DayNightDto] as number)), onClick: (i) => openDrill(drillOf(s, DN_COLS[i])) }))}
            extraTip={(i) => {
              const d = num(byShift("DAY")?.[DN_COLS[i].key]);
              const n = num(byShift("NIGHT")?.[DN_COLS[i].key]);
              return [["Night share", `${pct(n, d + n)}%`]];
            }}
          />
        ) : (
          <P1Empty />
        )
      }
      table={<P1Table columns={columns} rows={shifts} rowKey={(s) => s.shift} />}
    />
  );
}

/* ══════════════ 16 · Monthly rescheduled + 15 · reason-wise trend ══════════════ */

export function RescheduleMonthCard({ data, loading, error }: BreakdownCardProps) {
  const { f, colors, months, setMonths, openDrill } = useP1();
  const slots = monthSlots(months, f.now);
  const byMonth = new Map((data?.rescheduleMonths ?? []).map((m) => [m.month, m]));
  const crqs = (k: string) => num(byMonth.get(k)?.crqsRescheduled);
  const moves = (k: string) => num(byMonth.get(k)?.moves);
  const perCrq = (k: string) => (crqs(k) ? String(Math.round((moves(k) / crqs(k)) * 10) / 10) : "—");
  const drillOf = (s: (typeof slots)[number]): P1Drill => ({ title: `Rescheduled · ${s.tip}`, key: "RESCHED_MONTH", value: s.key, sub: s.tip, noRange: true });

  type Row = (typeof slots)[number];
  const rows = [...slots].reverse();
  const columns: P1Column<Row>[] = [
    { key: "month", header: "Month", cell: (s) => s.tip, exportValue: (s) => s.tip, foot: "Total" },
    { key: "crqs", header: "CRQs rescheduled", align: "right", cell: (s) => <Num v={crqs(s.key)} bold d={drillOf(s)} />, exportValue: (s) => crqs(s.key), foot: fmtN(sumBy(slots, (s) => crqs(s.key))) },
    { key: "moves", header: "Moves", align: "right", cell: (s) => fmtN(moves(s.key)), exportValue: (s) => moves(s.key), foot: fmtN(sumBy(slots, (s) => moves(s.key))) },
    { key: "per", header: "Moves per CRQ", align: "right", cell: (s) => perCrq(s.key), exportValue: (s) => perCrq(s.key), foot: "" },
  ];

  return (
    <P1Card
      title="Monthly rescheduled CRQ trend"
      tag={<Tag kind="own" text={`Last ${months} months`} />}
      info="r-rsm"
      legend={[{ label: "CRQs rescheduled", color: colors.rescheduled }]}
      right={<Seg value={months} options={MONTH_OPTIONS} onChange={setMonths} ariaLabel="Months shown" />}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Monthly rescheduled CRQs", columns, rows)}
      chart={
        <P1BarChart
          labels={slots.map((s) => s.label)}
          tipLabels={slots.map((s) => s.tip)}
          ariaLabel="CRQs rescheduled per month"
          series={[{ label: "CRQs rescheduled", color: colors.rescheduled, data: slots.map((s) => crqs(s.key)), onClick: (i) => openDrill(drillOf(slots[i])) }]}
          extraTip={(i) => [
            ["Moves", fmtN(moves(slots[i].key))],
            ["Moves per CRQ", perCrq(slots[i].key)],
          ]}
        />
      }
      table={<P1Table columns={columns} rows={rows} rowKey={(s) => s.key} />}
    />
  );
}

export function RescheduleReasonCard({ data, loading, error }: BreakdownCardProps) {
  const { f, colors, months, setMonths, openDrill } = useP1();
  const slots = monthSlots(months, f.now);
  const rr = data?.rescheduleReasons ?? [];
  const top = (data?.meta?.topReasons ?? "").split("|").filter(Boolean);
  const reasons = [...top, ...(rr.some((x) => x.reason === "Other") ? ["Other"] : [])];
  const color = (r: string) => (r === "Other" ? colors.cancelled : colors.cat[top.indexOf(r) % colors.cat.length]);
  const val = (month: string, reason: string) => num(rr.find((x) => x.month === month && x.reason === reason)?.crqs);
  const drillOf = (reason: string, slot?: (typeof slots)[number]): P1Drill => ({
    title: `Rescheduled: ${reason}${slot ? ` · ${slot.tip}` : ""}`,
    key: "RESCHED_REASON",
    value: `${slot ? slot.key : "ALL"}|${months}|${reason}`,
    sub: slot ? slot.tip : `last ${months} months`,
    noRange: true,
  });

  type Row = { reason: string };
  const rows: Row[] = reasons.map((reason) => ({ reason }));
  const rowTotal = (r: string) => sumBy(slots, (s) => val(s.key, r));
  const columns: P1Column<Row>[] = [
    {
      key: "reason",
      header: "Reason",
      cell: (r) => (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Box sx={{ width: 9, height: 9, borderRadius: "2px", background: color(r.reason), flexShrink: 0 }} />
          {r.reason}
        </Box>
      ),
      exportValue: (r) => r.reason,
    },
    ...slots.map(
      (s): P1Column<Row> => ({ key: s.key, header: s.label, exportHeader: s.tip, align: "right", cell: (r) => <Num v={val(s.key, r.reason)} d={drillOf(r.reason, s)} />, exportValue: (r) => val(s.key, r.reason) }),
    ),
    { key: "total", header: "Total", align: "right", cell: (r) => <Num v={rowTotal(r.reason)} bold d={drillOf(r.reason)} />, exportValue: (r) => rowTotal(r.reason) },
  ];

  return (
    <P1Card
      title="Reschedule reason-wise trend"
      tag={<Tag kind="own" text={`Last ${months} months`} />}
      info="r-rsr"
      legend={reasons.map((r) => ({ label: r, color: color(r) }))}
      right={<Seg value={months} options={MONTH_OPTIONS} onChange={setMonths} ariaLabel="Months shown" />}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Reschedule reasons by month", columns, rows)}
      chart={
        reasons.length ? (
          <P1BarChart
            stacked
            height={250}
            labels={slots.map((s) => s.label)}
            tipLabels={slots.map((s) => s.tip)}
            ariaLabel="CRQs rescheduled per month by reason"
            series={reasons.map((r) => ({ label: r, color: color(r), data: slots.map((s) => val(s.key, r)), onClick: (i) => openDrill(drillOf(r, slots[i])) }))}
          />
        ) : (
          <P1Empty message="No reschedules in these months." />
        )
      }
      table={rows.length ? <P1Table columns={columns} rows={rows} rowKey={(r) => r.reason} stickyFirst /> : <P1Empty />}
    />
  );
}
