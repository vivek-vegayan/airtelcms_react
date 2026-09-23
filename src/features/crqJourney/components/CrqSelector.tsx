import React from "react";
import { Autocomplete, Box, CircularProgress, TextField, Typography, useTheme } from "@mui/material";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import type { OrgFilterKey, OrgFilterOption, OrgFilterValues } from "../../orgHierarchy/types/orgHierarchy.types";
import type { CrqJourneySearchRow } from "../types/crqJourney.types";
import { formatStatusLabel, statusChipColor } from "../utils/crqJourney.utils";
import { useApiRefresh, type ApiTag } from "../../../hooks/useApiRefresh";

// The sub-domain CRQ list, the journey stages and the details card all provide
// the "CrqReview" type, so invalidating it refetches the whole screen.
const JOURNEY_TAGS: ApiTag[] = ["CrqReview"];

interface CrqSelectorProps {
  role: string;
  values: OrgFilterValues;
  options: Record<OrgFilterKey, OrgFilterOption[]>;
  onFilterChange: (key: OrgFilterKey, value?: number) => void;
  crqOptions: CrqJourneySearchRow[];
  isLoadingCrqs: boolean;
  value: CrqJourneySearchRow | null;
  onChange: (crq: CrqJourneySearchRow | null) => void;
}

export const CrqSelector: React.FC<CrqSelectorProps> = ({
  role,
  values,
  options,
  onFilterChange,
  crqOptions,
  isLoadingCrqs,
  value,
  onChange,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const scopeSelected = values.subDomain != null;
  const { refresh, isRefreshing } = useApiRefresh({
    tags: JOURNEY_TAGS,
    isFetching: isLoadingCrqs,
  });

  const emitCrq = (val: CrqJourneySearchRow | string | null) => {
    if (val == null) return onChange(null);
    if (typeof val === "string") {
      const crqNo = val.trim();
      if (!crqNo) return onChange(null);
      return onChange({ crqNo, currentStage: "", currentStatus: "", enteredCurrentStageAt: null });
    }
    onChange(val);
  };

  return (
    <Box
      sx={{
        background: theme.palette.background.paper,
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.5, md: 2 },
        flexWrap: "wrap",
        // OrgHierarchyFilters lays its selects out in a nowrap row; letting them
        // wrap here is what keeps the toolbar usable on laptop and tablet widths.
        "& > div:first-of-type": { flexWrap: "wrap", rowGap: 1.5 },
      }}
    >
      <OrgHierarchyFilters
        role={role}
        values={values}
        options={options}
        onChange={onFilterChange}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        refreshDisabled={!scopeSelected && !value}
        refreshTooltip={
          scopeSelected || value
            ? "Refresh CRQ list and journey"
            : "Pick a Sub Domain or a CRQ first"
        }
      />

      <Autocomplete<CrqJourneySearchRow, false, false, true>
        size="small"
        sx={{ minWidth: { xs: "100%", sm: 300, lg: 360 }, flex: { xs: "1 1 100%", sm: "0 1 auto" } }}
        freeSolo
        options={crqOptions}
        value={value}
        loading={isLoadingCrqs}
        disableClearable={false}
        getOptionLabel={(crq) => (typeof crq === "string" ? crq : crq.crqNo)}
        isOptionEqualToValue={(a, b) => a.crqNo === b.crqNo}
        onChange={(_e, crq) => emitCrq(crq)}
        filterOptions={(opts, state) => {
          const q = state.inputValue.trim().toLowerCase();
          if (!q) return opts;
          return opts.filter((crq) => crq.crqNo.toLowerCase().includes(q));
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Choose a Change Request"
            placeholder={scopeSelected ? "Search by CRQ ID…" : "Type a CRQ number and press Enter, or pick a Sub Domain to browse…"}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontFamily: "Roboto Mono, monospace",
                fontSize: 13,
              },
            }}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoadingCrqs && <CircularProgress color="inherit" size={14} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, crq) => {
          const chip = statusChipColor(crq.currentStatus, isDark);
          return (
            <Box component="li" {...props} key={crq.crqNo} sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                sx={{
                  fontFamily: "Roboto Mono, monospace",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  flexGrow: 1,
                }}
              >
                {crq.crqNo}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{crq.currentStage}</Typography>
              <Box
                sx={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: chip.color,
                  background: chip.bg,
                  borderRadius: "6px",
                  px: "6px",
                  py: "1px",
                }}
              >
                {formatStatusLabel(crq.currentStatus)}
              </Box>
            </Box>
          );
        }}
        noOptionsText={
          scopeSelected ? "No CRQs found for this Sub Domain" : "Type a full CRQ number and press Enter to look it up"
        }
      />
    </Box>
  );
};
