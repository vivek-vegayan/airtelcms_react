import { useMemo } from "react";
import { useGetP1PendencyQuery } from "../api/crqAnalyticsP1Api";
import { Num, Tag } from "../components/P1Bits";
import { P1Card, P1Empty } from "../components/P1Card";
import { P1Table, type P1Column } from "../components/P1Table";
import { useP1 } from "../hooks/useP1Context";
import type { P1Drill, P1TeamOpenDto, P1TeamStatusDto } from "../types/crqAnalyticsP1.types";
import { exportP1Table } from "../utils/p1Export";
import { fmtN, num, sumBy } from "../utils/p1Format";

/** A drill limited to one team row. The "Not set" team has no id to filter on, so it is not clickable. */
const teamDrill = (teamId: number | null, d: P1Drill): P1Drill | undefined => (teamId == null ? undefined : { ...d, team: teamId });

type GridRow = P1TeamOpenDto & { domain: string; showDomain: boolean };
type StatusKey = "openNow" | "withCcb" | "withSe" | "closed" | "cancelled" | "rejected" | "cancelTypeUnknown";

/** Pendency: how old the open work is (CRQ_AN_SP_P1_PENDENCY). */
export default function P1PendencyView() {
  const { f, colors } = useP1();
  const t = colors.tokens;
  const { data, isFetching, isError } = useGetP1PendencyQuery({ ...f.filterParams, from: f.range.from, to: f.range.to });
  const loading = isFetching && !data;

  const domainOf = useMemo(() => new Map(f.orgTree.map((o) => [o.subDomainId, o.domainName])), [f.orgTree]);

  /* ── Open CRQs by team and age ─────────────────────────────────────── */
  const grid = useMemo(() => {
    const bands = [...(data?.bands ?? [])].sort((a, b) => a.bandNo - b.bandNo);
    const cells = new Map((data?.ageGrid ?? []).map((g) => [`${g.teamId}|${g.bandNo}`, num(g.crqs)]));
    const cell = (teamId: number | null, bandNo: number) => cells.get(`${teamId}|${bandNo}`) ?? 0;

    const sorted = (data?.teamTotals ?? [])
      .map((x) => ({ ...x, domain: (x.teamId != null && domainOf.get(x.teamId)) || "—" }))
      .sort((a, b) => a.domain.localeCompare(b.domain) || num(b.openTotal) - num(a.openTotal));
    const rows: GridRow[] = sorted.map((r, i) => ({ ...r, showDomain: i === 0 || sorted[i - 1].domain !== r.domain }));

    // Slot Lapse (band 0) is a state, not an age, so it is left out of the shading scale.
    const maxCell = Math.max(1, ...(data?.ageGrid ?? []).filter((g) => g.bandNo > 0).map((g) => num(g.crqs)));
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
          header: b.bandLabel,
          align: "right",
          headSx: lapse ? { color: t.danger } : undefined,
          cellSx: (r) => (lapse ? undefined : { background: colors.shade(cell(r.teamId, b.bandNo) / maxCell) }),
          cell: (r) => (
            <Num
              v={cell(r.teamId, b.bandNo)}
              bold={lapse}
              color={lapse ? t.danger : t.textPrimary}
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
  }, [data, domainOf, colors, t]);

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
    return { rows, columns };
  }, [data, domainOf]);

  return (
    <>
      <P1Card
        title="Open CRQs by team and age"
        tag={<Tag kind="now" />}
        info="p-grid"
        loading={loading}
        error={isError}
        onExport={() => exportP1Table("Open CRQs by team and age", grid.columns, grid.rows)}
      >
        {grid.rows.length ? (
          <P1Table columns={grid.columns} rows={grid.rows} rowKey={(r) => `${r.teamId}-${r.team}`} stickyFirst />
        ) : (
          <P1Empty message="No open CRQs for this selection." />
        )}
      </P1Card>

      <P1Card
        title="Team-wise status"
        info="p-team"
        loading={loading}
        error={isError}
        onExport={() => exportP1Table("Team-wise status", status.columns, status.rows)}
      >
        {status.rows.length ? <P1Table columns={status.columns} rows={status.rows} rowKey={(r) => `${r.teamId}-${r.team}`} /> : <P1Empty />}
      </P1Card>
    </>
  );
}
