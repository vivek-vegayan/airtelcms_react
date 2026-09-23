import {
  Box,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import HighlightIcon from "@mui/icons-material/Highlight";
import { SHIFT_COLOR_MAP } from "../../constant/shiftPalette";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Shift highlight picker shared by the Weekly and Monthly toolbars. */
export const HighlightShiftSelect = ({ value, onChange }: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <HighlightIcon sx={{ fontSize: 14, color: "text.secondary" }} />
      <Select
        size="small"
        displayEmpty
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          fontSize: 11,
          borderRadius: "8px",
          height: 30,
          minWidth: 130,
          bgcolor: isDark ? "background.default" : "#fff",
        }}
      >
        <MenuItem value="">
          <em>No highlight</em>
        </MenuItem>
        {Object.entries(SHIFT_COLOR_MAP)

          .map(([k, p]) => (
            <MenuItem key={k} value={k}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "2px",
                    bgcolor: p.badgeBg,
                  }}
                />
                <Typography fontSize={11}>{p.label}</Typography>
              </Stack>
            </MenuItem>
          ))}
      </Select>
    </Stack>
  );
};
