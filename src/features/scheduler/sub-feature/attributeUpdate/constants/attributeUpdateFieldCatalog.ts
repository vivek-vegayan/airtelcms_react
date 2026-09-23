import type {
  AttributeStageSchema,
  PlanningToolAttribute,
  StageAttribute,
} from "../types/attributeUpdate.types";

/**
 * Field catalog for the CMS 7-stage change flow: which Remedy / CAB / Cygnet
 * ("Planning Tool") attributes exist per stage, their input type, mandatory
 * level and (for dropdown/radio fields) allowed values.
 *
 * This is deliberately still frontend config, not fetched from the DB: the
 * backing tables (REMEDY_UPDATE_ATTR_TBL / CAB_UPDATE_ATTR_TBL /
 * CYGNET_UPDATE_ATTR_TBL) are plain flat tables with no type/label/mandatory
 * metadata columns, so there is nothing for a stored procedure to return
 * that would let the UI generate this catalog itself. Every entry's `field`
 * is the join key into the live attribute values returned by
 * GET /attributeupdate/details (and sent back on save) - that live data,
 * not this catalog, is what used to be hardcoded/mocked.
 */

// ─── Shared value lists ───────────────────────────────────────────────────────

const COMPANY_VALUES = ["Bharti Airtel Ltd-ANG", "Bharti Airtel Ltd-TNG"];

const ORGANIZATION_VALUES = [
  "Bharti Security",
  "CCB",
  "CCB_VALIDATOR",
  "DCO",
  "Data",
  "External Organisation",
  "Field Operations",
  "Front Office",
  "ILD-CLS",
  "MSC Operations Team",
  "Managed NOC",
  "Management",
  "N/W Implementation",
  "NOC",
  "NSG-Deployment",
  "NSG-ITMC",
  "OSS",
  "Operation Support",
  "Operations Team",
  "Operations_ANG",
  "TNG-Change Approvers",
  "TX",
  "Technology Solution",
  "Voice",
];

const GROUP_VALUES = ["Dependant on Support Organization"];

const MOP_METHOD_VALUES = [
  "ACE",
  "AIM + CLI",
  "AIM + GUI",
  "AIM + NIME",
  "AIM + OEM",
  "Auto - AIM",
  "Auto - INFRASOL",
  "Auto - RPA",
  "Auto - Script",
  "Auto - OEM Tools",
  "GRASP",
  "Infrasol + CLI",
  "Infrasol + GUI",
  "Infrasol + NIME",
  "Infrasol + OEM",
  "Manual - CLI",
  "Manual - GUI",
  "Manual - NIME",
  "Manual - OEM",
  "Manual - CLI/GUI",
  "OEM Tools + CLI",
  "OEM Tools + GUI",
  "OEM Tools + NIME",
  "OEM Tools + OEM",
  "RPA + CLI",
  "RPA + GUI",
  "RPA + NIME",
  "RPA + OEM",
  "Script + CLI",
  "Script + GUI",
  "Script + NIME",
  "Script + OEM",
];

const YES_NO_VALUES = ["Yes", "No"];

/** Who carried out the activity - an organization, not a person, which is why
 * "Activity Executed By*" stays a dropdown while the "...Done By" fields around
 * it default to the signed-in user's OLM ID. */
const EXECUTED_BY_VALUES = ["OEM", "Bharti", "Bharti + OEM"];

/** Circle codes offered by the numbered CAB circle slots (circle1..circle19).
 * Deliberately separate from the "Impacted Circle(s)**" list below, which also
 * carries an "All" entry and spells one circle "GI" - that field's options are
 * left exactly as they were. */
const CIRCLE_VALUES = [
  "AP",
  "BH&J",
  "GJ",
  "HPHP",
  "ITMC",
  "J&K",
  "KK",
  "KL",
  "ROMH",
  "MPCG",
  "MUM",
  "NCR",
  "NESA",
  "OR",
  "RJ",
  "TN",
  "UPE",
  "UPW",
  "WB",
];

/** Options for the 19 numbered per-circle impactedPartiesCab* fields. Same list
 * the existing "Impacted Parties*" multi-select uses, kept as its own const so
 * that field's inline options stay exactly as they were. */
