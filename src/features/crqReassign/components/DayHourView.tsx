import { useState, type DragEvent, type ReactNode } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { orDash } from "../../scheduler/sub-feature/cancelledCrq/cancelledCrqFormat";
import { addDays, hm, parseYmd, shortDate, ymd } from "../utils/crqReassign.utils";
import { blockDetails, inActivityWindow, rosterOn, segmentsOn, type Segment, type TimeBlock, type TimelineEngineer } from "../utils/timelineModel";
import { useReassignTokens } from "../hooks/useReassignTokens";
import { DateBadge, DetailTip } from "./reassignUi";

interface Props {
  engineers: TimelineEngineer[];
  date: string;
  busy: boolean;
  onMove: (block: TimeBlock, newStart: Date) => void;
  onBlocked: (message: string) => void;
  onBlockClick: (block: TimeBlock) => void;
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Overlapping blocks share one cell so none is hidden behind another. */
interface Group {
  start: number;
  end: number;
  segs: Segment[];
}

const groupSegments = (segs: Segment[]): Group[] => {
  const out: Group[] = [];
  for (const s of segs) {
    const start = Math.floor(s.startH);
    const end = Math.max(start + 1, Math.ceil(s.endH));
    const last = out[out.length - 1];
    if (last && start < last.end) {
      last.end = Math.max(last.end, end);
      last.segs.push(s);
    } else {
      out.push({ start, end, segs: [s] });
    }
  }
  return out;
};

/**
 * Hourly view of one date. Dragging a block onto a free hour of the same
 * engineer moves its execution window (CRQ_SP_REASSIGN_TIME, duration kept);
 * the start stays on this date, an overnight block may still end on the next.
 */
export const DayHourView = ({ engineers, date, busy, onMove, onBlocked, onBlockClick }: Props) => {
  const { tk, rule, label, hatch, hatchDark } = useReassignTokens();
  const [drag, setDrag] = useState<TimeBlock | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const prevShort = shortDate(ymd(addDays(parseYmd(date), -1)));
  const nextShort = shortDate(ymd(addDays(parseYmd(date), 1)));

  const drop = (ev: DragEvent, eng: TimelineEngineer, hour: number) => {
    ev.preventDefault();
    const block = drag;
    setDrag(null);
    setHover(null);
    if (!block) return;
    if (block.olmid !== eng.olmid) {
      onBlocked(`Blocked — ${block.crqNo} belongs to ${block.olmid}. Change the engineer from Member view.`);
      return;
    }
    const newStart = new Date(parseYmd(date).getTime());
    newStart.setHours(hour, 0, 0, 0);
    const dur = block.end.getTime() - block.start.getTime();
    const newEnd = newStart.getTime() + dur;
    const clash = eng.blocks.find(
      (b) => b.key !== block.key && b.start.getTime() < newEnd && b.end.getTime() > newStart.getTime(),
    );
    if (clash) {
      onBlocked(`Blocked — ${eng.name} already has ${clash.crqNo} in that window.`);
      return;
    }
    onMove(block, newStart);
  };

  return (
    // Fluid: the 24 hour columns share the screen width — no sideways scroll.
    <Box>
      <Box component="table" sx={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", fontSize: 13 }}>
        <Box component="thead">
          <Box component="tr">
            <Box
              component="th"
              sx={{ ...label, textAlign: "left", px: 1.75, py: 1.25, width: { xs: 120, md: 170 }, borderBottom: rule, borderRight: rule, bgcolor: tk.surface2, position: "sticky", top: 0, zIndex: 3 }}
            >
              Engineer
            </Box>
            {HOURS.map((h) => (
              <Box
                component="th"
                key={h}
                sx={{ textAlign: "left", px: 0.5, py: 1.25, borderBottom: rule, borderLeft: rule, fontSize: 10.5, fontWeight: 600, color: tk.textSecondary, bgcolor: tk.surface2, position: "sticky", top: 0, zIndex: 2 }}
              >
                {String(h).padStart(2, "0")}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {engineers.map((e) => {
            const roster = rosterOn(e, date);
            const windowMin = Number(roster?.window_min ?? 0);
            const used = Math.max(0, windowMin - Number(roster?.free_min ?? 0));
            const groups = groupSegments(segmentsOn(e, date));
            const cells: ReactNode[] = [];

            for (let h = 0; h < 24; ) {
              const g = groups.find((x) => x.start === h);
              if (g) {
                cells.push(
                  <Box component="td" key={`g${h}`} colSpan={g.end - g.start} sx={{ p: 0.5, borderBottom: rule, borderLeft: rule, verticalAlign: "top", overflow: "hidden" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {g.segs.map((s) => {
                        const movable = !s.cont && !busy;
                        return (
                          <DetailTip key={s.key} title={s.block.crqNo} details={blockDetails(s)}>
                            <Box
                              draggable={movable}
                              onDragStart={(ev) => {
                                if (!movable) return ev.preventDefault();
                                ev.dataTransfer.effectAllowed = "move";
                                ev.dataTransfer.setData("text/plain", s.block.key);
                                setDrag(s.block);
                              }}
                              onDragEnd={() => {
                                setDrag(null);
                                setHover(null);
                              }}
                              onClick={() => !s.cont && onBlockClick(s.block)}
                              sx={{
                                cursor: s.cont ? "not-allowed" : "grab",
                                px: 0.75,
                                py: 0.6,
                                minHeight: 46,
                                overflow: "hidden",
                                borderRadius: tk.radius,
                              bgcolor: s.cont ? tk.bg : tk.surface2,
                                opacity: drag?.key === s.block.key ? 0.4 : 1,
                                border: `1px solid ${tk.border}`,
                                borderLeft: s.cont ? `3px dashed ${tk.warning}` : `3px solid ${tk.accent}`,
                                borderRight: s.overnight ? `3px solid ${tk.warning}` : `1px solid ${tk.border}`,
                                transition: "opacity 120ms",
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 12 }} noWrap>{s.block.crqNo}</Typography>
                                {s.cont ? <DateBadge kind="cont" /> : s.overnight ? <DateBadge kind="plus" /> : null}
                              </Box>
                              <Typography sx={{ fontSize: 11, color: tk.textSecondary, mt: 0.4 }} noWrap>
                                {orDash(s.block.row.Plan_Id)} / {orDash(s.block.row.Task_Id)}
                              </Typography>
                              <Typography sx={{ fontSize: 10, color: tk.textDim, mt: 0.5 }} noWrap>
                                {s.cont
                                  ? `00:00 – ${hm(s.block.end)} (of ${hm(s.block.start)} – ${hm(s.block.end)})`
                                  : `${hm(s.block.start)} – ${hm(s.block.end)}${s.overnight ? " next day" : ""}`}
                              </Typography>
                              {(s.cont || s.overnight) && (
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: tk.warning, mt: 0.4 }} noWrap>
                                  {s.cont ? `Started ${prevShort} · ${hm(s.block.start)}` : `Ends ${nextShort} · ${hm(s.block.end)}`}
                                </Typography>
                              )}
                            </Box>
                          </DetailTip>
                        );
                      })}
                    </Box>
                  </Box>,
                );
                h = g.end;
              } else {
                const hh = h;
                const key = `${e.olmid}-${hh}`;
                const active = !!drag && hover === key;
                const inWindow = inActivityWindow(roster, hh);
                cells.push(
                  <Box
                    component="td"
                    key={key}
                    onDragOver={(ev) => {
                      if (!drag) return;
                      ev.preventDefault();
                      ev.dataTransfer.dropEffect = "move";
                      if (hover !== key) setHover(key);
                    }}
                    onDragLeave={() => hover === key && setHover(null)}
                    onDrop={(ev) => drop(ev, e, hh)}
                    sx={{
                      p: 0.5,
                      height: 56,
                      borderBottom: rule,
                      borderLeft: rule,
                      outline: active ? `2px solid ${tk.accent}` : "none",
                      outlineOffset: "-2px",
                      background: active ? tk.accentDim : inWindow ? hatch : hatchDark,
                    }}
                  />,
                );
                h += 1;
              }
            }

            return (
              <Box component="tr" key={e.olmid}>
                <Box component="td" sx={{ px: 1.75, py: 1.5, width: { xs: 120, md: 170 }, borderBottom: rule, borderRight: rule, verticalAlign: "top" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }} noWrap>{e.name}</Typography>
                    {e.level && (
                      <Chip size="small" label={e.level} sx={{ height: 18, fontSize: 10 }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 11, color: tk.textSecondary, mt: 0.25 }} noWrap>
                    {e.olmid} · {roster ? `Shift ${roster.shift_name}` : "Not rostered"}
                  </Typography>
                  {roster && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.9 }}>
                      <Box sx={{ height: 4, width: 84, bgcolor: tk.trackOff, borderRadius: 2 }}>
                        <Box
                          sx={{
                            height: "100%",
                            width: `${windowMin ? Math.min(100, (used / windowMin) * 100) : 0}%`,
                            bgcolor: windowMin && used / windowMin > 0.75 ? tk.warning : tk.accent,
                            borderRadius: 2,
                            transition: "width 220ms ease-out",
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: 10, color: tk.textSecondary }}>
                        {used}m / {windowMin}m
                      </Typography>
                    </Box>
                  )}
                </Box>
                {cells}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2.5, px: 2, py: 1.75, fontSize: 11, color: tk.textSecondary, borderTop: rule, flexWrap: "wrap" }}>
        {[
          { label: "Scheduled", sx: { bgcolor: tk.surface2, border: `1px solid ${tk.border}`, borderLeft: `3px solid ${tk.accent}` } },
          { label: "Inside shift activity window — valid drop target", sx: { background: hatch, border: `1px dashed ${tk.border}` } },
          { label: "Outside shift activity window", sx: { background: hatchDark, border: `1px solid ${tk.border}` } },
          { label: "Runs past 24:00 — ends on the next date", sx: { bgcolor: tk.warning } },
          { label: "Continued from the previous date", sx: { border: `2px dashed ${tk.warning}` } },
        ].map((l) => (
          <Box key={l.label} component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <Box component="span" sx={{ width: 10, height: 10, ...l.sx }} />
            {l.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DayHourView;
