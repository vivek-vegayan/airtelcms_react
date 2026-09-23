import type { ElementType } from "react";
import { Box, Card, Skeleton, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WifiIcon from "@mui/icons-material/Wifi";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import { format, parseISO } from "date-fns";
import type { Colors } from "../types/colorTypes";
import type { EmpWorkLocationRow } from "../types/dashboard.types";
import type { DashboardWorkLocationStatus } from "../hooks/useDashboardWorkLocation";
import { fadeIn, getCardSx } from "../constants/dashboard.styles";
import { SectionHeader } from "./SectionHeader";

interface WorkLocationCardProps {
  location?: EmpWorkLocationRow;
  status: DashboardWorkLocationStatus;
  errorMessage?: string;
  colors: Colors;
  mounted: boolean;
  delay: number;
}

function resolveLocationDisplay(code: string): { label: string; Icon: ElementType } {
  const c = code.trim().toUpperCase();
  if (c.includes("HOME") || c === "WFH") return { label: "Work From Home", Icon: HomeIcon };
  if (c.includes("OFFICE") || c === "WFO") return { label: "Office", Icon: BusinessIcon };
  if (c.includes("SITE")) return { label: "Site", Icon: LocationOnIcon };
  if (c.includes("REMOTE")) return { label: "Remote", Icon: WifiIcon };
  if (c.includes("HYBRID")) return { label: "Hybrid", Icon: CompareArrowsIcon };
  return { label: code, Icon: BusinessIcon };
}

export function WorkLocationCard({ location, status, errorMessage, colors, mounted, delay }: WorkLocationCardProps) {
  return (
    <Card sx={{ ...getCardSx(colors), p: "16px", ...fadeIn(mounted, delay) }}>
      <SectionHeader title="Work location" colors={colors} />

      {status === "loading" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", py: "10px" }}>
          <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: "12px" }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={14} />
          </Box>
        </Box>
      )}

      {status === "error" && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", py: "22px" }}>
          <ErrorOutlineIcon sx={{ fontSize: 24, color: colors.danger }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.danger, textAlign: "center" }}>
            {errorMessage}
          </Typography>
        </Box>
      )}

      {status === "empty" && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", py: "22px" }}>
          <LocationOffIcon sx={{ fontSize: 24, color: colors.textDim }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.textDim, textAlign: "center" }}>
            No work location recorded for today
          </Typography>
        </Box>
      )}

      {status === "ready" && location && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", py: "4px" }}>
          {(() => {
            const { label, Icon } = resolveLocationDisplay(location.workfromLocation);
            return (
              <>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    flexShrink: 0,
                    background: colors.accentDim,
                    border: `1.5px solid ${colors.accentBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon sx={{ fontSize: 22, color: colors.accent }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: colors.textPrimary }}>{label}</Typography>
                  <Typography sx={{ fontSize: 11, color: colors.textSecondary, mt: "2px" }} noWrap>
                    {location.shiftName} · {format(parseISO(location.workDate), "EEE, MMM d")}
                  </Typography>
                </Box>
              </>
            );
          })()}
        </Box>
      )}
    </Card>
  );
}
