import type { WorkflowStageId } from "../../../constants/workflowStages";
import type { MandatoryLevel, TargetSystem } from "../types/attributeUpdate.types";

/**
 * CMS stage display order for the Attribute Update dialog (matches the CMS
 * 7-stage reference flow: Scheduling & Approvals sits before MOP Creation).
 * Ids are the app-wide WorkflowStageId so real API data maps 1:1.
 */
export const CMS_STAGE_ORDER: WorkflowStageId[] = [
  "review",
  "impactanalysis",
  "scheduling",
  "mopcreate",
  "mopvalidate",
  "activityimplement",
  "closer",
];

/** Value lists with more than this many entries collapse behind "Show N values". */
export const ATTRIBUTE_INLINE_VALUES_LIMIT = 4;

interface SystemSectionMeta {
  /** Section card title. */
  title: string;
  /** Chip label in the "APIs on save" row. */
  apiChipLabel: string;
  /** Section header + API chip pastel palette (from the CMS reference design). */
  headerBg: string;
  headerFg: string;
  chipBg: string;
  chipFg: string;
}

export const SYSTEM_SECTIONS: Record<TargetSystem, SystemSectionMeta> = {
  remedy: {
    title: "Remedy Console — attributes to update",
    apiChipLabel: "Remedy · Update_Change",
    headerBg: "#E6F1FB",
    headerFg: "#042C53",
    chipBg: "#B5D4F4",
    chipFg: "#042C53",
  },
  cab: {
    title: "CAB Form — attributes to update",
    apiChipLabel: "CAB · Update_CAB",
    headerBg: "#E1F5EE",
    headerFg: "#04342C",
    chipBg: "#9FE1CB",
    chipFg: "#04342C",
  },
  planningTool: {
    title: "Planning Tool — attributes to update at this stage",
    apiChipLabel: "Planning Tool · UPDATE",
    headerBg: "#EEEDFE",
    headerFg: "#26215C",
    chipBg: "#CECBF6",
    chipFg: "#26215C",
  },
};

/** Render order of the three attribute sections inside the dialog body. */
export const SYSTEM_SECTION_ORDER: TargetSystem[] = [
  "remedy",
  "cab",
  "planningTool",
];

export const MANDATORY_BADGE: Record<
  MandatoryLevel,
  { label: string; bg: string; fg: string; dot: string }
> = {
  mandatory: { label: "Mandatory", bg: "#FCEBEB", fg: "#791F1F", dot: "#E5484D" },
  optional: { label: "Optional", bg: "#F1EFE8", fg: "#444441", dot: "#9B9B93" },
  conditional: { label: "Conditional", bg: "#FAEEDA", fg: "#633806", dot: "#E8A23D" },
};

/** Section accent used for the compact icon avatar + accordion accent bar. */
export const SYSTEM_ACCENT: Record<TargetSystem, string> = {
  remedy: "#1E7FD1",
  cab: "#1B9C77",
  planningTool: "#6E5CD6",
};

/** READ-ONLY / BACKEND attribute flag palettes (from the CMS reference design). */
export const ATTRIBUTE_FLAGS = {
  readOnly: { label: "READ-ONLY", bg: "#F1EFE8", fg: "#444441" },
  backend: { label: "BACKEND", bg: "#FBEAF0", fg: "#72243E" },
};

/** Header badge palettes: current CMS stage / Remedy status / Planning Tool phase. */
export const STAGE_BADGES = {
  cms: { bg: "#CECBF6", fg: "#26215C" },
  remedy: { bg: "#B5D4F4", fg: "#042C53" },
  planningTool: { bg: "#E5DCF3", fg: "#3C3489" },
};

/** Auto-set banner palettes (cms_status / remedy_status / change_id mirrors). */
export const AUTO_SET_BANNER = {
  cmsStage: { bg: "#EEEDFE", border: "#CECBF6", fg: "#26215C" },
  remedyStatus: { bg: "#E6F1FB", border: "#B5D4F4", fg: "#042C53" },
  crqNo: { bg: "#E1F5EE", border: "#9FE1CB", fg: "#04342C" },
};

/** Completed-step palette of the stage stepper (from the CMS reference design). */
export const STEPPER_DONE = { bg: "#97C459", border: "#639922", fg: "#173404" };

/** Remedy sub-status bar palette. */
export const SUB_STATUS_BAR = { bg: "#E6F1FB", border: "#B5D4F4", fg: "#042C53" };
