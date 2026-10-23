import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import VideoCameraFrontOutlinedIcon from "@mui/icons-material/VideoCameraFrontOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import KeyboardDoubleArrowLeftRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowLeftRounded";
import KeyboardDoubleArrowRightRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowRightRounded";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTabColorTokens } from "../../../style/theme";
import { exportRowsToExcel, type ExcelColumn } from "../../crqAnalytics/utils/excelExport";
import {
  useGetCabSessionAgendaQuery,
  useGetCabSessionsQuery,
} from "../api/cabManagerApiSlice";
import { AddCrqToSessionModal } from "../components/modals/AddCrqToSessionModal";
import { ImportExternalCrqModal } from "../components/modals/ImportExternalCrqModal";
import { RecordCabDecisionModal } from "../components/modals/RecordCabDecisionModal";
import { CabDecisionChip, ImpactChip } from "../components/shared/Chips";
import { errMsg } from "../components/shared/errMsg";
import { toSessionUrl } from "../components/shared/sessionLink";
import type { CabAgendaRow, CabSession } from "../types/types";

const MONO = { fontFamily: "'Roboto Mono', monospace" } as const;

const AGENDA_EXPORT_COLUMNS: ExcelColumn[] = [
  { header: "Circle", key: "circle", width: 16 },
  { header: "CRQ No", key: "crqNo", width: 20 },
  { header: "Type of activity", key: "typeOfActivity", width: 40 },
  { header: "Node name", key: "nodeName", width: 36 },
  { header: "Impact", key: "changeImpact", width: 10 },
  { header: "CAB decision", key: "cabDecision", width: 16 },
];

type Tone = "success" | "info" | "warning" | "error" | "neutral";

// Remembers whether the session list is folded away. Per-browser convenience
// only — storage can be blocked, so every access is guarded.
const LIST_OPEN_KEY = "cabSessions.listOpen";
function readListOpen(): boolean {
  try {
    return localStorage.getItem(LIST_OPEN_KEY) !== "false";
  } catch {
    return true;
  }
}
function writeListOpen(open: boolean) {
  try {
    localStorage.setItem(LIST_OPEN_KEY, String(open));
  } catch {
    /* storage unavailable — the toggle still works for this visit */
  }
}

const SESSION_STATUS: Record<string, { tone: Tone; label: string }> = {
  live:      { tone: "success", label: "Live" },
  scheduled: { tone: "info",    label: "Scheduled" },
  completed: { tone: "neutral", label: "Completed" },
};

// Order and colour of the decision tally in the session summary. Each pill
// doubles as a filter on the agenda.
const DECISIONS: { key: string; label: string; tone: Tone }[] = [
  { key: "PENDING",     label: "Awaiting",    tone: "neutral" },
  { key: "APPROVED",    label: "Approved",    tone: "success" },
  { key: "REJECTED",    label: "Rejected",    tone: "error" },
  { key: "RESCHEDULED", label: "Rescheduled", tone: "warning" },
];

/** Theme-aware foreground for a tone, so the page reads the same in dark mode. */
function useToneColor() {
  const theme = useTheme();
  return (tone: Tone) =>
    tone === "neutral" ? theme.palette.text.secondary : theme.palette[tone].main;
}

/** Small dot + label status marker. */
function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const color = useToneColor()(tone);
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex", alignItems: "center", gap: 0.6,
        px: 1, py: 0.2, borderRadius: 999,
        bgcolor: alpha(color, 0.1), color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
      }}
    >
      <Box
        sx={{
          width: 6, height: 6, borderRadius: "50%", bgcolor: color,
          ...(tone === "success" && {
            animation: "cabLivePulse 1.6s ease-in-out infinite",
            "@keyframes cabLivePulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.35 } },
          }),
        }}
      />
      {label}
    </Box>
  );
}

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

