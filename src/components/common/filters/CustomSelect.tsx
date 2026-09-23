import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";

// Define Props Interface
interface CustomSelectProps {
  label?: string;
  options?: string[]; // Made optional
  value?: string | null; // Made optional/null-safe
  onChange: (event: SelectChangeEvent) => void;
  width?: string | number;
  backgroundColor?: string;
  size?: "small" | "medium";
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label = "Select Option",
  options = [], //  default to empty array
  value = "",   //  default to empty string if null/undefined
  onChange,
  width = "170px",
  backgroundColor,
  size = "small",
  disabled = false,
}) => {
  //  runtime-safe validation: ensure value is in options
  const validValue = Array.isArray(options) && options.includes(value ?? "") ? value ?? "" : "";

  return (
    <FormControl size={size} sx={{ p: 0, width, maxWidth: "100%" }}>
      <InputLabel id={`${label}-label`}>{label}</InputLabel>
      <Select
        labelId={`${label}-label`}
        id={`${label}-select`}
        label={label}
        value={validValue}
        onChange={onChange}
        // No forced background — let the theme's MuiOutlinedInput styling
        // (light/dark aware) show through unless a caller opts in explicitly.
        sx={backgroundColor ? { bgcolor: backgroundColor } : undefined}
        disabled={disabled}
      >
        {options.length > 0 ? (
          options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No options available</MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default CustomSelect;