import type { StageRunState, WorkflowStageId } from "../../../constants/workflowStages";

/** Field input types used across Remedy / CAB / Planning Tool attribute schemas. */
export type AttributeFieldType =
  | "Text"
  | "Numbers"
  | "Date Time"
  | "Dropdown"
  | "Multi Select Dropdown"
  /** Same multi-value semantics as "Multi Select Dropdown" (string[] in the
   * form, CSV on the wire) but rendered as an always-visible checkbox group
   * rather than a collapsed select. */
  | "Multi Select Checkbox"
  | "Radio Button";

/** Normalized mandatory-ness bucket derived from the raw mandatory label. */
export type MandatoryLevel = "mandatory" | "optional" | "conditional";

/** Downstream system a group of attributes is written to on save. */
export type TargetSystem = "remedy" | "cab" | "planningTool";

/**
 * Visibility scope of a Planning Tool attribute:
 * - "always"    – shown at every stage
 * - "backend"   – set by the backend, never shown as an editable field
 * - other       – only shown when the stage declares that scope
 */
export type PlanningToolScope =
  | "always"
  | "backend"
  | "scheduling"
  | "execution"
  | "closure";

/** Which runtime value an auto-set (read-only) attribute mirrors. */
export type AutoSetSource =
  | "cmsStage"
  | "remedyStatus"
  | "crqNo"
  | "currentUserOlmId"
  /** Wall-clock time at which the stage card was opened. */
  | "currentDateTime";

/**
 * Live lookup backing a dropdown's options, instead of a hardcoded `values`
 * list. The three levels form a cascade: an organization is only valid within
 * a company, a group only within a company + organization, so each level is
 * fetched with the levels above it as parameters (see useAttributeOptions).
 *
 * Named after the GET_IMPL_*_DROPDOWN procedures behind them. Both the Change
 * Coordinator and the Change Implementer trio read these same lists - they are
 * one pool of support companies/organizations/groups, not two.
 */
export type AttributeOptionSource =
  | "implCompany"
  | "implOrganization"
  | "implGroup";

/** A sibling field whose current value parameterizes an attribute's lookup. */
export interface AttributeDependency {
  /** The sibling's `field` (same target system as the dependent attribute). */
  field: string;
  /** The sibling's display name, for the "Select X first." hint. */
  label: string;
}

export interface StageAttribute {
  name: string;
  /**
   * The join key into the live API values - Remedy/CAB use their camelCase DTO
   * property name, Planning Tool (Cygnet) uses the CYGNET_UPDATE_ATTR_TBL
   * column name verbatim, spaces and all (see PLANNING_TOOL_ATTRIBUTES).
   */
  field: string;
  type: AttributeFieldType;
  /** Raw mandatory label from the source system, e.g. "Mandatory - if cancellation". */
  mandatory: string;
  values?: string[];
  /**
   * Fetches this dropdown's options from the backend rather than using
   * `values`. `values` is still allowed alongside it and acts as the fallback
   * list when the lookup fails.
   */
  optionSource?: AttributeOptionSource;
  /**
   * The levels above this one in a cascade, outermost first - their live values
   * are what the lookup is parameterized by, and until they are all filled the
   * lookup cannot run at all.
   */
  dependsOn?: AttributeDependency[];
  /**
   * Fields (same system, by `field`) cleared whenever this one changes - the
   * downstream levels of a cascade, whose current selection stops being valid
   * the moment their parent moves.
   */
  resets?: string[];
  readOnly?: boolean;
  autoSetFrom?: AutoSetSource;
  /**
   * Seeds an EMPTY field from the same sources as `autoSetFrom`, then gets out
   * of the way - unlike `autoSetFrom` the field stays editable, and a value
   * already saved for the CRQ always wins over the seed.
   *
   * Used by the "...Done By" fields: they default to whoever is signed in,
   * because that is normally who did the step, but can be corrected when it
   * was somebody else.
   */
  prefillFrom?: AutoSetSource;
}

export interface PlanningToolAttribute extends StageAttribute {
  scope: PlanningToolScope;
}

