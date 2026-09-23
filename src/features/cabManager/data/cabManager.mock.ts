import type {
  AdminAnalytics,
  AdminUser,
  AssignMatrixCell,
  AssignRule,
  AuditEntry,
  CabAgendaRow,
  CabPlanDate,
  CabQueueRow,
  CabRejectReason,
  CabService,
  CabSession,
  CircleDropdown,
  Crq,
  CrqJourney,
  CrqStage,
  DashboardData,
  EscalationRow,
  ImpactCode,
  ImplementationDetail,
  MyCrqsResponse,
  Persona,
  RejectionReason,
  Role,
  SeRing,
  ServiceApprovalRule,
  SpocFeDetails,
} from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
//  Mock data for the CAB Portal RTK Query slice (queryFn fallback / VITE_CAB_USE_MOCK).
//  Field shapes mirror the backend's dummy stored procedures 1:1 — see
//  airtelmanagement/src/main/resources/sql/cabmanager_dummy_procedures.sql.
// ─────────────────────────────────────────────────────────────────────────────

export const STAGES: CrqStage[] = [
  "VALIDATE",
  "IMPACT_ANALYSIS",
  "MOP_CREATION",
  "MOP_VALIDATION",
  "SCHEDULING_APPROVAL",
  "EXECUTION",
  "CLOSURE",
];
export const ASSIGN_STAGES: CrqStage[] = STAGES;

// ── Personas / role switcher ────────────────────────────────────────────────
export const ROLES: Record<Role, Persona> = {
  admin:       { role: "admin",       name: "Amit Verma",     title: "CTO · All Domains",        shortTitle: "CTO",          olm: "amver01", initials: "AV", color: "#1565C0", home: "cabPlanning" },
  requester:   { role: "requester",   name: "Karan Mehta",    title: "NOC L2 · Requester",       shortTitle: "NOC L2",       olm: "karme07", initials: "KM", color: "#00796B", home: "mycrqs" },
  stakeholder: { role: "stakeholder", name: "Priya Deshmukh", title: "COH Optics · Stakeholder", shortTitle: "COH Optics",   olm: "prdes03", initials: "PD", color: "#C2185B", home: "mycrqs" },
  cabEngineer: { role: "cabEngineer", name: "Ravi Nair",      title: "NOC · CAB Engineer",       shortTitle: "CAB Engineer", olm: "ravna02", initials: "RN", color: "#5D4037", home: "cabPlanning" },
  cabMember:   { role: "cabMember",   name: "Sneha Iyer",     title: "SPOC · CAB Member",        shortTitle: "SPOC IP Core", olm: "sneiy04", initials: "SI", color: "#7B1FA2", home: "cabSessions" },
  se:          { role: "se",          name: "Arjun Rao",      title: "Field SE · Implementation",shortTitle: "Field SE",     olm: "arjra09", initials: "AR", color: "#E64A19", home: "implementation" },
};

// "dashboard" hidden for now (2026-08-24) — re-add to a role's list to bring
// it back in both the sidebar and the tab strip (see useSidebarNav.tsx /
// CabManagerMainPageTab.tsx, both of which key off this list).
export const ROLE_SCREENS: Record<Role, string[]> = {
  admin:       ["cabPlanning", "cabSessions", "allcrqs", "journey", "admin"],
  requester:   ["cabSessions", "mycrqs", "journey"],
  stakeholder: ["cabSessions", "mycrqs", "journey"],
  cabEngineer: ["cabSessions", "allcrqs", "journey"],
  cabMember:   ["cabSessions", "journey"],
  se:          ["cabSessions", "implementation", "journey"],
};

