import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import type { StageFieldConfig, StageStatusOption } from "../types/stageWorkflow.types";

/** Default Pass / Failed / Cancelled outcome set - reused by every stage
 * unless a stage explicitly needs a different set (pass an override to
 * buildStageConfig). */
export const DEFAULT_STATUS_OPTIONS: StageStatusOption[] = [
  {
    value: "Done",
    label: "Pass",
    description: "Stage completed successfully",
    icon: ThumbUpOutlinedIcon,
    palette: "success",
  },
  {
    value: "Failed",
    label: "Failed",
    description: "Stage did not meet requirements",
    icon: ThumbDownOutlinedIcon,
    palette: "error",
  },
  {
    value: "canceled",
    label: "Cancelled",
    description: "Stage was cancelled before completion",
    icon: CancelOutlinedIcon,
    palette: "warning",
  },
];

/**
 * Reusable "cancellation block" fields - identical across all stages today
 * (send-back team, remedy status, reason, derived rollback owner, remedy
 * remark). Spread this into any stage's `fields` array.
 */
export const CANCELLATION_FIELDS: StageFieldConfig[] = [
  {
    name: "cygnetStatus",
    label: "Send activity back to",
    type: "select",
    options: [
      { label: "Planning Team", value: "REJECT_TO_PLANNING" },
      { label: "Operations Team", value: "REJECT_TO_OPERATIONS" },
    ],
    visibleWhen: (v) => v.status === "canceled",
    requiredWhen: (v) => v.status === "canceled",
  },
  {
    name: "field1",
    label: "Remedy Status",
    type: "select",
    options: [{ label: "Cancelled", value: "Cancelled" }],
    visibleWhen: (v) => v.status === "canceled",
    requiredWhen: (v) => v.status === "canceled",
  },
  {
    name: "cancellationReason",
    label: "Cancellation Reason",
    // Loaded from sp_Get_Distinct_Cancellation_Reasons, so a reason added in
    // the database shows up here without a frontend change.
    type: "select",
    optionsSource: "cancellationReasons",
    visibleWhen: (v) => v.status === "canceled",
    requiredWhen: (v) => v.status === "canceled",
  },
  {
    name: "field4",
    label: "Cancellation Rejection Owner",
    type: "readonly",
    visibleWhen: (v) => v.status === "canceled",
    // The owner is fixed by the reason - same row of the procedure's result.
    deriveValueWith: (v, ctx) => ctx.ownerForCancellationReason(v.cancellationReason),
  },
  {
    name: "field5",
    label: "Remedy Remark",
    type: "textarea",
    placeholder: "Enter cancellation remark…",
    visibleWhen: (v) => v.status === "canceled",
    requiredWhen: (v) => v.status === "canceled",
  },
];