/** Attribute schema of one CMS stage, keyed by the app-wide workflow stage id. */
export interface AttributeStageSchema {
  id: WorkflowStageId;
  /** Full CMS stage label, e.g. "Plan & Inventory Validation". */
  label: string;
  /** Short label rendered in the stage stepper. */
  shortLabel: string;
  /** Planning Tool phase name shown in the header badge. */
  planningToolPhase: string;
  /** Remedy statuses the CRQ can be in at this stage (>1 renders the sub-status bar). */
  remedyStatuses: string[];
  /**
   * Subset of `remedyStatuses` at which this stage actually collects its
   * attribute fields. Every *other* status is a status-only transition: the
   * card renders no fields and Save posts just the auto-set Status, so a
   * "Scheduled" -> "Scheduled For Approval" hop doesn't demand execution data
   * the activity hasn't produced yet (Network Execution collects only at
   * "Implementation In Progress").
   *
   * Omit to keep the default - every status collects the full field set.
   */
  attributeStatuses?: string[];
  /** Extra Planning Tool scopes unlocked at this stage (besides "always"). */
  planningToolScopes: PlanningToolScope[];
  remedy: StageAttribute[];
  cab: StageAttribute[];
}

/**
 * Raw system row as returned by GET /attributeupdate/details, keyed by
 * StageAttribute["field"] - the camelCase DTO property for Remedy/CAB, the DB
 * column name for Cygnet. Values are plain strings ("yyyy-MM-dd HH:mm:ss" or
 * ISO for Date Time fields), or null.
 */
export type AttributeValueRow = Record<string, string | null>;

/** Live per-CRQ, per-stage snapshot - the actual shape GET /attributeupdate/details returns. */
export interface AttributeUpdateDetailsResponse {
  /** Latest saved Remedy row for this CRQ + stage, or null if never saved. */
  remedy: AttributeValueRow | null;
  /** Latest saved CAB row for this CRQ + stage, or null if never saved. */
  cab: AttributeValueRow | null;
  /** Latest saved Cygnet row for this CRQ, or null if never saved. */
  cygnet: AttributeValueRow | null;
  /**
   * The CRQ's live Remedy status (GET_CHANGE_REQUEST_STATUS), e.g.
   * "Scheduled For Review" - null when the procedure returned no row.
   *
   * Where the CRQ actually stands, which is what the sub-status bar opens on
   * and will not step back before. Distinct from the status the last save
   * wrote, and from `StageAttributeView.activeRemedyStatus`, which is the one
   * the user currently has selected.
   */
  remedyStatus: string | null;
}

/** Lightweight CRQ header context captured from the selected CRQ row. */
export interface AttributeUpdateCrqContext {
  crqNo: string;
  crqId: number | null;
  requester: string;
  circle: string;
  vendor: string;
  domain: string;
}

/** Per-card dialog mode, resolved from the stage's run state + the CRQ's current stage. */
export type StageDialogMode = "edit" | "view" | "pending";

/**
 * Snapshot captured once at dialog-open time for one workflow stage: its run
 * state (history/current/future classification input) plus the audit fields
 * (status/performedBy/completedAt) sourced from crq.history[], the same data
 * StageHistoryPanel renders elsewhere.
 */
export interface StageMeta {
  runState: StageRunState;
  status: string | null;
  performedBy: string | null;
  completedAt: string | null;
}

export interface AttributeUpdateState {
  dialogOpen: boolean;
  crq: AttributeUpdateCrqContext | null;
  /** The CRQ's live workflow stage - the only stage ever editable. */
  currentStageId: WorkflowStageId | null;
  /** Normalized overall CRQ status (e.g. "Done") - forces every stage to view mode when Done. */
  crqStatus: string;
  /** Per-stage run state + audit meta, captured once at open time. */
  stageMeta: Partial<Record<WorkflowStageId, StageMeta>>;
}

/** A stage attribute enriched with everything the row component needs to render. */
export interface ResolvedAttribute extends StageAttribute {
  mandatoryLevel: MandatoryLevel;
  /** Resolved value for auto-set fields (current CMS stage / Remedy status / CRQ no). */
  autoSetValue?: string;
  /** True for backend-set Planning Tool fields (rendered dimmed with a flag). */
  isBackend: boolean;
  /** Which downstream system this attribute belongs to - the save-payload section key. */
  system: TargetSystem;
  /** Current live value loaded from the API (string, joined-CSV for multi-select, or null if unsaved). */
  value: string | null;
}

/** Fully resolved view-model for the currently selected stage. */
export interface StageAttributeView {
  stage: AttributeStageSchema;
  stageIndex: number;
  activeRemedyStatus: string;
  /**
   * False when `activeRemedyStatus` is one of the stage's status-only
   * sub-statuses (see AttributeStageSchema.attributeStatuses). The attribute
   * arrays below are then stripped to their auto-set entries, so the card has
   * nothing to render and Save carries only the Status.
   */
  collectsAttributes: boolean;
  remedyAttributes: ResolvedAttribute[];
  cabAttributes: ResolvedAttribute[];
  planningToolVisible: ResolvedAttribute[];
  planningToolBackend: ResolvedAttribute[];
  totalPlanningToolCount: number;
}