// ── Core CRQ dataset — mirrors backend CrqDto (post sp_get_cab_crqs / sp_get_my_crqs_rows update) ──
export const MOCK_CRQS: Crq[] = [
  { serviceApprovalId: 1,  crqNo: "CRQ-2026-0418", planId: "PLAN-2026-0001", domainName: "Optics",   circleCode: "MH",   currentStage: "VALIDATE",             serviceCode: "TX",   stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 82 },
  { serviceApprovalId: 2,  crqNo: "CRQ-2026-0421", planId: "PLAN-2026-0002", domainName: "IP Core",  circleCode: "KA",   currentStage: "VALIDATE",             serviceCode: "CORE", stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 34 },
  { serviceApprovalId: 3,  crqNo: "CRQ-2026-0422", planId: "PLAN-2026-0003", domainName: "Optics",   circleCode: "GJ",   currentStage: "SCHEDULING_APPROVAL",  serviceCode: "TX",   stageStatus: "IN_PROGRESS", serviceApprovalStatus: "ON_HOLD", changeImpact: "SA", slaPercentage: 58 },
  { serviceApprovalId: 4,  crqNo: "CRQ-2026-0423", planId: "PLAN-2026-0004", domainName: "IP Core",  circleCode: "DL",   currentStage: "MOP_VALIDATION",       serviceCode: "CORE", stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 71 },
  { serviceApprovalId: 5,  crqNo: "CRQ-2026-0424", planId: "PLAN-2026-0005", domainName: "Optics",   circleCode: "TN",   currentStage: "VALIDATE",             serviceCode: "TX",   stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 88 },
  { serviceApprovalId: 6,  crqNo: "CRQ-2026-0425", planId: "PLAN-2026-0006", domainName: "Packet",   circleCode: "AP",   currentStage: "VALIDATE",             serviceCode: "B2B",  stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "SA",  slaPercentage: 28 },
  { serviceApprovalId: 7,  crqNo: "CRQ-2026-0419", planId: "PLAN-2026-0007", domainName: "Mobility", circleCode: "MH",   currentStage: "EXECUTION",            serviceCode: "MOB",  stageStatus: "COMPLETED",   serviceApprovalStatus: "APPROVED", changeImpact: "NSA", slaPercentage: 12 },
  { serviceApprovalId: 8,  crqNo: "CRQ-2026-0420", planId: "PLAN-2026-0008", domainName: "Mobility", circleCode: "WB",   currentStage: "VALIDATE",             serviceCode: "MOB",  stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 64 },
  { serviceApprovalId: 9,  crqNo: "CRQ-2026-0415", planId: "PLAN-2026-0009", domainName: "IP Core",  circleCode: "UP-E", currentStage: "VALIDATE",             serviceCode: "CORE", stageStatus: "IN_PROGRESS", serviceApprovalStatus: "REJECTED", changeImpact: "SA", slaPercentage: 92 },
  { serviceApprovalId: 10, crqNo: "CRQ-2026-0417", planId: "PLAN-2026-0010", domainName: "Packet",   circleCode: "KA",   currentStage: "SCHEDULING_APPROVAL",  serviceCode: "B2B",  stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 55 },
  { serviceApprovalId: 11, crqNo: "CRQ-2026-0426", planId: "PLAN-2026-0011", domainName: "Embedded", circleCode: "RJ",   currentStage: "VALIDATE",             serviceCode: "RAN",  stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 40 },
  { serviceApprovalId: 12, crqNo: "CRQ-2026-0414", planId: "PLAN-2026-0012", domainName: "Embedded", circleCode: "MH",   currentStage: "EXECUTION",            serviceCode: "RAN",  stageStatus: "COMPLETED",   serviceApprovalStatus: "APPROVED", changeImpact: "SA", slaPercentage: 18 },
  { serviceApprovalId: 13, crqNo: "CRQ-2026-0413", planId: "PLAN-2026-0013", domainName: "Embedded", circleCode: "DL",   currentStage: "VALIDATE",             serviceCode: "RAN",  stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 76 },
  { serviceApprovalId: 14, crqNo: "CRQ-2026-0412", planId: "PLAN-2026-0014", domainName: "Packet",   circleCode: "MP",   currentStage: "VALIDATE",             serviceCode: "B2B",  stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "NSA",  slaPercentage: 81 },
  { serviceApprovalId: 15, crqNo: "CRQ-2026-0411", planId: "PLAN-2026-0015", domainName: "IP Core",  circleCode: "WB",   currentStage: "SCHEDULING_APPROVAL",  serviceCode: "CORE", stageStatus: "IN_PROGRESS", serviceApprovalStatus: "PENDING",  changeImpact: "SA",  slaPercentage: 47 },
];

