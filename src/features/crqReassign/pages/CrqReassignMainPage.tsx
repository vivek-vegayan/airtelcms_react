import { type JSX, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, InputAdornment, MenuItem, Tab, Tabs, TextField, Typography, useTheme } from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";
import { RefreshIconButton } from "../../../components/ui/RefreshIconButton";
import { api } from "../../../service/api";
import { useAppDispatch } from "../../../app/hooks";
import { authStorage } from "../../../app/store/auth.storage";
import OrgFilterSelect from "../../orgHierarchy/components/OrgFilterSelect";
import { getOrgFilterVisibility } from "../../orgHierarchy/config/orgFilterVisibility";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import type { OrgFilterKey, OrgFilterOption } from "../../orgHierarchy/types/orgHierarchy.types";
import { errMsg } from "../../cabManager/components/shared/errMsg";
import { useGetReassignStatsQuery, usePublishReassignMutation, useUndoReassignMutation } from "../api/crqReassignApi";
import ReassignStats from "../components/ReassignStats";
import MemberGridView from "../components/MemberGridView";
import TimelineView, { type TimeLevel } from "../components/TimelineView";
import HistoryView from "../components/HistoryView";
import { HintBar, type Note } from "../components/reassignUi";
import { useReassignTokens } from "../hooks/useReassignTokens";
import {
  addDays,
  batchStorage,
  CAB_FLAGS,
  LEVEL_OPTIONS,
  longDate,
  monthLabel,
  monthRange,
  parseYmd,
  rangeLabel,
  SHIFT_OPTIONS,
  todayYmd,
  weekRange,
  ymd,
} from "../utils/crqReassign.utils";

interface CrqReassignMainPageProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
}

type View = "time" | "member" | "history";

const SEARCH_DEBOUNCE_MS = 350;
const ORG_FILTER_ORDER: OrgFilterKey[] = ["vertical", "teamFunction", "domain", "subDomain"];
const ORG_LABELS: Record<OrgFilterKey, string> = {
  vertical: "Vertical",
  teamFunction: "Team Function",
  domain: "Domain",
  subDomain: "Team",
};
const ORG_ALL: Record<OrgFilterKey, string> = {
  vertical: "All Verticals",
  teamFunction: "All Functions",
  domain: "All Domains",
  subDomain: "All Teams",
};

/**
 * CRQ Reassignment — change stage owners, execution time and CAB status of
 * open CRQs. Every change lands in a draft batch; Undo rolls back its last
 * step and Publish makes the whole batch final.
 */
