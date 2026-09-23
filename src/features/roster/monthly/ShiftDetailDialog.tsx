import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";
import {
  getShiftStyle,
  resolveShiftKeyFromDisplay,
} from "../constant/shiftPalette";
import type { ShiftInfo, UserRoster } from "../types/monthlyRoster.type";

export interface ShiftDetailData {
  user: UserRoster;
  date: string;
  shift: ShiftInfo | undefined;
}

interface Props {
  data: ShiftDetailData | null;
  onClose: () => void;
}

/** Employee + shift details dialog opened from a Monthly grid cell. */
export const ShiftDetailDialog = ({ data, onClose }: Props) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const CELL_BORDER = isDark ? "rgba(255,255,255,.06)" : "#F0F0F2";

  const p = getShiftStyle(resolveShiftKeyFromDisplay(data?.shift?.shiftDisplay));
  const k = resolveShiftKeyFromDisplay(data?.shift?.shiftDisplay);

  return (
    <Dialog
      open={Boolean(data)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          bgcolor: isDark ? alpha(p.badgeBg, 0.1) : p.cardBg,
          borderBottom: `1px solid ${isDark ? alpha(p.badgeBg, 0.2) : p.cardBorder}`,
          py: "12px",
          px: "16px",
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "9px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: p.badgeBg,
            color: "#fff",
            fontWeight: 800,
            fontSize: k.length > 1 ? 11 : 17,
            letterSpacing: "-.4px",
          }}
        >
          {k}
        </Box>
        <Box>
          <Typography fontSize={15} fontWeight={700}>
            {p.label}
          </Typography>
          <Typography fontSize={11} color="text.secondary">
            {data?.user.olmid} · {dayjs(data?.date).format("DD MMM YYYY")}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: "18px !important", px: "20px" }}>
        {data && (
          <Stack gap={2}>
            <Box>
              <Typography
                fontSize={10}
                fontWeight={600}
                color="text.disabled"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: ".07em",
                  mb: "8px",
                }}
              >
                Employee
              </Typography>
              {[
                ["OLMID", data.user.olmid],
                ["Level", data.user.jobLevel],
                ["Location", data.user.officeLocation || "N/A"],
                ["Mobile", data.user.mobileNo || "N/A"],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  display="flex"
                  justifyContent="space-between"
                  py="4px"
                  sx={{ borderBottom: `1px solid ${CELL_BORDER}` }}
                >
                  <Typography fontSize={12} color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontSize={12} fontWeight={600}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ borderColor: CELL_BORDER }} />

            <Box>
              <Typography
                fontSize={10}
                fontWeight={600}
                color="text.disabled"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: ".07em",
                  mb: "8px",
                }}
              >
                Shift details
              </Typography>
              {[
                ["Date", dayjs(data.date).format("DD MMM YYYY (dddd)")],
                ["Shift", data.shift?.shiftDisplay ?? "Week Off"],
                ["Time", p.time !== "—" ? p.time : "—"],
                ["Work Mode", data.shift?.workMode ?? "—"],
                [
                  "Available",
                  data.shift?.availableMins !== undefined
                    ? `${Math.round(data.shift.availableMins / 60)} hrs`
                    : "—",
                ],
                ["Assignments", String(data.shift?.assignActCount ?? "—")],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  display="flex"
                  justifyContent="space-between"
                  py="4px"
                  sx={{ borderBottom: `1px solid ${CELL_BORDER}` }}
                >
                  <Typography fontSize={12} color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontSize={12} fontWeight={600}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: "16px", py: "12px" }}>
        <Button
          onClick={onClose}
          variant="contained"
          disableElevation
          size="small"
          sx={{
            bgcolor: p.badgeBg,
            borderRadius: "8px",
            "&:hover": { bgcolor: alpha(p.badgeBg, 0.85) },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