// ── CAB services (AllCRQs "Service" filter) — mirrors CRQ_CAB_SERVICE_MASTER ──
// export const MOCK_CAB_SERVICES: CabService[] = [
//   { serviceCode: "RAN",  serviceName: "Radio Access Network" },
//   { serviceCode: "MOB",  serviceName: "Mobility (RAN/Core)" },
//   { serviceCode: "B2B",  serviceName: "Enterprise / B2B" },
//   { serviceCode: "TEL",  serviceName: "Telemedia" },
//   { serviceCode: "CORE", serviceName: "Core Services" },
//   { serviceCode: "TX",   serviceName: "Transmission" },
// ];

export const MOCK_CAB_SERVICES: CabService[] = [
  { serviceCode: "Radio Access Network" },
  { serviceCode: "Mobility (RAN/Core)" },
  { serviceCode: "Enterprise / B2B" },
  { serviceCode: "Telemedia" },
  { serviceCode: "Core Services" },
  { serviceCode: "Transmission" },
];


// ── Rejection reasons / stage vocab used by admin config screens ────────────
export const REJECTION_STAGES = ["Initial Technical Review", "Domain Approval", "Validation", "Execution Gate", "Post Execution Review"];

export const MOCK_REJECTION_REASONS: RejectionReason[] = [
  { reason: "Wrong CRQ Flow – Type of CR",  active: true  },
  { reason: "Incorrect approver mapped",    active: true  },
  { reason: "Wrong Impact - SA, NSA, CNSA", active: true  },
  { reason: "Duplicate CRQ",                active: true  },
  { reason: "Plan Issue",                   active: false },
];

// ── CAB reject reasons (AllCRQs reject dropdown) — mirrors sp_get_cab_reject_reasons() ──
export const MOCK_CAB_REJECT_REASONS: CabRejectReason[] = [
  { reasonId: 1, reasonText: "Insufficient impact details" },
  { reasonId: 2, reasonText: "Window clashes with freeze/blackout" },
  { reasonId: 3, reasonText: "Rollback plan inadequate" },
  { reasonId: 4, reasonText: "Wrong impact classification" },
];

// ── CAB sessions ────────────────────────────────────────────────────────────
export const MOCK_CAB_SESSIONS: CabSession[] = [
  // session_link is free text and often absent — one of each, so the UI's
  // "no bridge booked yet" path is exercised alongside the joinable one.
  { id: "CAB-2026-101", sessionLink: null, stage: "SCHEDULING_APPROVAL", host: "Rahul Sharma", date: "2026-06-14", time: "16:00 IST", status: "scheduled", type: "Critical", crqIds: ["CRQ-2026-0418", "CRQ-2026-0424", "CRQ-2026-0412"] },
  { id: "CAB-2026-098", sessionLink: "meet.google.com/abc-defg", stage: "SCHEDULING_APPROVAL", host: "Anita Desai",  date: "2026-06-11", time: "15:00 IST", status: "live",      type: "Normal",   crqIds: ["CRQ-2026-0415"] },
];

// ── SE rings (Field Execution) ───────────────────────────────────────────────
export const MOCK_SE_RINGS: SeRing[] = [
  { id: "RING-01", ring: "Ring A", locA: "Chennai-Central", locB: "Chennai-East", type: "Protection", slotStart: "01:00 IST", slotEnd: "02:00 IST", decision: "pending" },
  { id: "RING-02", ring: "Ring B", locA: "Chennai-East",    locB: "Chennai-South", type: "Working",     slotStart: "02:00 IST", slotEnd: "03:00 IST", decision: "pending" },
];

