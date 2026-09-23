import { Box, Button, Stack, Typography, alpha, useTheme } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

export type CabQueueStateKind = "idle" | "empty" | "error";

interface Props {
  kind: CabQueueStateKind;
  /** Human-readable scope the state refers to, e.g. "IP Access › OLT Access". */
  scopeLabel?: string;
  /** Server message — rendered for `error` only, never for the empty sentinel. */
  message?: string;
  onRetry?: () => void;
  onChangeScope?: () => void;
}

const COPY: Record<
  CabQueueStateKind,
  { title: string; body: (scope?: string) => string }
> = {
  idle: {
    title: "Choose a scope to load the queue",
    body: () =>
      "Pick a Domain and a Sub Domain above. The CAB waiting queue is always scoped to one Domain / Sub Domain pair.",
  },
  empty: {
    title: "No CRQs awaiting CAB review",
    body: (scope) =>
      scope
        ? `Nothing is waiting for CAB review in ${scope} right now. Try another Sub Domain, or check back once new CRQs reach the CAB stage.`
        : "Nothing is waiting for CAB review in the selected scope right now.",
  },
  error: {
    title: "Couldn't load the CAB waiting queue",
    body: (scope) =>
      scope
        ? `The queue for ${scope} could not be fetched. This is a server-side problem, not an empty queue.`
        : "The queue could not be fetched. This is a server-side problem, not an empty queue.",
  },
};

/**
 * Idle / empty / error placeholder for the CAB waiting queue.
 *
 * The three cases are deliberately distinct: an empty queue is an expected,
 * neutral outcome and must never be dressed up as a red failure — which is
 * exactly what the raw "No CRQs Found" proc sentinel used to look like here.
 */
export function CabQueueState({
  kind,
  scopeLabel,
  message,
  onRetry,
  onChangeScope,
}: Props) {
  const theme = useTheme();
  const isError = kind === "error";
  const accent = isError ? theme.palette.error.main : theme.palette.primary.main;
  const Icon =
    kind === "error"
      ? ErrorOutlineRoundedIcon
      : kind === "idle"
        ? TuneRoundedIcon
        : InboxRoundedIcon;
  const copy = COPY[kind];

  return (
    <Box
      sx={{
        px: 3,
        py: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          mb: 2,
          color: accent,
          bgcolor: alpha(accent, theme.palette.mode === "dark" ? 0.16 : 0.08),
        }}
      >
        <Icon sx={{ fontSize: 28 }} />
      </Box>

      <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 0.75 }}>
        {copy.title}
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: "text.secondary", maxWidth: 460, lineHeight: 1.6 }}
      >
        {copy.body(scopeLabel)}
      </Typography>

      {isError && message && (
        <Typography
          variant="caption"
          sx={{
            mt: 1.5,
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            fontFamily: "'Roboto Mono', monospace",
            color: "error.main",
            bgcolor: alpha(theme.palette.error.main, 0.08),
          }}
        >
          {message}
        </Typography>
      )}

      {(onRetry || onChangeScope) && (
        <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
          {onRetry && (
            <Button
              size="small"
              variant={isError ? "contained" : "outlined"}
              color={isError ? "error" : "primary"}
              startIcon={<RefreshRoundedIcon />}
              onClick={onRetry}
            >
              {isError ? "Retry" : "Refresh"}
            </Button>
          )}
          {onChangeScope && (
            <Button size="small" variant="text" onClick={onChangeScope}>
              Reset filters
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
