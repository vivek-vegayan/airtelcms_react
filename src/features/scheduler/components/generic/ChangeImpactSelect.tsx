import React from "react";
import { MenuItem, TextField } from "@mui/material";
import { CHANGE_IMPACT_OPTIONS, type ChangeImpactFilter } from "../../util/changeImpact";

interface ChangeImpactSelectProps {
  value: ChangeImpactFilter;
  onChange: (value: ChangeImpactFilter) => void;
  colors: any;
}

/** Toolbar dropdown that narrows the stage listing by CRQ change impact. */
const ChangeImpactSelect: React.FC<ChangeImpactSelectProps> = ({ value, onChange, colors }) => (
  <TextField
    select
    size="small"
    label="Change Impact"
    value={value}
    onChange={(e) => onChange(e.target.value as ChangeImpactFilter)}
    InputLabelProps={{ sx: { fontSize: 13 } }}
    InputProps={{
      sx: {
        fontSize: 13,
        height: 34,
        borderRadius: "9px",
        bgcolor: colors.trackOff,
        color: colors.textPrimary,
        "& fieldset": { borderColor: colors.border },
      },
    }}
    sx={{ width: 220 }}
  >
    <MenuItem value="" sx={{ fontSize: 13 }}>
      All
    </MenuItem>
    {CHANGE_IMPACT_OPTIONS.map((o) => (
      <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>
);

export default ChangeImpactSelect;