// ── Admin: users / matrix / rules / audit ───────────────────────────────────
export const MOCK_ADMIN_USERS: AdminUser[] = [
  { name: "Amit Verma",     olm: "amver01", role: "CTO / Admin",    domain: "All Domains", access: "Approve", status: "active"   },
  { name: "Priya Deshmukh", olm: "prdes03", role: "COH (L4)",       domain: "Optics",      access: "Approve", status: "active"   },
  { name: "Sneha Iyer",     olm: "sneiy04", role: "Lead (L3)",      domain: "IP Core",     access: "Approve", status: "active"   },
  { name: "Ravi Nair",      olm: "ravna02", role: "CAB Engineer",   domain: "All Domains", access: "Write",   status: "active"   },
  { name: "Karan Mehta",    olm: "karme07", role: "Requester (L2)", domain: "Optics",      access: "Write",   status: "active"   },
  { name: "Arjun Rao",      olm: "arjra09", role: "Field SE",       domain: "Optics",      access: "Read",    status: "active"   },
  { name: "Vikram Joshi",   olm: "vikjo05", role: "Manager (L3)",   domain: "Embedded",    access: "Approve", status: "inactive" },
];

export const ASSIGN_DOMAINS = ["IP Core","Optics", "Packet", "Embedded", "Mobility"] as const;
export const ASSIGN_CIRCLES = ["MH", "KA", "GJ", "DL", "TN", "AP", "WB", "UP-E", "RJ", "MP"] as const;

export const APPROVERS = [
  { name: "Amit Verma",     role: "CTO / Admin",  domain: "All Domains" },
  { name: "Priya Deshmukh", role: "COH (L4)",     domain: "Optics"      },
  { name: "Sneha Iyer",     role: "Lead (L3)",    domain: "IP Core"     },
  { name: "Anil Kumar",     role: "Lead (L3)",    domain: "Packet"      },
  { name: "Kavya Reddy",    role: "Lead (L3)",    domain: "Mobility"    },
  { name: "Rahul Sharma",   role: "Manager (L3)", domain: "Embedded"    },
  { name: "Vikram Joshi",   role: "Manager (L3)", domain: "Embedded"    },
];

const ASSIGN_DEFAULT_BY_DOMAIN: Record<string, string> = {
  "IP Core":  "Sneha Iyer",
  Optics:     "Priya Deshmukh",
  Packet:     "Anil Kumar",
  Embedded:   "Rahul Sharma",
  Mobility:   "Kavya Reddy",
};
export const MOCK_ASSIGN_MATRIX: AssignMatrixCell[] = ASSIGN_STAGES.flatMap((stage) =>
  ASSIGN_DOMAINS.map((domain) => ({
    stage,
    domain,
    approver: stage === "VALIDATE" ? "Amit Verma" : ASSIGN_DEFAULT_BY_DOMAIN[domain],
  }))
);

export const MOCK_ASSIGN_RULES: AssignRule[] = [
  { id: "AR-01", domain: "Optics",   circle: "TN", impact: "SA",  stage: "VALIDATE",             approver: "Priya Deshmukh", active: true  },
  { id: "AR-02", domain: "Mobility", circle: "MH", impact: "SA",  stage: "SCHEDULING_APPROVAL",  approver: "Kavya Reddy",    active: true  },
  { id: "AR-03", domain: "IP Core",  circle: "KA", impact: "NSA", stage: "SCHEDULING_APPROVAL",  approver: "Sneha Iyer",     active: false },
];

