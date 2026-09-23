import { useRef, useState } from "react";
import { Box, Button, IconButton, MenuItem, Select, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import CropSquareRoundedIcon from "@mui/icons-material/CropSquareRounded";
import FilterNoneRoundedIcon from "@mui/icons-material/FilterNoneRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import { useTabColorTokens } from "../../../style/theme";
import { useSubmitFeedbackMutation } from "../api/dataAgentApi";
import type { ChartType } from "../types/dataAgent.types";

const TYPE_LABELS: Record<ChartType, string> = {
  bar: "Bar",
  line: "Line",
  pie: "Pie",
  table: "Table",
  metrics: "Metrics",
  tags: "Tags",
  multibar: "Multi Bar",
  area: "Area",
  barnegative: "+/- Bar",
};

const PADDING = 8;
interface Rect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlaps(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.width + PADDING &&
    a.x + a.width + PADDING > b.x &&
    a.y < b.y + b.height + PADDING &&
    a.y + a.height + PADDING > b.y
  );
}

function resolvePosition(
  id: string,
  nx: number,
  ny: number,
  width: number,
  height: number,
  allWidgets: Rect[],
): { x: number; y: number } {
  const others = allWidgets.filter((w) => w.id !== id);
  const moved: Rect = { id, x: nx, y: ny, width, height };
  if (!others.some((o) => overlaps(moved, o))) return { x: nx, y: ny };
  let lowestY = ny;
  for (const o of others) {
    if (overlaps(moved, o)) lowestY = Math.max(lowestY, o.y + o.height + PADDING);
  }
  return { x: nx, y: lowestY };
}

interface WidgetProps {
  id: string;
  title: string;
  type: ChartType;
  availableTypes: ChartType[];
  x: number;
  y: number;
  width: number;
  height: number;
  saved: boolean;
  minimized: boolean;
  onTypeChange: (type: ChartType) => void;
  onClose: () => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onToggleMinimize: () => void;
  onToggleSave: () => void;
  children: React.ReactNode;
  allWidgets?: Rect[];
}

export default function Widget({
  id,
  title,
  type,
  availableTypes,
  x,
  y,
  width,
  height,
  saved,
  minimized,
  onTypeChange,
  onClose,
  onPositionChange,
  onResize,
  onToggleMinimize,
  onToggleSave,
  children,
  allWidgets = [],
}: WidgetProps) {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, edge: "" });
  const [showFeedback, setShowFeedback] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, .MuiSelect-root")) return;
    e.preventDefault();
    dragOffset.current = { x: e.clientX - x, y: e.clientY - y };
    const onMove = (ev: MouseEvent) => {
      const nx = Math.max(0, ev.clientX - dragOffset.current.x);
      const ny = Math.max(0, ev.clientY - dragOffset.current.y);
      const resolved = resolvePosition(id, nx, ny, width, height, allWidgets);
      onPositionChange(id, resolved.x, resolved.y);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startResize = (e: React.MouseEvent, edge: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = { x: e.clientX, y: e.clientY, w: width, h: height, edge };
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - resizeStart.current.x;
      const dy = ev.clientY - resizeStart.current.y;
      const { w, h, edge } = resizeStart.current;
      let nw = w;
      let nh = h;
      if (edge.includes("e")) nw = Math.max(240, w + dx);
      if (edge.includes("s")) nh = Math.max(180, h + dy);
      if (edge.includes("w")) nw = Math.max(240, w - dx);
      if (edge.includes("n")) nh = Math.max(180, h - dy);
      onResize(id, nw, nh);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleDot = (cursor: string, pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: "50%",
    cursor,
    zIndex: 20,
    background: c.accent,
    opacity: 0.6,
    ...pos,
  });

  const handleBar = (cursor: string, pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    borderRadius: 4,
    cursor,
    zIndex: 20,
    background: c.border,
    ...pos,
  });

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width,
        bgcolor: c.surface,
        borderRadius: c.radiusL,
        border: `1px solid ${c.border}`,
        boxShadow: theme.shadows[c.isDark ? 8 : 3],
        overflow: "visible",
      }}
    >
      <Box
        onMouseDown={onMouseDown}
        sx={{
          px: 1.25,
          py: 1,
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: minimized ? "none" : `1px solid ${c.border}`,
          borderRadius: minimized ? c.radiusL : `${c.radiusL} ${c.radiusL} 0 0`,
          bgcolor: c.surface2,
        }}
      >
        <Typography variant="caption" fontWeight={600} noWrap sx={{ flex: 1, color: c.textPrimary }}>
          {title}
        </Typography>
        {availableTypes.length > 1 && (
          <Select
            size="small"
            value={type}
            onChange={(e) => onTypeChange(e.target.value as ChartType)}
            sx={{ fontSize: 11, height: 26, ".MuiSelect-select": { py: 0.25, px: 1 } }}
          >
            {availableTypes.map((t) => (
              <MenuItem key={t} value={t} sx={{ fontSize: 12 }}>
                {TYPE_LABELS[t]}
              </MenuItem>
            ))}
          </Select>
        )}
        <IconButton size="small" onClick={onToggleMinimize} title={minimized ? "Restore" : "Minimize"}>
          {minimized ? <CropSquareRoundedIcon sx={{ fontSize: 15 }} /> : <FilterNoneRoundedIcon sx={{ fontSize: 13 }} />}
        </IconButton>
        <IconButton size="small" onClick={onToggleSave} sx={{ color: saved ? "#f5b400" : c.textSecondary }} title="Save">
          {saved ? <StarRoundedIcon sx={{ fontSize: 17 }} /> : <StarBorderRoundedIcon sx={{ fontSize: 17 }} />}
        </IconButton>
        <Tooltip title="Send feedback">
          <IconButton
            size="small"
            onClick={() => setShowFeedback((v) => !v)}
            sx={{ color: showFeedback ? c.accent : c.textSecondary }}
          >
            <ThumbUpAltRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onClose} title="Close">
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {showFeedback && !minimized && (
        <FeedbackPopover widgetId={id} question={title} width={width} onClose={() => setShowFeedback(false)} />
      )}

      {!minimized && (
        <Box sx={{ p: 1.5, height: height - 48, overflow: "auto" }}>
          <Box sx={{ height: "100%" }}>{children}</Box>
        </Box>
      )}

      {!minimized && (
        <>
          <Box onMouseDown={(e) => startResize(e, "se")} sx={handleDot("se-resize", { right: -4, bottom: -4 })} />
          <Box onMouseDown={(e) => startResize(e, "sw")} sx={handleDot("sw-resize", { left: -4, bottom: -4 })} />
          <Box onMouseDown={(e) => startResize(e, "ne")} sx={handleDot("ne-resize", { right: -4, top: -4 })} />
          <Box onMouseDown={(e) => startResize(e, "nw")} sx={handleDot("nw-resize", { left: -4, top: -4 })} />
          <Box
            onMouseDown={(e) => startResize(e, "e")}
            sx={handleBar("e-resize", { right: -3, top: "50%", transform: "translateY(-50%)", width: 3, height: 28 })}
          />
          <Box
            onMouseDown={(e) => startResize(e, "w")}
            sx={handleBar("w-resize", { left: -3, top: "50%", transform: "translateY(-50%)", width: 3, height: 28 })}
          />
          <Box
            onMouseDown={(e) => startResize(e, "s")}
            sx={handleBar("s-resize", { bottom: -3, left: "50%", transform: "translateX(-50%)", height: 3, width: 28 })}
          />
          <Box
            onMouseDown={(e) => startResize(e, "n")}
            sx={handleBar("n-resize", { top: -3, left: "50%", transform: "translateX(-50%)", height: 3, width: 28 })}
          />
        </>
      )}
    </Box>
  );
}