export default function CrqReassignMainPage({ setDynamicHeaderText, setDynamicHeaderIcon }: CrqReassignMainPageProps) {
  const theme = useTheme();
  const { tk, rule } = useReassignTokens();
  const dispatch = useAppDispatch();
  const dark = theme.palette.mode === "dark";

  const [view, setView] = useState<View>("time");
  const [timeLevel, setTimeLevel] = useState<TimeLevel>("week");
  const [gridLevel, setGridLevel] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState(todayYmd());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [engLevel, setEngLevel] = useState("all");
  const [shift, setShift] = useState("all");
  const [cab, setCab] = useState("all");
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [crqTotal, setCrqTotal] = useState(0);
  const [note, setNote] = useState<Note | null>(null);
  const [batchId, setBatchIdState] = useState<string | null>(() => batchStorage.get());

  const roleName = authStorage.getUser()?.roleCode ?? "TEAM_MEMBER";
  const { values, handleChange, resetAll } = useOrgHierarchyState("crqReassign");
  const { options } = useOrgHierarchyFilters(values);
  const visibleOrg = useMemo(() => {
    const granted = getOrgFilterVisibility(roleName);
    return ORG_FILTER_ORDER.filter((k) => granted.includes(k));
  }, [roleName]);
  const teamId = values.subDomain || undefined;

  useEffect(() => {
    setDynamicHeaderText("CRQ Reassignment");
    setDynamicHeaderIcon(<SwapHorizRoundedIcon sx={{ color: "white" }} />);
  }, [setDynamicHeaderText, setDynamicHeaderIcon]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setBatchId = useCallback((id: string | null) => {
    batchStorage.set(id);
    setBatchIdState(id);
  }, []);

  const range = useMemo(
    () => (timeLevel === "day" ? { from: anchor, to: anchor } : timeLevel === "month" ? monthRange(anchor) : weekRange(anchor)),
    [timeLevel, anchor],
  );

  const { data: stats, isFetching: statsFetching } = useGetReassignStatsQuery({
    from: range.from,
    to: range.to,
    batchId: batchId ?? undefined,
  });
  const [undo, { isLoading: undoing }] = useUndoReassignMutation();
  const [publish, { isLoading: publishing }] = usePublishReassignMutation();

  const runBatchAction = async (action: typeof undo | typeof publish, clearBatch: boolean) => {
    try {
      const res = await action({ batchId }).unwrap();
      setNote({ text: res.message, bad: false });
      if (clearBatch) setBatchId(null);
    } catch (e) {
      setNote({ text: errMsg(e), bad: true });
    }
  };

  const refresh = () => {
    dispatch(api.util.invalidateTags([{ type: "CrqReassign", id: "ALL" }]));
    setNote(null);
  };

  const changeLevel = (level: TimeLevel) => {
    if (level !== "day") setGridLevel(level);
    setTimeLevel(level);
    setNote(null);
  };
  const openDate = (date: string) => {
    setAnchor(date);
    setTimeLevel("day");
    setNote(null);
  };
  const step = (dir: 1 | -1) => {
    const a = parseYmd(anchor);
    const next =
      timeLevel === "month" ? new Date(a.getFullYear(), a.getMonth() + dir, 1) : addDays(a, timeLevel === "week" ? 7 * dir : dir);
    setAnchor(ymd(next));
  };

  const scope =
    view === "member"
      ? { value: `${crqTotal} CRQs matched`, nav: false }
      : timeLevel === "day"
        ? { value: longDate(anchor), nav: true }
        : timeLevel === "month"
          ? { value: monthLabel(anchor), nav: true }
          : { value: rangeLabel(range.from, range.to), nav: true };

  const inputSx = {
    "& .MuiInputBase-root": { height: 32 },
    "& .MuiInputBase-input": { padding: "4px 8px", fontSize: "0.8rem" },
  };
  // Same compact label placement as OrgFilterSelect so every dropdown in the row lines up.
  const selectSx = {
    ...inputSx,
    "& .MuiInputLabel-root": { fontSize: "0.8rem", transform: "translate(8px, 7px) scale(1)" },
    "& .MuiInputLabel-shrink": { transform: "translate(12px, -6px) scale(0.75)" },
  };
  const menuItemSx = { fontSize: "0.8rem", py: 0.5 };
  const filterCount = visibleOrg.length + 2;
  const activeFilters =
    visibleOrg.filter((k) => !!values[k]).length +
    (view === "time" ? Number(engLevel !== "all") + Number(shift !== "all") : Number(cab !== "all") + Number(onlyGaps)) +
    Number(searchInput.trim() !== "");
  const clearFilters = () => {
    resetAll();
    setEngLevel("all");
    setShift("all");
    setCab("all");
    setOnlyGaps(false);
    setSearchInput("");
  };
  const withAll = (key: OrgFilterKey): OrgFilterOption[] => [{ label: ORG_ALL[key], value: 0 }, ...options[key]];

  return (
    <Box
      sx={{
        backgroundColor: dark ? tk.accentDim : theme.palette.background.paper,
        maxWidth: "100%",
        minHeight: SHELL_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        pl: 8,
        overflow: "auto",
      }}
    >
      {/* Tab bar — same shell as the Scheduler tabs */}
      <Box
        sx={{
          mt: "45px",
          background: dark
            ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
            : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <Tabs
          value={view}
          onChange={(_e, v) => setView(v)}
          sx={{
            px: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 500, fontSize: 14 },
            "& .Mui-selected": { fontWeight: 600, color: theme.palette.primary.main },
            "& .MuiTabs-indicator": {
              display: "flex",
              justifyContent: "center",
              backgroundColor: "transparent",
              "&::after": {
                content: '""',
                width: 0,
                height: 0,
                borderRight: "8px solid transparent",
                borderLeft: "8px solid transparent",
                borderBottom: `10px solid ${theme.palette.primary.main}`,
                position: "absolute",
                bottom: 0,
              },
            },
          }}
        >
          <Tab label="Time Slot" value="time" />
          <Tab label="Member" value="member" />
          <Tab label="History" value="history" />
        </Tabs>
      </Box>

      <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", gap: 1.75, minWidth: 0 }}>
        {/* Title row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: tk.radius,
              display: "grid",
              placeItems: "center",
              color: tk.accent,
              bgcolor: tk.accentDim,
              border: `1px solid ${tk.accentBorder}`,
            }}
          >
            <SwapHorizRoundedIcon sx={{ fontSize: 17 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 800, color: tk.textPrimary, lineHeight: 1.3 }}>CRQ Reassignment</Typography>
            <Typography sx={{ fontSize: 11.5, color: tk.textSecondary, lineHeight: 1.3 }}>
              Change stage owners, execution time and CAB status — changes stay in a draft until published.
            </Typography>
          </Box>
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UndoRoundedIcon sx={{ fontSize: 16 }} />}
              disabled={!batchId || undoing}
              onClick={() => runBatchAction(undo, false)}
              sx={{ textTransform: "none", fontSize: "0.78rem", height: 30 }}
            >
              Undo
            </Button>
            <Button
              size="small"
              variant="contained"
              disableElevation
              startIcon={<PublishRoundedIcon sx={{ fontSize: 16 }} />}
              disabled={!batchId || publishing}
              onClick={() => runBatchAction(publish, true)}
              sx={{ textTransform: "none", fontSize: "0.78rem", height: 30 }}
            >
              Publish changes
            </Button>
            <RefreshIconButton onClick={refresh} busy={statsFetching} />
          </Box>
        </Box>

        <ReassignStats stats={stats} loading={statsFetching && !stats} batchId={batchId} />

        {/* Filter card — dropdown filters on top, search + date navigator below. */}
        {view !== "history" && (
          <Box sx={{ borderRadius: tk.radiusL, bgcolor: tk.surface, border: `1px solid ${tk.border}`, minWidth: 0 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                  md: `repeat(${Math.min(filterCount, 4)}, minmax(0, 1fr))`,
                  lg: `repeat(${filterCount}, minmax(0, 1fr))`,
                },
                gap: 1.5,
                px: 1.5,
                pt: 1.75,
                pb: 1.5,
                "& > .MuiFormControl-root": { minWidth: 0, width: "100%" },
              }}
            >
              {visibleOrg.map((key) => (
                <OrgFilterSelect
                  key={key}
                  label={ORG_LABELS[key]}
                  value={values[key] ?? 0}
                  options={withAll(key)}
                  onChange={(v) => handleChange(key, v ? v : undefined)}
                />
              ))}
              {view === "time" ? (
                <>
                  <TextField select size="small" label="Level" value={engLevel} onChange={(e) => setEngLevel(e.target.value)} sx={selectSx}>
                    {LEVEL_OPTIONS.map((l) => (
                      <MenuItem key={l} value={l} sx={menuItemSx}>{l === "all" ? "All Levels" : l}</MenuItem>
                    ))}
                  </TextField>
                  <TextField select size="small" label="Shift" value={shift} onChange={(e) => setShift(e.target.value)} sx={selectSx}>
                    {SHIFT_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={menuItemSx}>{s === "all" ? "All Shifts" : `Shift ${s}`}</MenuItem>
                    ))}
                  </TextField>
                </>
              ) : (
                <>
                  <TextField select size="small" label="CAB" value={cab} onChange={(e) => setCab(e.target.value)} sx={selectSx}>
                    <MenuItem value="all" sx={menuItemSx}>All</MenuItem>
                    {CAB_FLAGS.map((f) => (
                      <MenuItem key={f} value={f} sx={menuItemSx}>{f}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="Stages"
                    value={onlyGaps ? "yes" : "no"}
                    onChange={(e) => setOnlyGaps(e.target.value === "yes")}
                    sx={selectSx}
                  >
                    <MenuItem value="no" sx={menuItemSx}>All CRQs</MenuItem>
                    <MenuItem value="yes" sx={menuItemSx}>Unassigned stages only</MenuItem>
                  </TextField>
                </>
              )}
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, px: 1.5, py: 1.25, borderTop: `1px solid ${tk.border}` }}>
              <TextField
                size="small"
                placeholder={view === "member" ? "Search CRQ number or owner…" : "Search engineer, OLM id or CRQ…"}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                sx={{ flex: { xs: "1 1 100%", sm: "1 1 260px" }, maxWidth: { sm: 420 }, minWidth: 0, ...inputSx }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ fontSize: 16, color: tk.textDim }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box
                sx={{
                  ml: { sm: "auto" },
                  width: { xs: "100%", sm: "auto" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "space-between", sm: "flex-end" },
                  gap: 1,
                }}
              >
                {activeFilters > 0 && (
                  <Button size="small" onClick={clearFilters} sx={{ textTransform: "none", fontSize: "0.78rem", height: 32, whiteSpace: "nowrap" }}>
                    Clear filters ({activeFilters})
                  </Button>
                )}
                {scope.nav ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setAnchor(todayYmd())}
                      sx={{ textTransform: "none", fontSize: "0.78rem", height: 32, minWidth: 0, px: 1.5 }}
                    >
                      Today
                    </Button>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        height: 32,
                        border: `1px solid ${tk.border}`,
                        borderRadius: tk.radius,
                        overflow: "hidden",
                      }}
                    >
                      <IconButton size="small" onClick={() => step(-1)} sx={{ borderRadius: 0, height: "100%" }}>
                        <ChevronLeftRoundedIcon fontSize="small" />
                      </IconButton>
                      <Typography
                        sx={{
                          px: 1,
                          minWidth: { xs: 140, sm: 170 },
                          textAlign: "center",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: tk.textPrimary,
                          whiteSpace: "nowrap",
                          borderLeft: `1px solid ${tk.border}`,
                          borderRight: `1px solid ${tk.border}`,
                          lineHeight: "30px",
                        }}
                      >
                        {scope.value}
                      </Typography>
                      <IconButton size="small" onClick={() => step(1)} sx={{ borderRadius: 0, height: "100%" }}>
                        <ChevronRightRoundedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Typography sx={{ ml: "auto", fontSize: 12.5, fontWeight: 600, color: tk.textSecondary, whiteSpace: "nowrap" }}>
                    {scope.value}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* View */}
        <Box sx={{ borderRadius: tk.radiusL, bgcolor: tk.surface, border: rule, overflow: "hidden", minWidth: 0 }}>
          {view === "time" && (
            <TimelineView
              level={timeLevel}
              gridLevel={gridLevel}
              from={range.from}
              to={range.to}
              anchor={anchor}
              teamId={teamId}
              engLevel={engLevel}
              shift={shift}
              search={search}
              batchId={batchId}
              note={note}
              setNote={setNote}
              onBatch={setBatchId}
              onLevel={changeLevel}
              onOpenDate={openDate}
            />
          )}
          {view === "member" && (
            <MemberGridView
              teamId={teamId}
              search={search}
              cab={cab}
              onlyGaps={onlyGaps}
              batchId={batchId}
              note={note}
              setNote={setNote}
              onBatch={setBatchId}
              onTotal={setCrqTotal}
            />
          )}
          {view === "history" && (
            <>
              <HintBar note={note}>
                <Box component="span" sx={{ fontWeight: 600, color: tk.textPrimary }}>
                  Every draft change, undo and publish made on this page — newest first.
                </Box>
              </HintBar>
              <Box sx={{ p: 1.5 }}>
                <HistoryView batchId={batchId} />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
