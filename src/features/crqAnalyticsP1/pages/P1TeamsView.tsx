import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { MaterialReactTable, MRT_GlobalFilterTextField, type MRT_ColumnDef, type MRT_TableInstance } from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import dayjs from "dayjs";
import { PieChartCard } from "../../crqAnalytics/components/PieChartCard";
import { useGetP1NightsQuery, useGetP1TeamsQuery } from "../api/crqAnalyticsP1Api";
import { Num, Section, Seg, SideTag, Tag } from "../components/P1Bits";
import { P1BarChart } from "../components/P1BarChart";
import { P1Card, P1Empty } from "../components/P1Card";
import { P1HBars } from "../components/P1HBars";
import { P1Table, type P1Column } from "../components/P1Table";
import { useP1 } from "../hooks/useP1Context";
import type { P1BookingDto, P1Drill, P1EngineerHoursDto, P1NightDto, P1RequestorDto, P1TaskTypeDto } from "../types/crqAnalyticsP1.types";
import { exportP1Objects, exportP1Table } from "../utils/p1Export";
import { STAGES, dayLabel, dur, fmtN, h1, num, pct, sumBy, ymd } from "../utils/p1Format";

type NightRange = "last7" | "next7" | "next14";
const NIGHT_OPTIONS: { value: NightRange; label: string }[] = [
  { value: "last7", label: "Last 7 nights" },
  { value: "next7", label: "Next 7 nights" },
  { value: "next14", label: "Next 14 nights" },
];

/** Tonight = today, or yesterday before the 06:00 night cut-off (NIGHT_DAY_CUTOFF). */
const nightWindow = (range: NightRange, now: number) => {
  const tonight = dayjs(now).subtract(dayjs(now).hour() < 6 ? 1 : 0, "day").startOf("day");
  if (range === "last7") return { from: ymd(tonight.subtract(7, "day").valueOf()), to: ymd(tonight.subtract(1, "day").valueOf()), name: "last 7 nights" };
  if (range === "next14") return { from: ymd(tonight.valueOf()), to: ymd(tonight.add(13, "day").valueOf()), name: "next 14 nights" };
  return { from: ymd(tonight.valueOf()), to: ymd(tonight.add(6, "day").valueOf()), name: "next 7 nights" };
};

type HourKey = "crqReviewH" | "impactAnalysisH" | "mopCreationH" | "mopValidationH" | "schedulingOfActivityH" | "executionH" | "closureH";
const HOUR_KEYS: HourKey[] = ["crqReviewH", "impactAnalysisH", "mopCreationH", "mopValidationH", "schedulingOfActivityH", "executionH", "closureH"];

/** Teams & people: who does the work and on what (CRQ_AN_SP_P1_TEAMS + CRQ_AN_SP_P1_NIGHTS). */
export default function P1TeamsView() {
  const { f } = useP1();
  const [nights, setNights] = useState<NightRange>("next7");
  const win = nightWindow(nights, f.now);

  const teams = useGetP1TeamsQuery({ ...f.filterParams, from: f.range.from, to: f.range.to });
  const night = useGetP1NightsQuery({ ...f.filterParams, nightsFrom: win.from, nightsTo: win.to });
  const tState = { loading: teams.isFetching && !teams.data, error: teams.isError };
  const nState = { loading: night.isFetching && !night.data, error: night.isError };

  return (
    <>
      <Section title="Hours & requestors" />
      <EngineerHoursCard rows={teams.data?.engineers ?? []} {...tState} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "repeat(2, minmax(0,1fr))" }, gap: 2, alignItems: "start" }}>
        <TaskTypeCard rows={teams.data?.taskTypes ?? []} {...tState} />
        <RequestorCard rows={teams.data?.requestors ?? []} {...tState} />
      </Box>

      <Section title="Planned nights & engineer bookings" right={<Seg value={nights} options={NIGHT_OPTIONS} onChange={setNights} ariaLabel="Nights shown" />} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "repeat(2, minmax(0,1fr))" }, gap: 2, alignItems: "start" }}>
        <NightsPlannedCard rows={night.data?.nights ?? []} name={win.name} {...nState} />
        <EngineersBookedCard rows={night.data?.nights ?? []} name={win.name} {...nState} />
      </Box>
      <BookingCard rows={night.data?.bookings ?? []} name={win.name.replace("nights", "days")} {...nState} />
    </>
  );
}

