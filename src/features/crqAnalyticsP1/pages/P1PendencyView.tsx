import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useGetP1PendencyQuery } from "../api/crqAnalyticsP1Api";
import { Num, Seg, Tag } from "../components/P1Bits";
import { sequentialBlue } from "../../crqAnalytics/utils/chartPalette";
import { P1Card, P1Empty } from "../components/P1Card";
import { P1HBars, type P1HBarRow } from "../components/P1HBars";
import { P1Table, type P1Column } from "../components/P1Table";
import { useP1 } from "../hooks/useP1Context";
import type { P1Drill, P1TeamOpenDto, P1TeamStatusDto } from "../types/crqAnalyticsP1.types";
import { exportP1Table } from "../utils/p1Export";
import { fmtN, num, sumBy } from "../utils/p1Format";

/**
 * Colour of each age column in the table, youngest first (band 1 = 0–2 d … band 6 = over 30 d):
 * dark red, light red, neutral, light green, green, dark green. Text is white on the dark colours
 * and dark on the light ones, in light and dark mode alike. A band beyond the sixth takes the last.
 */
const AGE_BAND_COLORS: { bg: string; fg: string }[] = [
  { bg: "#C62828", fg: "#FFFFFF" }, // 0–2 d   dark red
  { bg: "#F8CACA", fg: "#5A1414" }, // 2–7 d   light red
  { bg: "#E9EDF2", fg: "#1F2933" }, // 7–15 d  neutral
  { bg: "#CBEFD8", fg: "#0E4D2C" }, // 15–21 d light green
  { bg: "#3E9E68", fg: "#FFFFFF" }, // 21–30 d green
  { bg: "#1B6B3C", fg: "#FFFFFF" }, // over 30 d dark green
];
const ageBandColor = (bandNo: number) => AGE_BAND_COLORS[Math.min(Math.max(bandNo, 1), AGE_BAND_COLORS.length) - 1];

/** A drill limited to one team row. The "Not set" team has no id to filter on, so it is not clickable. */
const teamDrill = (teamId: number | null, d: P1Drill): P1Drill | undefined => (teamId == null ? undefined : { ...d, team: teamId });

type GridRow = P1TeamOpenDto & { domain: string; showDomain: boolean };
type StatusKey = "openNow" | "withCcb" | "withSe" | "closed" | "cancelled" | "rejected" | "cancelTypeUnknown";

