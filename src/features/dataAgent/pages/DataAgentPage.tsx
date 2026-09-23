import { useEffect, useRef, useState } from "react";
import { Box, Button, Stack, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import ViewSidebarRoundedIcon from "@mui/icons-material/ViewSidebarRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";
import { useAppSelector } from "../../../app/hooks";
import { useTabColorTokens } from "../../../style/theme";
import {
  useAskQuestionMutation,
  useClearHistoryMutation,
  useDeleteHistoryEntryMutation,
  useGetHistoryQuery,
  useSaveHistoryMutation,
} from "../api/dataAgentApi";
import { getAvailableTypes } from "../utils/detectType";
import ChatHistorySidebar from "../components/ChatHistorySidebar";
import ChatPanel from "../components/ChatPanel";
import VisualizationCanvas from "../components/VisualizationCanvas";
import SelectionPopup from "../components/SelectionPopup";
import { useTextSelection } from "../hooks/useTextSelection";
import { useFullWindow } from "../hooks/useFullWindow";
import { generateId } from "../utils/generateId";
import type { CanvasPage, ChatMessage, QueryResult, WidgetState } from "../types/dataAgent.types";

const PAGES_KEY = "dataAgent.canvasPages";
const VIZ_WIDTH_KEY = "dataAgent.vizPanelWidth";
const WELCOME_TEXT =
  "Hi! Ask me anything about your network data. I'll fetch results and explain them — pin any response to the canvas to visualize it.";

function loadPages(): CanvasPage[] {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to default */
  }
  return [{ id: generateId(), name: "Page 1", widgets: [] }];
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Pulls the backend's ApiResponse.message out of an RTK Query error, falling back to a generic message. */
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return "Unable to reach the Data Agent server.";
}

