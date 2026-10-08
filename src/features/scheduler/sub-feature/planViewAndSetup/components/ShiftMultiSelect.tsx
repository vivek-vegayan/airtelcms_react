import React, { useMemo, useState } from "react";
import {
  Autocomplete,
  Chip,
  CircularProgress,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Schedule } from "@mui/icons-material";

/** "A, B,,LG" -> ["A", "B", "LG"] (trimmed, de-duplicated, order kept). */
const splitShifts = (value: string | null | undefined): string[] =>
  Array.from(
    new Set(
      String(value ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

interface Props {
  /** Comma-separated shifts, e.g. "A,LG". */
  value: string;
  onChange: (value: string) => void;
  /** Live shift names from GET /activity/planshiftdropdown. */
  options: string[];
  loading?: boolean;
  label?: string;
  error?: boolean;
  helperText?: React.ReactNode;
}

/** Multi-select shift picker that also accepts typed shifts. Typing a comma,
 *  pressing Enter or leaving the field commits typed text. The selection
 *  is sent to the backend as a comma-separated string. */
const ShiftMultiSelect: React.FC<Props> = ({
  value,
  onChange,
  options,
  loading,
  label = "Shift",
  error,
  helperText,
}) => {
  const selected = useMemo(() => splitShifts(value), [value]);
  const [inputValue, setInputValue] = useState("");

  // Typed text that matches an option ignoring case uses the option's spelling
  // ("g" -> "G"), so it doesn't create a duplicate chip.
  const commit = (next: string[]) => {
    const normalized = next.map(
      (s) => options.find((o) => o.toLowerCase() === s.trim().toLowerCase()) ?? s,
    );
    onChange(splitShifts(normalized.join(",")).join(","));
  };

  // Only text the user actually typed is committed on blur. (autoSelect is not
  // used: it would add whatever option was last hovered, e.g. clicking Save
  // right after hovering "G" silently selected G.)
  const commitTyped = () => {
    if (!inputValue.trim()) return;
    commit([...selected, inputValue]);
    setInputValue("");
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      disableCloseOnSelect
      fullWidth
      size="small"
      sx={{
        // Same width as the other fields; chips wrap so the field grows downward.
        "& .MuiAutocomplete-inputRoot": { flexWrap: "wrap", rowGap: 0.5, py: 0.75 },
        "& .MuiAutocomplete-tag": { my: 0 },
      }}
      options={options}
      value={selected}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(_, text, reason) => {
        if (reason === "reset") {
          setInputValue("");
          return;
        }
        // Typing a comma commits everything before it as chips.
        if (text.includes(",")) {
          const parts = text.split(",");
          const rest = parts.pop() ?? "";
          commit([...selected, ...parts]);
          setInputValue(rest);
          return;
        }
        setInputValue(text);
      }}
      onChange={(_, next) => commit(next as string[])}
      renderTags={(tags, getTagProps) =>
        tags.map((t, i) => {
          const { key, ...rest } = getTagProps({ index: i });
          return (
            <Chip
              key={key}
              {...rest}
              label={t}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: 11, fontWeight: 600, "& .MuiChip-label": { px: 0.75 } }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          placeholder={selected.length ? "" : "Select or type"}
          inputProps={{
            ...params.inputProps,
            onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
              params.inputProps.onBlur?.(e);
              commitTyped();
            },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start" sx={{ ml: 0.5, mr: 0.5 }}>
                  {loading ? (
                    <CircularProgress size={14} thickness={5} />
                  ) : (
                    <Schedule fontSize="small" />
                  )}
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default ShiftMultiSelect;