const IMPACTED_PARTIES_VALUES = [
  "Core/MPBN",
  "TWAMP-Accedian",
  "B2B",
  "NOC_DCN_&_Tool",
  "Telemedia",
  "Switch",
  "NOC_IM",
  "NOC_NS",
  "TWAMP-Exfo",
  "Mobility-RAN",
  "DC",
  "NA",
  "IWAN",
];

// ─── Shared attribute blocks ─────────────────────────────────────────────────

/**
 * A "who did this step" field - CRQ Validated By, MOP Created By and friends.
 *
 * Defaults to the signed-in user's OLM ID, since that is normally who performed
 * the step, but stays editable so it can be corrected when somebody else did it
 * or when one person records another's work.
 *
 * `prefillFrom` and not `autoSetFrom`: auto-set would render the row as a
 * greyed-out display and ignore anything typed. The prefill only fills a field
 * that is still empty - a value already saved for this CRQ always wins, so
 * reopening a completed stage shows who actually did it, not who is looking.
 */
const OLM_PREFILL_ATTRIBUTE = (name: string, field: string): StageAttribute => ({
  name,
  field,
  type: "Text",
  mandatory: "Mandatory",
  prefillFrom: "currentUserOlmId",
});

/**
 * The "...Time" partner of an OLM_PREFILL_ATTRIBUTE - CRQ Validated Time,
 * MOP Created By Time and so on.
 *
 * Defaults to the moment the stage card was opened, which is normally when the
 * step was done, and stays editable for the cases where it wasn't. Like the OLM
 * prefill, a time already saved for this CRQ wins over the seed, so reopening a
 * completed stage never rewrites its timestamp to "now".
 */
const NOW_PREFILL_ATTRIBUTE = (name: string, field: string): StageAttribute => ({
  name,
  field,
  type: "Date Time",
  mandatory: "Mandatory",
  prefillFrom: "currentDateTime",
});

/** How many numbered circle slots the CAB form stores (circle1..circle19 and
 * their matching impactedPartiesCab1..impactedPartiesCab19). Derived from
 * CIRCLE_VALUES, since each slot is now pinned to one entry of that list by
 * position - adding a circle there adds its slot here automatically, and the
 * two can never fall out of step. */
const CAB_CIRCLE_SLOT_COUNT = CIRCLE_VALUES.length;

/**
 * The CAB form's 19 numbered circle / impacted-parties pairs, as flat fields.
 *
 * Each slot is fixed to one circle by position - circle1 is always AP, circle2
 * always BH&J, through circle19 = WB - so a slot's dropdown offers only its own
 * circle. The real input is the Impacted Parties half of the pair: which parties
 * are hit in that circle.
 *
 * The circle half stays a Dropdown rather than becoming a read-only label
 * because buildAttributeSaveSections skips read-only attributes entirely, which
 * would drop circle1..19 from the payload - and INSERT_CAB_UPDATE_ATTR writes
 * the CAB row whole, so anything not sent comes back null.
 */
const CAB_CIRCLE_SLOT_ATTRIBUTES: StageAttribute[] = Array.from(
  { length: CAB_CIRCLE_SLOT_COUNT },
  (_, i) => i + 1,
).flatMap((slot) => [
  {
    name: `Circle ${slot}`,
    field: `circle${slot}`,
    type: "Dropdown" as const,
    mandatory: "Optional",
    // Only this slot's own circle - see the block comment above.
    values: [CIRCLE_VALUES[slot - 1]],
  },
  {
    name: `Impacted Parties ${slot}`,
    field: `impactedPartiesCab${slot}`,
    type: "Dropdown" as const,
    mandatory: "Optional",
    values: IMPACTED_PARTIES_VALUES,
  },
]);

/**
 * One "Support Company → Support Organization → Support Group Name+" cascade.
 *
 * The Change Coordinator and Change Implementer trios are the same three-level
 * lookup over the same lists - GET_IMPL_COMPANY_DROPDOWN /
 * GET_IMPL_ORG_DROPDOWN / GET_IMPL_GROUP_DROPDOWN, fronted by
 * /attributeupdate/dropdown/impl-*, which narrow organizations by company and
 * groups by company + organization. They differ only in field names, labels and
 * mandatory-ness, so both are built from this one definition rather than
 * duplicated.
 *
 * `values` stays behind as the offline fallback if a lookup fails; `dependsOn`
 * tells useAttributeOptions which sibling fields parameterize the lookup, and
 * `resets` clears the levels below whenever a level changes.
 */