export default function DataAgentPage() {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const displayName = useAppSelector((s) => s.auth.user?.employeeName ?? "");
  // Below "sm" the history rail auto-collapses (same breakpoint SideBar itself
  // uses); below "md" there isn't room for three side-by-side panels, so the
  // canvas becomes a full-screen overlay instead of a fixed-width column.
  const isDownSm = useMediaQuery(theme.breakpoints.down("sm"));
  const isDownMd = useMediaQuery(theme.breakpoints.down("md"));

  const [pages, setPages] = useState<CanvasPage[]>(loadPages);
  const [activePageId, setActivePageId] = useState(() => loadPages()[0].id);
  const [activeTab, setActiveTab] = useState<"canvas" | "saved">("canvas");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [vizOpen, setVizOpen] = useState(false);
  const [vizMaximized, setVizMaximized] = useState(false);
  const { isFullWindow, toggleFullWindow } = useFullWindow();
  const [vizWidth, setVizWidth] = useState(() => {
    const saved = localStorage.getItem(VIZ_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : 480;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: WELCOME_TEXT, timestamp: nowIso(), hasData: false },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);

  const [askQuestion, { isLoading: asking }] = useAskQuestionMutation();
  const [saveHistory] = useSaveHistoryMutation();
  const { data: history = [], isLoading: historyLoading } = useGetHistoryQuery();
  const [deleteHistoryEntry] = useDeleteHistoryEntryMutation();
  const [clearHistoryMutation] = useClearHistoryMutation();

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingViz = useRef(false);
  const { selection, clearSelection } = useTextSelection(canvasRef);

  useEffect(() => {
    localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem(VIZ_WIDTH_KEY, String(vizWidth));
  }, [vizWidth]);

  const startVizDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingViz.current = true;
    const startX = e.clientX;
    const startW = vizWidth;
    const onMove = (ev: MouseEvent) => {
      if (!isDraggingViz.current) return;
      const dx = startX - ev.clientX;
      setVizWidth(Math.max(320, Math.min(window.innerWidth * 0.75, startW + dx)));
    };
    const onUp = () => {
      isDraggingViz.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const updatePageWidgets = (id: string, updater: (widgets: WidgetState[]) => WidgetState[]) =>
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, widgets: updater(p.widgets) } : p)));

  const addPage = () => {
    const newPage: CanvasPage = { id: generateId(), name: `Page ${pages.length + 1}`, widgets: [] };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
  };

  const deletePage = (id: string) => {
    if (pages.length === 1) return;
    const idx = pages.findIndex((p) => p.id === id);
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    if (activePageId === id) setActivePageId(next[Math.max(0, idx - 1)].id);
  };

  const renamePage = (id: string, name: string) =>
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)));

  const updateWidget = (id: string, patch: Partial<WidgetState>) =>
    updatePageWidgets(activePageId, (prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  const toggleSaveWidget = (id: string) =>
    updatePageWidgets(activePageId, (prev) => prev.map((w) => (w.id === id ? { ...w, saved: !w.saved } : w)));

  const toggleMinimizeWidget = (id: string) =>
    updatePageWidgets(activePageId, (prev) => prev.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)));

  const removeWidget = (id: string) =>
    updatePageWidgets(activePageId, (prev) => prev.filter((w) => w.id !== id));

  const addToCanvas = (result: QueryResult) => {
    const rows = result.rows ?? [];
    const availableTypes = getAvailableTypes({ ...result, rows });
    const type = availableTypes[0];
    updatePageWidgets(activePageId, (prev) => [
      ...prev,
      {
        id: generateId(),
        type,
        availableTypes,
        title: result.question,
        data: { columns: result.columns, rows, question: result.question },
        summary: result.summary ?? undefined,
        x: 24 + (prev.length % 4) * 24,
        y: 24 + (prev.length % 4) * 24,
        width: type === "table" ? 460 : 320,
        height: type === "table" ? 340 : 280,
        saved: false,
        minimized: false,
      },
    ]);
  };

  const sendChat = async (questionOverride?: string) => {
    const q = (questionOverride ?? chatInput).trim();
    if (!q || asking) return;

    const userMsgId = generateId();
    const aiMsgId = generateId();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: q, timestamp: nowIso(), hasData: false },
      { id: aiMsgId, role: "assistant", text: "", timestamp: nowIso(), hasData: false, loading: true, question: q },
    ]);
    setChatInput("");
    setChatError(null);

    try {
      const result = await askQuestion({ question: q }).unwrap();

      // The server can answer 200 with a populated `error` field (e.g. an
      // unanswerable question) rather than an HTTP failure - surface that
      // the same way as a transport-level failure, not as a normal reply.
      if (result.error) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: result.error as string, loading: false, error: true } : m)),
        );
        return;
      }

      const rows = result.rows ?? [];
      const summary = result.summary ?? "";
      const rowCount = result.row_count ?? rows.length;
      const hasData = rowCount > 0;

      let replyText: string;
      if (summary.trim()) {
        replyText = summary;
      } else if (hasData) {
        replyText = `Found ${rowCount} result${rowCount !== 1 ? "s" : ""} across ${result.columns?.length ?? 0} columns: ${(result.columns ?? []).join(", ")}.`;
      } else {
        replyText = "No results found. Try rephrasing your question.";
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, text: replyText, hasData, loading: false, rowCount, columns: result.columns, intent: result.intent, result }
            : m,
        ),
      );

      saveHistory({ question: q, summary: replyText, intent: result.intent, rowCount }).catch(() => {
        /* history save is non-critical */
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, text: message, loading: false, error: true } : m)),
      );
      setChatError(message);
    }
  };

  const clearConversation = () =>
    setMessages([
      { id: generateId(), role: "assistant", text: WELCOME_TEXT, timestamp: nowIso(), hasData: false },
    ]);

  return (
    <Box
      sx={
        isFullWindow
          ? {
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              inset: 0,
              zIndex: theme.zIndex.modal + 1,
              height: "100vh",
              overflow: "hidden",
              bgcolor: c.bg,
            }
          : {
              display: "flex",
              flexDirection: "column",
              // The Header and SideBar are both `position: fixed` and out of
              // document flow (see Header.tsx's headerOffset / SideBar.tsx's
              // Drawer paper), so every top-level route shell has to carve out
              // its own clearance for them — same pl/pt DashboardViewPage and
              // ReusableTabLayout use. box-sizing: border-box (from CssBaseline)
              // means the padding is included in the 100vh, not additive.
              pl: 8,
              pt: "45px",
              height: "100vh",
              overflow: "hidden",
              bgcolor: c.bg,
            }
      }
    >
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
        <AutoAwesomeRoundedIcon sx={{ color: c.accent }} />
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
          Data Agent
        </Typography>
        <Button
          size="small"
          variant={vizOpen ? "contained" : "outlined"}
          startIcon={<ViewSidebarRoundedIcon fontSize="small" />}
          onClick={() => {
            setVizOpen((v) => !v);
            setVizMaximized(false);
          }}
          sx={{ textTransform: "none" }}
        >
          {vizOpen ? "Hide canvas" : "Show canvas"}
        </Button>
        <Tooltip title={isFullWindow ? "Exit full window" : "Full window view"}>
          <Button
            size="small"
            variant={isFullWindow ? "contained" : "outlined"}
            onClick={toggleFullWindow}
            sx={{ textTransform: "none", minWidth: 0, px: 1.25 }}
          >
            {isFullWindow ? <FullscreenExitRoundedIcon fontSize="small" /> : <FullscreenRoundedIcon fontSize="small" />}
          </Button>
        </Tooltip>
      </Stack>

      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {!vizMaximized && (
          <ChatHistorySidebar
            displayName={displayName || "You"}
            history={history}
            loading={historyLoading}
            collapsed={isDownSm || sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
            onSelect={(question) => setChatInput(question)}
            onDelete={(id) => deleteHistoryEntry(id)}
            onClear={() => clearHistoryMutation()}
          />
        )}

        {!vizMaximized && (
          <ChatPanel
            messages={messages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSend={sendChat}
            onRetry={sendChat}
            onClearConversation={clearConversation}
            loading={asking}
            error={chatError}
            onAddToCanvas={addToCanvas}
          />
        )}

        {vizOpen && (
          <>
            {!isDownMd && !vizMaximized && (
              <Box
                onMouseDown={startVizDrag}
                sx={{ width: 4, flexShrink: 0, cursor: "col-resize", bgcolor: c.border, "&:hover": { bgcolor: c.accent } }}
              />
            )}
            <Box
              sx={
                isDownMd
                  ? { position: "fixed", inset: 0, zIndex: theme.zIndex.modal, overflow: "hidden" }
                  : vizMaximized
                    ? { flex: 1, overflow: "hidden" }
                    : { width: vizWidth, flexShrink: 0, borderLeft: `1px solid ${c.border}`, overflow: "hidden" }
              }
            >
              <VisualizationCanvas
                pages={pages}
                activePageId={activePageId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onSelectPage={setActivePageId}
                onAddPage={addPage}
                onDeletePage={deletePage}
                onRenamePage={renamePage}
                onClose={() => {
                  setVizOpen(false);
                  setVizMaximized(false);
                }}
                isMaximized={vizMaximized}
                onToggleMaximize={() => setVizMaximized((v) => !v)}
                onWidgetTypeChange={(id, type) => updateWidget(id, { type })}
                onWidgetClose={removeWidget}
                onWidgetPositionChange={(id, x, y) => updateWidget(id, { x, y })}
                onWidgetResize={(id, width, height) => updateWidget(id, { width, height })}
                onWidgetToggleMinimize={toggleMinimizeWidget}
                onWidgetToggleSave={toggleSaveWidget}
                canvasRef={canvasRef}
              />
            </Box>
          </>
        )}
      </Box>

      <SelectionPopup selection={selection} onAsk={sendChat} onClose={clearSelection} />
    </Box>
  );
}
