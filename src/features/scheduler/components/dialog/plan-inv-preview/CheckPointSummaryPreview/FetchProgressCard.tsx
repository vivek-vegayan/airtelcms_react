import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, LinearProgress, Stack, Typography, alpha } from "@mui/material";
import type { Theme } from "@mui/material";

import {
  useCancelFetchJobMutation,
  useGetFetchProgressByCrqQuery,
  useGetImpactFetchBatchesQuery,
} from "../../../../api/fetchProgressApiSlice";
import type { FetchProgress, FetchStage } from "../../../../types/fetchProgress.types";

const POLL_MS = 3000;
/** Slower cadence while no job exists yet or the running job has stalled. */
const SLOW_POLL_MS = 15000;

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
  /** Re-runs the fetch with the stage's existing script (checkpoint "Data
   * Refresh" for VALIDATE, the impact script for the job's batch). */
  onRetry: (job: FetchProgress | null) => void;
  retrying?: boolean;
  onViewData: (job: FetchProgress) => void;
}> = (props) => {
  const card = <FetchProgressMain {...props} />;
  if (props.stage !== "IMPACT_ANALYSIS") return card;
  return (
    <>
      {card}
      <ImpactBatchStrip crqNo={props.crqNo} />
    </>
  );
};

const FetchProgressMain: React.FC<React.ComponentProps<typeof FetchProgressCard>> = ({
  crqNo,
  stage = "VALIDATE",
  disableActions = false,
  onRetry,
  retrying = false,
  onViewData,
}) => {
  // After a retry, the job that was on screen is stale: keep polling until a
  // different job id turns up so the new run is picked up.
  const [staleJobId, setStaleJobId] = useState<number | null>(null);

  // Polls while there is no job yet or the job is still running, and stops
  // once it is terminal so a finished CRQ left open is not hammering the API.
  // The interval is fed back from the previous result.
  const [finishedJobId, setFinishedJobId] = useState<number | null>(null);
  const [slow, setSlow] = useState(false);
  const polling = finishedJobId === null || finishedJobId === staleJobId;
  const { data, isLoading, isError } = useGetFetchProgressByCrqQuery(
    { crqNo, stage },
    {
      pollingInterval: !polling ? 0 : slow ? SLOW_POLL_MS : POLL_MS,
      skipPollingIfUnfocused: true,
      refetchOnMountOrArgChange: true,
    },
  );
  const [cancelJob, { isLoading: cancelling }] = useCancelFetchJobMutation();

  useEffect(() => {
    setFinishedJobId(data && data.finished ? data.jobId : null);
    // Back off while the daemon has not picked up the CRQ or the job is stuck.
    setSlow(data === null || !!data?.stalled);
  }, [data]);

  const handleRetry = () => {
    if (data) setStaleJobId(data.jobId);
    onRetry(data ?? null);
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

const BATCH_NUMBERS = [1, 2, 3, 4];

/** Batch1 after validation, Batch2 24h before, Batch3 1h before, Batch4 48h after. */
const BATCH_HINT: Record<number, string> = {
  1: "after validation",
  2: "24h before",
  3: "1h before",
  4: "48h after",
};

function batchTone(status: string): Tone {
  if (status === "SUCCESS") return "success";
  if (status === "FAILED") return "error";
  if (status === "PARTIAL" || status === "CANCELLED") return "warning";
  return "primary";
}

/**
 * Impact Analysis runs four times, each batch its own job row. Shows all four
 * with their own bars for the run type currently in play; polls with the same
 * cadence as the headline card while any batch is still unfinished.
 */
const ImpactBatchStrip: React.FC<{ crqNo: string }> = ({ crqNo }) => {
  const [settled, setSettled] = useState(false);
  const { data: rows = [] } = useGetImpactFetchBatchesQuery(
    { crqNo },
    { pollingInterval: settled ? 0 : POLL_MS, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: true },
  );
  const { data: current } = useGetFetchProgressByCrqQuery({ crqNo, stage: "IMPACT_ANALYSIS" });

  useEffect(() => {
    setSettled(rows.length > 0 && rows.every((r) => r.finished));
  }, [rows]);

  if (!rows.length) return null;

  // The run type of the headline job; fall back to everything if it has none.
  const runType = current?.runType ?? "";
  const inPlay = rows.filter((r) => !runType || r.runType === runType);
  const scoped = inPlay.length ? inPlay : rows;

  // Rows come oldest -> newest within a batch, so the last one wins.
  const byBatch = new Map<number, FetchProgress>();
  scoped.forEach((r) => {
    if (r.batchNo != null) byBatch.set(Number(r.batchNo), r);
  });
  const latest = [...byBatch.values()];
  const doneCount = latest.filter((b) => b.status === "SUCCESS").length;
  const sumTotal = latest.reduce((s, b) => s + (b.totalUnits || 0), 0);
  const sumDone = latest.reduce((s, b) => s + (b.doneUnits || 0), 0);
  const overall = sumTotal === 0 ? 0 : (100 * sumDone) / sumTotal;

  return (
    <Card>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" gap={1}>
        <Title text="Batches" tag={runType || null} />
        <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{doneCount} of 4 complete</Typography>
      </Stack>
      <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.5 }}>
        Overall {overall.toFixed(1)}% across the batches run so far.
      </Typography>

      {BATCH_NUMBERS.map((n) => {
        const b = byBatch.get(n);
        const isCurrent = !!b && !!current && b.jobId === current.jobId;
        const tot = b?.totalUnits || 0;
        const pct = !b ? 0 : tot === 0 ? (b.finished ? 100 : 0) : (b.percent ?? (100 * b.doneUnits) / tot);
        return (
          <Box
            key={n}
            sx={{
              border: "1px solid",
              borderColor: isCurrent ? "primary.main" : "divider",
              borderRadius: 2,
              px: 1.5,
              py: 1,
              mt: 1,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Batch{n}</Typography>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{BATCH_HINT[n]}</Typography>
                {b && (
                  <Chip
                    label={b.status}
                    size="small"
                    color={b.finished ? (batchTone(b.status) as "success" | "error" | "warning" | "primary") : "primary"}
                    variant={b.finished ? "outlined" : "filled"}
                    sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                  />
                )}
              </Stack>
              <Typography sx={{ fontSize: 12, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                {b ? `${b.doneUnits}/${tot}${b.failedUnits ? ` - ${b.failedUnits} failed` : ""}` : "not started"}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, pct)}
              color={b ? batchTone(b.status) : "primary"}
              sx={{
                height: 6,
                borderRadius: 999,
                mt: 0.75,
                bgcolor: (t: Theme) => alpha(t.palette.text.primary, 0.08),
                "& .MuiLinearProgress-bar": { borderRadius: 999 },
              }}
            />
          </Box>
        );
      })}
    </Card>
  );
};

export default FetchProgressCard;
