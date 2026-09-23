import { useMemo } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
  useTheme,
} from "@mui/material";
import { DOW_LONG, MONO, SHIFT_CODES, TOTAL_COLS } from "./goldenGrid.constants";
import type { GoldenSetEmployee } from "./goldenGrid.types";
import {
  colTotals,
  getShiftColor,
  spanTotals,
  summarise,
  workingCount,
} from "./goldenGrid.utils";
import { useGoldenGridTokens } from "./useGoldenGridTokens";
import ShiftPill from "./ShiftPill";

export default function AnalyticsModal({
  open,
  emps,
  onClose,
}: {
  open: boolean;
  emps: GoldenSetEmployee[];
  onClose: () => void;
}) {
  const theme = useTheme();
  const tk = useGoldenGridTokens(theme);

  const totals = useMemo(() => spanTotals(emps, 0, TOTAL_COLS), [emps]);
  const totalShifts = Object.values(totals).reduce((a, b) => a + b, 0);
  const busiestDay = useMemo(
    () =>
      Array.from({ length: TOTAL_COLS }, (_, i) => ({
        label: `W${Math.floor(i / 7) + 1} ${DOW_LONG[i % 7]}`,
        count: workingCount(colTotals(emps, i)),
      })).sort((a, b) => b.count - a.count)[0],
    [emps],
  );

  const nightHeavy = emps.filter((e) => summarise(e.shifts).night > 8).length;
  const lowRest = emps.filter((e) => summarise(e.shifts).off < 6).length;
  const balanced = Math.max(emps.length - nightHeavy - lowRest, 0);

  const kpis = [
    { label: "Total Shifts", value: totalShifts, color: tk.accent },
    { label: "Balanced", value: balanced, color: theme.palette.success.main },
    {
      label: "High Night Load",
      value: nightHeavy,
      color: theme.palette.warning.main,
    },
    { label: "Low Rest", value: lowRest, color: theme.palette.error.main },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: tk.radiusXL,
          bgcolor: tk.surface,
          border: `1px solid ${tk.border}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 750,
          fontSize: 17,
          pb: 0.5,
          letterSpacing: "-0.02em",
          color: tk.textPrimary,
          borderBottom: `1px solid ${tk.border}`,
          background: tk.isDark
            ? "linear-gradient(135deg,rgba(24,95,165,0.07),rgba(15,110,86,0.04))"
            : "linear-gradient(135deg,rgba(24,95,165,0.04),rgba(15,110,86,0.02))",
        }}
      >
        Shift Distribution Analytics
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="body2" sx={{ color: tk.textSecondary, mb: 2.5 }}>
          Full 42-day cycle · {emps.length} employees
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" },
            gap: 1.25,
            mb: 3,
          }}
        >
          {kpis.map((k) => (
            <Card
              key={k.label}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: tk.radiusL,
                borderColor: alpha(k.color, 0.2),
                bgcolor: alpha(k.color, 0.04),
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: k.color,
                  fontFamily: MONO,
                  lineHeight: 1,
                }}
              >
                {k.value}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: tk.textSecondary,
                  fontWeight: 600,
                  mt: 0.5,
                  lineHeight: 1.3,
                }}
              >
                {k.label}
              </Typography>
            </Card>
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)" },
            gap: 1.25,
            mb: 2.5,
          }}
        >
          {SHIFT_CODES.map((code) => {
            const sc = getShiftColor(code);
            const pct = totalShifts
              ? Math.round(((totals[code] ?? 0) / totalShifts) * 100)
              : 0;
            return (
              <Card
                key={code}
                variant="outlined"
                sx={{
                  p: 1.75,
                  borderRadius: tk.radiusL,
                  borderColor: alpha(sc.border, 0.35),
                  bgcolor: alpha(sc.background, tk.isDark ? 0.15 : 1),
                  transition: "transform 0.18s,box-shadow 0.18s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${alpha(sc.border, 0.25)}`,
                  },
                }}
              >
                <ShiftPill code={code} />
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: 26,
                    fontWeight: 700,
                    mt: 1,
                    lineHeight: 1,
                    color: sc.color,
                  }}
                >
                  {totals[code] ?? 0}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    mt: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(sc.border, 0.15),
                    "& .MuiLinearProgress-bar": {
                      bgcolor: sc.border,
                      borderRadius: 2,
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: tk.textSecondary,
                    fontWeight: 600,
                    mt: 0.5,
                    display: "block",
                    fontFamily: MONO,
                  }}
                >
                  {pct}%
                </Typography>
              </Card>
            );
          })}
        </Box>
        <Alert severity="info" sx={{ borderRadius: tk.radiusL }}>
          <strong>Busiest day:</strong> {busiestDay?.label ?? "N/A"} —{" "}
          {busiestDay?.count ?? 0} active personnel
        </Alert>
      </DialogContent>
      <DialogActions
        sx={{ px: 3, pb: 2.5, borderTop: `1px solid ${tk.border}` }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          disableElevation
          sx={{
            textTransform: "none",
            px: 3,
            borderRadius: tk.radius,
            fontWeight: 650,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
