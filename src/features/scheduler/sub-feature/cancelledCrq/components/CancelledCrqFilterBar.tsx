import { Box, Button, InputAdornment, TextField, useTheme } from "@mui/material";
import { useMemo } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import OrgFilterSelect from "../../../../orgHierarchy/components/OrgFilterSelect";
import { getOrgFilterVisibility } from "../../../../orgHierarchy/config/orgFilterVisibility";
import type {
  OrgFilterKey,
  OrgFilterOption,
  OrgFilterValues,
} from "../../../../orgHierarchy/types/orgHierarchy.types";
import { useTabColorTokens } from "../../../../../style/theme";

const LABELS: Record<OrgFilterKey, string> = {
  vertical: "Vertical",
  teamFunction: "Team Function",
  domain: "Domain",
  subDomain: "Sub Domain",
};

const ALL_LABEL: Record<OrgFilterKey, string> = {
  vertical: "All Verticals",
  teamFunction: "All Functions",
  domain: "All Domains",
  subDomain: "All Sub Domains",
};

interface Props {
  role: string;
  values: OrgFilterValues;
  options: Record<OrgFilterKey, OrgFilterOption[]>;
  onChange: (key: OrgFilterKey, value?: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

/**
 * Filter bar for the Cancelled CRQ registry.
 *
 * Which pickers appear is resolved by the SAME `getOrgFilterVisibility` the
 * shared OrgHierarchyFiltersV2 uses, so a user's "Organization Hierarchy"
 * grants govern this screen exactly as they govern every other one.
 *
 * What differs, and why this is not simply OrgHierarchyFiltersV2:
 *
 * - Every level offers an explicit "All …" entry. This register's whole
 *   point is the consolidated view, so a user must be able to widen back out
 *   after narrowing; the shared select has no empty entry, so once a value is
 *   picked there it can never be unpicked.
 * - A child picker is never disabled by an unset parent. In the shared bar an
 *   unset parent means "you haven't scoped yet, so you may not scope deeper";
 *   here an unset parent means "all of them", which is a valid scope to
 *   filter *within* — picking a Sub Domain without first picking a Domain is
 *   a legitimate query, not an incomplete one.
 *
 * Option cascading is unchanged: `useOrgHierarchyFilters` already treats a
 * falsy parent as "no narrowing", and the "All …" entry is valued 0, so
 * choosing it re-opens every child option.
 */
const ORG_FILTER_ORDER: OrgFilterKey[] = [
  "vertical",
  "teamFunction",
  "domain",
  "subDomain",
];

export const CancelledCrqFilterBar = ({
  role,
  values,
  options,
  onChange,
  search,
  onSearchChange,
  onRefresh,
  refreshing,
}: Props) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const visible = useMemo(() => {
    const granted = getOrgFilterVisibility(role);
    // Keep top-down order regardless of the order grants arrive in, so the
    // cascade reads coherently left to right.
    return ORG_FILTER_ORDER.filter((key) => granted.includes(key));
  }, [role]);

  const withAll = (key: OrgFilterKey): OrgFilterOption[] => [
    { label: ALL_LABEL[key], value: 0 },
    ...options[key],
  ];

  return (
    <Box
      sx={{
        display: "flex",
        // One line from md up (incl. 125% scaling); wrap only on narrow screens.
        flexWrap: { xs: "wrap", md: "nowrap" },
        gap: 1.25,
        alignItems: "center",
        // Sits in the table's top toolbar (no frame of its own); grows to fill
        // the row up to the table's column/fullscreen icons.
        flex: "1 1 auto",
        minWidth: 0,
        pt: 0.75,
      }}
    >
      {visible.map((key) => (
        <OrgFilterSelect
          key={key}
          label={LABELS[key]}
          // `?? 0` so an unset level displays as "All …" rather than blank —
          // the register really is showing all of them at that point.
          value={values[key] ?? 0}
          options={withAll(key)}
          onChange={(v) => onChange(key, v)}
          // Small base width so the pickers shrink instead of pushing Refresh
          // to a second line; they grow back on wider screens.
          sx={{ flex: "1 1 130px", minWidth: 120, maxWidth: 180 }}
        />
      ))}

      <TextField
        size="small"
        placeholder="Search CRQ, plan, reason, owner…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{
          minWidth: 160,
          flex: "1 1 200px",
          "& .MuiInputBase-root": { height: 32 },
          "& .MuiInputBase-input": { padding: "4px 8px", fontSize: "0.8rem" },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 16, color: tk.textDim }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        size="small"
        variant="text"
        disabled={refreshing}
        onClick={onRefresh}
        startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
        sx={{ textTransform: "none", fontSize: "0.78rem", height: 32, flexShrink: 0 }}
      >
        Refresh
      </Button>
    </Box>
  );
};

export default CancelledCrqFilterBar;
