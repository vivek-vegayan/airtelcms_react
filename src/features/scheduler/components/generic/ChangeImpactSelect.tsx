import React from "react";
import { MenuItem, TextField } from "@mui/material";
import { CHANGE_IMPACT_OPTIONS, type ChangeImpactFilter } from "../../util/changeImpact";
import { changeImpactSx } from "./stageToolbarSx";

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
    InputLabelProps={{ sx: { fontSize: 12.5 } }}
    SelectProps={{
      MenuProps: { PaperProps: { sx: { borderRadius: "9px", mt: 0.5, minWidth: 160 } } },
    }}
    InputProps={{
      sx: {
        fontSize: 12.5,
        height: 34,
        borderRadius: "9px",
        bgcolor: colors.trackOff,
        color: colors.textPrimary,
        "& fieldset": { borderColor: colors.border },
        "&:hover fieldset": { borderColor: `${colors.accentBorder} !important` },
        "&.Mui-focused fieldset": { borderColor: `${colors.accent} !important` },
        "& .MuiSelect-select": {
          py: 0,
          pr: "28px !important",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      },
    }}
    sx={changeImpactSx}
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
