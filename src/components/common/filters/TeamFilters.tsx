import {
  Box,
  alpha,
} from "@mui/material";
import { useState } from "react";
import FilterSelect from "./FilterSelect";
import type { FilterKey, TeamFiltersProps } from "./filters.types";
import {
  FILTER_OPTIONS,
  ROLE_FILTER_VISIBILITY,
} from "../../../app/config/filters.config";

const FILTER_LABELS: Record<FilterKey, string> = {
  domain: "Domain",
  subDomain: "Sub Domain",
  teamFunction: "Team Function",
  teamSubFunction: "Team Sub Function",
};

const TeamFilters = ({
  values,
  onChange,
  role,
  status,
  onStatusChange,
  children, 
}: TeamFiltersProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const visibleFilters = ROLE_FILTER_VISIBILITY[role] ?? [];

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        justifyContent: "start",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 2,
        borderRadius: 3,
        background: `linear-gradient(180deg, ${alpha(
          theme.palette.background.paper,
          0.9
        )}, ${theme.palette.background.paper})`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
      })}
    >
      {/* LEFT */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "start",
          width: "50%",
        }}
      >
        {visibleFilters.map((key) => (
          <FilterSelect
            key={key}
            label={FILTER_LABELS[key]}
            value={values[key]}
            options={FILTER_OPTIONS[key]}
            onChange={(value) => onChange(key, value)}
          />
        ))}
      </Box>

      {/* RIGHT (optional) */}
      {children && <Box>{children}</Box>}
    </Box>
  );
};

export default TeamFilters;

