import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, LinearProgress, Stack, Typography, alpha } from "@mui/material";
import type { Theme } from "@mui/material";

import { useCancelFetchJobMutation, useGetFetchProgressByCrqQuery } from "../../../../api/fetchProgressApiSlice";
import type { FetchProgress, FetchStage } from "../../../../types/fetchProgress.types";

const POLL_MS = 1500;

/** Statuses whose fetched data is worth opening - FAILED has nothing to show. */
const VIEWABLE = ["SUCCESS", "PARTIAL", "CANCELLED"];

type Tone = "primary" | "success" | "warning" | "error";

function fmt(sec?: number | null): string {
  if (sec === null || sec === undefined) return "--";
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}m${r ? ` ${r}s` : ""}`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function toneOf(p: FetchProgress): Tone {
  if (p.status === "SUCCESS") return "success";
  if (p.status === "FAILED") return "error";
  if (p.status === "PARTIAL" || p.status === "CANCELLED" || p.stalled) return "warning";
  return "primary";
}

/** The status note under the bar, or null when there is nothing to add. */
function noteOf(p: FetchProgress): { severity: "success" | "warning" | "error"; text: string } | null {
  const total = p.totalUnits;
  if (!p.finished && p.stalled) {
    return {
      severity: "warning",
      text: `No progress for ${fmt(p.heartbeatAgeSec)}. The external system may not be responding.`,
    };
  }
  switch (p.status) {
    case "PARTIAL":
      return {
        severity: "warning",
        text: `${p.failedUnits} of ${total} item(s) returned no data. The report covers the rest.`,
      };
    case "FAILED":
      return { severity: "error", text: p.errorText || "The fetch failed. Nothing could be retrieved." };
    case "CANCELLED":
      return { severity: "warning", text: `Cancelled. ${p.doneUnits} of ${total} item(s) were done.` };
    case "SUCCESS":
      return { severity: "success", text: `All ${total} item(s) fetched in ${fmt(p.elapsedSec)}.` };
  }
  if (total === 0) return { severity: "warning", text: "Nothing to fetch for this plan." };
  return null;
}

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      borderRadius: 2.5,
      p: 2,
      mb: 1.5,
    }}
  >
    {children}
  </Box>
);

const Title: React.FC<{ text: string; tag?: string | null }> = ({ text, tag }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <Typography variant="subtitle2" fontWeight={700}>
      {text}
    </Typography>
    {tag && (
      <Chip
        label={tag}
        size="small"
        variant="outlined"
        sx={{ height: 20, fontSize: 10.5, fontWeight: 600, color: "text.secondary" }}
      />
    )}
  </Stack>
);

const Bar: React.FC<{ value?: number; tone?: Tone }> = ({ value, tone = "primary" }) => (
  <LinearProgress
    variant={value === undefined ? "indeterminate" : "determinate"}
    value={value}
    color={tone}
    sx={{
      height: 8,
      borderRadius: 999,
      my: 1.25,
      bgcolor: (t: Theme) => alpha(t.palette.text.primary, 0.08),
      "& .MuiLinearProgress-bar": { borderRadius: 999 },
    }}
  />
);

const Note: React.FC<{ severity: "success" | "warning" | "error"; children: React.ReactNode }> = ({
  severity,
  children,
}) => (
  <Alert severity={severity} variant="outlined" sx={{ mt: 1.25, py: 0.25, borderRadius: 1.5, fontSize: 12.5 }}>
    {children}
  </Alert>
);

const btnSx = { fontSize: 12, textTransform: "none", borderRadius: 1.5 } as const;

/**
 * Node/interface fetch progress shown above the CheckPoint Summary. The fetch
 * daemon starts the job on its own; this polls the newest job for the CRQ
 * until it is terminal, then offers "View data", which hands control back to
 * the caller to reveal the existing checkpoint view.
 */
export const FetchProgressCard: React.FC<{
  crqNo: string;
  stage?: FetchStage;
  disableActions?: boolean;
  /** Re-runs the fetch (the existing checkpoint "Data Refresh" script). */
  onRetry: () => void;
  retrying?: boolean;
  onViewData: (job: FetchProgress) => void;
}> = ({ crqNo, stage = "VALIDATE", disableActions = false, onRetry, retrying = false, onViewData }) => {
  // After a retry, the job that was on screen is stale: keep polling until a
  // different job id turns up so the new run is picked up.
  const [staleJobId, setStaleJobId] = useState<number | null>(null);

  // Polls while there is no job yet or the job is still running, and stops
  // once it is terminal so a finished CRQ left open is not hammering the API.
  // The interval is fed back from the previous result.
  const [finishedJobId, setFinishedJobId] = useState<number | null>(null);
  const polling = finishedJobId === null || finishedJobId === staleJobId;
  const { data, isLoading, isError } = useGetFetchProgressByCrqQuery(
    { crqNo, stage },
    { pollingInterval: polling ? POLL_MS : 0, refetchOnMountOrArgChange: true },
  );
  const [cancelJob, { isLoading: cancelling }] = useCancelFetchJobMutation();

  useEffect(() => {
    setFinishedJobId(data && data.finished ? data.jobId : null);
  }, [data]);

  const handleRetry = () => {
    if (data) setStaleJobId(data.jobId);
    onRetry();
  };

  // A failed poll does not mean a failed job - the network may have blipped.
  // RTK keeps polling at the same interval; never show FAILED for this.
  const lostContact = isError ? <Note severity="warning">Lost contact with the server, retrying...</Note> : null;

  const retryButton = (
    <Button
      size="small"
      variant="outlined"
      color="inherit"
      sx={btnSx}
      onClick={handleRetry}
      disabled={disableActions || retrying}
    >
      {retrying ? "Retrying..." : "Retry"}
    </Button>
  );

  if (isLoading || (data === undefined && !isError)) {
    return (
      <Card>
        <Title text="Loading..." />
        <Bar />
      </Card>
    );
  }

  // No job row yet: the daemon simply has not reached this CRQ.
  if (!data) {
    return (
      <Card>
        <Title text="Waiting for plan data" />
        <Bar />
        <Note severity="warning">
          No fetch has started for {crqNo} yet. It begins automatically once the plan data is available.
        </Note>
        {lostContact}
      </Card>
    );
  }

  // Nothing in progress and the user has an action to take - a 0% bar here would mislead.
  if (data.status === "NOT_INGESTED") {
    return (
      <Card>
        <Title text="Plan data not available" tag={data.stageLabel || stage} />
        <Note severity="warning">Kindly fetch data from Planning tool, then run again.</Note>
        <Stack direction="row" spacing={2} sx={{ mt: 1.25, color: "text.secondary", fontSize: 12.5 }}>
          <span>CRQ {data.crqNo}</span>
          {data.planId && <span>Plan {data.planId}</span>}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          {retryButton}
        </Stack>
        {lostContact}
      </Card>
    );
  }

  const total = data.totalUnits || 0;
  const pct = total === 0 ? (data.finished ? 100 : 0) : (data.percent ?? (100 * data.doneUnits) / total);
  const indeterminate = !data.finished && total === 0;
  const tone = toneOf(data);
  const note = noteOf(data);
  const title = data.finished
    ? `Fetch ${String(data.status).toLowerCase()}`
    : data.status === "QUEUED"
      ? "Queued..."
      : "Fetching node data...";

  return (
    <Card>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" gap={1}>
        <Title text={title} tag={data.stageLabel} />
        {!indeterminate && (
          <Typography sx={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {pct.toFixed(1)}%
          </Typography>
        )}
      </Stack>

      <Bar value={indeterminate ? undefined : Math.min(100, pct)} tone={tone} />

      <Stack direction="row" flexWrap="wrap" columnGap={2} sx={{ color: "text.secondary", fontSize: 12.5 }}>
        <span>
          {data.doneUnits} / {total} done
        </span>
        {data.failedUnits > 0 && (
          <Box component="span" sx={{ color: "error.main" }}>
            {data.failedUnits} failed
          </Box>
        )}
        <span>elapsed {fmt(data.elapsedSec)}</span>
        {!data.finished && data.etaSec ? <span>~{fmt(data.etaSec)} left</span> : null}
        <span>CRQ {data.crqNo}</span>
      </Stack>

      {!data.finished && data.currentItem && (
        <Typography noWrap title={data.currentItem} sx={{ mt: 0.75, fontSize: 12.5, color: "text.secondary" }}>
          Now: {data.currentItem}
        </Typography>
      )}

      {note && <Note severity={note.severity}>{note.text}</Note>}
      {lostContact}

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
        {!data.finished && (
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            sx={btnSx}
            disabled={disableActions || cancelling}
            onClick={() => cancelJob({ jobId: data.jobId })}
          >
            {cancelling ? "Cancelling..." : "Cancel"}
          </Button>
        )}
        {data.finished && data.status !== "SUCCESS" && retryButton}
        {data.finished && VIEWABLE.includes(data.status) && (
          <Button size="small" variant="contained" disableElevation sx={btnSx} onClick={() => onViewData(data)}>
            View data
          </Button>
        )}
      </Stack>
    </Card>
  );
};

export default FetchProgressCard;
