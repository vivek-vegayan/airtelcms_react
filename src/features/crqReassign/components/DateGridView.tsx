import { Box, Chip, Typography } from "@mui/material";
import { orDash } from "../../scheduler/sub-feature/cancelledCrq/cancelledCrqFormat";
import { addDays, dowOf, hm, parseYmd, shortDate, ymd } from "../utils/crqReassign.utils";
import { blockDetails, rosterOn, segmentsOn, type TimelineEngineer } from "../utils/timelineModel";
import { useReassignTokens } from "../hooks/useReassignTokens";
import { DateBadge, DetailTip } from "./reassignUi";

interface Props {
  engineers: TimelineEngineer[];
  dates: string[];
  activeDate: string;
  /** Month view: narrower columns, CRQ number only on each chip. */
  compact: boolean;
  onOpenDate: (date: string) => void;
}

/** Week / month overview: engineers × dates, one chip per activity on that date. */
export const DateGridView = ({ engineers, dates, activeDate, compact, onOpenDate }: Props) => {
  const { tk, rule, label } = useReassignTokens();

  const nextShort = (d: string) => shortDate(ymd(addDays(parseYmd(d), 1)));
  const prevShort = (d: string) => shortDate(ymd(addDays(parseYmd(d), -1)));

  return (
    // Fluid: the date columns share whatever width the screen has — no sideways scroll.
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
            {dates.map((d) => {
              const count = engineers.reduce((n, e) => n + segmentsOn(e, d).length, 0);
              const active = d === activeDate;
              return (
                <Box
                  component="th"
                  key={d}
                  sx={{
                    p: 0,
                    borderBottom: rule,
                    borderLeft: rule,
                    borderTop: active ? `3px solid ${tk.accent}` : "none",
                    // Opaque so rows do not show through the pinned header.
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    background: active ? `linear-gradient(${tk.accentDim}, ${tk.accentDim}), ${tk.surface2}` : tk.surface2,
                    "&:hover": { background: `linear-gradient(${tk.accentDim}, ${tk.accentDim}), ${tk.surface2}` },
                  }}
                >
                  <Box
                    component="button"
                    onClick={() => onOpenDate(d)}
                    sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", px: compact ? 0.5 : 1.5, py: 1.25, bgcolor: "transparent", border: 0, cursor: "pointer", font: "inherit", color: tk.textPrimary, textAlign: "left" }}
                  >
                    <Box component="span" sx={{ ...label, fontSize: 10 }}>{compact ? dowOf(d).charAt(0) : dowOf(d)}</Box>
                    <Box component="span" sx={{ fontWeight: 600, fontSize: compact ? 13 : 18, lineHeight: 1.1, mt: 0.25 }}>{d.slice(8, 10)}</Box>
                    <Box component="span" sx={{ fontSize: 10, letterSpacing: "0.06em", color: tk.textSecondary, mt: 0.4 }}>
                      {count ? (compact ? count : `${count} CRQ`) : "—"}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
        <Box component="tbody">
          {engineers.map((e) => (
            <Box component="tr" key={e.olmid} sx={{ "&:hover": { bgcolor: tk.accentDim } }}>
              <Box component="td" sx={{ px: 1.75, py: 1.5, width: { xs: 120, md: 170 }, borderBottom: rule, borderRight: rule, verticalAlign: "top" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 13 }} noWrap>{e.name}</Typography>
                  {e.level && (
                    <Chip size="small" label={e.level} sx={{ height: 18, fontSize: 10 }} />
                  )}
                </Box>
                <Typography sx={{ fontSize: 11, color: tk.textSecondary, mt: 0.25 }} noWrap>
                  {e.olmid} · {orDash(e.team)}
                </Typography>
              </Box>
              {dates.map((d) => {
                const segs = segmentsOn(e, d);
                const roster = e.roster.get(d) ?? rosterOn(e, d);
                return (
                  <Box
                    component="td"
                    key={d}
                    sx={{ p: compact ? 0.25 : 0.75, borderBottom: rule, borderLeft: rule, verticalAlign: "top", overflow: "hidden", bgcolor: d === activeDate ? tk.accentDim : "transparent" }}
                  >
                    <Box onClick={() => onOpenDate(d)} sx={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 0.6, minHeight: 46 }}>
                      {/* Month: one count chip per day, CRQs listed on hover — keeps 31 columns narrow. */}
                      {compact && segs.length > 0 && (
                        <DetailTip
                          title={`${segs.length} CRQ on ${shortDate(d)}`}
                          details={segs.map((s) => [
                            s.block.crqNo,
                            `${s.cont ? "00:00" : hm(s.block.start)} – ${hm(s.block.end)}${s.overnight ? " +1d" : ""}`,
                          ])}
                        >
                          <Chip
                            size="small"
                            label={segs.length}
                            sx={{
                              height: 20,
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: segs.some((s) => s.cont || s.overnight) ? tk.warning : tk.accent,
                              bgcolor: segs.some((s) => s.cont || s.overnight) ? tk.warningDim : tk.accentDim,
                              border: `1px solid ${segs.some((s) => s.cont || s.overnight) ? tk.warningBorder : tk.accentBorder}`,
                            }}
                          />
                        </DetailTip>
                      )}
                      {!compact && segs.map((s) => (
                        <DetailTip key={s.key} title={s.block.crqNo} details={blockDetails(s)}>
                          <Box
                            sx={{
                              px: 0.9,
                              py: 0.6,
                              borderRadius: tk.radius,
                              bgcolor: s.cont ? tk.bg : tk.surface2,
                              border: `1px solid ${tk.border}`,
                              borderLeft: s.cont
                                ? `3px dashed ${tk.warning}`
                                : `3px solid ${s.overnight ? tk.warning : tk.accent}`,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: 11 }} noWrap>{s.block.crqNo}</Typography>
                              {s.cont ? <DateBadge kind="cont" /> : s.overnight ? <DateBadge kind="span" /> : null}
                            </Box>
                            {!compact && (
                              <>
                                <Typography sx={{ fontSize: 10, color: tk.textSecondary, mt: 0.25 }}>
                                  {s.cont ? `00:00 – ${hm(s.block.end)}` : `${hm(s.block.start)} – ${hm(s.block.end)}`}
                                </Typography>
                                {(s.cont || s.overnight) && (
                                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: tk.warning, mt: 0.4 }} noWrap>
                                    {s.cont ? `Started ${prevShort(d)} · ${hm(s.block.start)}` : `Ends ${nextShort(d)} · ${hm(s.block.end)}`}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        </DetailTip>
                      ))}
                      {segs.length === 0 && (
                        <Typography sx={{ fontSize: 10, color: tk.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {roster ? "Free" : "Off"}
                        </Typography>
                      )}
                      {roster && (
                        <Typography sx={{ fontSize: 9.5, color: tk.textDim, mt: "auto" }}>
                          {compact ? roster.shift_name : `Shift ${roster.shift_name} · ${roster.free_min ?? 0}m free`}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default DateGridView;