const buildSupportCascade = (
  /** Display names, company → organization → group. */
  [companyName, organizationName, groupName]: [string, string, string],
  /** DTO field names, in the same order. */
  [companyField, organizationField, groupField]: [string, string, string],
  mandatory: string,
): StageAttribute[] => {
  const company = { field: companyField, label: companyName };
  const organization = { field: organizationField, label: organizationName };

  return [
    {
      name: companyName,
      field: companyField,
      type: "Dropdown",
      mandatory,
      optionSource: "implCompany",
      resets: [organizationField, groupField],
      values: COMPANY_VALUES,
    },
    {
      name: organizationName,
      field: organizationField,
      type: "Dropdown",
      mandatory,
      optionSource: "implOrganization",
      dependsOn: [company],
      resets: [groupField],
      values: ORGANIZATION_VALUES,
    },
    {
      name: groupName,
      field: groupField,
      type: "Dropdown",
      mandatory,
      optionSource: "implGroup",
      dependsOn: [company, organization],
      values: GROUP_VALUES,
    },
  ];
};

/** Coordinator / implementer support-group attributes (Remedy). */
const COORDINATOR_IMPLEMENTER_ATTRIBUTES: StageAttribute[] = [
  // Remedy's ASCPY / ASORG / ASGRP.
  ...buildSupportCascade(
    [
      "Support Company - Change Coordinator",
      "Support Organization - Change Coordinator",
      "Support Group Name+ - Change Coordinator",
    ],
    [
      "supportCompanyChangeCoordinator",
      "supportOrganizationChangeCoordinator",
      "supportGroupNameChangeCoordinator",
    ],
    "Mandatory",
  ),
  // Remedy's ChgImpCpy / ChgImpOrg / ChgImpGrp. The missing space in
  // "Organization -Change" matches the source system's own label.
  ...buildSupportCascade(
    [
      "Support Company - Change Implementer",
      "Support Organization -Change Implementer",
      "Support Group Name+ - Change Implementer",
    ],
    [
      "supportCompanyChangeImplementer",
      "supportOrganizationChangeImplementer",
      "supportGroupNameChangeImplementer",
    ],
    "Optional",
  ),
];

/**
 * Remedy row's own status column - not editable, mirrors the stage's active
 * Remedy status (same source as Cygnet's "Remedy Status" field below) so
 * INSERT_REMEDY_UPDATE_ATTR's status param is never sent null. Every stage
 * includes this first in its `remedy` array - see buildAttributeSaveSections,
 * which auto-includes any autoSetFrom field in the save payload.
 */
const REMEDY_STATUS_ATTRIBUTE: StageAttribute = {
  name: "Status",
  field: "status",
  type: "Text",
  mandatory: "Mandatory",
  readOnly: true,
  autoSetFrom: "remedyStatus",
};

/**
 * Business justification for the change - previously only collected at the
 * Scheduling stage, now available (editable) at every stage so it's never
 * dropped from the save payload no matter which stage the user is on.
 */
const BUSINESS_JUSTIFICATION_ATTRIBUTE: StageAttribute = {
  name: "Business Justification",
  field: "businessJustification",
  type: "Dropdown",
  mandatory: "Mandatory",
  values: [
    "Corporate Strategic",
    "Business Unit Strategic",
    "Maintenance",
    "Defect",
    "Upgrade",
    "Enhancement",
    "Customer Commitment",
    "Sarbanes-Oxley",
    "Real Time Spare consumption",
    "RMA",
  ],
};

// ─── 7 CMS stages (ids reuse the app-wide WorkflowStageId) ───────────────────