/** One entry in the left-hand session list. The whole card selects the session. */
function SessionCard({
  session,
  active,
  onSelect,
}: {
  session: CabSession;
  active: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const st = SESSION_STATUS[session.status] ?? { tone: "neutral" as Tone, label: session.status };
  const crqCount = session.crqIds?.length ?? 0;
  const joinUrl = toSessionUrl(session.sessionLink);

  return (
    <ButtonBase
      component="div"
      onClick={onSelect}
      sx={{
        display: "block", width: "100%", textAlign: "left", flexShrink: 0,
        position: "relative", overflow: "hidden",
        p: 1.5, pl: 2,
        borderRadius: tk.radius,
        border: "1px solid",
        borderColor: active ? tk.accentBorder : "transparent",
        bgcolor: active ? tk.selectedRow : "transparent",
        transition: "background-color 120ms ease, border-color 120ms ease",
        "&:hover": { bgcolor: active ? tk.selectedRow : "action.hover" },
        // Accent rail on the selected session.
        "&::before": {
          content: '""', position: "absolute", left: 0, top: 10, bottom: 10, width: 3,
          borderRadius: "0 3px 3px 0", bgcolor: active ? tk.accent : "transparent",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography
          noWrap
          sx={{ ...MONO, fontSize: 12.5, fontWeight: 600, color: active ? "primary.main" : "text.primary" }}
        >
          {session.id}
        </Typography>
        <StatusPill tone={st.tone} label={st.label} />
      </Stack>

      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75, color: "text.secondary" }}>
        <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
        <Typography variant="caption" noWrap>{session.date} · {session.time}</Typography>
      </Stack>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25, color: "text.secondary" }}>
        <PersonOutlineOutlinedIcon sx={{ fontSize: 14 }} />
        <Typography variant="caption" noWrap>{session.host}</Typography>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Chip
            size="small"
            label={session.type}
            sx={{ height: 20, fontSize: 10.5, fontWeight: 600, bgcolor: tk.surface2 }}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {crqCount === 0 ? "No CRQs" : `${crqCount} CRQ${crqCount === 1 ? "" : "s"}`}
          </Typography>
        </Stack>
        {/* Only offered when the session actually has a bridge — a dead
            "Join" button is worse than none on a call day. */}
        {joinUrl && (
          <Tooltip title="Join session">
            <IconButton
              size="small"
              component="a"
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: 26, height: 26,
                color: session.status === "live" ? "success.main" : "primary.main",
                bgcolor: alpha(session.status === "live" ? theme.palette.success.main : theme.palette.primary.main, 0.1),
              }}
            >
              <VideoCameraFrontOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </ButtonBase>
  );
}

