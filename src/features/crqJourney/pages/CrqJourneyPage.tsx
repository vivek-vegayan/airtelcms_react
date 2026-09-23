import React, { useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useCrqJourney } from "../hooks/useCrqJourney";
import { CrqSelector } from "../components/CrqSelector";
import { CrqInfoStrip } from "../components/CrqInfoStrip";
import { CrqFlowCanvas } from "../components/CrqFlowCanvas";
import { CrqFlowSkeleton } from "../components/CrqFlowSkeleton";
import { CrqEmptyState } from "../components/CrqEmptyState";
import {
  ServiceRosterPanel,
  serviceRosterReserve,
} from "../components/ServiceRosterPanel";
import { SpocFeDetailsModal } from "../../cabManager/components/modals/SpocFeDetailsModal";

export const CrqJourneyPage: React.FC = () => {
  const {
    roleName,
    values,
    options,
    handleChange,
    crqOptions,
    isLoadingCrqs,
    selectedCrq,
    info,
    handleSelectCrq,
    showLegend,
    handleToggleLegend,
    isLoading,
    error,
    flow,
    progress,
    serviceRoster,
    approverIndex,
    scope,
    details,
    isLoadingDetails,
    refetch,
    isRefreshing,
  } = useCrqJourney();

  // The service panel sits under the flow canvas, and the canvas fits itself
  // into the viewport height left below its own top edge — so the panel's open
  // state lives here, where it can also be turned into the height the canvas
  // has to leave free. Collapsing it hands that height back to the diagram.
  const [rosterOpen, setRosterOpen] = useState(true);
  const rosterReserve = serviceRosterReserve(serviceRoster, rosterOpen);

  // Same read-only SPOC / Field Engineer dialog the CAB "My CRQs" drawer opens,
  // reused as-is: it is keyed on the CRQ number and fetches its own row, so the
  // journey page only has to own the open state.
  const [spocFeOpen, setSpocFeOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pb: 1 }}>
      {/* ── Org scope + CRQ selector ── */}
      <CrqSelector
        role={roleName}
        values={values}
        options={options}
        onFilterChange={handleChange}
        crqOptions={crqOptions}
        isLoadingCrqs={isLoadingCrqs}
        value={selectedCrq}
        onChange={handleSelectCrq}
      />

      {/* ── Loading ── */}
      {isLoading && <CrqFlowSkeleton />}

      {/* ── Error ── */}
      {error && !isLoading && (
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" startIcon={<RefreshRoundedIcon />} onClick={refetch}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ── Empty ── */}
      {!selectedCrq && !isLoading && (
        <CrqEmptyState
          subtitle={
            values.subDomain == null
              ? "Pick a Sub Domain to browse its Change Requests, or type a CRQ number directly."
              : "Choose a Change Request above to view its journey flow."
          }
        />
      )}

      {/* ── Journey ── */}
      {info && !isLoading && !error && (
        <>
          <CrqInfoStrip
            info={info}
            details={details}
            isLoadingDetails={isLoadingDetails}
            progress={progress}
            onRefresh={refetch}
            isRefreshing={isRefreshing}
            onViewSpocFe={() => setSpocFeOpen(true)}
          />

          {flow && (
            <CrqFlowCanvas
              flow={flow}
              showLegend={showLegend}
              onToggleLegend={handleToggleLegend}
              approverIndex={approverIndex}
              bottomReserve={rosterReserve}
            />
          )}

          {/* Who owns each service and who still has to act on it — under the
              diagram of what's left to do. The canvas above reserves this
              panel's height so both fit in one view. */}
          <ServiceRosterPanel
            roster={serviceRoster}
            scope={scope}
            open={rosterOpen}
            onToggle={() => setRosterOpen((v) => !v)}
          />

          <SpocFeDetailsModal
            open={spocFeOpen}
            crqNo={info.crqNo}
            onClose={() => setSpocFeOpen(false)}
          />
        </>
      )}
    </Box>
  );
};
