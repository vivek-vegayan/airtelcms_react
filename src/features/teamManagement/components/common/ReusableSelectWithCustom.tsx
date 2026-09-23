import { Autocomplete, TextField } from "@mui/material";

interface Props {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const ReusableSelectWithCustom = ({
  label,
  options,
  value,
  onChange,
  error,
  required,
}: Props) => {
  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value || ""}
      onChange={(_, newValue) => {
        if (typeof newValue === "string") {
          onChange(newValue);
        }
      }}
      onInputChange={(_, newInputValue) => {
        onChange(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size="small"
          required={required}
          error={!!error}
          helperText={error}
        />
      )}
    />
  );
};