/** Pendency: how old the open work is (CRQ_AN_SP_P1_PENDENCY). */
export default function P1PendencyView() {
  const { f, colors, openDrill } = useP1();
  const t = colors.tokens;
  const { data, isFetching, isError } = useGetP1PendencyQuery({ ...f.filterParams, from: f.range.from, to: f.range.to });
  const loading = isFetching && !data;

  const domainOf = useMemo(() => new Map(f.orgTree.map((o) => [o.subDomainId, o.domainName])), [f.orgTree]);

  /* ── Open CRQs by team and age ─────────────────────────────────────── */
  const [ageMode, setAgeMode] = useState<"count" | "share">("count");
  const grid = useMemo(() => {
    const bands = [...(data?.bands ?? [])].sort((a, b) => a.bandNo - b.bandNo);
    const cells = new Map((data?.ageGrid ?? []).map((g) => [`${g.teamId}|${g.bandNo}`, num(g.crqs)]));
    const cell = (teamId: number | null, bandNo: number) => cells.get(`${teamId}|${bandNo}`) ?? 0;

    const sorted = (data?.teamTotals ?? [])
      .map((x) => ({ ...x, domain: (x.teamId != null && domainOf.get(x.teamId)) || "—" }))
      .sort((a, b) => a.domain.localeCompare(b.domain) || num(b.openTotal) - num(a.openTotal));
    const rows: GridRow[] = sorted.map((r, i) => ({ ...r, showDomain: i === 0 || sorted[i - 1].domain !== r.domain }));

    // Age columns carry their band colour on every cell with CRQs (0 stays plain). Slot Lapse (band 0)
    // is a state, not an age: it keeps its bold red numbers and no fill.
    const fill = (bandNo: number, n: number) => (bandNo === 0 || n <= 0 ? null : ageBandColor(bandNo));
    const now = { now: true } as const;

    const columns: P1Column<GridRow>[] = [
      { key: "domain", header: "Domain", cell: (r) => (r.showDomain ? <b>{r.domain}</b> : ""), exportValue: (r) => r.domain, foot: "All" },
      { key: "team", header: "Team", cell: (r) => r.team, exportValue: (r) => r.team, foot: "" },
      {
        key: "ccb",
        header: "With CCB",
        align: "right",
        cell: (r) => <Num v={r.withCcb} d={teamDrill(r.teamId, { title: `${r.team} · open with CCB`, key: "OPEN_SIDE", value: "CCB", ...now })} />,
        exportValue: (r) => num(r.withCcb),
        foot: <Num v={sumBy(rows, (r) => r.withCcb)} d={{ title: "All teams · open with CCB", key: "OPEN_SIDE", value: "CCB", ...now }} />,
      },
      {
        key: "se",
        header: "With SE",
        align: "right",
        cell: (r) => <Num v={r.withSe} d={teamDrill(r.teamId, { title: `${r.team} · open with SE`, key: "OPEN_SIDE", value: "SE", ...now })} />,
        exportValue: (r) => num(r.withSe),
        foot: <Num v={sumBy(rows, (r) => r.withSe)} d={{ title: "All teams · open with SE", key: "OPEN_SIDE", value: "SE", ...now }} />,
      },
      ...bands.map((b): P1Column<GridRow> => {
        const lapse = b.bandNo === 0;
        return {
          key: `band-${b.bandNo}`,
          header: lapse ? (
            b.bandLabel
          ) : (
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <Box component="span" sx={{ width: 9, height: 9, borderRadius: "2px", background: ageBandColor(b.bandNo).bg, border: `1px solid ${t.border}` }} />
              {b.bandLabel}
            </Box>
          ),
          exportHeader: b.bandLabel,
          align: "right",
          headSx: lapse ? { color: t.danger } : undefined,
          cellSx: (r) => {
            const c = fill(b.bandNo, cell(r.teamId, b.bandNo));
            return c ? { background: c.bg } : undefined;
          },
          cell: (r) => (
            <Num
              v={cell(r.teamId, b.bandNo)}
              bold={lapse}
              color={lapse ? t.danger : (fill(b.bandNo, cell(r.teamId, b.bandNo))?.fg ?? t.textPrimary)}
              d={teamDrill(r.teamId, { title: `${r.team} · ${b.bandLabel}`, key: "AGE_BAND", value: b.bandNo, ...now })}
            />
          ),
          exportValue: (r) => cell(r.teamId, b.bandNo),
          foot: (
            <Num
              v={sumBy(rows, (r) => cell(r.teamId, b.bandNo))}
              color={lapse ? t.danger : undefined}
              d={{ title: `All teams · ${b.bandLabel}`, key: "AGE_BAND", value: b.bandNo, ...now }}
            />
          ),
        };
      }),
      {
        key: "total",
        header: "Total",
        align: "right",
        cell: (r) => <Num v={r.openTotal} bold d={teamDrill(r.teamId, { title: `${r.team} · all open`, key: "TEAM_OPEN", value: r.teamId ?? "", ...now })} />,
        exportValue: (r) => num(r.openTotal),
        foot: <Num v={sumBy(rows, (r) => r.openTotal)} d={{ title: "All open CRQs", key: "OPEN_SIDE", value: "ALL", ...now }} />,
      },
      {
        key: "oldest",
        header: "Oldest",
        exportHeader: "Oldest (days)",
        align: "right",
        cell: (r) => `${Math.floor(num(r.oldestDays))} d`,
        exportValue: (r) => Math.floor(num(r.oldestDays)),
        foot: `${Math.floor(Math.max(0, ...rows.map((r) => num(r.oldestDays))))} d`,
      },
    ];
    return { rows, columns };
  }, [data, domainOf, t]);

  // Chart: one stacked bar per team, its parts the age bands from young (light) to old (dark), then
  // Slot Lapse in red. Count = bar length is the open total; Share % = every bar full width, the
  // parts its age mix. The parts add up to the Total column of the table.
  const ageChart = useMemo(() => {
    const ages = [...(data?.bands ?? [])].filter((b) => b.bandNo > 0).sort((a, b) => a.bandNo - b.bandNo);
    const lapse = (data?.bands ?? []).find((b) => b.bandNo === 0);
    const order = lapse ? [...ages, lapse] : ages;
    const colorOf = (bandNo: number) => {
      if (bandNo === 0) return t.danger;
      const i = ages.findIndex((b) => b.bandNo === bandNo);
      return sequentialBlue(ages.length > 1 ? 0.15 + (0.85 * i) / (ages.length - 1) : 0.6);
    };
    const cells = new Map((data?.ageGrid ?? []).map((g) => [`${g.teamId}|${g.bandNo}`, num(g.crqs)]));
    const cell = (teamId: number | null, bandNo: number) => cells.get(`${teamId}|${bandNo}`) ?? 0;
    const share = ageMode === "share";

    const bars: P1HBarRow[] = [...(data?.teamTotals ?? [])]
      .sort((a, b) => num(b.openTotal) - num(a.openTotal))
      .map((r) => {
        const total = num(r.openTotal);
        const part = (n: number) => (share ? (total ? (100 * n) / total : 0) : n);
        return {
          key: `${r.teamId}-${r.team}`,
          label: r.team,
          value: share ? 100 : total,
          text: fmtN(total),
          segs: order.map((b) => {
            const n = cell(r.teamId, b.bandNo);
            const d = teamDrill(r.teamId, { title: `${r.team} · ${b.bandLabel}`, key: "AGE_BAND", value: b.bandNo, now: true });
            return { value: part(n), color: colorOf(b.bandNo), onClick: n && d ? () => openDrill(d) : undefined };
          }),
          tip: [
            ...order.map((b): [string, string] => {
              const n = cell(r.teamId, b.bandNo);
              return [b.bandLabel, total ? `${fmtN(n)} · ${Math.round((100 * n) / total)}%` : fmtN(n)];
            }),
            ["With CCB", fmtN(num(r.withCcb))],
            ["With SE", fmtN(num(r.withSe))],
            ["Total open", fmtN(total)],
            ["Oldest", `${Math.floor(num(r.oldestDays))} d`],
          ],
        };
      });
    return { bars, legend: order.map((b) => ({ label: b.bandLabel, color: colorOf(b.bandNo) })), max: share ? 100 : undefined };
  }, [data, ageMode, t, openDrill]);

  /* ── Team-wise status ──────────────────────────────────────────────── */
  const status = useMemo(() => {
    const rows = data?.teamStatus ?? [];
    const hasUnknown = sumBy(rows, (r) => r.cancelTypeUnknown) > 0;
    const range = <Tag kind="range" />;

    const count = (
      key: StatusKey,
      label: string,
      header: P1Column<P1TeamStatusDto>["header"],
      drill: (r: P1TeamStatusDto) => P1Drill | undefined,
      totalDrill: P1Drill,
    ): P1Column<P1TeamStatusDto> => ({
      key,
      header,
      exportHeader: label,
      align: "right",
      cell: (r) => <Num v={r[key]} d={drill(r)} />,
      exportValue: (r) => num(r[key]),
      foot: <Num v={sumBy(rows, (r) => r[key])} d={totalDrill} />,
    });
    const openSide = (side: "CCB" | "SE", key: StatusKey) =>
      count(
        key,
        `With ${side}`,
        `With ${side}`,
        (r) => teamDrill(r.teamId, { title: `${r.team} · With ${side}`, key: "OPEN_SIDE", value: side, now: true }),
        { title: `All teams · With ${side}`, key: "OPEN_SIDE", value: side, now: true },
      );
    const ended = (key: StatusKey, label: string, type: string) =>
      count(
        key,
        label,
        <>
          {label} {range}
        </>,
        (r) => teamDrill(r.teamId, { title: `${r.team} · ${label}`, key: "ENDED", value: type }),
        { title: `All teams · ${label}`, key: "ENDED", value: type },
      );

    const columns: P1Column<P1TeamStatusDto>[] = [
      { key: "team", header: "Team", cell: (r) => <b>{r.team}</b>, exportValue: (r) => r.team, foot: "Total" },
      {
        key: "domain",
        header: "Domain",
        cell: (r) => (r.teamId != null && domainOf.get(r.teamId)) || "—",
        exportValue: (r) => (r.teamId != null && domainOf.get(r.teamId)) || "",
        foot: "",
      },
      { key: "total", header: "Total", align: "right", cell: (r) => <b>{fmtN(num(r.total))}</b>, exportValue: (r) => num(r.total), foot: fmtN(sumBy(rows, (r) => r.total)) },
      count(
        "openNow",
        "Open",
        "Open",
        (r) => teamDrill(r.teamId, { title: `${r.team} · Open`, key: "TEAM_OPEN", value: r.teamId ?? "", now: true }),
        { title: "All teams · Open", key: "OPEN_SIDE", value: "ALL", now: true },
      ),
      openSide("CCB", "withCcb"),
      openSide("SE", "withSe"),
      ended("closed", "Closed", "DONE"),
      ended("cancelled", "Cancelled", "CANCELLED"),
      ended("rejected", "Rejected", "REJECTED"),
      ...(hasUnknown ? [ended("cancelTypeUnknown", "Type not mapped yet", "UNKNOWN")] : []),
    ];

    // Chart: one stacked bar per team, its parts adding up to the same Total as the table row.
    const parts: { key: StatusKey; label: string; color: string; drill: (r: P1TeamStatusDto) => P1Drill | undefined }[] = [
      { key: "withCcb", label: "Open · with CCB", color: colors.ccb, drill: (r) => teamDrill(r.teamId, { title: `${r.team} · With CCB`, key: "OPEN_SIDE", value: "CCB", now: true }) },
      { key: "withSe", label: "Open · with SE", color: colors.se, drill: (r) => teamDrill(r.teamId, { title: `${r.team} · With SE`, key: "OPEN_SIDE", value: "SE", now: true }) },
      { key: "closed", label: "Closed", color: colors.done, drill: (r) => teamDrill(r.teamId, { title: `${r.team} · Closed`, key: "ENDED", value: "DONE" }) },
      { key: "cancelled", label: "Cancelled", color: colors.cancelled, drill: (r) => teamDrill(r.teamId, { title: `${r.team} · Cancelled`, key: "ENDED", value: "CANCELLED" }) },
      { key: "rejected", label: "Rejected", color: colors.rejected, drill: (r) => teamDrill(r.teamId, { title: `${r.team} · Rejected`, key: "ENDED", value: "REJECTED" }) },
      ...(hasUnknown
        ? [{ key: "cancelTypeUnknown" as StatusKey, label: "Type not mapped yet", color: colors.unknown, drill: (r: P1TeamStatusDto) => teamDrill(r.teamId, { title: `${r.team} · Type not mapped yet`, key: "ENDED", value: "UNKNOWN" }) }]
        : []),
    ];
    const bars: P1HBarRow[] = [...rows]
      .sort((a, b) => num(b.total) - num(a.total))
      .map((r) => ({
        key: `${r.teamId}-${r.team}`,
        label: r.team,
        value: num(r.total),
        segs: parts.map((p) => {
          const d = p.drill(r);
          return { value: num(r[p.key]), color: p.color, onClick: d ? () => openDrill(d) : undefined };
        }),
        tip: [...parts.map((p): [string, string] => [p.label, fmtN(num(r[p.key]))]), ["Total", fmtN(num(r.total))]],
      }));
    const legend = parts.map((p) => ({ label: p.label, color: p.color }));

    return { rows, columns, bars, legend };
  }, [data, domainOf, colors, openDrill]);

  return (
    <>
      <P1Card
        title="Open CRQs by team and age"
        defaultView="table"
        tag={<Tag kind="now" />}
        info="p-grid"
        loading={loading}
        error={isError}
        onExport={() => exportP1Table("Open CRQs by team and age", grid.columns, grid.rows)}
        legend={ageChart.legend}
        right={
          <Seg
            value={ageMode}
            onChange={setAgeMode}
            ariaLabel="Bar length"
            options={[
              { value: "count", label: "Count" },
              { value: "share", label: "Share %" },
            ]}
          />
        }
        chart={grid.rows.length ? <P1HBars rows={ageChart.bars} max={ageChart.max} /> : <P1Empty message="No open CRQs for this selection." />}
        table={
          grid.rows.length ? (
            <P1Table columns={grid.columns} rows={grid.rows} rowKey={(r) => `${r.teamId}-${r.team}`} stickyFirst />
          ) : (
            <P1Empty message="No open CRQs for this selection." />
          )
        }
      />

      <P1Card
        title="Team-wise status"
        defaultView="table"
        info="p-team"
        legend={status.legend}
        loading={loading}
        error={isError}
        onExport={() => exportP1Table("Team-wise status", status.columns, status.rows)}
        chart={status.rows.length ? <P1HBars rows={status.bars} /> : <P1Empty />}
        table={status.rows.length ? <P1Table columns={status.columns} rows={status.rows} rowKey={(r) => `${r.teamId}-${r.team}`} /> : <P1Empty />}
      />
    </>
  );
}
