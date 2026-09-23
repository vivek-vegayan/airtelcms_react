import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import VideoCameraFrontOutlinedIcon from "@mui/icons-material/VideoCameraFrontOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  useGetCabSessionAgendaQuery,
  useGetCabSessionsQuery,
} from "../api/cabManagerApiSlice";
import { AddCrqToSessionModal } from "../components/modals/AddCrqToSessionModal";
import { RecordCabDecisionModal } from "../components/modals/RecordCabDecisionModal";
import { CabDecisionChip, ImpactChip } from "../components/shared/Chips";
import { errMsg } from "../components/shared/errMsg";
import { toSessionUrl } from "../components/shared/sessionLink";
import type { CabAgendaRow } from "../types/types";

const STATUS_COLOR = {
  live:      { bg: "#E8F5E9", fg: "#2E7D32", label: "Live"      },
  scheduled: { bg: "#E3F2FD", fg: "#1565C0", label: "Scheduled" },
  completed: { bg: "#F4F5F7", fg: "rgba(0,0,0,0.55)", label: "Completed" },
};

const MONO = { fontFamily: "'Roboto Mono', monospace" } as const;

/** Centred icon + message block used wherever a list comes back empty. */
function EmptyState({
  icon,
  title,
  hint,
  action,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 0.75,
        px: 3,
        py: compact ? 3 : 6,
      }}
    >
      <Box
        sx={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: compact ? 48 : 60, height: compact ? 48 : 60,
          borderRadius: "50%", bgcolor: "action.hover", color: "text.disabled", mb: 0.5,
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
      {hint && (
        <Typography variant="caption" sx={{ color: "text.secondary", maxWidth: 320, lineHeight: 1.6 }}>
          {hint}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1.25 }}>{action}</Box>}
    </Box>
  );
}

