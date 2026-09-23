import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { authStorage } from "../../../app/store/auth.storage";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import {
  useGetCrqsBySubDomainQuery,
  useGetCrqJourneyStagesQuery,
  useGetCrqDetailsQuery,
} from "../api/crqJourneyExplorer.api";
import {
  buildApproverIndex,
  buildServiceRoster,
  computeFlowProgress,
  currentStageEnteredAt,
  groupJourneyStages,
  summarizeServiceApprovals,
} from "../utils/crqJourney.utils";
import type { CrqJourneySearchRow } from "../types/crqJourney.types";

/**
 * Drives /cabmanager/journey[/:id]: sub-domain scoped CRQ search → dynamic-length
 * journey flow. When a crqNo arrives in the URL (e.g. the All CRQs drawer's
 * "View full CRQ journey" link), it's auto-selected instead of making the user
 * re-pick org scope + CRQ from the dropdown.
 */
export const useCrqJourney = () => {
  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";
  const { id: crqNoFromRoute } = useParams<{ id: string }>();

  const { values, handleChange: handleOrgFilterChange } = useOrgHierarchyState("crqJourney");
  const { options } = useOrgHierarchyFilters(values);

  const [selectedCrq, setSelectedCrq] = useState<CrqJourneySearchRow | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const subDomainId = values.subDomain;

  const { data: crqOptions = [], isFetching: isLoadingCrqs } = useGetCrqsBySubDomainQuery(
    subDomainId ?? 0,
    { skip: subDomainId == null }
  );

  // A different sub-domain scope invalidates whatever CRQ was picked before.
  useEffect(() => {
    setSelectedCrq(null);
  }, [subDomainId]);

  // Deep-link: /cabmanager/journey/:id lands here with a crqNo already known,
  // so fetch just enough (info card fields) to select it automatically. Once
  // consumed (or the user picks a CRQ themselves), it never overrides the
  // selection again — otherwise a background refetch of these details could
  // silently snap the user's later manual pick back to the route's crqNo.
  const [routeCrqConsumed, setRouteCrqConsumed] = useState(false);

  // One details query serves two jobs: bootstrapping the deep-linked CRQ, and
  // enriching the header strip (team function / created on / remark) for
  // whichever CRQ is selected. RTK Query dedupes them when they're the same.
  const detailsCrqNo = selectedCrq?.crqNo ?? (!routeCrqConsumed ? crqNoFromRoute : undefined);

  const {
    data: crqDetails,
    isFetching: isLoadingDetails,
    isError: isDetailsError,
  } = useGetCrqDetailsQuery(detailsCrqNo ?? "", { skip: !detailsCrqNo });

  useEffect(() => {
    if (!routeCrqConsumed && crqDetails?.info && crqDetails.info.crqNo === crqNoFromRoute) {
      setSelectedCrq({
        crqNo: crqDetails.info.crqNo,
        currentStage: crqDetails.info.currentStage,
        currentStatus: crqDetails.info.currentStatus,
        // The CRQ's creation date is not when it entered its current stage —
        // result set 2's current-stage row is.
        enteredCurrentStageAt: currentStageEnteredAt(crqDetails.stages),
      });
      setRouteCrqConsumed(true);
    }
  }, [crqDetails, crqNoFromRoute, routeCrqConsumed]);

  const handleSelectCrq = (crq: CrqJourneySearchRow | null) => {
    setRouteCrqConsumed(true);
    setSelectedCrq(crq);
  };

  const handleChange = (key: Parameters<typeof handleOrgFilterChange>[0], value?: number) => {
    setRouteCrqConsumed(true);
    handleOrgFilterChange(key, value);
  };

  const {
    data: journey,
    isFetching: isLoadingJourney,
    isError: isJourneyError,
    refetch: refetchJourney,
  } = useGetCrqJourneyStagesQuery(selectedCrq?.crqNo ?? "", { skip: !selectedCrq });

  const flow = useMemo(
    () => (journey?.stages ? groupJourneyStages(journey.stages) : null),
    [journey?.stages]
  );
  const progress = useMemo(() => (flow ? computeFlowProgress(flow) : null), [flow]);

  // Result set 2 of the same call: every CAB service on the CRQ, its decision,
  // and the L1/L2/L3 approval ladder behind it. It identifies services by code
  // only, so the grouped flow's service rows are handed in as well — they carry
  // the display names for exactly the services on this CRQ. The index then lets
  // an approvals-lane card in the canvas name the approver who owes it a
  // decision, without a lookup per render.
  const serviceApprovals = useMemo(
    () => summarizeServiceApprovals(journey?.pendingApprovals, flow?.approvals ?? []),
    [journey?.pendingApprovals, flow?.approvals]
  );
  const approverIndex = useMemo(
    () => buildApproverIndex(serviceApprovals.services),
    [serviceApprovals.services]
  );

  // Result set 3, folded together with the two above: one line per CAB service
  // carrying its decision, its approval ladder and its SPOC.
  const serviceRoster = useMemo(
    () => buildServiceRoster(journey?.serviceSpocs, serviceApprovals, flow?.approvals ?? []),
    [journey?.serviceSpocs, serviceApprovals, flow?.approvals]
  );

  // Only the details belonging to the CRQ on screen — a stale response for the
  // previously selected CRQ must not leak into the header strip.
  const selectedDetails =
    crqDetails?.info && crqDetails.info.crqNo === selectedCrq?.crqNo ? crqDetails.info : null;

  // The header strip's stage / status / entered-at come from GetCRQBySubDomainId,
  // i.e. only from rows the user picked out of the Sub Domain browse list. A CRQ
  // typed straight into the selector never passes through that list — CrqSelector
  // hands over a stub row carrying just the crqNo — so those three fields would
  // render as dashes next to a fully populated Team Function / Created On.
  // get_crq_details already covers all three; fill in whatever the row lacks.
  const info = useMemo<CrqJourneySearchRow | null>(() => {
    if (!selectedCrq) return null;
    if (!selectedDetails) return selectedCrq;
    return {
      crqNo: selectedCrq.crqNo,
      currentStage: selectedCrq.currentStage || selectedDetails.currentStage || "",
      currentStatus: selectedCrq.currentStatus || selectedDetails.currentStatus || "",
      enteredCurrentStageAt:
        selectedCrq.enteredCurrentStageAt ?? currentStageEnteredAt(crqDetails?.stages),
    };
  }, [selectedCrq, selectedDetails, crqDetails?.stages]);

  return {
    roleName,
    values,
    options,
    handleChange,
    crqOptions,
    isLoadingCrqs,
    selectedCrq,
    /** `selectedCrq` with anything the search row was missing filled in from get_crq_details. */
    info,
    handleSelectCrq,
    showLegend,
    handleToggleLegend: () => setShowLegend((v) => !v),
    isLoading: isLoadingJourney || (!!crqNoFromRoute && !selectedCrq && isLoadingDetails),
    error: isJourneyError
      ? "Failed to load CRQ journey."
      : isDetailsError && !!crqNoFromRoute && !routeCrqConsumed
        ? "Failed to load CRQ."
        : null,
    flow,
    progress,
    serviceRoster,
    approverIndex,
    scope: journey?.scope ?? null,
    details: selectedDetails,
    isLoadingDetails: isLoadingDetails && !selectedDetails,
    refetch: () => {
      if (selectedCrq) void refetchJourney();
    },
    isRefreshing: isLoadingJourney,
  };
};
