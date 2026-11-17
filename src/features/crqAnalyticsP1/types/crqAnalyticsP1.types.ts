// Mirrors com.vegayan.airtelmanagement.crqanalyticsp1.dto (base path /crq-analytics-p1).
// One response type per endpoint; one endpoint per CRQ_AN_SP_* procedure. Every array is one
// result set of that procedure, in procedure order. Counts come from SQL SUM()s, so an empty
// group can arrive as null - readers go through num().
// Date-times are "YYYY-MM-DD HH:mm:ss" and dates "YYYY-MM-DD", both in IST.

type N = number | null;
type S = string | null;

/** The six filters every Phase 1 procedure takes first (CSV strings; omitted = all). */
export interface P1FilterParams {
  vertical?: string;
  function?: string;
  domain?: string;
  subDomain?: string;
  circle?: string;
  stage?: string;
}

export interface P1RangeParams extends P1FilterParams {
  /** "YYYY-MM-DD HH:mm:ss". Range is [from, to). */
  from: string;
  to: string;
}

/* ── GET /filters · CRQ_AN_SP_FILTERS ─────────────────────────────────── */
export interface P1OrgNodeDto {
  verticalId: number;
  verticalName: string;
  functionId: number;
  functionName: string;
  domainId: number;
  domainName: string;
  subDomainId: number;
  subDomainName: string;
}
export interface P1CircleDto {
  circle: string;
  crqs: N;
}
export interface P1StageDto {
  stage: string;
  stageName: S;
  stageNo: number;
  side: string;
}
export interface P1DataStatusDto {
  dataAsOf: S;
  lastRunStatus: S;
  lastRunMessage: S;
  valuesNotMapped: N;
}
export interface P1FiltersResponse {
  orgTree: P1OrgNodeDto[];
  circles: P1CircleDto[];
  stages: P1StageDto[];
  dataStatus: P1DataStatusDto | null;
}

/* ── GET /pendency · CRQ_AN_SP_P1_PENDENCY ────────────────────────────── */
export interface P1BandDto {
  bandNo: number;
  bandLabel: string;
}
export interface P1AgeCellDto {
  teamId: N;
  team: string;
  bandNo: number;
  crqs: N;
}
export interface P1TeamOpenDto {
  teamId: N;
  team: string;
  openTotal: N;
  withCcb: N;
  withSe: N;
  slotLapse: N;
  oldestDays: N;
}
export interface P1TeamStatusDto {
  teamId: N;
  team: string;
  total: N;
  openNow: N;
  withCcb: N;
  withSe: N;
  closed: N;
  cancelled: N;
  rejected: N;
  cancelTypeUnknown: N;
}
export interface P1PendencyResponse {
  bands: P1BandDto[];
  ageGrid: P1AgeCellDto[];
  teamTotals: P1TeamOpenDto[];
  teamStatus: P1TeamStatusDto[];
}

/* ── GET /results · CRQ_AN_SP_P1_RESULTS ──────────────────────────────── */
export interface P1KeyNumbersDto {
  fromAt: S;
  toAt: S;
  prevFromAt: S;
  received: N;
  done: N;
  cancelled: N;
  rejected: N;
  cancelTypeUnknown: N;
  movedToSe: N;
  openNow: N;
  openAtStart: N;
  withCcbNow: N;
  withSeNow: N;
  assignedNow: N;
  unassignedNow: N;
  prevReceived: N;
  prevDone: N;
  prevCancelled: N;
  prevRejected: N;
}
export type P1StepUnit = "H4" | "DAY" | "WEEK" | "MONTH";
export interface P1StepDto {
  bucketNo: number;
  step: P1StepUnit;
  bucketStart: string;
  bucketEnd: string;
  received: N;
  done: N;
  cancelled: N;
  rejected: N;
  cancelTypeUnknown: N;
  movedToSe: N;
  ccbStopped: N;
  ccbClosed: N;
  ccbPendingAtEnd: N;
  seStopped: N;
  seClosed: N;
  sePendingAtEnd: N;
  openAtEnd: N;
}
export interface P1ExecCellDto {
  status: string;
  stageNo: number;
  crqs: N;
}
export interface P1PeriodRowDto {
  item: string;
  last24h: N;
  last7d: N;
  last30d: N;
  selected: N;
  from24h: S;
  from7d: S;
  from30d: S;
  windowEnd: S;
}
export interface P1StopCounts {
  cancelled: N;
  rejected: N;
  cancelTypeUnknown: N;
  total: N;
}
export interface P1StopSideDto extends P1StopCounts {
  side: string;
}
export interface P1StopMonthDto extends P1StopCounts {
  month: string;
}
export interface P1StopReasonDto extends P1StopCounts {
  reason: string;
}
export interface P1StopStageDto extends P1StopCounts {
  stageNo: number;
  stage: string;
  side: string;
}
export interface P1StopGeoDto extends P1StopCounts {
  circle: S;
  region: S;
  mainReason: S;
  mainReasonCrqs: N;
}
export interface P1ResultsResponse {
  keyNumbers: P1KeyNumbersDto | null;
  steps: P1StepDto[];
  executive: P1ExecCellDto[];
  periods: P1PeriodRowDto[];
  stopBySide: P1StopSideDto[];
  stopByMonth: P1StopMonthDto[];
  stopByReason: P1StopReasonDto[];
  stopByStage: P1StopStageDto[];
  stopByCircle: P1StopGeoDto[];
}