/** The per-stage schemas before the stage-agnostic CAB fields are appended. */
const CMS_STAGE_SCHEMAS_BASE: AttributeStageSchema[] = [
  {
    id: "review",
    label: "Plan & Inventory Validation",
    shortLabel: "Plan & Inv Val",
    planningToolPhase: "Planning",
    remedyStatuses: ["Planning In Progress"],
    planningToolScopes: [],
    // Business Justification is collected at exactly two stages: here and
    // Scheduling & Approvals. Every other stage omits it.
    remedy: [
      REMEDY_STATUS_ATTRIBUTE,
      BUSINESS_JUSTIFICATION_ATTRIBUTE,
      ...COORDINATOR_IMPLEMENTER_ATTRIBUTES,
    ],
    cab: [
      OLM_PREFILL_ATTRIBUTE("CRQ Validated By", "crqValidatedBy"),
      NOW_PREFILL_ATTRIBUTE("CRQ Validated Time", "crqValidatedTime"),
      { name: "Host Name**", field: "hostName", type: "Text", mandatory: "Mandatory" },
      {
        name: "Layer",
        field: "layer",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: ["ACC", "AGG", "CORE", "ISP", "MPLS/PE"],
      },
      { name: "Node IP Address*", field: "nodeIpAddress", type: "Text", mandatory: "Mandatory" },
    ],
  },
  {
    id: "impactanalysis",
    label: "Impact Analysis",
    shortLabel: "Impact Analysis",
    planningToolPhase: "Impact Analysis",
    remedyStatuses: ["Planning In Progress"],
    planningToolScopes: [],
    remedy: [
      REMEDY_STATUS_ATTRIBUTE,
      {
        name: "Impacted Segment",
        field: "impactedSegment",
        // Multi-select: an activity can hit more than one segment. Held as
        // string[] in the form, saved as a CSV string like the other
        // multi-value fields.
        type: "Multi Select Checkbox",
        mandatory: "Optional",
        values: [
          "DC",
          "Mobility",
          "TWAMP",
          "NOC NS",
          "NOC IM",
          "Switch",
          "Telemedia",
          "NOC DCN and tool",
          "B2B",
        ],
      },
      { name: "Actual Impact", field: "actualImpact", type: "Text", mandatory: "Mandatory" },
      {
        name: "Activity Impact Analysis Done",
        field: "activityImpactAnalysisDone",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      { name: "OLT Details", field: "oltDetails", type: "Text", mandatory: "Optional" },
    ],
    cab: [
      {
        name: "Technology**",
        field: "technology",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: ["BRAS", "CEN", "EPT", "ISP", "MPLS", "NPT", "OTN"],
      },
      OLM_PREFILL_ATTRIBUTE("Impact Analysis Done By", "impactAnalysisDoneBy"),
      NOW_PREFILL_ATTRIBUTE("Impact Analysis Done By Time", "impactAnalysisDoneByTime"),
      {
        name: "B2B Impacted*",
        field: "b2bImpacted",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      { name: "MSAN Count", field: "msanCount", type: "Text", mandatory: "Optional" },
    ],
  },
  {
    id: "mopcreate",
    label: "MOP Creation",
    shortLabel: "MOP Creation",
    planningToolPhase: "MOP Creation",
    remedyStatuses: ["Planning In Progress"],
    planningToolScopes: [],
    remedy: [
      REMEDY_STATUS_ATTRIBUTE,
      ...COORDINATOR_IMPLEMENTER_ATTRIBUTES,
      {
        name: "MOP Creation Method",
        field: "mopCreationMethod",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: MOP_METHOD_VALUES,
      },
      {
        name: "SOP Document",
        field: "sopDocument",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      {
        name: "MOP Document",
        field: "mopDocument",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: ["Yes"],
      },
    ],
    cab: [
      OLM_PREFILL_ATTRIBUTE("MOP Created By", "mopCreatedBy"),
      NOW_PREFILL_ATTRIBUTE("MOP Created By Time", "mopCreatedByTime"),
    ],
  },
  {
    id: "mopvalidate",
    label: "MOP Validation",
    shortLabel: "MOP Validation",
    planningToolPhase: "MOP Validation",
    remedyStatuses: ["Planning In Progress"],
    planningToolScopes: [],
    remedy: [REMEDY_STATUS_ATTRIBUTE, ...COORDINATOR_IMPLEMENTER_ATTRIBUTES],
    cab: [
      OLM_PREFILL_ATTRIBUTE("MOP Validated By", "mopValidatedBy"),
      NOW_PREFILL_ATTRIBUTE("MOP Validated By Time", "mopValidatedByTime"),
      {
        name: "MOP Validation Remark",
        field: "mopValidationRemark",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: ["Not OK", "OK"],
      },
      {
        name: "FE Required**",
        field: "feRequired",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      {
        name: "Remarks for FE Details",
        field: "remarksForFeDetails",
        type: "Text",
        mandatory: "Optional",
      },
    ],
  },
  {
    id: "scheduling",
    label: "Scheduling & Approvals",
    shortLabel: "Scheduling & Approvals",
    planningToolPhase: "Scheduling",
    remedyStatuses: ["Planning In Progress"],
    planningToolScopes: ["scheduling"],
    remedy: [
      REMEDY_STATUS_ATTRIBUTE,
      ...COORDINATOR_IMPLEMENTER_ATTRIBUTES,
      {
        name: "Scheduled Start Date+",
        field: "scheduledStartDate",
        type: "Date Time",
        mandatory: "Mandatory",
      },
      {
        name: "Scheduled End Date+",
        field: "scheduledEndDate",
        type: "Date Time",
        mandatory: "Mandatory",
      },
      BUSINESS_JUSTIFICATION_ATTRIBUTE,
    ],
    cab: [
      OLM_PREFILL_ATTRIBUTE("CRQ Scheduled By", "crqScheduledBy"),
      NOW_PREFILL_ATTRIBUTE("CRQ Scheduled By Time", "crqScheduledByTime"),
      {
        name: "Activity Executed By*",
        field: "activityExecutedBy",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: EXECUTED_BY_VALUES,
      },
      { name: "L3 Approver OLM ID", field: "l3ApproverOlmId", type: "Text", mandatory: "Mandatory" },
    ],
  },
  {
    id: "activityimplement",
    label: "Network Execution",
    shortLabel: "Network Execution",
    planningToolPhase: "Execution",
    remedyStatuses: [
      "Scheduled For Review",
      "Scheduled For Approval",
      "Scheduled",
      "Implementation In Progress",
    ],
    // The three "Scheduled*" sub-statuses are pure Remedy transitions - the
    // activity hasn't started yet, so there is no actual start time to record.
    // Only "Implementation in Progress" collects the field below; the others
    // save the Status alone.
    //
    // Everything the activity produces (actual end time, implementer details,
    // pre/post checks, execution method, ...) is collected at Task Closure, not
    // here: at "Implementation in Progress" the work is still running, so those
    // answers don't exist yet.
    attributeStatuses: ["Implementation In Progress"],
    planningToolScopes: ["execution"],
    remedy: [
      REMEDY_STATUS_ATTRIBUTE,
      {
        name: "Actual Start Date*+",
        field: "actualStartDate",
        type: "Date Time",
        mandatory: "Mandatory",
      },
    ],
    // No CAB fields at this stage - see the note above. An empty section is not
    // rendered (AttributeSection) and is left out of the save payload entirely
    // (buildAttributeSaveSections), so nothing an earlier stage saved is blanked.
    cab: [],
  },
  {
    id: "closer",
    label: "Task Closure",
    shortLabel: "Task Closure",
    planningToolPhase: "Task Closure",
    remedyStatuses: ["Completed"],
    planningToolScopes: ["closure"],
    remedy: [
      REMEDY_STATUS_ATTRIBUTE,
      {
        name: "Actual End Date*+",
        field: "actualEndDate",
        type: "Date Time",
        mandatory: "Mandatory",
      },
      { name: "Completed Date", field: "completedDate", type: "Date Time", mandatory: "Mandatory" },
    ],
    cab: [
      {
        name: "Activity Executed By*",
        field: "activityExecutedBy",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: EXECUTED_BY_VALUES,
      },
      {
        name: "Actual Implementer Name",
        field: "actualImplementerName",
        type: "Text",
        mandatory: "Mandatory",
      },
      {
        name: "Actual Implementer Phone No",
        field: "actualImplementerPhoneNo",
        type: "Numbers",
        mandatory: "Mandatory",
      },
      {
        name: "Exit Criteria Fulfilled**",
        field: "exitCriteriaFulfilled",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      {
        name: "MOP Referred During Activity",
        field: "mopReferredDuringActivity",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      {
        name: "Pre Check Done**",
        field: "preCheckDone",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      OLM_PREFILL_ATTRIBUTE("Pre - Checks Done By", "preChecksDoneBy"),
      NOW_PREFILL_ATTRIBUTE("Pre-Check Done Time", "preCheckDoneTime"),
      {
        name: "Post Check Done**",
        field: "postCheckDone",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      OLM_PREFILL_ATTRIBUTE("Post - Checks Done By", "postChecksDoneBy"),
      NOW_PREFILL_ATTRIBUTE("Post-Check Done Time", "postCheckDoneTime"),
      {
        name: "Requested Date Deviation Reason",
        field: "requestedDateDeviationReason",
        type: "Dropdown",
        mandatory: "Optional",
        values: [
          "Activity Preponed",
          "Activity approval denied by B2B",
          "Activity approval denied by Circle (Deployment)",
          "Activity approval denied by Circle (Ops)",
          "Activity approval denied by OEM",
          "Activity on hold by management",
          "Activity reverting",
          "Based on request received from requester",
          "FE Tools not available",
          "FE not available",
          "Fiber cuts",
          "Fiber readiness issue",
          "LAN issue",
          "NE unmanaged",
          "NIAM Access Issue",
          "NMS Issue",
          "NOC Readiness",
          "NOC engg Not available",
          "Natural Calamities",
          "Portal/Tool Issues",
          "Remedy not working",
          "SPOC Details not available",
          "Site Access Issue",
          "Spare not available",
          "Time constraint",
          "VVIP Visit",
        ],
      },
      {
        name: "Executer Location",
        field: "executerLocation",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: [
          "AIRTEL CIRCLE OFFICE",
          "AIRTEL NOC",
          "MS-ERICSSON OFFICE",
          "MS-NOKIA OFFICE",
          "WORK FROM HOME",
        ],
      },
      {
        name: "MOP Execution Method",
        field: "mopExecutionMethod",
        type: "Dropdown",
        mandatory: "Mandatory",
        values: MOP_METHOD_VALUES,
      },
      {
        name: "Change Activity Done",
        field: "changeActivityDone",
        type: "Radio Button",
        mandatory: "Mandatory",
        values: YES_NO_VALUES,
      },
      {
        name: "Change Activity Done Time",
        field: "changeActivityDoneTime",
        type: "Date Time",
        mandatory: "Mandatory",
      },
      OLM_PREFILL_ATTRIBUTE("CRQ Closed By", "crqClosedBy"),
      NOW_PREFILL_ATTRIBUTE("CRQ Closed By Time", "crqClosedByTime"),
    ],
  },
];

/**
 * The only stage that carries the numbered circle / impacted-parties pairs.
 *
 * Impact Analysis is where the per-circle impact is actually assessed, so it is
 * the one stage that collects circle1..19 / impactedPartiesCab1..19. Written as
 * an allow-list rather than six exclusions: a stage added later gets them only
 * if someone opts it in here.
 *
 * ⚠ Saving at any OTHER stage BLANKS whatever Impact Analysis put in those 38
 * columns. GET /attributeupdate/details returns the whole CAB row and
 * INSERT_CAB_UPDATE_ATTR writes it back whole, so columns a stage does not send
 * come back as nulls. Re-saving Impact Analysis restores them; any later stage
 * that saves afterwards wipes them again. If that becomes a problem, the fix is
 * the "hidden but preserved" treatment Planning Tool already uses - keep the
 * fields in every stage's schema, render them nowhere, still echo them back.
 */
const STAGES_WITH_CAB_CIRCLE_SLOTS = new Set<AttributeStageSchema["id"]>(["impactanalysis"]);

/**
 * The stage schemas, with the 19 numbered circle / impacted-parties pairs
 * appended to the CAB section of the stages listed above.
 *
 * Appended here rather than spread into each stage's `cab` array so the rule
 * lives in a single visible place.
 */
export const CMS_STAGE_SCHEMAS: AttributeStageSchema[] = CMS_STAGE_SCHEMAS_BASE.map((stage) =>
  STAGES_WITH_CAB_CIRCLE_SLOTS.has(stage.id)
    ? { ...stage, cab: [...stage.cab, ...CAB_CIRCLE_SLOT_ATTRIBUTES] }
    : stage,
);

// ─── Planning Tool (Cygnet) master field list, filtered per stage via scopes ─
//
// `field` here is the CYGNET_UPDATE_ATTR_TBL column name, spelled exactly as
// the DB spells it - that table names its columns after the Remedy attributes
// they mirror ("Impacted Circle(s)", "Type of CR", "ChgImpCpy", "cms_stage"),
// not in camelCase like the Remedy and CAB attribute tables.
// GET_CYGNET_DETAILS_BY_CHANGE_ID returns those labels untouched and
// INSERT_CYGNET_UPDATE_ATTR matches the keys it is handed back against them, so
// this list is the one place the Cygnet column names are written down on either
// side of the wire - rename a column in the DB and this is the only file that
// has to follow.

/**
 * CYGNET_UPDATE_ATTR_TBL's key column. Never sent as a Cygnet save field: the
 * CRQ travels as the save payload's top-level `crqNo`, which is what
 * INSERT_CYGNET_UPDATE_ATTR identifies the row by - it drops this key from the
 * JSON it is handed.
 */
export const CYGNET_CHANGE_ID_FIELD = "Infrastructure Change ID";

export const PLANNING_TOOL_ATTRIBUTES: PlanningToolAttribute[] = [
  {
    name: "Change ID",
    field: CYGNET_CHANGE_ID_FIELD,
    type: "Text",
    mandatory: "Mandatory",
    scope: "always",
    readOnly: true,
    autoSetFrom: "crqNo",
  },
  {
    name: "CMS Function",
    field: "CMS_FUNCTION",
    type: "Text",
    mandatory: "Mandatory",
    scope: "always",
    readOnly: true,
  },
  {
    name: "CMS Sub Function",
    field: "CMS_SUB_FUNCTION",
    type: "Text",
    mandatory: "Mandatory",
    scope: "always",
    readOnly: true,
  },
  { name: "Plan ID", field: "PLAN_ID", type: "Text", mandatory: "Mandatory", scope: "backend" },
  { name: "Task ID", field: "TASK_ID", type: "Text", mandatory: "Mandatory", scope: "backend" },
  {
    name: "Requestor Type",
    field: "REQUESTOR_TYPE",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: ["Ops", "IT", "NOC", "Vendor", "Customer"],
  },
  {
    name: "Requestor Name",
    field: "REQUESTOR_NAME",
    type: "Text",
    mandatory: "Mandatory",
    scope: "always",
  },
  {
    name: "Impacted Circle(s)",
    field: "Impacted Circle(s)",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: [
      "North",
      "South",
      "East",
      "West",
      "NCR",
      "WB",
      "MH",
      "KA",
      "TN",
      "KL",
      "AP",
      "GJ",
      "PB",
      "RJ",
      "UP-E",
      "UP-W",
      "MP",
      "KOL",
      "MUM",
      "DEL",
    ],
  },
  {
    name: "Vendor",
    field: "VENDOR",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: [
      "Nokia",
      "Ericsson",
      "Huawei",
      "Cisco",
      "ZTE",
      "Juniper",
      "ECI",
      "ADVA",
      "Ciena",
      "Samsung",
    ],
  },
  {
    name: "Domain",
    field: "Domain",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: [
      "MPLS-TX",
      "IP Core",
      "Access",
      "Transport",
      "DWDM",
      "OTN",
      "RAN",
      "GPON",
      "FTTX",
      "CEN",
      "BRAS",
      "EPT",
      "NPT",
    ],
  },
  {
    name: "Opcat Level 1",
    field: "OPCAT_LEVEL_1",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: ["Network", "Hardware", "Software", "Service", "Application"],
  },
  {
    name: "Opcat Level 2",
    field: "OPCAT_LEVEL_2",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: ["MPLS", "DWDM", "IP", "Optical", "Router", "Switch", "Firewall"],
  },
  {
    name: "Opcat Level 3",
    field: "OPCAT_LEVEL_3",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: [
      "Node Addition",
      "Node Removal",
      "Configuration Change",
      "Upgrade",
      "Migration",
      "Patch",
    ],
  },
  {
    name: "Type of CR",
    field: "Type of CR",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: ["Planned", "Emergency", "Standard", "Normal", "Project"],
  },
  {
    name: "Change Impact",
    field: "ChangeImpact",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    values: ["Minor", "Major", "Critical", "Extensive/Widespread"],
  },
  {
    name: "Activity Window",
    field: "ACTIVITY_WINDOW",
    type: "Text",
    mandatory: "Mandatory",
    scope: "scheduling",
  },
  {
    name: "Requested Start Time",
    field: "REQUESTED_START_TIME",
    type: "Date Time",
    mandatory: "Mandatory",
    scope: "scheduling",
  },
  {
    name: "Requested End Time",
    field: "REQUESTED_END_TIME",
    type: "Date Time",
    mandatory: "Mandatory",
    scope: "scheduling",
  },
  {
    name: "Scheduled Start Date",
    field: "Scheduled Start Date",
    type: "Date Time",
    mandatory: "Mandatory",
    scope: "scheduling",
  },
  {
    name: "Scheduled End Date",
    field: "Scheduled End Date",
    type: "Date Time",
    mandatory: "Mandatory",
    scope: "scheduling",
  },
  {
    name: "Coordinator Company",
    field: "ASCPY",
    type: "Text",
    mandatory: "Mandatory",
    scope: "always",
  },
  {
    name: "Coordinator Organization",
    field: "ASORG",
    type: "Text",
    mandatory: "Mandatory",
    scope: "always",
  },
  {
    name: "Coordinator Group",
    field: "ASGRP",
    type: "Text",
    mandatory: "Mandatory",
    scope: "always",
  },
  {
    name: "Implementer Company",
    field: "ChgImpCpy",
    type: "Text",
    mandatory: "Mandatory",
    scope: "execution",
  },
  {
    name: "Implementer Organization",
    field: "ChgImpOrg",
    type: "Text",
    mandatory: "Mandatory",
    scope: "execution",
  },
  {
    name: "Implementer Group",
    field: "ChgImpGrp",
    type: "Text",
    mandatory: "Mandatory",
    scope: "execution",
  },
  {
    name: "Actual Implementer Name",
    field: "Actual Implementer Name",
    type: "Text",
    mandatory: "Mandatory",
    scope: "execution",
  },
  {
    name: "Actual Implementer Phone No",
    field: "Actual Implementer Phone No",
    type: "Numbers",
    mandatory: "Mandatory",
    scope: "execution",
  },
  {
    name: "Execution Engineer Details",
    field: "EXECUTION_ENGINEER_DETAILS",
    type: "Text",
    mandatory: "Optional",
    scope: "execution",
  },
  {
    name: "CMS Status",
    field: "cms_stage",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    readOnly: true,
    autoSetFrom: "cmsStage",
    values: [
      "Plan & Inv Val",
      "Impact Analysis",
      "Scheduling",
      "MOP Creation",
      "MOP Validation",
      "Network Execution",
      "Task Closure",
      "Closed",
    ],
  },
  {
    name: "CRQ Approval Status",
    field: "CRQ approval status",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "scheduling",
    values: ["Pending", "Approved", "Rejected", "Deferred"],
  },
  {
    name: "Remedy Status",
    field: "Change Request Status",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "always",
    readOnly: true,
    autoSetFrom: "remedyStatus",
    values: [
      "Draft",
      "Planning In Progress",
      "Scheduled For Review",
      "Scheduled For Approval",
      "Scheduled",
      "Implementation In Progress",
      "Completed",
      "Rejected",
      "Cancelled",
      "Closed",
    ],
  },
  {
    name: "Task Closure Status",
    field: "TASK_CLOSURE_STATUS",
    type: "Dropdown",
    mandatory: "Mandatory",
    scope: "closure",
    values: ["Open", "In Progress", "Success", "Failed", "Closed"],
  },
  {
    name: "Completed Date",
    field: "Completed Date",
    type: "Date Time",
    mandatory: "Mandatory",
    scope: "closure",
  },
  {
    name: "Cancellation Time",
    field: "CANCELLATION_TIME",
    type: "Date Time",
    mandatory: "Optional",
    scope: "backend",
  },
  {
    name: "Rejection Time",
    field: "REJECTION_TIME",
    type: "Date Time",
    mandatory: "Optional",
    scope: "backend",
  },
  {
    name: "Status Reason",
    field: "Status Reason",
    type: "Dropdown",
    mandatory: "Optional",
    scope: "closure",
    values: ["Successful", "Partial Success", "Failed", "Rolled Back", "Cancelled"],
  },
  {
    name: "Failure Remarks",
    field: "FAILURE_REMARKS",
    type: "Text",
    mandatory: "Optional",
    scope: "backend",
  },
];
