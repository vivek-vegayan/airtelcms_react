import { Box, Chip, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { type KeyboardEvent } from "react";

interface Props {
  inputId: string;
  searchTerms: string[];
  onTermsChange: (terms: string[]) => void;
  /** In-progress text lives in the owning toolbar so "Clear all" can reset it. */
  inputValue: string;
  onInputChange: (value: string) => void;
}

/**
 * Multi-term chip search input shared by the Weekly and Monthly toolbars.
 * Enter / comma commits the current text as a chip; Backspace on empty
 * input removes the last chip.
 */
export const RosterSearchInput = ({
  inputId,
  searchTerms,
  onTermsChange,
  inputValue,
  onInputChange,
}: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const commitInput = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !searchTerms.includes(s));
    if (parts.length > 0) onTermsChange([...searchTerms, ...parts]);
    onInputChange("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitInput(inputValue);
    }
    if (e.key === "Backspace" && inputValue === "" && searchTerms.length > 0)
      onTermsChange(searchTerms.slice(0, -1));
  };

  const hasSearch = searchTerms.length > 0 || inputValue.trim().length > 0;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "4px",
        minWidth: 220,
        maxWidth: 380,
        minHeight: 32,
        px: "10px",
        py: "4px",
        borderRadius: "8px",
        border: `1px solid ${
          hasSearch ? theme.palette.primary.main : theme.palette.divider
        }`,
        bgcolor: isDark ? "background.default" : "#fff",
        cursor: "text",
        transition: "border-color .15s",
      }}
      onClick={() => document.getElementById(inputId)?.focus()}
    >
      <SearchIcon
        sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }}
      />

      {searchTerms.map((term) => (
        <Chip
          key={term}
          label={term}
          size="small"
          onDelete={() => onTermsChange(searchTerms.filter((t) => t !== term))}
          deleteIcon={<CloseIcon style={{ fontSize: 11 }} />}
          sx={{
            height: 20,
            fontSize: "0.65rem",
            fontWeight: 600,
            bgcolor: isDark ? "primary.dark" : "#EEF5FF",
            color: "primary.main",
            border: "1px solid",
            borderColor: isDark ? "primary.main" : "#C3D9FE",
            "& .MuiChip-deleteIcon": {
              color: "primary.main",
              "&:hover": { color: "error.main" },
            },
          }}
        />
      ))}

      <Box
        id={inputId}
        component="input"
        value={inputValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onInputChange(e.target.value)
        }
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) commitInput(inputValue);
        }}
        placeholder={
          searchTerms.length === 0 ? "Search employee…" : "Add more…"
        }
        sx={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: "0.75rem",
          color: "text.primary",
          flex: 1,
          minWidth: 90,
          fontFamily: "inherit",
        }}
      />

      {hasSearch && (
        <Box
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onTermsChange([]);
            onInputChange("");
          }}
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "text.disabled",
            flexShrink: 0,
            "&:hover": { color: "error.main" },
            transition: "color .15s",
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </Box>
      )}
    </Box>
  );
};