/* ── GET /breakdown · CRQ_AN_SP_P1_BREAKDOWN ──────────────────────────── */
export interface P1CircleTeamDto {
  circle: S;
  region: S;
  teamId: N;
  team: string;
  crqs: N;
}
export interface P1GeoStatusDto {
  circle: S;
  region: S;
  received: N;
  done: N;
  openNow: N;
  cancelled: N;
  rejected: N;
  failed: N;
  rescheduled: N;
}
export type P1ShiftKind = "DAY" | "NIGHT" | "NO_SLOT";
export interface P1DayNightDto {
  shift: P1ShiftKind;
  closed: N;
  completed: N;
  cancelled: N;
  rejected: N;
  failed: N;
}
export interface P1RescheduleReasonDto {
  month: string;
  reason: string;
  crqs: N;
  moves: N;
}
export interface P1RescheduleMonthDto {
  month: string;
  crqsRescheduled: N;
  moves: N;
}
export interface P1TrendDayDto {
  day: string;
  dayEnd: string;
  received: N;
  closed: N;
  cancelled: N;
  rejected: N;
  openAtEnd: N;
}
export interface P1BreakdownMetaDto {
  months: N;
  monthFrom: S;
  topReasons: S;
}
export interface P1BreakdownResponse {
  circleTeam: P1CircleTeamDto[];
  circleStatus: P1GeoStatusDto[];
  regionStatus: P1GeoStatusDto[];
  dayNight: P1DayNightDto[];
  rescheduleReasons: P1RescheduleReasonDto[];
  rescheduleMonths: P1RescheduleMonthDto[];
  trend7: P1TrendDayDto[];
  meta: P1BreakdownMetaDto | null;
  stopByRegion: P1StopGeoDto[];
}

/* ── GET /teams · CRQ_AN_SP_P1_TEAMS ──────────────────────────────────── */
export interface P1EngineerHoursDto {
  personOlmid: string;
  employeeName: S;
  teamId: N;
  team: S;
  sideByWork: "CCB" | "SE" | "BOTH";
  crqReviewH: N;
  impactAnalysisH: N;
  mopCreationH: N;
  mopValidationH: N;
  schedulingOfActivityH: N;
  executionH: N;
  closureH: N;
  totalH: N;
  onHoldH: N;
  tasksDone: N;
  rosterH: N;
  utilPct: N;
}
export interface P1TaskTypeDto {
  stageNo: number;
  task: string;
  side: string;
  tasksDone: N;
  hours: N;
  avgMinPerTask: N;
  sharePct: N;
}
export interface P1RequestorDto {
  requestorType: string;
  received: N;
  openNow: N;
  done: N;
  cancelled: N;
  rejected: N;
  cancelTypeUnknown: N;
  sharePct: N;
}
export interface P1TeamsResponse {
  engineers: P1EngineerHoursDto[];
  taskTypes: P1TaskTypeDto[];
  requestors: P1RequestorDto[];
}