export const SERVICE_TYPES = ["Enterprise Services (B2B)", "Mobility", "Telemedia", "Core Services"];
export const SERVICE_IMPACTS: ImpactCode[] = ["SA", "NSA"];
export const SERVICE_CIRCLES = ["All", "MH", "KA", "GJ", "DL", "TN", "AP", "WB", "UP-E", "RJ", "MP"];
/** Mock stand-in for GET /cab/admin/circledropdown (VITE_CAB_USE_MOCK=true). */
export const MOCK_CAB_CIRCLES: CircleDropdown[] = SERVICE_CIRCLES.map((circleCode) => ({ circleCode }));

/**
 * Mock stand-in for GET /cab/crqs/{crqNo}/spoc-fe-details. Mirrors the real
 * proc's common shape: a SPOC assigned with no email on record, and no Field
 * Engineer yet - so the dialog's partial/empty states get exercised.
 */
export const MOCK_SPOC_FE_DETAILS = (crqNo: string): SpocFeDetails => ({
  crqNo,
  spocOlmId: "A1SMCYAO",
  spocName: "KUSH GAUTAM",
  spocNumber: "9990009990",
  spocEmail: null,
  feOlmId: null,
  feName: null,
  feNumber: null,
  feEmail: null,
});
export const APPROVAL_AUTHORITIES = ["GSMC", "RAN Head", "COH", "Core Head", "NOC Head", "Domain Head", "Duty Manager", "CTO"];

export const MOCK_SERVICE_RULES: ServiceApprovalRule[] = [
  { id: "SR-01", service: "Enterprise Services (B2B)", circle: "All", l1: "GSMC",      l2: "NOC Head", l3: "CTO", active: true  },
  { id: "SR-02", service: "Mobility",                  circle: "All", l1: "RAN Head",  l2: "NOC Head", l3: "CTO", active: true  },
  { id: "SR-03", service: "Telemedia",                 circle: "All", l1: "COH",       l2: "NOC Head", l3: "CTO", active: false },
  { id: "SR-04", service: "Core Services",              circle: "All", l1: "Core Head", l2: "NOC Head", l3: "CTO", active: false },
];

export const MOCK_ESCALATION_MATRIX: EscalationRow[] = [
  { stage: "SCHEDULING_APPROVAL", l1: "6h", l2: "3h", l3: "1h",  notify: "SPOC → Domain Head"   },
  { stage: "MOP_VALIDATION",      l1: "4h", l2: "2h", l3: "1h",  notify: "Eng Lead → COH"       },
  { stage: "VALIDATE",            l1: "8h", l2: "4h", l3: "2h",  notify: "CAB Eng → CTO"        },
  { stage: "EXECUTION",           l1: "2h", l2: "1h", l3: "30m", notify: "NOC-NS → Duty Manager" },
];

