import { useEffect, useState } from "react";
import { Alert, Collapse } from "@mui/material";

import FetchProgressCard from "../../../dialog/plan-inv-preview/CheckPointSummaryPreview/FetchProgressCard";
import { useRunImpactAnalysisScriptMutation } from "../../../../api/impactBatchApiSlice";
import type { FetchProgress } from "../../../../types/fetchProgress.types";
import { ImpactBatchExplorer } from "./ImpactBatchExplorer";

/**
 * Impact Analysis Summary body: the node/interface fetch progress (headline
 * job + Batch1..4 strip) comes first, and the existing ImpactBatchExplorer is
 * revealed unchanged once the user opens it with "View data".
 */
export const ImpactAnalysisPreview: React.FC<{
  crqNo: string | null;
  colors: any;
  readOnly?: boolean;
}> = ({ crqNo, colors, readOnly = false }) => {
  const [showData, setShowData] = useState(false);
  useEffect(() => setShowData(false), [crqNo]);

  const [runScript, { isLoading: retrying }] = useRunImpactAnalysisScriptMutation();
  const [retryStatus, setRetryStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Same script the explorer's "Refetch" runs, for the batch the job was on.
  const handleRetry = async (job: FetchProgress | null) => {
    if (!crqNo) return;
    setRetryStatus(null);
    try {
      const result = await runScript({ crqNo, attempt: job?.batchNo || 1 }).unwrap();
      setRetryStatus({ ok: result.status === "SUCCESS", message: result.message });
    } catch (err) {
      setRetryStatus({ ok: false, message: typeof err === "string" ? err : "Failed to execute impact analysis script." });
    }
  };

  // No CRQ: the explorer already renders its own empty state.
  if (!crqNo) return <ImpactBatchExplorer crqNo={crqNo} colors={colors} readOnly={readOnly} />;

  return (
    <>
      <FetchProgressCard
        crqNo={crqNo}
        stage="IMPACT_ANALYSIS"
        disableActions={readOnly}
        onRetry={handleRetry}
        retrying={retrying}
        onViewData={() => setShowData(true)}
      />

      <Collapse in={Boolean(retryStatus)} unmountOnExit>
        <Alert
          severity={retryStatus?.ok ? "success" : "error"}
          sx={{ borderRadius: 1.5, mb: 1.5, fontSize: 12.5, py: 0.5 }}
          onClose={() => setRetryStatus(null)}
        >
          {retryStatus?.message}
        </Alert>
      </Collapse>

      {showData && <ImpactBatchExplorer crqNo={crqNo} colors={colors} readOnly={readOnly} />}
    </>
  );
};

export default ImpactAnalysisPreview;
