import { useEffect, useRef, useState } from "react";
import { Box, Button, Stack, TextField, Typography, useTheme } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useTabColorTokens } from "../../../style/theme";
import type { SelectionState } from "../hooks/useTextSelection";

interface SelectionPopupProps {
  selection: SelectionState;
  onAsk: (query: string) => void;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: "Explain", prefix: "Explain: " },
  { label: "Status", prefix: "Show status for: " },
  { label: "Top 10", prefix: "Show top 10 for: " },
  { label: "Trend", prefix: "Show trend for: " },
];

const POPUP_WIDTH = 280;

export default function SelectionPopup({ selection, onAsk, onClose }: SelectionPopupProps) {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const [customQuery, setCustomQuery] = useState("");
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!selection.visible) return null;

  const left = Math.min(Math.max(8, selection.x - POPUP_WIDTH / 2), window.innerWidth - POPUP_WIDTH - 8);
  const top = selection.y - 8;

  const submitCustom = () => {
    if (!customQuery.trim()) return;
    onAsk(`${customQuery.trim()} about "${selection.text}"`);
    onClose();
  };

  return (
    <>
      <Box onClick={onClose} sx={{ position: "fixed", inset: 0, zIndex: 998, background: "transparent" }} />
      <Box
        sx={{
          position: "fixed",
          left,
          top,
          transform: "translateY(-100%)",
          width: POPUP_WIDTH,
          zIndex: 999,
          bgcolor: c.surface,
          borderRadius: c.radiusL,
          border: `1px solid ${c.border}`,
          boxShadow: theme.shadows[12],
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${c.border}`, bgcolor: c.surface2 }}>
          <Typography
            variant="caption"
            sx={{ display: "block", color: c.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10, mb: 0.5 }}
          >
            Selected text
          </Typography>
          <Typography variant="body2" noWrap sx={{ color: c.accent, fontStyle: "italic", fontWeight: 500 }}>
            "{selection.text.length > 60 ? selection.text.slice(0, 58) + "…" : selection.text}"
          </Typography>
        </Box>

        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ p: 1.25 }}>
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              size="small"
              variant="outlined"
              onClick={() => {
                onAsk(action.prefix + selection.text);
                onClose();
              }}
              sx={{ textTransform: "none", borderRadius: 100, fontSize: 11, py: 0.25 }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>

        <Box sx={{ height: 1, bgcolor: c.border, mx: 1.25 }} />

        <Box sx={{ p: 1.25 }}>
          {!showInput ? (
            <Button
              fullWidth
              size="small"
              onClick={() => setShowInput(true)}
              sx={{ justifyContent: "flex-start", textTransform: "none", color: c.textSecondary, fontSize: 11 }}
            >
              ✦ Ask something custom…
            </Button>
          ) : (
            <Stack direction="row" gap={0.75}>
              <TextField
                inputRef={inputRef}
                size="small"
                fullWidth
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder={`Ask about "${selection.text.slice(0, 20)}…"`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitCustom();
                  if (e.key === "Escape") {
                    setShowInput(false);
                    setCustomQuery("");
                  }
                }}
              />
              <Button variant="contained" disabled={!customQuery.trim()} onClick={submitCustom} sx={{ minWidth: 0, px: 1.5 }}>
                <ArrowForwardRoundedIcon fontSize="small" />
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    </>
  );
}
