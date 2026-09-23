import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import type {
  RosterAccent,
  RosterTabConfig,
  TabColorTokens,
} from "../../types/rosterGenerationMain.types";

export const ROSTER_TABS: RosterTabConfig[] = [
  {
    id: "golden",
    label: "Golden set roster",
    metaLabel: "Roster cycle view",
    icon: <LayersOutlinedIcon sx={{ fontSize: 15 }} />,
    accent: "accent",
  },
  {
    id: "week7",
    label: "Week 7 preview",
    metaLabel: "7-day schedule preview",
    icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 15 }} />,
    accent: "success",
  },
];

export function resolveAccent(tk: TabColorTokens, accent: RosterAccent) {
  return accent === "success"
    ? { main: tk.success, dim: tk.successDim }
    : { main: tk.accent, dim: tk.accentDim };
}