/* ── GET /nights · CRQ_AN_SP_P1_NIGHTS ────────────────────────────────── */
export interface P1NightDto {
  nightDate: string;
  weekday: S;
  plannedCrqs: N;
  done: N;
  toRun: N;
  slotLapseOpen: N;
  engineersBooked: N;
  engineersOnRoster: N;
  crqsPerEngineer: N;
}
export interface P1BookingDto {
  personOlmid: string;
  employeeName: S;
  jobLevel: S;
  vendorCompany: S;
  teamId: N;
  team: S;
  side: S;
  shiftDate: string;
  shiftName: S;
  dayType: "WORK" | "WEEK_OFF" | "LEAVE" | "NO_ROSTER";
  availableMin: N;
  bookedMin: N;
  crqs: N;
}
export interface P1NightsResponse {
  nights: P1NightDto[];
  bookings: P1BookingDto[];
}
export interface P1NightsParams extends P1FilterParams {
  nightsFrom: string;
  nightsTo: string;
}

/* ── GET /crqs · CRQ_AN_SP_LIST ───────────────────────────────────────── */
export interface P1CrqRowDto {
  crqNo: string;
  team: S;
  domainName: S;
  circle: S;
  region: S;
  shift: S;
  currentStage: S;
  stageNo: number;
  stageLabel: S;
  side: S;
  currentStatus: S;
  result: string;
  createdAt: S;
  ccbDoneAt: S;
  endAt: S;
  ageDays: N;
  night: S;
  engineerName: S;
  rescheduleCount: N;
  cancelReason: S;
  person: S;
  task: S;
  taskDoneAt: S;
  taskHours: N;
  taskHoldHours: N;
}
export interface P1CrqListResponse {
  totalRows: number;
  offset: number;
  limit: number;
  rows: P1CrqRowDto[];
}
export interface P1CrqListParams extends P1RangeParams {
  /** p_key / p_value of CRQ_AN_SP_LIST, e.g. key "ENDED", value "DONE". */
  key: string;
  value: string;
  offset: number;
  limit: number;
}

/* ── GET /journey · CRQ_AN_SP_JOURNEY ─────────────────────────────────── */
export interface P1JourneyHeaderDto {
  crqNo: string;
  planType: S;
  verticalName: S;
  functionName: S;
  domainName: S;
  subDomainName: S;
  circle: S;
  region: S;
  currentStage: S;
  stageNo: number;
  side: S;
  currentStatus: S;
  result: string;
  isOpen: boolean | null;
  createdAt: S;
  ccbDoneAt: S;
  endAt: S;
  cancelStage: S;
  cancelReason: S;
  slotStart: S;
  slotEnd: S;
  firstSlotStart: S;
  engineerName: S;
  shiftLetter: S;
  dayNight: S;
  rescheduleCount: N;
  requestorType: S;
  ageDays: N;
}
export interface P1JourneyStageDto {
  stageNo: number;
  stage: S;
  side: S;
  team: S;
  assignedName: S;
  performedName: S;
  enteredAt: S;
  pickedAt: S;
  doneAt: S;
  waitMin: N;
  workMin: N;
  holdMin: N;
}
export interface P1JourneyMoveDto {
  moveNo: N;
  movedAt: S;
  src: S;
  reason: S;
  oldSlotStart: S;
  newSlotStart: S;
}
export interface P1JourneyFailDto {
  eventAt: S;
  reason: S;
  performedBy: S;
}
export interface P1JourneyCancelDto {
  cancelledAt: S;
  cancelledStage: S;
  cancellationOrRejection: S;
  mappedType: S;
  cancellationReason: S;
  cancelledBy: S;
}
export interface P1JourneyResponse {
  header: P1JourneyHeaderDto | null;
  stages: P1JourneyStageDto[];
  moves: P1JourneyMoveDto[];
  failures: P1JourneyFailDto[];
  cancelRows: P1JourneyCancelDto[];
}

/* ── UI state ─────────────────────────────────────────────────────────── */
export type P1View = "pendency" | "results" | "teams";
export type P1Side = "" | "CCB" | "SE";

/** A clickable number: which CRQ_AN_SP_LIST key / value returns the CRQs behind it. */
export interface P1Drill {
  title: string;
  key: string;
  value?: string | number;
  /** Shown under the title instead of the page range (one step, one month ...). */
  sub?: string;
  /** Own window in epoch ms, when the number is not for the page range. */
  from?: number;
  to?: number;
  /** The key ignores the range (month / day keys): a wide window is sent. */
  noRange?: boolean;
  /** Counted "right now", not for the range. */
  now?: boolean;
  /** Filter override for this click: one team row. */
  team?: number | null;
}