interface CardState {
  loading: boolean;
  error: boolean;
}

/* ══════════════ Engineer task summary ══════════════ */

function UtilCell({ v }: { v: number | null }) {
  const { colors } = useP1();
  const t = colors.tokens;
  if (v == null) return <Box component="span" sx={{ color: t.textDim }}>–</Box>;
  const x = num(v);
  const color = x > 100 ? t.danger : x >= 50 ? t.success : t.info;
  return (
    <Box component="span" title={`Utilization ${x}%`} sx={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", minWidth: 96 }}>
      <Box sx={{ width: 46, height: 6, borderRadius: "3px", background: t.trackOff, overflow: "hidden" }}>
        <Box sx={{ width: `${Math.min(100, x)}%`, height: "100%", background: color }} />
      </Box>
      <b>{Math.round(x * 10) / 10}%</b>
    </Box>
  );
}

function EngineerHoursCard({ rows, loading, error }: { rows: P1EngineerHoursDto[] } & CardState) {
  const { f, colors } = useP1();
  const who = (p: P1EngineerHoursDto) => p.employeeName || p.personOlmid;
  const tasksDrill = (p: P1EngineerHoursDto, stageNo?: number): P1Drill => ({
    title: `${who(p)} · ${stageNo ? STAGES[stageNo - 1].label : "all tasks"}${p.team ? ` (${p.team})` : ""}`,
    key: "PERSON_TASKS",
    value: `${p.personOlmid}||${stageNo ?? ""}`,
  });

  // Totals in the footer follow what the table shows (after a search).
  const visibleRows = (table: MRT_TableInstance<P1EngineerHoursDto>) => table.getFilteredRowModel().rows.map((r) => r.original);
  const right = { muiTableHeadCellProps: { align: "right" as const }, muiTableBodyCellProps: { align: "right" as const }, muiTableFooterCellProps: { align: "right" as const } };

  const columns = useMemo<MRT_ColumnDef<P1EngineerHoursDto>[]>(
    () => [
      {
        id: "who",
        header: "Engineer",
        // name and OLM id are both searchable
        accessorFn: (p) => `${p.employeeName ?? ""} ${p.personOlmid}`,
        size: 230,
        Cell: ({ row }) => (
          <>
            <b>{who(row.original)}</b>{" "}
            <Box component="span" sx={{ color: colors.tokens.textSecondary }}>
              {row.original.personOlmid}
            </Box>
          </>
        ),
        Footer: () => <b>Total</b>,
      },
      { id: "team", header: "Team", accessorFn: (p) => p.team || "Not set", size: 160 },
      { id: "side", header: "Side", accessorFn: (p) => p.sideByWork, size: 90, Cell: ({ row }) => <SideTag side={row.original.sideByWork} /> },
      ...HOUR_KEYS.map(
        (k, i): MRT_ColumnDef<P1EngineerHoursDto> => ({
          id: k,
          header: STAGES[i].label,
          accessorFn: (p) => num(p[k]),
          size: 110,
          ...right,
          Cell: ({ row }) => <Num v={row.original[k]} text={h1(row.original[k])} d={tasksDrill(row.original, i + 1)} />,
          Footer: ({ table }) => h1(sumBy(visibleRows(table), (p) => p[k])),
        }),
      ),
      {
        id: "total",
        header: "Total hrs",
        accessorFn: (p) => num(p.totalH),
        size: 100,
        ...right,
        Cell: ({ row }) => <Num v={row.original.totalH} bold text={h1(row.original.totalH)} d={tasksDrill(row.original)} />,
        Footer: ({ table }) => <b>{h1(sumBy(visibleRows(table), (p) => p.totalH))}</b>,
      },
      {
        id: "hold",
        header: "On hold hrs",
        accessorFn: (p) => num(p.onHoldH),
        size: 100,
        ...right,
        Cell: ({ row }) => h1(row.original.onHoldH),
        Footer: ({ table }) => h1(sumBy(visibleRows(table), (p) => p.onHoldH)),
      },
      {
        id: "tasks",
        header: "Tasks",
        accessorFn: (p) => num(p.tasksDone),
        size: 90,
        ...right,
        Cell: ({ row }) => <Num v={row.original.tasksDone} d={tasksDrill(row.original)} />,
        Footer: ({ table }) => fmtN(sumBy(visibleRows(table), (p) => p.tasksDone)),
      },
      {
        id: "roster",
        header: "Rostered hrs",
        accessorFn: (p) => p.rosterH ?? -1,
        size: 110,
        ...right,
        Cell: ({ row }) => (row.original.rosterH == null ? "–" : h1(row.original.rosterH)),
        Footer: ({ table }) => h1(sumBy(visibleRows(table), (p) => p.rosterH)),
      },
      {
        id: "util",
        header: "Utilization %",
        accessorFn: (p) => p.utilPct ?? -1,
        size: 130,
        ...right,
        Cell: ({ row }) => <UtilCell v={row.original.utilPct} />,
        Footer: ({ table }) => {
          // utilization of all engineers shown: their hours over their rostered hours
          const rostered = visibleRows(table).filter((p) => p.rosterH != null);
          const roster = sumBy(rostered, (p) => p.rosterH);
          return <UtilCell v={roster ? Math.round((1000 * sumBy(rostered, (p) => p.totalH)) / roster) / 10 : null} />;
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- who / tasksDrill / visibleRows are pure helpers of this render
    [colors],
  );

  // Your shared table (Material React Table), kept plain: its search box, sorting by clicking a
  // header, and paging. No column menus, column filters, show / hide columns or full screen.
  const table = useAppTable({
    columns,
    data: rows,
    enableSorting: true,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableHiding: false,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableToolbarInternalActions: false,
    // The search box sits in the card header (below), so the table needs no top bar of its own.
    enableTopToolbar: false,
    enableColumnPinning: true,
    initialState: {
      density: "compact",
      showGlobalFilter: true,
      sorting: [{ id: "total", desc: true }],
      columnPinning: { left: ["who"] },
      // always opens on 10 rows a page
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    appTable: { frame: false, maxHeight: 560, emptyTitle: "No finished work in this range." },
  });

  // Excel: exactly the rows the table shows, in its current order.
  const exportShown = () =>
    exportP1Objects(
      "Engineer task summary",
      table.getPrePaginationRowModel().rows.map(({ original: p }) => ({
        engineer: who(p),
        olmid: p.personOlmid,
        team: p.team ?? "",
        side: p.sideByWork,
        ...Object.fromEntries(HOUR_KEYS.map((k) => [k, num(p[k])])),
        totalH: num(p.totalH),
        onHoldH: num(p.onHoldH),
        tasksDone: num(p.tasksDone),
        rosterH: p.rosterH ?? "",
        utilPct: p.utilPct ?? "",
      })),
      {
        engineer: "Engineer",
        olmid: "OLM id",
        team: "Team",
        side: "Side",
        ...Object.fromEntries(HOUR_KEYS.map((k, i) => [k, `${STAGES[i].label} (h)`])),
        totalH: "Total hrs",
        onHoldH: "On hold hrs",
        tasksDone: "Tasks",
        rosterH: "Rostered hrs",
        utilPct: "Utilization %",
      },
    );

  return (
    <P1Card
      title="Engineer task summary — hours by task"
      tag={<Tag kind="range" text={f.range.short} />}
      info="t-tasks"
      legend={[
        { label: "Utilization under 50%", color: colors.tokens.info },
        { label: "50–100%", color: colors.tokens.success },
        { label: "Over 100%", color: colors.tokens.danger },
      ]}
      loading={loading}
      error={error}
      right={<MRT_GlobalFilterTextField table={table} />}
      onExport={exportShown}
    >
      <MaterialReactTable table={table} />
    </P1Card>
  );
}

/* ══════════════ Hours by task type ══════════════ */

function TaskTypeCard({ rows, loading, error }: { rows: P1TaskTypeDto[] } & CardState) {
  const { f, colors, openDrill } = useP1();
  const all = STAGES.map((s) => rows.find((r) => r.stageNo === s.no) ?? { stageNo: s.no, task: s.label, side: s.side, tasksDone: 0, hours: 0, avgMinPerTask: null, sharePct: 0 });
  const drillOf = (no: number): P1Drill => ({ title: `${STAGES[no - 1].label} · tasks finished`, key: "TASK_DONE", value: no });
  const totalTasks = sumBy(all, (r) => r.tasksDone);
  const totalHours = sumBy(all, (r) => r.hours);

  const columns: P1Column<P1TaskTypeDto>[] = [
    { key: "task", header: "Task", cell: (r) => STAGES[r.stageNo - 1].label, exportValue: (r) => STAGES[r.stageNo - 1].label, foot: "Total" },
    { key: "side", header: "Side", cell: (r) => <SideTag side={r.side} />, exportValue: (r) => r.side, foot: "" },
    { key: "tasks", header: "Tasks", align: "right", cell: (r) => <Num v={r.tasksDone} d={drillOf(r.stageNo)} />, exportValue: (r) => num(r.tasksDone), foot: fmtN(totalTasks) },
    { key: "hours", header: "Hours", align: "right", cell: (r) => h1(r.hours), exportValue: (r) => num(r.hours), foot: h1(totalHours) },
    { key: "avg", header: "Avg per task", align: "right", cell: (r) => dur(r.avgMinPerTask), exportValue: (r) => r.avgMinPerTask ?? "", foot: totalTasks ? dur((totalHours * 60) / totalTasks) : "—" },
    { key: "share", header: "Share", align: "right", cell: (r) => `${num(r.sharePct)}%`, exportValue: (r) => num(r.sharePct), foot: "100%" },
  ];

  return (
    <P1Card
      title="Hours by task type"
      tag={<Tag kind="range" text={f.range.short} />}
      info="t-type"
      legend={[
        { label: "CCB", color: colors.ccb },
        { label: "SE", color: colors.se },
      ]}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Hours by task type", columns, all)}
      chart={
        totalHours ? (
          <P1HBars
            rows={all.map((r) => ({
              key: String(r.stageNo),
              label: STAGES[r.stageNo - 1].label,
              value: num(r.hours),
              color: STAGES[r.stageNo - 1].side === "CCB" ? colors.ccb : colors.se,
              text: `${h1(r.hours)} h`,
              onClick: num(r.tasksDone) ? () => openDrill(drillOf(r.stageNo)) : undefined,
              tip: [
                ["Hours", h1(r.hours)],
                ["Tasks", fmtN(num(r.tasksDone))],
                ["Average", dur(r.avgMinPerTask)],
                ["Share", `${num(r.sharePct)}%`],
              ],
            }))}
          />
        ) : (
          <P1Empty message="No finished work in this range." />
        )
      }
      table={<P1Table columns={columns} rows={all} rowKey={(r) => r.stageNo} />}
    />
  );
}

/* ══════════════ CRQs by requestor ══════════════ */

type ReqKey = "openNow" | "done" | "cancelled" | "rejected" | "cancelTypeUnknown";

function RequestorCard({ rows, loading, error }: { rows: P1RequestorDto[] } & CardState) {
  const { f, openDrill } = useP1();
  const hasUnknown = sumBy(rows, (r) => r.cancelTypeUnknown) > 0;
  const drillOf = (r: P1RequestorDto, type: string, label: string): P1Drill => ({ title: `Requestor ${r.requestorType} · ${label}`, key: "REQUESTOR", value: `${r.requestorType}|${type}` });
  const statusCols: { key: ReqKey; label: string; type: string }[] = [
    { key: "openNow", label: "Open now", type: "OPEN" },
    { key: "done", label: "Done", type: "DONE" },
    { key: "cancelled", label: "Cancelled", type: "CANCELLED" },
    { key: "rejected", label: "Rejected", type: "REJECTED" },
    ...(hasUnknown ? [{ key: "cancelTypeUnknown" as ReqKey, label: "Type not mapped yet", type: "UNKNOWN" }] : []),
  ];

  const columns: P1Column<P1RequestorDto>[] = [
    { key: "req", header: "Requestor", cell: (r) => r.requestorType, exportValue: (r) => r.requestorType },
    { key: "received", header: "Received", align: "right", cell: (r) => <Num v={r.received} bold d={drillOf(r, "ALL", "received")} />, exportValue: (r) => num(r.received) },
    { key: "share", header: "Share", align: "right", cell: (r) => `${num(r.sharePct)}%`, exportValue: (r) => num(r.sharePct) },
    ...statusCols.map((c): P1Column<P1RequestorDto> => ({ key: c.key, header: c.label, align: "right", cell: (r) => <Num v={r[c.key]} d={drillOf(r, c.type, c.label.toLowerCase())} />, exportValue: (r) => num(r[c.key]) })),
  ];

  return (
    <P1Card
      title="CRQs by requestor"
      tag={<Tag kind="range" text={f.range.short} />}
      info="t-req"
      loading={loading}
      error={error}
      onExport={() => exportP1Table("CRQs by requestor", columns, rows)}
      chart={
        rows.length ? (
          <Box sx={{ height: 220 }}>
            <PieChartCard
              slices={rows.map((r) => ({ label: r.requestorType, value: num(r.received) }))}
              showValues
              centerUnit="received"
              onSliceClick={(label) => {
                const r = rows.find((x) => x.requestorType === label);
                if (r) openDrill(drillOf(r, "ALL", "received"));
              }}
            />
          </Box>
        ) : (
          <P1Empty message="No CRQs received in this range." />
        )
      }
      table={<P1Table columns={columns} rows={rows} rowKey={(r) => r.requestorType} />}
    />
  );
}

/* ══════════════ CRQs planned by night ══════════════ */

const nightDrill = (x: P1NightDto, type: string, label: string): P1Drill => ({
  title: `${label} · night of ${dayLabel(x.nightDate)}`,
  key: "NIGHT_PLANNED",
  value: `${x.nightDate}|${type}`,
  sub: `Night of ${dayLabel(x.nightDate)}`,
});

type PlanKey = "done" | "toRun" | "slotLapseOpen";

function NightsPlannedCard({ rows, name, loading, error }: { rows: P1NightDto[]; name: string } & CardState) {
  const { colors, openDrill } = useP1();
  const parts: { key: PlanKey; label: string; type: string; color: string }[] = [
    { key: "done", label: "Done", type: "DONE", color: colors.done },
    { key: "toRun", label: "Still to run", type: "AHEAD", color: colors.received },
    { key: "slotLapseOpen", label: "Slot Lapse, still open", type: "LAPSE", color: colors.tokens.danger },
  ];
  const any = rows.some((x) => num(x.plannedCrqs));

  const columns: P1Column<P1NightDto>[] = [
    { key: "night", header: "Night", cell: (x) => dayLabel(x.nightDate), exportValue: (x) => x.nightDate, foot: "Total" },
    { key: "planned", header: "Planned", align: "right", cell: (x) => <Num v={x.plannedCrqs} bold d={nightDrill(x, "ALL", "CRQs planned")} />, exportValue: (x) => num(x.plannedCrqs), foot: fmtN(sumBy(rows, (x) => x.plannedCrqs)) },
    ...parts.map(
      (p): P1Column<P1NightDto> => ({
        key: p.key,
        header: p.label,
        align: "right",
        cell: (x) => <Num v={x[p.key]} color={p.type === "LAPSE" ? colors.tokens.danger : undefined} d={nightDrill(x, p.type, p.label)} />,
        exportValue: (x) => num(x[p.key]),
        foot: fmtN(sumBy(rows, (x) => x[p.key])),
      }),
    ),
  ];

  return (
    <P1Card
      title="CRQs planned by night"
      tag={<Tag kind="own" text={`Nights · ${name}`} />}
      info="t-nplan"
      legend={parts.map((p) => ({ label: p.label, color: p.color }))}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("CRQs planned by night", columns, rows)}
      chart={
        any ? (
          <P1BarChart
            stacked
            labels={rows.map((x) => dayLabel(x.nightDate))}
            ariaLabel="CRQs planned per night"
            series={parts.map((p) => ({ label: p.label, color: p.color, data: rows.map((x) => num(x[p.key])), onClick: (i) => openDrill(nightDrill(rows[i], p.type, p.label)) }))}
          />
        ) : (
          <P1Empty message="No CRQs booked on these nights." />
        )
      }
      table={<P1Table columns={columns} rows={rows} rowKey={(x) => x.nightDate} />}
    />
  );
}

/* ══════════════ Engineers booked by night ══════════════ */

function EngineersBookedCard({ rows, name, loading, error }: { rows: P1NightDto[]; name: string } & CardState) {
  const { colors, openDrill } = useP1();
  const columns: P1Column<P1NightDto>[] = [
    { key: "night", header: "Night", cell: (x) => dayLabel(x.nightDate), exportValue: (x) => x.nightDate },
    { key: "roster", header: "On roster", align: "right", cell: (x) => fmtN(num(x.engineersOnRoster)), exportValue: (x) => num(x.engineersOnRoster) },
    { key: "booked", header: "Engineers booked", align: "right", cell: (x) => <b>{fmtN(num(x.engineersBooked))}</b>, exportValue: (x) => num(x.engineersBooked) },
    { key: "pct", header: "Booked % of roster", align: "right", cell: (x) => (num(x.engineersOnRoster) ? `${pct(x.engineersBooked, x.engineersOnRoster)}%` : "—"), exportValue: (x) => pct(x.engineersBooked, x.engineersOnRoster) },
    { key: "planned", header: "CRQs planned", align: "right", cell: (x) => <Num v={x.plannedCrqs} d={nightDrill(x, "ALL", "CRQs planned")} />, exportValue: (x) => num(x.plannedCrqs) },
    { key: "per", header: "CRQs per engineer", align: "right", cell: (x) => (x.crqsPerEngineer == null ? "—" : String(x.crqsPerEngineer)), exportValue: (x) => x.crqsPerEngineer ?? "" },
  ];

  return (
    <P1Card
      title="Engineers booked by night"
      tag={<Tag kind="own" text={`Nights · ${name}`} />}
      info="t-neng"
      legend={[
        { label: "On roster", color: colors.chrome.axis },
        { label: "Engineers booked", color: colors.se },
      ]}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Engineers booked by night", columns, rows)}
      chart={
        rows.length ? (
          <P1BarChart
            labels={rows.map((x) => dayLabel(x.nightDate))}
            ariaLabel="Engineers on roster and booked per night"
            series={[
              { label: "On roster", color: colors.chrome.axis, data: rows.map((x) => num(x.engineersOnRoster)) },
              {
                label: "Engineers booked",
                color: colors.se,
                data: rows.map((x) => num(x.engineersBooked)),
                onClick: (i) => openDrill({ ...nightDrill(rows[i], "ALL", "CRQs booked"), title: `CRQs booked · night of ${dayLabel(rows[i].nightDate)} (${fmtN(num(rows[i].engineersBooked))} engineers)` }),
              },
            ]}
            extraTip={(i) => [
              ["CRQs planned", fmtN(num(rows[i].plannedCrqs))],
              ["CRQs per engineer", rows[i].crqsPerEngineer == null ? "—" : String(rows[i].crqsPerEngineer)],
            ]}
          />
        ) : (
          <P1Empty />
        )
      }
      table={<P1Table columns={columns} rows={rows} rowKey={(x) => x.nightDate} />}
    />
  );
}

/* ══════════════ Engineer booked / available time by date ══════════════ */

interface BookPerson {
  olmid: string;
  name: string;
  level: string;
  vendor: string;
  team: string;
  byDate: Map<string, P1BookingDto>;
}

function BookingCard({ rows, name, loading, error }: { rows: P1BookingDto[]; name: string } & CardState) {
  const { colors } = useP1();
  const t = colors.tokens;

  const { dates, people } = useMemo(() => {
    const dateSet = [...new Set(rows.map((x) => x.shiftDate))].sort();
    const map = new Map<string, BookPerson>();
    rows.forEach((x) => {
      const p = map.get(x.personOlmid) ?? {
        olmid: x.personOlmid,
        name: x.employeeName || x.personOlmid,
        level: x.jobLevel || "—",
        vendor: x.vendorCompany || "—",
        team: x.team || "—",
        byDate: new Map<string, P1BookingDto>(),
      };
      p.byDate.set(x.shiftDate, x);
      map.set(x.personOlmid, p);
    });
    const list = [...map.values()].sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));
    return { dates: dateSet, people: list };
  }, [rows]);

  const shade = (b: number, a: number) => (!a ? (b ? t.dangerDim : undefined) : b > a ? t.dangerDim : b >= 0.8 * a ? t.warningDim : b > 0 ? t.successDim : undefined);
  const cellText = (x: P1BookingDto) => {
    const b = num(x.bookedMin);
    const a = num(x.availableMin);
    if (!a && !b) return x.dayType === "WEEK_OFF" ? "WO" : x.dayType === "LEAVE" ? "Leave" : "—";
    return `${fmtN(b)}/${fmtN(a)}`;
  };

  const columns: P1Column<BookPerson>[] = [
    {
      key: "who",
      header: "Engineer",
      cell: (p) => (
        <>
          <b>{p.name}</b>{" "}
          <Box component="span" sx={{ color: t.textSecondary }}>
            {p.olmid}
          </Box>
        </>
      ),
      exportValue: (p) => p.name,
      foot: "Total",
    },
    { key: "olmid", header: "OLM id", cell: () => null, exportValue: (p) => p.olmid, headSx: { display: "none" }, cellSx: () => ({ display: "none" }) },
    { key: "level", header: "Level", cell: (p) => p.level, exportValue: (p) => p.level, foot: "" },
    { key: "vendor", header: "Vendor", cell: (p) => p.vendor, exportValue: (p) => p.vendor, foot: "" },
    { key: "team", header: "Team", cell: (p) => p.team, exportValue: (p) => p.team, foot: "" },
    ...dates.map((d): P1Column<BookPerson> => {
      const ds = rows.filter((x) => x.shiftDate === d);
      const tb = sumBy(ds, (x) => x.bookedMin);
      const ta = sumBy(ds, (x) => x.availableMin);
      return {
        key: d,
        header: dayLabel(d),
        exportHeader: `${d} (booked/available min)`,
        align: "right",
        cellSx: (p) => {
          const x = p.byDate.get(d);
          return x ? { background: shade(num(x.bookedMin), num(x.availableMin)) } : undefined;
        },
        cell: (p) => {
          const x = p.byDate.get(d);
          if (!x) return <Box component="span" sx={{ color: t.textDim }}>—</Box>;
          const text = cellText(x);
          const muted = !num(x.availableMin) && !num(x.bookedMin);
          return (
            <Box component="span" sx={{ color: muted ? t.textSecondary : undefined }} title={`Booked ${dur(num(x.bookedMin))} · available ${num(x.availableMin) ? dur(num(x.availableMin)) : x.dayType === "WEEK_OFF" ? "week off" : "leave"} · ${fmtN(num(x.crqs))} CRQs${x.shiftName ? ` · shift ${x.shiftName}` : ""}`}>
              <Num
                v={x.crqs}
                text={text}
                color={t.textPrimary}
                d={{ title: `${p.name} · booked ${dayLabel(d)} (${fmtN(num(x.crqs))} CRQs)`, key: "PERSON_DAY", value: `${p.olmid}|${d}`, sub: dayLabel(d), noRange: true }}
              />
            </Box>
          );
        },
        exportValue: (p) => {
          const x = p.byDate.get(d);
          return x ? cellText(x) : "";
        },
        foot: (
          <span title={`All engineers shown · booked ${dur(tb)} of ${dur(ta)}`}>
            {fmtN(tb)}/{fmtN(ta)}
            <Box sx={{ fontSize: 11, fontWeight: 400, color: t.textSecondary }}>{ta ? `${pct(tb, ta)}%` : "—"}</Box>
          </span>
        ),
      };
    }),
  ];

  return (
    <P1Card
      title="Engineer booked / available time by date"
      tag={<Tag kind="own" text={`${name} · minutes`} />}
      info="t-book"
      legend={[
        { label: "Under 80%", color: t.successDim },
        { label: "80–100%", color: t.warningDim },
        { label: "Over 100%", color: t.dangerDim },
      ]}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Engineer booked and available minutes", columns, people)}
    >
      {people.length ? <P1Table columns={columns} rows={people} rowKey={(p) => p.olmid} stickyFirst maxHeight={560} /> : <P1Empty message="No engineers for this selection." />}
    </P1Card>
  );
}