function FeedbackPopover({
  widgetId,
  question,
  width,
  onClose,
}: {
  widgetId: string;
  question: string;
  width: number;
  onClose: () => void;
}) {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [submitFeedback, { isLoading, isSuccess, isError }] = useSubmitFeedbackMutation();

  const submit = async () => {
    if (!rating) return;
    try {
      // Thumbs map onto the server's 1-5 rating scale: up = most helpful, down = least.
      await submitFeedback({ requestId: widgetId, panelId: question, rating: rating === "up" ? 5 : 1, comment }).unwrap();
      setTimeout(onClose, 1200);
    } catch {
      // isError already surfaces the failure in the popover below.
    }
  };

  return (
    <>
      <Box
        onClick={onClose}
        sx={{ position: "absolute", inset: 0, zIndex: 99, borderRadius: c.radiusL, bgcolor: "rgba(0,0,0,0.35)" }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: Math.min(260, width - 32),
          zIndex: 100,
          bgcolor: c.surface,
          borderRadius: c.radiusL,
          border: `1px solid ${c.border}`,
          boxShadow: theme.shadows[12],
          p: 2,
        }}
      >
        {isSuccess ? (
          <Typography variant="body2" align="center" color="success.main" fontWeight={600}>
            Thanks for your feedback!
          </Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle2">Rate this result</Typography>
              <IconButton size="small" onClick={onClose}>
                <CloseRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mb: 1.5 }}>
              {question}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 1.5 }}>
              <IconButton onClick={() => setRating("up")} sx={{ opacity: rating === "up" ? 1 : 0.4 }}>
                <ThumbUpAltIcon sx={{ fontSize: 26, color: rating === "up" ? "success.main" : "inherit" }} />
              </IconButton>
              <IconButton onClick={() => setRating("down")} sx={{ opacity: rating === "down" ? 1 : 0.4 }}>
                <ThumbDownAltIcon sx={{ fontSize: 26, color: rating === "down" ? "error.main" : "inherit" }} />
              </IconButton>
            </Box>
            <TextField
              multiline
              minRows={2}
              fullWidth
              size="small"
              placeholder="Any comments? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {isError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                Failed to send. Please try again.
              </Typography>
            )}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 1.5, textTransform: "none" }}
              disabled={!rating || isLoading}
              onClick={submit}
            >
              {isLoading ? "Sending…" : "Send feedback"}
            </Button>
          </>
        )}
      </Box>
    </>
  );
}
