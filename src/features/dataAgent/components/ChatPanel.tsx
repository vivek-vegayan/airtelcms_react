import { useEffect, useRef, useState } from "react";
import { Avatar, Box, Button, Chip, IconButton, Stack, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddchartRoundedIcon from "@mui/icons-material/AddchartRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import { useTabColorTokens } from "../../../style/theme";
import type { ChatMessage, QueryResult } from "../types/dataAgent.types";

const SUGGESTIONS = [
  "Top 10 interfaces by peak inbound traffic",
  "Show distinct linktypes",
  "Nodes with highest out traffic",
  "Traffic distribution by linktype",
  "Monthly traffic trend",
];

interface ChatPanelProps {
  messages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSend: (override?: string) => void;
  onRetry: (question: string) => void;
  onClearConversation: () => void;
  loading: boolean;
  error: string | null;
  onAddToCanvas: (result: QueryResult) => void;
}

export default function ChatPanel({
  messages,
  chatInput,
  onChatInputChange,
  onSend,
  onRetry,
  onClearConversation,
  loading,
  error,
  onAddToCanvas,
}: ChatPanelProps) {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ px: 2.5, py: 1.25, borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ flex: 1 }}>
          {SUGGESTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              size="small"
              variant="outlined"
              onClick={() => onSend(s)}
              sx={{ fontSize: 11, borderRadius: 100 }}
            />
          ))}
        </Stack>
        <Tooltip title="Clear conversation">
          <IconButton size="small" onClick={onClearConversation}>
            <DeleteSweepOutlinedIcon sx={{ fontSize: 18, color: c.textSecondary }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, display: "flex", flexDirection: "column", gap: 1.75 }}>
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} onAddToCanvas={onAddToCanvas} onRetry={onRetry} />
        ))}
        <div ref={bottomRef} />
      </Box>

      {error && (
        <Box sx={{ px: 2.5, py: 1, borderTop: `1px solid ${c.border}`, flexShrink: 0 }}>
          <Typography variant="caption" color="error">
            ⚠ {error}
          </Typography>
        </Box>
      )}

      <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${c.border}`, bgcolor: c.surface, flexShrink: 0 }}>
        <Stack direction="row" gap={1.25} alignItems="flex-end">
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            value={chatInput}
            disabled={loading}
            placeholder="Ask anything about your network data…"
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) onSend();
            }}
          />
          <Button
            variant="contained"
            endIcon={<SendRoundedIcon fontSize="small" />}
            disabled={loading || !chatInput.trim()}
            onClick={() => onSend()}
            sx={{ textTransform: "none", flexShrink: 0 }}
          >
            {loading ? "…" : "Ask"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

interface ChatBubbleProps {
  msg: ChatMessage;
  onAddToCanvas: (result: QueryResult) => void;
  onRetry: (question: string) => void;
}

function ChatBubble({ msg, onAddToCanvas, onRetry }: ChatBubbleProps) {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.4 }}>
        <Box
          sx={{
            maxWidth: "75%",
            px: 1.75,
            py: 1.25,
            bgcolor: c.accent,
            color: "#fff",
            borderRadius: "14px 14px 4px 14px",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {msg.text}
        </Box>
        <Typography variant="caption" sx={{ color: c.textSecondary, fontSize: 10, pr: 0.5 }}>
          {formatTime(msg.timestamp)}
        </Typography>
      </Box>
    );
  }

  if (msg.loading) {
    return (
      <Stack direction="row" gap={1.25} alignItems="flex-end">
        <BotAvatar />
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: c.surface2,
            border: `1px solid ${c.border}`,
            borderRadius: "14px 14px 14px 4px",
            display: "flex",
            gap: 0.75,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: c.accent,
                opacity: 0.5,
                animation: "dataagent-pulse 1.2s ease-in-out infinite",
                animationDelay: `${i * 150}ms`,
                "@keyframes dataagent-pulse": {
                  "0%, 100%": { opacity: 0.3, transform: "scale(0.8)" },
                  "50%": { opacity: 1, transform: "scale(1)" },
                },
              }}
            />
          ))}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack direction="row" gap={1.25} alignItems="flex-start">
      <BotAvatar />
      <Box sx={{ flex: 1, maxWidth: "calc(100% - 46px)" }}>
        <Box
          sx={{
            px: 1.75,
            py: 1.35,
            bgcolor: msg.error ? c.dangerDim : c.surface2,
            border: `1px solid ${msg.error ? c.dangerBorder : c.border}`,
            borderRadius: "14px 14px 14px 4px",
            fontSize: 13,
            color: msg.error ? c.danger : c.textPrimary,
            lineHeight: 1.65,
          }}
        >
          {msg.text || "…"}
        </Box>

        {msg.hasData && !msg.error && (
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.75 }}>
            <Chip
              size="small"
              icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />}
              label={`${msg.rowCount} rows · ${msg.columns?.length ?? 0} cols`}
              sx={{ fontSize: 10, bgcolor: c.accentDim, color: c.accent }}
            />
            {msg.intent && <Chip size="small" label={msg.intent} sx={{ fontSize: 10 }} />}
          </Stack>
        )}

        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mt: 0.75 }}>
          <Typography variant="caption" sx={{ color: c.textSecondary, fontSize: 10 }}>
            {formatTime(msg.timestamp)}
          </Typography>

          <CopyButton text={msg.text} />

          {msg.error && msg.question && (
            <Button
              size="small"
              variant="text"
              startIcon={<ReplayRoundedIcon sx={{ fontSize: 14 }} />}
              onClick={() => onRetry(msg.question!)}
              sx={{ textTransform: "none", fontSize: 11, color: c.textSecondary, minWidth: 0, py: 0 }}
            >
              Retry
            </Button>
          )}

          {msg.hasData && !msg.error && msg.result && (
            <Button
              size="small"
              variant="text"
              startIcon={<AddchartRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={() => onAddToCanvas(msg.result!)}
              sx={{ textTransform: "none", fontSize: 11, color: c.textSecondary, minWidth: 0, py: 0 }}
            >
              Pin to canvas
            </Button>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

function CopyButton({ text }: { text: string }) {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard permission denied - silently ignore, non-critical */
    }
  };

  return (
    <Tooltip title={copied ? "Copied!" : "Copy response"}>
      <IconButton size="small" onClick={copy} sx={{ p: 0.4 }}>
        {copied ? (
          <CheckRoundedIcon sx={{ fontSize: 13, color: "success.main" }} />
        ) : (
          <ContentCopyRoundedIcon sx={{ fontSize: 13, color: c.textSecondary }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

function BotAvatar() {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  return (
    <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: c.accent, flexShrink: 0 }}>
      <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />
    </Avatar>
  );
}
