import { Box, type SelectChangeEvent } from "@mui/material";
import CustomSelect from "./CustomSelect";
import type { FilterOption } from "./filters.types";

interface Props {
  label: string;
  value?: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const FilterSelect = ({
  label,
  value = "",
  options,
  onChange,
  disabled,
}: Props) => {
  const handleChange = (e: SelectChangeEvent<string>) => {
    onChange(e.target.value);
  };

  return (
    <Box sx={{ width: "24%", pl:1 }}>
      <CustomSelect
        label={label}
        value={value}
        options={options.map((o) => o.value)}
        onChange={handleChange}
        size="small"
        width="100%"
        disabled={disabled}
      />
    </Box>
  );
};

export default FilterSelect;
