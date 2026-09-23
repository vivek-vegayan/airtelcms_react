import { FormControlLabel, Radio, RadioGroup } from "@mui/material";

export type RosterViewMode = "weekly" | "monthly";

interface Props {
  value: RosterViewMode;
  onChange: (view: RosterViewMode) => void;
}

/** Weekly / Monthly radio toggle for the roster page header. */
export const RosterViewSwitch = ({ value, onChange }: Props) => (
  <RadioGroup
    row
    value={value}
    onChange={(e) => onChange(e.target.value as RosterViewMode)}
    sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.8rem" } }}
  >
    <FormControlLabel
      value="weekly"
      control={<Radio size="small" />}
      label="Weekly"
    />
    <FormControlLabel
      value="monthly"
      control={<Radio size="small" />}
      label="Monthly"
    />
  </RadioGroup>
);