export const MOCK_AUDIT_LOG: AuditEntry[] = [
  { actor: "Karan Mehta",    action: "CRQ Raised",                     crq: "CRQ-2026-0418", stage: "VALIDATE",            time: "2026-06-09T14:32:00", tag: "create"   },
  { actor: "System",         action: "SLA timer started (L1 · 4h)",    crq: "CRQ-2026-0418", stage: "VALIDATE",            time: "2026-06-09T14:32:00", tag: "system"   },
  { actor: "Sneha Iyer",     action: "Approved",                       crq: "CRQ-2026-0418", stage: "SCHEDULING_APPROVAL", time: "2026-06-10T09:18:00", tag: "approve"  },
  { actor: "System",         action: "Escalation triggered — SLA < 50%", crq: "CRQ-2026-0418", stage: "VALIDATE",          time: "2026-06-13T21:40:00", tag: "escalate" },
  { actor: "Priya Deshmukh", action: "Delegated to Sneha Iyer",        crq: "CRQ-2026-0422", stage: "SCHEDULING_APPROVAL", time: "2026-06-11T10:02:00", tag: "delegate" },
  { actor: "Sneha Iyer",     action: "Rejected — Conflicting Change",  crq: "CRQ-2026-0415", stage: "VALIDATE",            time: "2026-06-11T16:22:00", tag: "reject"   },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Builders — mirror the backend's (hardcoded) dummy stored procedures so the
//  mock fallback behaves like the real API. See cabmanager_dummy_procedures.sql.
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve `value` after `ms` ms — simulates network latency. */
export const mockDelay = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const buildDashboard = (): DashboardData => ({
  kpis: [
    { label: "Pending Approvals", value: "12", foot: "Awaiting your action", accent: "blue"   },
    { label: "Approved Today",    value: "8",  foot: "Completed today",      accent: "green"  },
    { label: "Escalations",       value: "3",  foot: "SLA at risk",          accent: "red"    },
    { label: "Rejected",          value: "2",  foot: "This week",            accent: "orange" },
  ],
  stageBars: [
    { stage: "VALIDATE",            count: 10, pct: 24 },
    { stage: "SCHEDULING_APPROVAL", count: 8,  pct: 19 },
    { stage: "IMPACT_ANALYSIS",     count: 6,  pct: 14 },
    { stage: "MOP_VALIDATION",      count: 12, pct: 29 },
    { stage: "EXECUTION",           count: 6,  pct: 14 },
  ],
  escalations: [
    { crqNo: "CRQ-2026-0401", slaPercentage: 42 },
    { crqNo: "CRQ-2026-0407", slaPercentage: 35 },
  ],
});

export const buildMyCrqs = (): MyCrqsResponse => ({
  stats: { awaitingMe: 5, approvedThisWeek: 11, rejectedThisWeek: 2 },
  rows: [
    {
      serviceApprovalId: 401, crqNo: "CRQ-2026-0401", planId: "PLAN-2026-101", domainName: "IP Core", circleCode: "MH",
      currentStage: "SCHEDULING_APPROVAL", serviceCode: "CORE", stageStatus: "IN_PROGRESS",
      serviceApprovalStatus: "PENDING", changeImpact: "NSA", slaPercentage: 42,
      approverName: "Rahul Sharma", assignStartTime: "2026-06-14T02:00:00", assignedToMe: true, raisedBy: "Priya Nair",
    },
  ],
});

export const buildCabQueue = (): CabQueueRow[] => [
  { crqNo: "CRQ-2026-0410", impact: "SA",  circle: "Mumbai",    domain: "Packet",   executionWindow: "02:00 - 05:00 IST" },
  { crqNo: "CRQ-2026-0411", impact: "NSA", circle: "Bangalore", domain: "Embedded", executionWindow: "01:00 - 03:00 IST" },
];

export const buildCabPlanDates = (): CabPlanDate[] => [
  { date: "2026-06-14", dayName: "FRI", dayNum: "14", monthName: "JUN", sessionId: "CAB-2026-101", type: "Critical", crqIds: ["CRQ-2026-0418", "CRQ-2026-0424", "CRQ-2026-0412"] },
  { date: "2026-06-16", dayName: "SUN", dayNum: "16", monthName: "JUN", sessionId: "CAB-2026-102", type: "Normal",   crqIds: ["CRQ-2026-0420", "CRQ-2026-0413"] },
];

/**
 * Agenda board rows for a session — the sp_get_crq_cab_agenda_v2 shape.
 * Covers the three decisions the board can show plus an untouched row, so the
 * mock exercises every branch of the decision column.
 */
export const buildAgendaBoard = (sessionId: string): CabAgendaRow[] => {
  const session = MOCK_CAB_SESSIONS.find((s) => s.id === sessionId);
  const date = session?.date ?? "2026-06-14";
  const chair = session?.host ?? "Rahul Sharma";
  const base = { cabSessionDate: date, chairedBy: chair };
  return [
    { mappingId: 1, circle: "NCR",  crqNo: "CRQ000005097287", nodeName: "NDL-2B2-901-1AG-A-ASR1XXXR064", changeImpact: "NSA", cabDecision: "APPROVED",    ...base },
    { mappingId: 2, circle: "UP-E", crqNo: "CRQ000005097397", nodeName: null,                            changeImpact: "SA",  cabDecision: "PENDING",     ...base },
    { mappingId: 3, circle: null,   crqNo: "CRQ000005097484", nodeName: "BHA-MPL-LTE-PE-RTR-42-163",     changeImpact: "NSA", cabDecision: "REJECTED",    ...base },
    { mappingId: 4, circle: "WB",   crqNo: "TESTCRQ",         nodeName: null,                            changeImpact: "NSA", cabDecision: "RESCHEDULED", ...base },
  ];
};

export const buildImplementation = (
  crqId: string = "CRQ-2026-0418",
  crqs: Crq[] = MOCK_CRQS
): ImplementationDetail => {
  const crq: Crq = crqs.find((c) => c.crqNo === crqId) ?? {
    serviceApprovalId: 418,
    crqNo: "CRQ-2026-0418",
    planId: "PLAN-2026-104",
    domainName: "Optics",
    circleCode: "TN",
    currentStage: "EXECUTION",
    serviceCode: "TX",
    stageStatus: "COMPLETED",
    serviceApprovalStatus: "APPROVED",
    changeImpact: "NSA",
    slaPercentage: 76,
    approverName: "Meera Iyer",
    assignStartTime: "2026-06-13T01:00:00",
    assignedToMe: false,
    raisedBy: "Vikram Rao",
  };
  return {
    crq,
    noc: { tollFree: "1800-419-8181", email: "noc@airtel.com", called: false },
    rings: MOCK_SE_RINGS.map((r) => ({ ...r })),
  };
};

export const buildAnalytics = (): AdminAnalytics => ({
  total: 120,
  approved: 95,
  rejected: 14,
  breachRisk: 11,
  heat: [
    { domain: "IP Core",  breach: 4, total: 30, level: "mid"  },
    { domain: "Optics",   breach: 1, total: 22, level: "low"  },
    { domain: "Packet",   breach: 6, total: 18, level: "high" },
    { domain: "Embedded", breach: 0, total: 15, level: "low"  },
    { domain: "Mobility", breach: 0, total: 35, level: "low"  },
  ],
});

// ── Journey builder — fixed approval chain / parallel tracks / remarks,
//    matching the backend's dummy sp_get_crq_journey_* procedures. ──────────
export const buildJourney = (
  crqId: string,
  crqs: Crq[] = MOCK_CRQS
): CrqJourney | null => {
  const crq = crqs.find((c) => c.crqNo === crqId);
  if (!crq) return null;

  return {
    crq,
    pipeIndex: 3,
    approvalChain: [
      { level: "L1", label: "Authorization", who: "Priya Nair",   state: "completed"   },
      { level: "L2", label: "Scheduling",    who: "Sanjay Gupta", state: "completed"   },
      { level: "L3", label: "Validation",    who: "Meera Iyer",   state: "in_progress" },
      { level: "L4", label: "CAB Review",    who: "Rahul Sharma", state: "pending"     },
      { level: "L5", label: "Implementation",who: "Arjun Nair",   state: "not_started" },
    ],
    parallelTracks: [
      { track: "Security", approver: "Deepak Verma", role: "Security Lead",   status: "approved",  color: "green",  time: "2026-06-10T09:00:00" },
      { track: "Network",  approver: "Anita Desai",   role: "Network Lead",   status: "reviewing", color: "blue",   time: "2026-06-10T10:30:00" },
      { track: "Business", approver: "Karan Mehta",   role: "Business Owner", status: "queued",    color: "orange", time: "" },
    ],
    remarks: [
      { who: "Priya Nair",   role: "Requester",   stage: "VALIDATE",            comment: "Pre-checks complete, redundancy verified.", time: "2026-06-09T08:05:00" },
      { who: "Sanjay Gupta", role: "Domain SPOC", stage: "SCHEDULING_APPROVAL", comment: "Window confirmed with B2B SPOC.",           time: "2026-06-10T12:04:00" },
    ],
  };
};