export function CabSessionsPage() {
  const sessions = useGetCabSessionsQuery();
  const [activeId, setActiveId] = useState<string | null>(null);
  // Re-asked on every session switch rather than served from the 60s cache:
  // during a live sitting another CAB member may have recorded a decision since
  // this agenda was last read, and a stale board is worse than a brief spinner.
  const agenda = useGetCabSessionAgendaQuery(activeId ?? "", {
    skip: !activeId,
    refetchOnMountOrArgChange: true,
  });

  const [search, setSearch] = useState("");
  const [circle, setCircle] = useState("");
  const [impact, setImpact] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [decisionRow, setDecisionRow] = useState<CabAgendaRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const sessionList = sessions.data ?? [];
  const noSessions = !sessions.isLoading && !sessions.isError && sessionList.length === 0;
  const activeSession = sessionList.find((s) => s.id === activeId);

  // Auto-select first session
  useEffect(() => {
    if (!activeId && sessions.data && sessions.data.length > 0) {
      setActiveId(sessions.data[0].id);
    }
  }, [activeId, sessions.data]);

  // Filters describe one agenda. Carrying them to the next session would hide
  // rows the user never chose to hide.
  useEffect(() => {
    setSearch("");
    setCircle("");
    setImpact("");
    setPendingOnly(false);
  }, [activeId]);

  // `data` is RTK Query's last result for ANY session id; only `currentData` is
  // scoped to the session actually selected.
  const rows = useMemo(() => agenda.currentData ?? [], [agenda.currentData]);

  const circleOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.circle).filter(Boolean) as string[])).sort(),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (circle && r.circle !== circle) return false;
      if (impact && r.changeImpact !== impact) return false;
      if (pendingOnly && r.cabDecision?.toUpperCase() !== "PENDING") return false;
      if (q) {
        const hay = `${r.crqNo} ${r.nodeName ?? ""} ${r.circle ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, circle, impact, pendingOnly]);

  const decided = rows.filter((r) => r.cabDecision?.toUpperCase() !== "PENDING").length;
  const activeJoinUrl = toSessionUrl(activeSession?.sessionLink);
  const chairedBy = rows[0]?.chairedBy ?? activeSession?.host;
  const sessionDate = rows[0]?.cabSessionDate ?? activeSession?.date;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 500, letterSpacing: "-0.3px" }}>My CAB Sessions</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Open a session's agenda, work through the CRQs tabled at it, and record what the CAB decided on each.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: "340px 1fr", gap: 2, minHeight: 0 }}>
        {/* Left: sessions list */}
        <Stack spacing={1.5} sx={{ overflowY: "auto", pr: 0.5 }}>
          {sessions.isLoading ? (
            <>
              {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={160} />)}
            </>
          ) : sessions.isError ? (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void sessions.refetch()}>Retry</Button>}>{errMsg(sessions.error)}</Alert>
          ) : noSessions ? (
            <Paper
              elevation={0}
              sx={{ border: "1px dashed", borderColor: "divider", bgcolor: "background.default", flexShrink: 0 }}
            >
              <EmptyState
                compact
                icon={<EventBusyOutlinedIcon sx={{ fontSize: 26 }} />}
                title="No CAB sessions"
                hint="You have no CAB sessions scheduled right now. New sessions appear here as soon as the CAB Engineer plans one."
                action={
                  <Button size="small" variant="outlined" onClick={() => void sessions.refetch()}>
                    Refresh
                  </Button>
                }
              />
            </Paper>
          ) : (
            sessionList.map((s) => {
              const sc = STATUS_COLOR[s.status];
              const isActive = s.id === activeId;
              const crqCount = s.crqIds?.length ?? 0;
              const joinUrl = toSessionUrl(s.sessionLink);
              return (
                <Paper
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  sx={{
                    p: 2, cursor: "pointer", border: "1px solid",
                    borderColor: isActive ? "primary.main" : "divider",
                    bgcolor: isActive ? "#F4F8FD" : "background.paper",
                    flexShrink: 0,
                  }}
                  elevation={0}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={{ ...MONO, color: "primary.main", fontWeight: 500, fontSize: 13 }}>{s.id}</Typography>
                    <Chip size="small" label={sc?.label ?? s.status} sx={{ bgcolor: sc?.bg, color: sc?.fg, fontWeight: 500 }} />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Chip size="small" label={s.type} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {crqCount === 0 ? "No CRQs yet" : crqCount + " CRQs"}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{s.date} · {s.time}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Hosted by {s.host}</Typography>
                  <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={(e) => { e.stopPropagation(); setActiveId(s.id); }}
                    >
                      {s.status === "completed" ? "Review minutes" : "View agenda"}
                    </Button>
                    {/* Only offered when the session actually has a bridge — a
                        dead "Join" button is worse than none on a call day. */}
                    {joinUrl && (
                      <Button
                        size="small"
                        variant={s.status === "live" ? "contained" : "outlined"}
                        startIcon={<VideoCameraFrontOutlinedIcon />}
                        component="a"
                        href={joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                      >
                        Join
                      </Button>
                    )}
                  </Stack>
                </Paper>
              );
            })
          )}
        </Stack>

        {/* Right: agenda board */}
        <Paper sx={{ border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }} elevation={0}>
          {sessions.isLoading ? (
            <Box sx={{ p: 3 }}><Skeleton variant="rounded" height={400} /></Box>
          ) : sessions.isError ? (
            <EmptyState
              icon={<InboxOutlinedIcon sx={{ fontSize: 30 }} />}
              title="Session details unavailable"
              hint="Your CAB sessions could not be loaded, so there is nothing to show here yet."
              action={
                <Button size="small" variant="outlined" onClick={() => void sessions.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : noSessions ? (
            <EmptyState
              icon={<InboxOutlinedIcon sx={{ fontSize: 30 }} />}
              title="Nothing to display"
              hint="The agenda and the CRQs tabled for discussion will show up here once a CAB session is scheduled for you."
            />
          ) : !activeId ? (
            <EmptyState
              icon={<TouchAppOutlinedIcon sx={{ fontSize: 30 }} />}
              title="Select a session"
              hint="Pick a CAB session from the list on the left to open its agenda."
            />
          ) : (
            <>
              {/* Session header */}
              <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography sx={{ ...MONO, color: "primary.main", fontWeight: 500 }}>{activeId}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {activeSession?.type ? `${activeSession.type} CAB · ` : ""}
                      {rows.length === 0 ? "No CRQs tabled" : `${decided} of ${rows.length} decided`}
                    </Typography>
                    {/* A refresh over rows already on screen — the board stays
                        readable, but nobody acts on it thinking it is settled. */}
                    {agenda.isFetching && !agenda.isLoading && (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
                        <CircularProgress size={11} color="inherit" />
                        <Typography variant="caption">Refreshing</Typography>
                      </Stack>
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    {sessionDate}
                    {chairedBy ? ` · Chaired by ${chairedBy}` : ""}
                  </Typography>
                  {/* The raw link, so it can be read out or copied on a call
                      even by someone who cannot click through from here. */}
                  {activeSession?.sessionLink && (
                    <Typography
                      variant="caption"
                      sx={{ ...MONO, fontSize: 11, color: "text.secondary", display: "block", overflowWrap: "anywhere" }}
                    >
                      {activeSession.sessionLink}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {activeSession?.status === "live" && (
                    <Chip size="small" label="Session live" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 500 }} />
                  )}
                  {activeJoinUrl && (
                    <Button
                      size="small"
                      variant={activeSession?.status === "live" ? "contained" : "outlined"}
                      startIcon={<VideoCameraFrontOutlinedIcon />}
                      component="a"
                      href={activeJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      Join session
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlaylistAddOutlinedIcon />}
                    onClick={() => setAddOpen(true)}
                  >
                    Add CRQs
                  </Button>
                </Stack>
              </Box>

              {/* Filters */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <TextField
                  size="small"
                  placeholder="Search CRQ, node or circle"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <SearchOutlinedIcon sx={{ fontSize: 18, color: "text.disabled", mr: 0.75 }} /> }}
                  sx={{ flex: 1, minWidth: 220 }}
                />
                <TextField
                  select size="small" label="Circle" value={circle}
                  onChange={(e) => setCircle(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="">All circles</MenuItem>
                  {circleOptions.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <TextField
                  select size="small" label="Impact" value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  sx={{ minWidth: 130 }}
                >
                  <MenuItem value="">SA and NSA</MenuItem>
                  <MenuItem value="SA">SA</MenuItem>
                  <MenuItem value="NSA">NSA</MenuItem>
                </TextField>
                <Chip
                  label="Awaiting decision only"
                  variant={pendingOnly ? "filled" : "outlined"}
                  color={pendingOnly ? "primary" : "default"}
                  onClick={() => setPendingOnly((v) => !v)}
                  sx={{ fontWeight: 500 }}
                />
              </Stack>

              {/* Agenda rows */}
              <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
                {agenda.isError ? (
                  <Box sx={{ p: 3 }}>
                    <Alert
                      severity="error"
                      action={<Button color="inherit" size="small" onClick={() => void agenda.refetch()}>Retry</Button>}
                    >
                      {errMsg(agenda.error)}
                    </Alert>
                  </Box>
                ) : agenda.isLoading ? (
                  // isLoading, not isFetching: with refetchOnMountOrArgChange a
                  // return to an already-read session refetches, and blanking
                  // the board to a skeleton each time would flash on every
                  // switch. Cached rows stay on screen; the header says it is
                  // re-checking.
                  <Box sx={{ p: 2.5 }}><Skeleton variant="rounded" height={320} /></Box>
                ) : rows.length === 0 ? (
                  <EmptyState
                    icon={<PlaylistRemoveOutlinedIcon sx={{ fontSize: 30 }} />}
                    title="No CRQs on the agenda"
                    hint="No change requests have been tabled at this session yet."
                    action={
                      <Button size="small" variant="outlined" startIcon={<PlaylistAddOutlinedIcon />} onClick={() => setAddOpen(true)}>
                        Add CRQs
                      </Button>
                    }
                  />
                ) : visibleRows.length === 0 ? (
                  <EmptyState
                    icon={<PlaylistRemoveOutlinedIcon sx={{ fontSize: 30 }} />}
                    title="No CRQs match these filters"
                    hint="Clear the search or pick a different circle to see the rest of the agenda."
                    action={
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => { setSearch(""); setCircle(""); setImpact(""); setPendingOnly(false); }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <TableContainer>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {["Circle", "CRQ No", "Node name", "Impact", "CAB decision", ""].map((h, i) => (
                            <TableCell
                              key={h || `col-${i}`}
                              sx={{
                                fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                                textTransform: "uppercase", color: "text.secondary",
                                bgcolor: "background.paper",
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {visibleRows.map((r) => {
                          const isPending = r.cabDecision?.toUpperCase() === "PENDING";
                          return (
                            <TableRow key={r.mappingId} hover>
                              <TableCell>{r.circle ?? "—"}</TableCell>
                              <TableCell sx={{ ...MONO, fontSize: 12.5, color: "primary.main", fontWeight: 500 }}>
                                {r.crqNo}
                              </TableCell>
                              <TableCell sx={{ ...MONO, fontSize: 11.5, color: "text.secondary" }}>
                                {r.nodeName ?? "—"}
                              </TableCell>
                              <TableCell>
                                {r.changeImpact ? <ImpactChip impact={r.changeImpact} /> : "—"}
                              </TableCell>
                              <TableCell><CabDecisionChip decision={r.cabDecision} /></TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant={isPending ? "outlined" : "text"}
                                  onClick={() => setDecisionRow(r)}
                                  sx={{ whiteSpace: "nowrap" }}
                                >
                                  {isPending ? "Record decision" : "Revise"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {activeId && (
        <>
          <RecordCabDecisionModal
            open={!!decisionRow}
            sessionId={activeId}
            row={decisionRow}
            onClose={() => setDecisionRow(null)}
          />
          <AddCrqToSessionModal
            open={addOpen}
            sessionId={activeId}
            alreadyTabled={rows.map((r) => r.crqNo)}
            onClose={() => setAddOpen(false)}
          />
        </>
      )}
    </Box>
  );
}
