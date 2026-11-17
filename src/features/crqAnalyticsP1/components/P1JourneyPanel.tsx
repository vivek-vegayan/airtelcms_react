import { Box, CircularProgress, Typography } from "@mui/material";
import { EmptyOrErrorState } from "../../crqAnalytics/components/EmptyOrErrorState";
import { useGetP1JourneyQuery } from "../api/crqAnalyticsP1Api";
import { useP1 } from "../hooks/useP1Context";
import type { P1JourneyCancelDto, P1JourneyFailDto, P1JourneyMoveDto } from "../types/crqAnalyticsP1.types";
import { STAGES, dur, fdt, hm, num, parseDT, stageByCode } from "../utils/p1Format";
import { ResultPill } from "./P1Bits";
import { P1Table, type P1Column } from "./P1Table";

const TYPE_LABEL: Record<string, string> = { CANCELLED: "Cancelled", REJECTED: "Rejected", UNKNOWN: "Type not mapped yet" };

const MOVE_COLUMNS: P1Column<P1JourneyMoveDto>[] = [
  { key: "when", header: "When", cell: (m) => fdt(m.movedAt) },
  { key: "from", header: "From slot", cell: (m) => fdt(m.oldSlotStart) },
  { key: "to", header: "To slot", cell: (m) => fdt(m.newSlotStart) },
  { key: "reason", header: "Reason", cell: (m) => m.reason ?? "" },
];
const FAIL_COLUMNS: P1Column<P1JourneyFailDto>[] = [
  { key: "when", header: "When", cell: (x) => fdt(x.eventAt) },
  { key: "reason", header: "Reason", cell: (x) => x.reason ?? "" },
  { key: "by", header: "By", cell: (x) => x.performedBy ?? "—" },
];
const CANCEL_COLUMNS: P1Column<P1JourneyCancelDto>[] = [
  { key: "when", header: "When", cell: (k) => fdt(k.cancelledAt) },
  { key: "stage", header: "Stage", cell: (k) => stageByCode(k.cancelledStage)?.label ?? k.cancelledStage ?? "—" },
  { key: "raw", header: "Type as stored", cell: (k) => k.cancellationOrRejection ?? "—" },
  { key: "type", header: "Counted as", cell: (k) => TYPE_LABEL[k.mappedType ?? "UNKNOWN"] ?? TYPE_LABEL.UNKNOWN },
  { key: "reason", header: "Reason", cell: (k) => k.cancellationReason || "Not recorded" },
];

