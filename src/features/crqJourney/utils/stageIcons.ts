import type { ElementType } from "react";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import InsightsIcon from "@mui/icons-material/Insights";
import DescriptionIcon from "@mui/icons-material/Description";
import VerifiedIcon from "@mui/icons-material/Verified";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import FlagIcon from "@mui/icons-material/Flag";

/** get_crq_details stage codes → representative icon. Shared by the list and visual-flow views. */
export const STAGE_ICONS: Record<string, ElementType> = {
  VALIDATE: FactCheckIcon,
  IMPACT_ANALYSIS: InsightsIcon,
  MOP_CREATION: DescriptionIcon,
  MOP_VALIDATION: VerifiedIcon,
  SCHEDULING_APPROVAL: EventAvailableIcon,
  EXECUTION: RocketLaunchIcon,
  CLOSURE: FlagIcon,
};

export const getStageIcon = (code: string): ElementType => STAGE_ICONS[code.trim().toUpperCase()] ?? FactCheckIcon;
