import { useState } from "react";
import {
  Avatar,
  Box,
  IconButton,
  InputBase,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import { useTabColorTokens } from "../../../style/theme";
import type { HistoryEntry } from "../types/dataAgent.types";

interface ChatHistorySidebarProps {
  displayName: string;
  history: HistoryEntry[];
  loading: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (question: string) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
}

const INTENT_COLORS: Record<string, string> = {
  ranking: "#4f9eff",
  lookup: "#34d399",
  trend: "#a78bfa",
  distribution: "#fb7185",
  top_n: "#fbbf24",
  comparison: "#22d3ee",
};

function groupByDate(history: HistoryEntry[]) {
  const groups: Record<string, HistoryEntry[]> = {};
  history.forEach((h) => {
    const date = h.timestamp
      ? new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(h);
  });
  return groups;
}

export default function ChatHistorySidebar({
  displayName,
  history,
  loading,
  collapsed,
  onToggle,
  onSelect,
  onDelete,
  onClear,
}: ChatHistorySidebarProps) {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const filtered = history.filter(
    (h) => !search.trim() || h.question.toLowerCase().includes(search.toLowerCase()),
  );
  const grouped = groupByDate(filtered);

  if (collapsed) {
    return (
      <Box
        sx={{
          width: 44,
          flexShrink: 0,
          bgcolor: c.sidebarBg,
          borderRight: `1px solid ${c.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 1.5,
          gap: 1,
        }}
      >
        <IconButton size="small" onClick={onToggle} title="Expand history" sx={{ color: c.accent }}>
          <MenuRoundedIcon />
        </IconButton>
        <Typography
          variant="caption"
          sx={{ writingMode: "vertical-rl", color: c.textSecondary, mt: 1, letterSpacing: "0.05em", textTransform: "uppercase" }}
        >
          History
        </Typography>
        {history.length > 0 && (
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              bgcolor: c.accent,
              color: "#fff",
              fontSize: 9,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Math.min(history.length, 99)}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        bgcolor: c.sidebarBg,
        borderRight: `1px solid ${c.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: "14px 14px 10px", borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: c.accent }}>
              {displayName.charAt(0).toUpperCase() || "?"}
            </Avatar>
            <Box>
              <Typography variant="caption" fontWeight={600} sx={{ display: "block", color: c.textPrimary }}>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: c.textSecondary, fontSize: 10 }}>
                {history.length} conversation{history.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={0.25} alignItems="center">
            {history.length > 0 && (
              <Typography
                component="button"
                onClick={onClear}
                variant="caption"
                sx={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: c.textSecondary,
                  px: 0.5,
                  "&:hover": { color: c.danger },
                }}
              >
                Clear
              </Typography>
            )}
            <IconButton size="small" onClick={onToggle} title="Collapse">
              <ChevronLeftRoundedIcon sx={{ fontSize: 18, color: c.textSecondary }} />
            </IconButton>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            border: `1px solid ${c.border}`,
            borderRadius: c.radius,
            px: 1,
            bgcolor: c.surface2,
          }}
        >
          <InputBase
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history…"
            sx={{ fontSize: 12, py: 0.5, flex: 1, color: c.textPrimary }}
          />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80 }}>
            <Typography variant="caption" color="text.secondary">
              Loading…
            </Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 120,
              gap: 1,
              color: c.textSecondary,
            }}
          >
            <ForumOutlinedIcon sx={{ fontSize: 26 }} />
            <Typography variant="caption">{search ? "No matches found" : "No history yet"}</Typography>
          </Box>
        ) : (
          Object.entries(grouped).map(([date, sessions]) => (
            <Box key={date}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  px: 1.75,
                  pt: 1,
                  pb: 0.5,
                  fontWeight: 600,
                  color: c.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: 10,
                  position: "sticky",
                  top: 0,
                  bgcolor: c.sidebarBg,
                }}
              >
                {date}
              </Typography>

              {sessions.map((session) => (
                <Box
                  key={session.id}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelect(session.question)}
                  sx={{
                    px: 1.75,
                    py: 1.1,
                    cursor: "pointer",
                    bgcolor: hoveredId === session.id ? c.selectedRow : "transparent",
                    borderBottom: `1px solid ${c.border}`,
                  }}
                >
                  {session.intent && (
                    <Box
                      sx={{
                        display: "inline-block",
                        fontSize: 9,
                        fontWeight: 600,
                        px: 0.75,
                        borderRadius: 100,
                        bgcolor: `${INTENT_COLORS[session.intent] ?? c.accent}22`,
                        color: INTENT_COLORS[session.intent] ?? c.accent,
                        mb: 0.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {session.intent}
                    </Box>
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: 12,
                      color: c.textPrimary,
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mb: 0.5,
                    }}
                  >
                    {session.question}
                  </Typography>

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: c.textSecondary, fontSize: 10 }}>
                      {session.rowCount != null && session.rowCount > 0 ? `${session.rowCount} rows` : ""}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography variant="caption" sx={{ color: c.textSecondary, fontSize: 10 }}>
                        {session.timestamp
                          ? new Date(session.timestamp).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </Typography>
                      {hoveredId === session.id && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(session.id);
                          }}
                          sx={{ p: 0.25, "&:hover": { color: c.danger } }}
                        >
                          <CloseRoundedIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
