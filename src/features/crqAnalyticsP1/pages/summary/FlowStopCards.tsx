import { useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { PieChartCard } from "../../../crqAnalytics/components/PieChartCard";
import { Num, Seg, SideTag, Tag } from "../../components/P1Bits";
import { P1BarChart } from "../../components/P1BarChart";
import { P1Card, P1Empty } from "../../components/P1Card";
import { P1HBars } from "../../components/P1HBars";
import { P1Table, type P1Column } from "../../components/P1Table";
import { useP1 } from "../../hooks/useP1Context";
import type { P1Drill, P1StepDto, P1StopCounts, P1StopGeoDto, P1StopReasonDto } from "../../types/crqAnalyticsP1.types";
import { exportP1Table } from "../../utils/p1Export";
import { STAGES, fmtN, monthSlots, num, parseDT, pct, stepInfo, sumBy } from "../../utils/p1Format";
import type { SummaryCardProps } from "./OverviewCards";

const stepWindow = (b: P1StepDto) => ({ from: parseDT(b.bucketStart) ?? undefined, to: parseDT(b.bucketEnd) ?? undefined });

export const MONTH_OPTIONS = [
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
] as const;

type StopType = "CANCELLED" | "REJECTED" | "UNKNOWN";
const STOP_LABEL: Record<StopType, string> = { CANCELLED: "Cancelled", REJECTED: "Rejected", UNKNOWN: "Type not mapped yet" };
const STOP_FIELD: Record<StopType, keyof P1StopCounts> = { CANCELLED: "cancelled", REJECTED: "rejected", UNKNOWN: "cancelTypeUnknown" };

/** Cancelled + Rejected, plus "Type not mapped yet" only while some stops still have no mapping. */
const stopTypes = (rows: readonly P1StopCounts[]): StopType[] =>
  sumBy(rows, (r) => r.cancelTypeUnknown) > 0 ? ["CANCELLED", "REJECTED", "UNKNOWN"] : ["CANCELLED", "REJECTED"];

/* ══════════════ Step charts: flow run rate + finishing as many as we receive ══════════════ */

interface StepSeries {
  label: string;
  color: string;
  pick: (b: P1StepDto) => number | null;
  drill: (b: P1StepDto) => Pick<P1Drill, "key" | "value" | "from" | "to">;
}

function StepCard({ title, info, data, loading, error, series, diff }: SummaryCardProps & { title: string; info: "r-flow" | "r-inout"; series: StepSeries[]; diff?: boolean }) {
  const { f, colors, openDrill } = useP1();
  const steps = useMemo(() => data?.steps ?? [], [data]);
  const si = useMemo(() => stepInfo(steps), [steps]);
  const drillOf = (s: StepSeries, i: number): P1Drill => ({ title: `${s.label} · ${si.tips[i]}`, sub: si.tips[i], ...s.drill(steps[i]) });

  type Row = { b: P1StepDto; i: number };
  const rows: Row[] = steps.map((b, i) => ({ b, i })).reverse();
  const columns: P1Column<Row>[] = [
    { key: "step", header: si.unit, cell: (r) => si.tips[r.i], exportValue: (r) => si.tips[r.i], foot: "Total" },
    ...series.map(
      (s): P1Column<Row> => ({
        key: s.label,
        header: s.label,
        align: "right",
        cell: (r) => <Num v={s.pick(r.b)} d={drillOf(s, r.i)} />,
        exportValue: (r) => num(s.pick(r.b)),
        foot: fmtN(sumBy(steps, s.pick)),
      }),
    ),
    ...(diff
      ? [
          {
            key: "diff",
            header: "Difference",
            align: "right" as const,
            cell: (r: Row) => {
              const d = num(series[0].pick(r.b)) - num(series[1].pick(r.b));
              return <Box component="span" sx={{ color: d > 0 ? colors.tokens.danger : colors.tokens.success, fontWeight: 600 }}>{`${d > 0 ? "+" : ""}${fmtN(d)}`}</Box>;
            },
            exportValue: (r: Row) => num(series[0].pick(r.b)) - num(series[1].pick(r.b)),
            foot: fmtN(sumBy(steps, series[0].pick) - sumBy(steps, series[1].pick)),
          },
        ]
      : []),
  ];

  return (
    <P1Card
      title={title}
      tag={<Tag kind="range" text={f.range.short} />}
      info={info}
      legend={series.map((s) => ({ label: s.label, color: s.color }))}
      loading={loading}
      error={error}
      onExport={() => exportP1Table(title, columns, rows)}
      chart={
        steps.length ? (
          <P1BarChart
            labels={si.labels}
            tipLabels={si.tips}
            height={240}
            ariaLabel={`${title} per ${si.unit.toLowerCase()}`}
            series={series.map((s) => ({ label: s.label, color: s.color, data: steps.map((b) => num(s.pick(b))), onClick: (i) => openDrill(drillOf(s, i)) }))}
          />
        ) : (
          <P1Empty />
        )
      }
      table={steps.length ? <P1Table columns={columns} rows={rows} rowKey={(r) => r.b.bucketNo} maxHeight={420} /> : <P1Empty />}
    />
  );
}

export function FlowCard(props: SummaryCardProps) {
  const c = useP1().colors;
  return (
    <StepCard
      {...props}
      title="CRQ flow run rate — CCB to SE, SE to closed"
      info="r-flow"
      series={[
        { label: "Received in CCB", color: c.received, pick: (b) => b.received, drill: (b) => ({ key: "RECEIVED", ...stepWindow(b) }) },
        { label: "Moved to SE", color: c.movedToSe, pick: (b) => b.movedToSe, drill: (b) => ({ key: "MOVED_TO_SE", ...stepWindow(b) }) },
        { label: "SE to closed", color: c.done, pick: (b) => b.seClosed, drill: (b) => ({ key: "SIDE_CLOSED", value: "SE", ...stepWindow(b) }) },
      ]}
    />
  );
}

export function InOutCard(props: SummaryCardProps) {
  const c = useP1().colors;
  return (
    <StepCard
      {...props}
      title="Are we finishing as many as we receive?"
      info="r-inout"
      diff
      series={[
        { label: "Received", color: c.received, pick: (b) => b.received, drill: (b) => ({ key: "RECEIVED", ...stepWindow(b) }) },
        { label: "Done", color: c.done, pick: (b) => b.done, drill: (b) => ({ key: "ENDED", value: "DONE", ...stepWindow(b) }) },
      ]}
    />
  );
}

/* ══════════════ Cancelled CRQs — CCB vs SE ══════════════ */

export function CancelSideCard({ data, loading, error }: SummaryCardProps) {
  const { f, colors, openDrill: open } = useP1();
  const sides = (["CCB", "SE"] as const).map(
    (side) => data?.stopBySide.find((x) => x.side === side) ?? { side, cancelled: 0, rejected: 0, cancelTypeUnknown: 0, total: 0 },
  );
  const types = stopTypes(sides);
  const totalCancelled = sumBy(sides, (s) => s.cancelled);
  const sideLabel = { CCB: "CCB (first 4 stages)", SE: "SE (last 3 stages)" } as const;
  const drillOf = (side: string, type: StopType | "CANCELLED"): P1Drill => ({ title: `${STOP_LABEL[type]} while with ${side}`, key: "CANCEL_SIDE", value: `${side}|${type}` });

  type Row = (typeof sides)[number];
  const columns: P1Column<Row>[] = [
    { key: "side", header: "Side", cell: (r) => <SideTag side={r.side} />, exportValue: (r) => r.side },
    ...types.map(
      (ty): P1Column<Row> => ({
        key: ty,
        header: STOP_LABEL[ty],
        align: "right",
        cell: (r) => <Num v={r[STOP_FIELD[ty]]} d={drillOf(r.side, ty)} />,
        exportValue: (r) => num(r[STOP_FIELD[ty]]),
      }),
    ),
    { key: "share", header: "Share of cancelled", align: "right", cell: (r) => `${pct(r.cancelled, totalCancelled)}%`, exportValue: (r) => pct(r.cancelled, totalCancelled) },
  ];

  return (
    <P1Card
      title="Cancelled CRQs — CCB vs SE"
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-cfn"
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Cancelled CRQs CCB vs SE", columns, sides)}
      chart={
        totalCancelled ? (
          <Box sx={{ height: 220 }}>
            <PieChartCard
              slices={sides.map((s) => ({ label: sideLabel[s.side as "CCB" | "SE"], value: num(s.cancelled) }))}
              colors={[colors.ccb, colors.se]}
              showValues
              centerUnit="cancelled"
              onSliceClick={(label) => {
                const side = label.startsWith("CCB") ? "CCB" : "SE";
                open(drillOf(side, "CANCELLED"));
              }}
            />
          </Box>
        ) : (
          <P1Empty message="No cancelled CRQs in this range." />
        )
      }
      table={<P1Table columns={columns} rows={sides} rowKey={(r) => r.side} />}
    />
  );
}

/* ══════════════ Cancelled and rejected — month by month ══════════════ */

export function CancelMonthCard({ data, loading, error }: SummaryCardProps) {
  const { f, colors, months, setMonths, openDrill: open } = useP1();
  const slots = monthSlots(months, f.now);
  const byMonth = new Map((data?.stopByMonth ?? []).map((m) => [m.month, m]));
  const types = stopTypes(data?.stopByMonth ?? []);
  const typeColor: Record<StopType, string> = { CANCELLED: colors.cancelled, REJECTED: colors.rejected, UNKNOWN: colors.unknown };
  const val = (key: string, ty: StopType) => num(byMonth.get(key)?.[STOP_FIELD[ty]]);
  const drillOf = (slot: (typeof slots)[number], ty: StopType): P1Drill => ({ title: `${STOP_LABEL[ty]} · ${slot.tip}`, key: "ENDED_MONTH", value: `${slot.key}|${ty}`, sub: slot.tip, noRange: true });

  type Row = (typeof slots)[number];
  const rows = [...slots].reverse();
  const columns: P1Column<Row>[] = [
    { key: "month", header: "Month", cell: (s) => s.tip, exportValue: (s) => s.tip },
    ...types.map(
      (ty): P1Column<Row> => ({ key: ty, header: STOP_LABEL[ty], align: "right", cell: (s) => <Num v={val(s.key, ty)} d={drillOf(s, ty)} />, exportValue: (s) => val(s.key, ty) }),
    ),
    { key: "total", header: "Total", align: "right", cell: (s) => <b>{fmtN(types.reduce((a, ty) => a + val(s.key, ty), 0))}</b>, exportValue: (s) => types.reduce((a, ty) => a + val(s.key, ty), 0) },
  ];

  return (
    <P1Card
      title="Cancelled and rejected — month by month"
      tag={<Tag kind="own" text={`Last ${months} months`} />}
      info="r-cmon"
      legend={types.map((ty) => ({ label: STOP_LABEL[ty], color: typeColor[ty] }))}
      right={<Seg value={months} options={MONTH_OPTIONS} onChange={setMonths} ariaLabel="Months shown" />}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Cancelled and rejected by month", columns, rows)}
      chart={
        <P1BarChart
          labels={slots.map((s) => s.label)}
          tipLabels={slots.map((s) => s.tip)}
          ariaLabel="Cancelled and rejected per month"
          series={types.map((ty) => ({ label: STOP_LABEL[ty], color: typeColor[ty], data: slots.map((s) => val(s.key, ty)), onClick: (i) => open(drillOf(slots[i], ty)) }))}
        />
      }
      table={<P1Table columns={columns} rows={rows} rowKey={(s) => s.key} />}
    />
  );
}

/* ══════════════ Why were CRQs cancelled or rejected? ══════════════ */

export function CancelWhyCard({ data, loading, error }: SummaryCardProps) {
  const { f, colors, openDrill: open } = useP1();
  const [showAll, setShowAll] = useState(false);
  const reasons = useMemo(() => data?.stopByReason ?? [], [data]);
  const types = stopTypes(reasons);
  const typeColor: Record<StopType, string> = { CANCELLED: colors.cancelled, REJECTED: colors.rejected, UNKNOWN: colors.unknown };
  const total = sumBy(reasons, (r) => r.total);
  const drillOf = (reason: string, ty: StopType | "STOPPED"): P1Drill => ({
    title: ty === "STOPPED" ? `Reason: ${reason}` : `${reason} · ${STOP_LABEL[ty].toLowerCase()}`,
    key: "CANCEL_REASON",
    value: `${reason}|${ty}`,
  });

  // Share of all stops covered by this reason and every reason above it (rows are sorted by total).
  const runningShare = useMemo(() => {
    const cumulative = reasons.reduce<number[]>((acc, r) => [...acc, (acc[acc.length - 1] ?? 0) + num(r.total)], []);
    return cumulative.map((c) => pct(c, total));
  }, [reasons, total]);

  const shown = showAll ? reasons : reasons.slice(0, 12);
  const bars = shown.map((r, i) => ({
    key: r.reason,
    label: r.reason,
    value: num(r.total),
    text: `${fmtN(num(r.total))} · ${pct(r.total, total)}%`,
    onClick: () => open(drillOf(r.reason, "STOPPED")),
    segs: types.map((ty) => ({ value: num(r[STOP_FIELD[ty]]), color: typeColor[ty], onClick: () => open(drillOf(r.reason, ty)) })),
    tip: [
      ...types.map((ty): [string, string] => [STOP_LABEL[ty], fmtN(num(r[STOP_FIELD[ty]]))]),
      ["Share", `${pct(r.total, total)}%`] as [string, string],
      ["Running total", `${runningShare[i]}%`] as [string, string],
    ],
  }));
  const columns: P1Column<P1StopReasonDto>[] = [
    { key: "reason", header: "Reason", cell: (r) => r.reason, exportValue: (r) => r.reason },
    ...types.map(
      (ty): P1Column<P1StopReasonDto> => ({ key: ty, header: STOP_LABEL[ty], align: "right", cell: (r) => <Num v={r[STOP_FIELD[ty]]} d={drillOf(r.reason, ty)} />, exportValue: (r) => num(r[STOP_FIELD[ty]]) }),
    ),
    { key: "total", header: "Total", align: "right", cell: (r) => <b>{fmtN(num(r.total))}</b>, exportValue: (r) => num(r.total) },
    { key: "share", header: "Share", align: "right", cell: (r) => `${pct(r.total, total)}%`, exportValue: (r) => pct(r.total, total) },
    { key: "run", header: "Running total", align: "right", cell: (_r, i) => `${runningShare[i]}%`, exportValue: (r) => runningShare[reasons.indexOf(r)] },
  ];

  return (
    <P1Card
      title="Why were CRQs cancelled or rejected?"
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-why"
      legend={types.map((ty) => ({ label: STOP_LABEL[ty], color: typeColor[ty] }))}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Cancel and reject reasons", columns, reasons)}
      chart={
        reasons.length ? (
          <>
            <P1HBars rows={bars} max={Math.max(1, ...reasons.map((r) => num(r.total)))} />
            {reasons.length > 12 && (
              <Button size="small" variant="outlined" sx={{ mt: 1.25, textTransform: "none", alignSelf: "flex-start" }} onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show top 12" : `Show all ${reasons.length} reasons`}
              </Button>
            )}
          </>
        ) : (
          <P1Empty message="Nothing cancelled or rejected in this range." />
        )
      }
      table={reasons.length ? <P1Table columns={columns} rows={reasons} rowKey={(r) => r.reason} maxHeight={460} /> : <P1Empty />}
    />
  );
}

/* ══════════════ Where were CRQs cancelled or rejected? ══════════════ */

export function CancelWhereCard({ data, loading, error }: SummaryCardProps) {
  const { f, colors, openDrill: open } = useP1();
  const t = colors.tokens;
  const rows = STAGES.map((s) => {
    const x = data?.stopByStage.find((w) => w.stageNo === s.no);
    return { s, cancelled: num(x?.cancelled), rejected: num(x?.rejected), cancelTypeUnknown: num(x?.cancelTypeUnknown), total: num(x?.total) };
  });
  const types = stopTypes(rows);
  const typeColor: Record<StopType, string> = { CANCELLED: colors.cancelled, REJECTED: colors.rejected, UNKNOWN: colors.unknown };
  const max = Math.max(1, ...rows.flatMap((r) => types.map((ty) => r[STOP_FIELD[ty]] as number)));
  const totalAll = sumBy(rows, (r) => r.total);
  const drillOf = (code: string, label: string, ty: StopType | "STOPPED"): P1Drill => ({
    title: `${ty === "STOPPED" ? "Stopped" : STOP_LABEL[ty]} at ${label}`,
    key: "CANCEL_STAGE",
    value: `${code}|${ty}`,
  });

  type Row = (typeof rows)[number];
  const columns: P1Column<Row>[] = [
    { key: "stage", header: "Stage", cell: (r) => r.s.label, exportValue: (r) => r.s.label, foot: "Total" },
    { key: "side", header: "Side", cell: (r) => <SideTag side={r.s.side} />, exportValue: (r) => r.s.side, foot: "" },
    ...types.map(
      (ty): P1Column<Row> => ({
        key: ty,
        header: STOP_LABEL[ty],
        align: "right",
        cell: (r) => <Num v={r[STOP_FIELD[ty]] as number} d={drillOf(r.s.code, r.s.label, ty)} />,
        exportValue: (r) => r[STOP_FIELD[ty]] as number,
        foot: fmtN(sumBy(rows, (r) => r[STOP_FIELD[ty]] as number)),
      }),
    ),
    { key: "total", header: "Total", align: "right", cell: (r) => <Num v={r.total} bold d={drillOf(r.s.code, r.s.label, "STOPPED")} />, exportValue: (r) => r.total, foot: fmtN(totalAll) },
  ];

  return (
    <P1Card
      title="Where were CRQs cancelled or rejected?"
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-where"
      legend={types.map((ty) => ({ label: STOP_LABEL[ty], color: typeColor[ty] }))}
      loading={loading}
      error={error}
      onExport={() => exportP1Table("Where CRQs were stopped", columns, rows)}
      chart={
        totalAll ? (
          <Box>
            {types.map((ty) => (
              <Box key={ty} sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: t.textSecondary, mb: 0.5 }}>
                  {STOP_LABEL[ty]}, by the stage it was in
                </Typography>
                <P1HBars
                  max={max}
                  rows={rows.map((r) => ({
                    key: r.s.code,
                    label: r.s.label,
                    value: r[STOP_FIELD[ty]] as number,
                    color: typeColor[ty],
                    onClick: r[STOP_FIELD[ty]] ? () => open(drillOf(r.s.code, r.s.label, ty)) : undefined,
                  }))}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <P1Empty message="Nothing cancelled or rejected in this range." />
        )
      }
      table={<P1Table columns={columns} rows={rows} rowKey={(r) => r.s.code} />}
    />
  );
}

/* ══════════════ Circle-wise cancellation report (Circle / Region tab) ══════════════ */

export function CancelGeoCard({ circles, regions, loading, error }: { circles: P1StopGeoDto[] | undefined; regions: P1StopGeoDto[] | undefined; loading: boolean; error: boolean }) {
  const { f } = useP1();
  const [tab, setTab] = useState<"circle" | "region">("circle");
  const isRegion = tab === "region";
  const rows = (isRegion ? regions : circles) ?? [];
  const name = (r: P1StopGeoDto) => (isRegion ? r.region : r.circle) ?? "Not set";
  const key = isRegion ? "REGION_STOPPED" : "CIRCLE_STOPPED";
  const types = stopTypes(rows);
  const total = sumBy(rows, (r) => r.total);
  const drillOf = (r: P1StopGeoDto, ty: StopType): P1Drill => ({ title: `${name(r)} — ${STOP_LABEL[ty].toLowerCase()}`, key, value: `${name(r)}|${ty}` });

  const columns: P1Column<P1StopGeoDto>[] = [
    { key: "name", header: isRegion ? "Region" : "Circle", cell: (r) => <b>{name(r)}</b>, exportValue: name, foot: "Total" },
    ...types.map(
      (ty): P1Column<P1StopGeoDto> => ({
        key: ty,
        header: STOP_LABEL[ty],
        align: "right",
        cell: (r) => <Num v={r[STOP_FIELD[ty]]} d={drillOf(r, ty)} />,
        exportValue: (r) => num(r[STOP_FIELD[ty]]),
        foot: fmtN(sumBy(rows, (r) => r[STOP_FIELD[ty]])),
      }),
    ),
    { key: "total", header: "Total", align: "right", cell: (r) => <b>{fmtN(num(r.total))}</b>, exportValue: (r) => num(r.total), foot: fmtN(total) },
    { key: "share", header: "Share", align: "right", cell: (r) => `${pct(r.total, total)}%`, exportValue: (r) => pct(r.total, total), foot: total ? "100%" : "0%" },
    {
      key: "main",
      header: "Main reason",
      cell: (r) =>
        r.mainReason ? (
          <>
            {r.mainReason}{" "}
            <Box component="span" sx={{ opacity: 0.65 }}>
              ({fmtN(num(r.mainReasonCrqs))})
            </Box>
          </>
        ) : (
          "—"
        ),
      exportValue: (r) => r.mainReason ?? "",
      foot: "",
    },
  ];

  return (
    <P1Card
      title={isRegion ? "Region-wise cancellation report" : "Circle-wise cancellation report"}
      tag={<Tag kind="range" text={f.range.short} />}
      info="r-circle"
      right={
        <Seg
          value={tab}
          ariaLabel="Group by"
          onChange={setTab}
          options={[
            { value: "circle", label: "Circle" },
            { value: "region", label: "Region" },
          ]}
        />
      }
      loading={loading}
      error={error}
      onExport={() => exportP1Table(isRegion ? "Region-wise cancellation" : "Circle-wise cancellation", columns, rows)}
    >
      {rows.length ? <P1Table columns={columns} rows={rows} rowKey={name} /> : <P1Empty />}
    </P1Card>
  );
}
