import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  Tooltip,
  useTheme,
  alpha,
  Divider,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import type { Checkpoint, CheckpointItem } from "../../../../types/checkpoint.types";
import CheckpointItemCard from "./CheckpointItemCard";

interface Props {
  checkpoints: Checkpoint[];
  onStatusChange?: (checkpointId: string, newStatus: "Pass" | "Fail") => void;
  defaultSelectedId?: string | null;
  disableActions?: boolean;
}

const HorizontalCheckpointStrip: React.FC<Props> = ({
  checkpoints,
  onStatusChange,
  defaultSelectedId = null,
  disableActions = false,
}) => {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultSelectedId ?? checkpoints[0]?.id ?? null,
  );
  const selectedCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!checkpoints.some((c) => c.id === selectedId)) {
      setSelectedId(checkpoints[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoints]);

  useEffect(() => {
    selectedCardRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedId]);

  const statusConfig = (status: string) => {
    if (status === "Pass")
      return {
        color: theme.palette.success.main,
        label: "PASS",
        icon: <CheckCircleRoundedIcon fontSize="small" />,
      };
    if (status === "Fail")
      return {
        color: theme.palette.error.main,
        label: "FAIL",
        icon: <ErrorRoundedIcon fontSize="small" />,
      };
    return {
      color: theme.palette.text.disabled,
      label: "PENDING",
      icon: <HourglassEmptyRoundedIcon fontSize="small" />,
    };
  };

  if (checkpoints.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No checkpoints available for this CRQ.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Horizontal strip */}
      <Box
        sx={{
          display: "flex",
          gap: 1.1,
          overflowX: "auto",
          py: 0.75,
          px: 0.25,
          scrollSnapType: "x mandatory",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.text.primary, 0.15),
            borderRadius: 20,
          },
        }}
      >
        {checkpoints.map((cp) => {
          const cfg = statusConfig(cp.status ?? "NA");
          const isSelected = cp.id === selectedId;
          const match = cp.title.match(/\(([^)]+)\)/);
          const displayTitle = match ? match[1] : cp.title;

          return (
            <Paper
              key={cp.id}
              ref={isSelected ? selectedCardRef : undefined}
              onClick={() => setSelectedId(cp.id)}
              elevation={0}
              variant="outlined"
              sx={{
                p: 1.1,
                width: 208,
                flexShrink: 0,
                borderRadius: 2,
                scrollSnapAlign: "center",
                cursor: "pointer",
                borderWidth: isSelected ? 1.5 : 1,
                borderColor: isSelected ? cfg.color : "divider",
                bgcolor: isSelected ? alpha(cfg.color, 0.06) : "background.paper",
                transition: "transform .2s ease, box-shadow .25s ease, border-color .25s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 2,
                },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={0.75}>
                <Stack direction="row" spacing={0.85} alignItems="flex-start" sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(cfg.color, 0.14),
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      flexShrink: 0,
                      color: cfg.color,
                      mt: "1px",
                    }}
                  >
                    {cfg.icon}
                  </Box>

                  <Tooltip title={displayTitle} arrow disableInteractive>
                    <Typography
                      fontWeight={700}
                      sx={{
                        fontSize: 12.5,
                        lineHeight: 1.3,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {displayTitle}
                    </Typography>
                  </Tooltip>
                </Stack>

                <Chip
                  label={cfg.label}
                  size="small"
                  sx={{
                    bgcolor: alpha(cfg.color, 0.14),
                    color: cfg.color,
                    fontWeight: 700,
                    fontSize: 9.5,
                    height: 18,
                    flexShrink: 0,
                  }}
                />
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.6, fontSize: 10.5, display: "block" }}>
                {cp.items?.length ?? 0} items
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Selected checkpoint detail */}
      <Box sx={{ mt: 1.5 }}>
        {(() => {
          const sel = checkpoints.find((c) => c.id === selectedId);
          if (!sel) return null;

          return (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Stack>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 14 }}>
                    {sel.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                    {sel.items.length} items • Status: {sel.status ?? "NA"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.75}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={disableActions}
                    onClick={() => onStatusChange?.(sel.id, "Pass")}
                    sx={{ fontSize: 11.5, textTransform: "none", borderRadius: 1.5, px: 1.5 }}
                  >
                    Mark PASS
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    disabled={disableActions}
                    onClick={() => onStatusChange?.(sel.id, "Fail")}
                    sx={{ fontSize: 11.5, textTransform: "none", borderRadius: 1.5, px: 1.5 }}
                  >
                    Mark FAIL
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ maxHeight: "50vh", overflow: "auto", pr: 0.5 }}>
                {sel.items.length > 0 ? (
                  <Stack spacing={1.25}>
                    {sel.items.map((it: CheckpointItem, idx: number) => (
                      <CheckpointItemCard key={`${sel.id}_${idx}`} item={it} />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, fontSize: 12.5 }}>
                    No items available for this checkpoint.
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })()}
      </Box>
    </Box>
  );
};

export default HorizontalCheckpointStrip;