/** One CRQ as the analytics tables see it: status line, key facts, reschedules, failures, cancel record, stage by stage. */
export function P1JourneyPanel({ crqNo }: { crqNo: string }) {
  const { colors } = useP1();
  const t = colors.tokens;
  const { data, isFetching, isError } = useGetP1JourneyQuery(crqNo);

  if (isFetching && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={26} />
      </Box>
    );
  }
  if (isError) return <EmptyOrErrorState kind="error" message="Couldn't load this CRQ." />;
  const h = data?.header;
  if (!h) return <EmptyOrErrorState kind="empty" message="This CRQ is not in the analytics tables yet." />;

  const isOpen = h.result === "OPEN";
  const moves = num(h.rescheduleCount);
  const stopStage = stageByCode(h.cancelStage);
  const headline = isOpen
    ? `Now at ${STAGES[h.stageNo - 1]?.label ?? h.currentStage} (${h.side})`
    : h.result === "DONE"
      ? moves
        ? `Done after ${moves} reschedule${moves > 1 ? "s" : ""}`
        : "Done on the planned night"
      : `${TYPE_LABEL[h.result] ?? TYPE_LABEL.UNKNOWN} at ${stopStage?.label ?? "—"}${h.cancelReason ? ` — ${h.cancelReason}` : ""}`;

  const slotEnd = parseDT(h.slotEnd);
  const facts: [string, string][] = [
    ["Team", [h.subDomainName, h.domainName, h.circle, h.region].filter(Boolean).join(" · ") || "—"],
    ["Requestor", h.requestorType || "Not recorded"],
    ["Received", fdt(h.createdAt)],
    ["Moved to SE", fdt(h.ccbDoneAt)],
    ["Slot booked", h.slotStart ? `${fdt(h.slotStart)}${slotEnd ? ` – ${hm(slotEnd)}` : ""}` : "—"],
    ["First slot booked", fdt(h.firstSlotStart)],
    ["Engineer for the slot", h.engineerName || "—"],
    ["Day / Night", h.dayNight === "NIGHT" ? "Night" : h.dayNight === "DAY" ? "Day" : "No slot"],
  ];
  if (moves) facts.push(["Rescheduled", `${moves} time${moves === 1 ? "" : "s"}`]);
  if (!isOpen) facts.push(["Finished", fdt(h.endAt)]);

  const label = (text: string) => (
    <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: t.textSecondary, mt: 2.25, mb: 0.75 }}>
      {text}
    </Typography>
  );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, pt: 0.5 }}>
        <ResultPill result={h.result} currentStatus={h.currentStatus} />
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: t.textPrimary }}>{headline}</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px 18px", mt: 1.75 }}>
        {facts.map(([k, v]) => (
          <Box key={k} sx={{ fontSize: 12.5, lineHeight: 1.45, color: t.textPrimary, overflowWrap: "anywhere" }}>
            <Box sx={{ fontSize: 11, color: t.textSecondary, fontWeight: 600 }}>{k}</Box>
            {v}
          </Box>
        ))}
      </Box>

      {data.moves.length > 0 && (
        <>
          {label("Reschedule history")}
          <P1Table columns={MOVE_COLUMNS} rows={data.moves} rowKey={(_m, i) => i} />
        </>
      )}
      {data.failures.length > 0 && (
        <>
          {label("Failures recorded")}
          <P1Table columns={FAIL_COLUMNS} rows={data.failures} rowKey={(_x, i) => i} />
        </>
      )}
      {data.cancelRows.length > 0 && (
        <>
          {label("Cancel / reject record")}
          <P1Table columns={CANCEL_COLUMNS} rows={data.cancelRows} rowKey={(_k, i) => i} />
        </>
      )}

      {label("Stage by stage")}
      {STAGES.map((s) => {
        const x = data.stages.find((y) => y.stageNo === s.no);
        const color = s.side === "CCB" ? colors.ccb : colors.se;
        let meta = "Not reached";
        let right: string | null = null;
        let rightSub = "";
        if (x?.doneAt) {
          meta = [
            `By ${x.performedName || x.assignedName || "—"}`,
            x.team,
            `waited ${dur(x.waitMin)}`,
            `done ${fdt(x.doneAt)}`,
            num(x.holdMin) ? `on hold ${dur(x.holdMin)}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
          right = dur(x.workMin);
          rightSub = s.no === 6 ? "slot window" : "work";
        } else if (x) {
          meta = !isOpen
            ? h.result === "DONE"
              ? "—"
              : "Stopped here"
            : x.pickedAt
              ? `With ${x.assignedName || "—"} since ${fdt(x.pickedAt)}`
              : `Waiting to be picked up since ${fdt(x.enteredAt)}${x.assignedName ? ` · assigned to ${x.assignedName}` : ""}`;
          right = isOpen ? "now" : null;
        } else if (!isOpen && h.result !== "DONE" && stopStage && s.no > stopStage.no) {
          meta = "Did not happen";
        }
        return (
          <Box key={s.no} sx={{ display: "grid", gridTemplateColumns: "16px minmax(0,1fr) auto", gap: "4px 10px", py: "9px", borderBottom: `1px solid ${t.border}` }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                mt: "3px",
                borderRadius: "50%",
                boxSizing: "border-box",
                border: `2px solid ${x ? color : t.border}`,
                background: x?.doneAt ? color : "transparent",
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ fontSize: 13, fontWeight: 700, color: t.textPrimary }}>
                {s.label}{" "}
                <Box component="span" sx={{ fontWeight: 400, color: t.textSecondary }}>
                  · {s.side}
                </Box>
              </Box>
              <Box sx={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5, mt: "2px" }}>{meta}</Box>
            </Box>
            <Box sx={{ textAlign: "right", fontSize: 12, lineHeight: 1.5, color: t.textPrimary }}>
              {right && <b>{right}</b>}
              {rightSub && <Box sx={{ color: t.textSecondary }}>{rightSub}</Box>}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