export function CabSessionsPage() {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const toneColor = useToneColor();

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
  const [decision, setDecision] = useState("");
  const [decisionRow, setDecisionRow] = useState<CabAgendaRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [listOpen, setListOpen] = useState(readListOpen);
  const toggleList = () => {
    setListOpen((v) => {
      writeListOpen(!v);
      return !v;
    });
  };

  const sessionList = sessions.data ?? [];
  const noSessions = !sessions.isLoading && !sessions.isError && sessionList.length === 0;
  const activeSession = sessionList.find((s) => s.id === activeId);

  // Auto-select first session
  useEffect(() => {
    if (!activeId && sessions.data && sessions.data.length > 0) {
      setActiveId(sessions.data[0].id);
    }
  }, [activeId, sessions.data]);

  const clearFilters = () => {
    setSearch("");
    setCircle("");
    setImpact("");
    setDecision("");
  };

  // Filters describe one agenda. Carrying them to the next session would hide
  // rows the user never chose to hide.
  useEffect(() => {
    setSearch("");
    setCircle("");
    setImpact("");
    setDecision("");
  }, [activeId]);

  // `data` is RTK Query's last result for ANY session id; only `currentData` is
  // scoped to the session actually selected.
  const rows = useMemo(() => agenda.currentData ?? [], [agenda.currentData]);

  const circleOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.circle).filter(Boolean) as string[])).sort(),
    [rows]
  );

  const tally = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const k = r.cabDecision?.toUpperCase() ?? "";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (circle && r.circle !== circle) return false;
      if (impact && r.changeImpact !== impact) return false;
      if (decision && r.cabDecision?.toUpperCase() !== decision) return false;
      if (q) {
        const hay = `${r.crqNo} ${r.typeOfActivity ?? ""} ${r.nodeName ?? ""} ${r.circle ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, circle, impact, decision]);

  const hasFilters = Boolean(search || circle || impact || decision);
  const decided = rows.length - (tally.PENDING ?? 0);
  const progress = rows.length === 0 ? 0 : Math.round((decided / rows.length) * 100);
  const activeJoinUrl = toSessionUrl(activeSession?.sessionLink);
  const chairedBy = rows[0]?.chairedBy ?? activeSession?.host;
  const sessionDate = rows[0]?.cabSessionDate ?? activeSession?.date;
  const activeStatus = activeSession ? SESSION_STATUS[activeSession.status] : undefined;

  const columns = useMemo<MRT_ColumnDef<CabAgendaRow>[]>(
    () => [
      { accessorKey: "circle", header: "Circle", size: 100, Cell: ({ row }) => row.original.circle ?? "—" },
      {
        accessorKey: "crqNo",
        header: "CRQ No",
        size: 140,
        Cell: ({ row }) => (
          <Typography sx={{ ...MONO, fontSize: 12.5, color: "primary.main", fontWeight: 500, whiteSpace: "nowrap" }}>
            {row.original.crqNo}
          </Typography>
        ),
      },
      // Long free-text columns wrap within a cap instead of stretching the
      // table past the panel on narrower (or zoomed) screens.
      {
        accessorKey: "typeOfActivity",
        header: "Type of activity",
        size: 200,
        Cell: ({ row }) => (
          <Typography sx={{ fontSize: 12, color: "text.secondary", maxWidth: 260, whiteSpace: "normal", overflowWrap: "anywhere" }}>
            {row.original.typeOfActivity ?? "—"}
          </Typography>
        ),
      },
      {
        accessorKey: "nodeName",
        header: "Node name",
        size: 180,
        Cell: ({ row }) => (
          <Typography sx={{ ...MONO, fontSize: 11.5, color: "text.secondary", maxWidth: 220, whiteSpace: "normal", overflowWrap: "anywhere" }}>
            {row.original.nodeName ?? "—"}
          </Typography>
        ),
      },
      {
        accessorKey: "changeImpact",
        header: "Impact",
        size: 90,
        Cell: ({ row }) => (row.original.changeImpact ? <ImpactChip impact={row.original.changeImpact} /> : "—"),
      },
      {
        accessorKey: "cabDecision",
        header: "CAB decision",
        size: 130,
        Cell: ({ row }) => <CabDecisionChip decision={row.original.cabDecision} />,
      },
    ],
    []
  );

  const table = useAppTable({
    columns,
    data: visibleRows,
    getRowId: (row) => String(row.mappingId),
    state: { isLoading: agenda.isLoading },
    enableTopToolbar: false,
    enableRowActions: true,
    positionActionsColumn: "last",
    displayColumnDefOptions: {
      "mrt-row-actions": { header: "", size: 140, muiTableBodyCellProps: { align: "right" } },
    },
    renderRowActions: ({ row }) => {
      const isPending = row.original.cabDecision?.toUpperCase() === "PENDING";
      return (
        <Button
          size="small"
          variant={isPending ? "contained" : "text"}
          disableElevation
          onClick={() => setDecisionRow(row.original)}
          sx={{ whiteSpace: "nowrap", minWidth: 0, px: 1.25, fontSize: 12 }}
        >
          {isPending ? "Record decision" : "Revise"}
        </Button>
      );
    },
    appTable: {
      // Sits inside the agenda Paper and takes whatever height it has left,
      // so the body scrolls under a sticky header and the pager stays visible.
      frame: false,
      maxHeight: false,
      emptyTitle: "No CRQs match these filters",
    },
    muiTablePaperProps: {
      sx: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
    },
    muiTableContainerProps: {
      sx: { flex: 1, minHeight: 0, overflowY: "auto" },
    },
  });

  // Exports what is on screen, so the sheet matches the filters the user applied.
  const handleExport = async () => {
    if (!activeId || visibleRows.length === 0) return;
    setExporting(true);
    try {
      await exportRowsToExcel(visibleRows, AGENDA_EXPORT_COLUMNS, "CAB Agenda", `CAB_Session_${activeId}`);
    } finally {
      setExporting(false);
    }
  };

  const copyLink = async () => {
    if (!activeSession?.sessionLink) return;
    try {
      await navigator.clipboard.writeText(activeSession.sessionLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the link is still visible to copy by hand */
    }
  };

  const panelSx = {
    border: "1px solid",
    borderColor: tk.border,
    borderRadius: tk.radiusL,
    bgcolor: tk.surface,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
  } as const;

  const filterFieldSx = {
    "& .MuiOutlinedInput-root": { bgcolor: tk.surface, fontSize: 13 },
    "& .MuiInputLabel-root": { fontSize: 13 },
  } as const;

  return (
    // The floor stops a short (e.g. 125% zoomed) viewport from crushing the
    // agenda to a couple of rows; below it the page scrolls instead.
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", minHeight: 560, gap: 2 }}>
      {/* Page header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: "-0.3px" }}>My CAB Sessions</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
            Open a session's agenda, work through the CRQs tabled at it, and record what the CAB decided on each.
          </Typography>
        </Box>
        <Tooltip title="Refresh sessions and agenda">
          <span>
            <IconButton
              size="small"
              onClick={() => {
                void sessions.refetch();
                if (activeId) void agenda.refetch();
              }}
              disabled={sessions.isFetching || agenda.isFetching}
              sx={{ border: "1px solid", borderColor: tk.border, bgcolor: tk.surface }}
            >
              {sessions.isFetching || agenda.isFetching
                ? <CircularProgress size={16} />
                : <RefreshRoundedIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* minmax(0, 1fr) lets the agenda column shrink below the table's
          natural width, so the table scrolls sideways instead of the page. */}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: listOpen
            ? { xs: "250px minmax(0, 1fr)", lg: "270px minmax(0, 1fr)", xl: "310px minmax(0, 1fr)" }
            : "44px minmax(0, 1fr)",
          transition: "grid-template-columns 200ms ease",
          gap: 2,
          minHeight: 0,
        }}
      >
        {/* Left: sessions list. Folds to a slim rail so the agenda can take
            the full width once a session is picked. */}
        {!listOpen ? (
          <Paper elevation={0} sx={{ ...panelSx, alignItems: "center", py: 1, gap: 1.5 }}>
            <Tooltip title="Show sessions" placement="right">
              <IconButton size="small" onClick={toggleList}>
                <KeyboardDoubleArrowRightRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <ButtonBase
              onClick={toggleList}
              sx={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "text.secondary", py: 1, borderRadius: 1,
                "&:hover": { color: "primary.main" },
              }}
            >
              Sessions{!sessions.isLoading && !sessions.isError ? ` · ${sessionList.length}` : ""}
            </ButtonBase>
          </Paper>
        ) : (
        <Paper elevation={0} sx={panelSx}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ pl: 2, pr: 1, py: 0.75, borderBottom: "1px solid", borderColor: tk.border, bgcolor: tk.surface2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "text.secondary" }}>
                Sessions
              </Typography>
              {!sessions.isLoading && !sessions.isError && (
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {sessionList.length}
                </Typography>
              )}
            </Stack>
            <Tooltip title="Hide sessions">
              <IconButton size="small" onClick={toggleList}>
                <KeyboardDoubleArrowLeftRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack spacing={0.5} sx={{ flex: 1, overflowY: "auto", p: 1 }}>
            {sessions.isLoading ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={104} sx={{ flexShrink: 0 }} />)
            ) : sessions.isError ? (
              <Alert
                severity="error"
                action={<Button color="inherit" size="small" onClick={() => void sessions.refetch()}>Retry</Button>}
              >
                {errMsg(sessions.error)}
              </Alert>
            ) : noSessions ? (
              <EmptyState
                compact
                icon={<EventBusyOutlinedIcon sx={{ fontSize: 26 }} />}
                title="No CAB sessions"
                hint="New sessions appear here as soon as the CAB Engineer plans one."
                action={
                  <Button size="small" variant="outlined" onClick={() => void sessions.refetch()}>
                    Refresh
                  </Button>
                }
              />
            ) : (
              sessionList.map((s) => (
                <SessionCard key={s.id} session={s} active={s.id === activeId} onSelect={() => setActiveId(s.id)} />
              ))
            )}
          </Stack>
        </Paper>
        )}

        {/* Right: agenda board */}
        <Paper elevation={0} sx={panelSx}>
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
              <Box
                sx={{
                  px: 2.5, py: { xs: 1.5, xl: 2 },
                  borderBottom: "1px solid", borderColor: tk.border,
                  display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0, flex: "1 1 280px" }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography sx={{ ...MONO, fontSize: 16, fontWeight: 600, color: "text.primary" }}>{activeId}</Typography>
                    {activeStatus && <StatusPill tone={activeStatus.tone} label={activeStatus.label} />}
                    {activeSession?.type && (
                      <Chip
                        size="small"
                        label={`${activeSession.type} CAB`}
                        sx={{ height: 20, fontSize: 10.5, fontWeight: 600, bgcolor: tk.surface2 }}
                      />
                    )}
                    {/* A refresh over rows already on screen — the board stays
                        readable, but nobody acts on it thinking it is settled. */}
                    {agenda.isFetching && !agenda.isLoading && (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
                        <CircularProgress size={11} color="inherit" />
                        <Typography variant="caption">Refreshing</Typography>
                      </Stack>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75, color: "text.secondary" }}>
                    {sessionDate && (
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <CalendarTodayOutlinedIcon sx={{ fontSize: 13 }} />
                        <Typography variant="caption">{sessionDate}</Typography>
                      </Stack>
                    )}
                    {chairedBy && (
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <PersonOutlineOutlinedIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">Chaired by {chairedBy}</Typography>
                      </Stack>
                    )}
                    {/* The raw link, so it can be read out or copied on a call
                        even by someone who cannot click through from here. */}
                    {activeSession?.sessionLink && (
                      <Stack direction="row" spacing={0.25} alignItems="center" sx={{ minWidth: 0, maxWidth: "100%" }}>
                        <Typography variant="caption" noWrap sx={{ ...MONO, fontSize: 11, maxWidth: 320 }}>
                          {activeSession.sessionLink}
                        </Typography>
                        <Tooltip title={copied ? "Copied" : "Copy link"}>
                          <IconButton size="small" onClick={() => void copyLink()} sx={{ p: 0.25 }}>
                            <ContentCopyOutlinedIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap justifyContent="flex-end">
                  {activeJoinUrl && (
                    <Button
                      size="small"
                      variant={activeSession?.status === "live" ? "contained" : "outlined"}
                      color={activeSession?.status === "live" ? "success" : "primary"}
                      disableElevation
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
                  {/* mahesh told me to hide this button  */}
                  {/* <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlaylistAddOutlinedIcon />}
                    onClick={() => setAddOpen(true)}
                  >
                    Add CRQs
                  </Button> */}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<UploadFileOutlinedIcon />}
                    onClick={() => setImportOpen(true)}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Add External CRQ
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <FileDownloadOutlinedIcon />}
                    onClick={() => void handleExport()}
                    disabled={exporting || visibleRows.length === 0}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {exporting ? "Exporting…" : "Export Excel"}
                  </Button>
                </Stack>
              </Box>

              {/* Decision progress + tally. Each tally pill filters the agenda. */}
              {rows.length > 0 && (
                <Box
                  sx={{
                    px: 2.5, py: 1.25,
                    borderBottom: "1px solid", borderColor: tk.border,
                    display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2,
                  }}
                >
                  <Box sx={{ flex: "1 1 200px", minWidth: 180, maxWidth: 360 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {decided} of {rows.length} decided
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{progress}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={progress === 100 ? "success" : "primary"}
                      sx={{ height: 6, borderRadius: 3, bgcolor: tk.surface2 }}
                    />
                  </Box>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {DECISIONS.map((d) => {
                      const count = tally[d.key] ?? 0;
                      const selected = decision === d.key;
                      const color = toneColor(d.tone);
                      return (
                        <ButtonBase
                          key={d.key}
                          onClick={() => setDecision(selected ? "" : d.key)}
                          disabled={count === 0 && !selected}
                          sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.75,
                            px: 1.25, py: 0.5, borderRadius: 999,
                            border: "1px solid",
                            borderColor: selected ? color : tk.border,
                            bgcolor: selected ? alpha(color, 0.12) : "transparent",
                            opacity: count === 0 && !selected ? 0.5 : 1,
                            transition: "all 120ms ease",
                            "&:hover": { bgcolor: alpha(color, 0.08) },
                          }}
                        >
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: color }} />
                          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{d.label}</Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: selected ? color : "text.primary" }}>
                            {count}
                          </Typography>
                        </ButtonBase>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Filters */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ px: 2.5, py: 1.25, borderBottom: "1px solid", borderColor: tk.border, bgcolor: tk.surface2 }}
              >
                <TextField
                  size="small"
                  placeholder="Search CRQ, node or circle"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <SearchOutlinedIcon sx={{ fontSize: 18, color: "text.disabled", mr: 0.75 }} /> }}
                  sx={{ ...filterFieldSx, flex: "1 1 220px", maxWidth: 360 }}
                />
                <TextField
                  select size="small" label="Circle" value={circle}
                  onChange={(e) => setCircle(e.target.value)}
                  sx={{ ...filterFieldSx, minWidth: 140 }}
                >
                  <MenuItem value="">All circles</MenuItem>
                  {circleOptions.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <TextField
                  select size="small" label="Impact" value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  sx={{ ...filterFieldSx, minWidth: 120 }}
                >
                  <MenuItem value="">SA and NSA</MenuItem>
                  <MenuItem value="SA">SA</MenuItem>
                  <MenuItem value="NSA">NSA</MenuItem>
                </TextField>
                {hasFilters && (
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<FilterAltOffOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={clearFilters}
                    sx={{ color: "text.secondary", fontSize: 12 }}
                  >
                    Clear
                  </Button>
                )}
                {rows.length > 0 && (
                  <Typography variant="caption" sx={{ ml: "auto", color: "text.secondary", whiteSpace: "nowrap" }}>
                    Showing <b>{visibleRows.length}</b> of {rows.length}
                  </Typography>
                )}
              </Stack>

              {/* Agenda rows */}
              <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" }}>
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
                      <Button size="small" variant="outlined" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <MaterialReactTable table={table} />
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
          <ImportExternalCrqModal
            open={importOpen}
            sessionId={activeId}
            alreadyTabled={rows.map((r) => r.crqNo)}
            onClose={() => setImportOpen(false)}
          />
        </>
      )}
    </Box>
  );
}
