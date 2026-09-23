import React from "react";
import { Autocomplete, Box, CircularProgress, TextField, Typography, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OrgHierarchyFilters from "../../../orgHierarchy/components/OrgHierarchyFiltersV2";
import type { OrgFilterKey, OrgFilterOption, OrgFilterValues } from "../../../orgHierarchy/types/orgHierarchy.types";
import type { CrqJourneySearchRow } from "../../types/crqJourney.types";
import { statusChipColor } from "../../utils/crqJourney.utils";
import { useApiRefresh, type ApiTag } from "../../../../hooks/useApiRefresh";

// The sub-domain CRQ list and the details card both provide the "CrqReview"
// type, so invalidating it refetches the whole screen.
const JOURNEY_TAGS: ApiTag[] = ["CrqReview"];

interface CrqDetailsSearchBarProps {
  role: string;
  values: OrgFilterValues;
  options: Record<OrgFilterKey, OrgFilterOption[]>;
  onFilterChange: (key: OrgFilterKey, value?: number) => void;
  crqOptions: CrqJourneySearchRow[];
  isLoadingCrqs: boolean;
  value: CrqJourneySearchRow | null;
  onChange: (crq: CrqJourneySearchRow | null) => void;
}

export const CrqDetailsSearchBar: React.FC<CrqDetailsSearchBarProps> = ({
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
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        p: "14px 18px",
        borderRadius: "14px",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
            : "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === "dark" ? "0 8px 28px rgba(0,0,0,0.4)" : "0 8px 28px rgba(16,40,70,0.06)",
        transition: "box-shadow 0.2s ease",
        "&:focus-within": {
          boxShadow: `0 0 0 3px ${theme.palette.primary.main}22, 0 8px 28px rgba(16,40,70,0.08)`,
        },
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
            ? "Refresh CRQ list and details"
            : "Pick a Sub Domain or a CRQ first"
        }
      />

      <Autocomplete<CrqJourneySearchRow, false, false, true>
        size="small"
        sx={{ flex: 1, minWidth: { xs: "100%", sm: 320 } }}
        freeSolo
        options={crqOptions}
        value={value}
        loading={isLoadingCrqs}
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
            placeholder={scopeSelected ? "Look up a CRQ number…" : "Type a CRQ number and press Enter, or pick a Sub Domain to browse…"}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "999px",
                background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "#fff",
                fontFamily: "Roboto Mono, monospace",
                fontSize: 13,
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: <SearchIcon sx={{ fontSize: 18, color: "text.disabled", ml: "6px" }} />,
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
          const chip = statusChipColor(crq.currentStatus, theme.palette.mode === "dark");
          return (
            <Box component="li" {...props} key={crq.crqNo} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: chip.dot, flexShrink: 0 }} />
              <Typography sx={{ fontFamily: "Roboto Mono, monospace", fontSize: 12.5, fontWeight: 600, color: theme.palette.primary.main }}>
                {crq.crqNo}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{crq.currentStage}</Typography>
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
