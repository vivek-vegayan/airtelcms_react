import { useState } from "react";
import { Box, IconButton, Stack, TextField, Tabs, Tab, Tooltip, Typography, useTheme } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import BubbleChartRoundedIcon from "@mui/icons-material/BubbleChartRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import CloseFullscreenRoundedIcon from "@mui/icons-material/CloseFullscreenRounded";
import { useTabColorTokens } from "../../../style/theme";
import Widget from "./Widget";
import { renderWidgetChart } from "./renderWidgetChart";
import type { CanvasPage, ChartType } from "../types/dataAgent.types";

interface VisualizationCanvasProps {
  pages: CanvasPage[];
  activePageId: string;
  activeTab: "canvas" | "saved";
  onTabChange: (tab: "canvas" | "saved") => void;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, name: string) => void;
  onClose: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onWidgetTypeChange: (widgetId: string, type: ChartType) => void;
  onWidgetClose: (widgetId: string) => void;
  onWidgetPositionChange: (widgetId: string, x: number, y: number) => void;
  onWidgetResize: (widgetId: string, width: number, height: number) => void;
  onWidgetToggleMinimize: (widgetId: string) => void;
  onWidgetToggleSave: (widgetId: string) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function VisualizationCanvas({
  pages,
  activePageId,
  activeTab,
  onTabChange,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onClose,
  isMaximized,
  onToggleMaximize,
  onWidgetTypeChange,
  onWidgetClose,
  onWidgetPositionChange,
  onWidgetResize,
  onWidgetToggleMinimize,
  onWidgetToggleSave,
  canvasRef,
}: VisualizationCanvasProps) {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
  const widgets = activePage?.widgets ?? [];
  const savedWidgets = pages.flatMap((p) => p.widgets.filter((w) => w.saved));

  const commitRename = (id: string) => {
    onRenamePage(id, editingName);
    setEditingPageId(null);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: c.bg }}>
      <Stack direction="row" alignItems="center" gap={1.25} sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Visualization Canvas
        </Typography>
        <Tabs
          value={activeTab}
          onChange={(_, v) => onTabChange(v)}
          sx={{ minHeight: 0, "& .MuiTab-root": { minHeight: 0, py: 0.5, fontSize: 11, textTransform: "none" } }}
        >
          <Tab value="canvas" label={`Canvas (${widgets.length})`} />
          <Tab value="saved" label={`Saved (${savedWidgets.length})`} />
        </Tabs>
        <Tooltip title={isMaximized ? "Restore split view" : "Maximize canvas"}>
          <IconButton size="small" onClick={onToggleMaximize}>
            {isMaximized ? (
              <CloseFullscreenRoundedIcon sx={{ fontSize: 15 }} />
            ) : (
              <OpenInFullRoundedIcon sx={{ fontSize: 15 }} />
            )}
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onClose}>
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      <Stack direction="row" alignItems="center" gap={0.5} sx={{ px: 2, borderBottom: `1px solid ${c.border}`, overflowX: "auto", flexShrink: 0 }}>
        {pages.map((page) => (
          <Stack
            key={page.id}
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{
              borderBottom: page.id === activePageId ? `2px solid ${c.accent}` : "2px solid transparent",
              py: 0.75,
              flexShrink: 0,
            }}
          >
            {editingPageId === page.id ? (
              <TextField
                autoFocus
                variant="standard"
                size="small"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => commitRename(page.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename(page.id);
                  if (e.key === "Escape") setEditingPageId(null);
                }}
                sx={{ width: 90, "& input": { fontSize: 11 } }}
              />
            ) : (
              <Typography
                component="button"
                onClick={() => onSelectPage(page.id)}
                onDoubleClick={() => {
                  setEditingPageId(page.id);
                  setEditingName(page.name);
                }}
                variant="caption"
                sx={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontWeight: page.id === activePageId ? 600 : 400,
                  color: page.id === activePageId ? c.accent : c.textSecondary,
                  whiteSpace: "nowrap",
                }}
              >
                {page.name}
              </Typography>
            )}
            {pages.length > 1 && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(page.id);
                }}
                sx={{ p: 0.25 }}
              >
                <CloseRoundedIcon sx={{ fontSize: 11 }} />
              </IconButton>
            )}
          </Stack>
        ))}
        <IconButton size="small" onClick={onAddPage} title="Add new page" sx={{ ml: 0.5, color: c.accent }}>
          <AddRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      {activeTab === "canvas" && (
        <Box ref={canvasRef} sx={{ flex: 1, overflow: "auto", position: "relative" }}>
          <Box sx={{ position: "relative", minHeight: "100%", minWidth: "100%" }}>
            {widgets.length === 0 && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  color: c.textSecondary,
                  textAlign: "center",
                  px: 3,
                }}
              >
                <BubbleChartRoundedIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                <Typography variant="body2" sx={{ maxWidth: 220 }}>
                  Pin a chat response to visualize it here.
                </Typography>
              </Box>
            )}

            {widgets.map((w) => (
              <Widget
                key={w.id}
                {...w}
                onTypeChange={(type) => onWidgetTypeChange(w.id, type)}
                onClose={() => onWidgetClose(w.id)}
                onPositionChange={onWidgetPositionChange}
                onResize={onWidgetResize}
                onToggleMinimize={() => onWidgetToggleMinimize(w.id)}
                onToggleSave={() => onWidgetToggleSave(w.id)}
                allWidgets={widgets.map((cw) => ({
                  id: cw.id,
                  x: cw.x,
                  y: cw.y,
                  width: cw.width,
                  height: cw.minimized ? 44 : cw.height,
                }))}
              >
                {!w.minimized && renderWidgetChart(w.type, w.data)}
              </Widget>
            ))}
          </Box>
        </Box>
      )}

      {activeTab === "saved" && (
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {savedWidgets.length === 0 ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: c.textSecondary }}>
              <Stack alignItems="center" gap={1}>
                <BookmarkBorderRoundedIcon sx={{ fontSize: 28 }} />
                <Typography variant="body2">No saved widgets yet.</Typography>
              </Stack>
            </Box>
          ) : (
            <Stack gap={1.5}>
              {savedWidgets.map((w) => (
                <Box key={w.id} sx={{ bgcolor: c.surface, borderRadius: c.radiusL, border: `1px solid ${c.border}`, overflow: "hidden" }}>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${c.border}`, bgcolor: c.surface2 }}>
                    <Typography variant="caption" fontWeight={600} noWrap sx={{ flex: 1 }}>
                      {w.title}
                    </Typography>
                    <IconButton size="small" onClick={() => onWidgetToggleSave(w.id)} sx={{ color: "#f5b400" }}>
                      <StarRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => onWidgetClose(w.id)}>
                      <CloseRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                  <Box sx={{ p: 1.25 }}>{renderWidgetChart(w.type, w.data)}</Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}
