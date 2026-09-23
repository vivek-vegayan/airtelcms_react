import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  useCancelRescheduleMutation,
  useConfirmRescheduleSlotMutation,
  useGetRescheduleContextQuery,
  useGetRescheduleReasonOptionsQuery,
  useInitiateRescheduleMutation,
  useLazyGetRescheduleCalendarQuery,
  useLazyGetRescheduleSlotsQuery,
  useMoveRescheduleStageMutation,
  useSaveRescheduleDateMutation,
} from "../../../api/rescheduleApiSlice";
import type {
  CrqStageEnum,
  RescheduleAttemptStatus,
  RescheduleCalendarModel,
  RescheduleConfirmResponse,
  RescheduleSlot,
} from "../../../types/reschedule.types";

/** Wizard steps, in the order the stepper renders them. */
export const RESCHEDULE_STEPS = [
  "Reschedule Details",
  "Select Date",
  "Move Stage",
  "Engineer Slot",
  "Confirmation",
] as const;

export const STEP_DETAILS = 0;
export const STEP_DATE = 1;
export const STEP_STAGE = 2;
export const STEP_SLOT = 3;
export const STEP_CONFIRM = 4;
/** Not a stepper entry - the terminal screen shown after confirm succeeds. */
export const STEP_SUCCESS = 5;

/**
 * Where an attempt that was left in flight should re-open. Mirrors the
 * procedures' own guards: SAVE_DATE only accepts INITIATED/DATE_SELECTED,
 * MOVE_STAGE only DATE_SELECTED, GET_SLOTS/CONFIRM_SLOT only STAGE_MOVED.
 */
const resumeStep = (
  status: RescheduleAttemptStatus | null,
  desiredDate: string | null,
): number => {
  if (status === "STAGE_MOVED") return STEP_SLOT;
  // DATE_SELECTED without a stored date is an inconsistent row - send the user
  // back to pick one rather than into a move that would be rejected.
  if (status === "DATE_SELECTED" && desiredDate) return STEP_STAGE;
  return STEP_DATE;
};

const splitDates = (csv: string | null | undefined): Set<string> =>
  new Set(
    (csv ?? "")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean),
  );

/** Both the initiate response and the calendar refresh carry these six fields. */
const toCalendarModel = (source: {
  message?: string | null;
  startDate: string | null;
  endDate: string | null;
  busyDates: string | null;
  weekendDates: string | null;
  holidayDates: string | null;
  networkFreeDates: string | null;
}): RescheduleCalendarModel => ({
  message: source.message ?? null,
  startDate: source.startDate,
  endDate: source.endDate,
  busyDates: splitDates(source.busyDates),
  weekendDates: splitDates(source.weekendDates),
  holidayDates: splitDates(source.holidayDates),
  networkFreezeDates: splitDates(source.networkFreeDates),
});

const errorMessage = (err: unknown, fallback: string): string =>
  (err as { data?: { message?: string } })?.data?.message || fallback;

interface UseRescheduleWizardArgs {
  open: boolean;
  crqId: number | null;
  onCompleted?: () => void;
}

/**
 * Owns every piece of reschedule wizard state and the order the procedures run
 * in. The dialog and its step components stay presentational, so a step can be
 * reordered or re-styled without touching the call sequence.
 *
 * Request budget for a full pass: context, initiate, save-date, move-stage,
 * confirm-slot - five calls, one per user action. The calendar arrives with
 * initiate and the slots with move-stage, so neither has a fetch of its own;
 * the lazy calendar/slots endpoints fire only on an explicit Refresh, or when
 * an interrupted attempt is resumed and the step's data was never in memory.
 */
export function useRescheduleWizard({ open, crqId, onCompleted }: UseRescheduleWizardArgs) {
  const [step, setStep] = useState<number>(STEP_DETAILS);
  // The furthest step reached this dialog session - the stepper's own
  // indicator uses this for its checkmarks; navigation itself is strictly
  // sequential (Continue only), the stages are never clickable.
  const [furthestStep, setFurthestStep] = useState<number>(STEP_DETAILS);
  // Reason for reschedule: a fixed option from sp_reschedule_reason_drop_down,
  // plus optional free text the user can add alongside it.
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reasonNote, setReasonNote] = useState("");
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [desiredDate, setDesiredDate] = useState<string | null>(null);
  const [toStage, setToStage] = useState<CrqStageEnum | null>(null);
  const [selectedSlotLabel, setSelectedSlotLabel] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<RescheduleConfirmResponse | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);
  // Where a previous session's still-open attempt should land once the user
  // presses Continue on Details - every reopen shows Details first (never an
  // auto skip-ahead) and only jumps once they choose to move on.
  const [resumeTarget, setResumeTarget] = useState<number | null>(null);
  /**
   * True while the user is re-picking a date for an attempt whose stage move is
   * already committed, so submitDate re-cuts the offer window instead of
   * walking on to the Move Stage step.
   */
  const [reofferingDate, setReofferingDate] = useState(false);

  // Held locally because they arrive as part of a mutation's response, not from
  // a query cache - a refresh simply overwrites them.
  const [calendar, setCalendar] = useState<RescheduleCalendarModel | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [slots, setSlots] = useState<RescheduleSlot[]>([]);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const resetAll = useCallback(() => {
    setStep(STEP_DETAILS);
    setFurthestStep(STEP_DETAILS);
    setSelectedReason(null);
    setReasonNote("");
    setRescheduleId(null);
    setDesiredDate(null);
    setToStage(null);
    setSelectedSlotLabel(null);
    setConfirmation(null);
    setStepError(null);
    setResumed(false);
    setResumeTarget(null);
    setReofferingDate(false);
    setCalendar(null);
    setCalendarError(null);
    setSlots([]);
    setSlotsMessage(null);
    setSlotsError(null);
  }, []);

  // A fresh open always starts from a clean slate; the resume effect below
  // then re-seeds it from whatever the backend says is still in flight.
  useEffect(() => {
    if (open) resetAll();
  }, [open, resetAll]);

  /* ── Step 1 (read): CRQ_SP_RESCHEDULE_CONTEXT ─────────────────────────── */
  const {
    data: context,
    isFetching: isContextLoading,
    isError: isContextError,
    error: contextError,
  } = useGetRescheduleContextQuery({ crqId: crqId as number }, { skip: !open || !crqId });

  /* ── Step 1 (read): sp_reschedule_reason_drop_down ────────────────────── */
  const { data: reasonOptions, isFetching: isReasonOptionsLoading } =
    useGetRescheduleReasonOptionsQuery(undefined, { skip: !open });

  /* ── Writes ───────────────────────────────────────────────────────────── */
  const [initiate, { isLoading: isInitiating }] = useInitiateRescheduleMutation();
  const [saveDate, { isLoading: isSavingDate }] = useSaveRescheduleDateMutation();
  const [moveStage, { isLoading: isMovingStage }] = useMoveRescheduleStageMutation();
  const [confirmSlot, { isLoading: isConfirming }] = useConfirmRescheduleSlotMutation();
  const [cancelRescheduleAttempt, { isLoading: isCancelling }] = useCancelRescheduleMutation();

  /* ── Refresh-only reads ───────────────────────────────────────────────── */
  const [fetchCalendar, { isFetching: isCalendarLoading }] = useLazyGetRescheduleCalendarQuery();
  const [fetchSlots, { isFetching: isSlotsLoading }] = useLazyGetRescheduleSlotsQuery();

  const isBusy = isInitiating || isSavingDate || isMovingStage || isConfirming;

  /** Recompute the date window for the current attempt (no new attempt row). */
  const refreshCalendar = useCallback(
    async (id?: number) => {
      const target = id ?? rescheduleId;
      if (!target) return;
      setCalendarError(null);
      try {
        const res = await fetchCalendar({ rescheduleId: target }).unwrap();
        setCalendar(toCalendarModel(res));
      } catch (err) {
        setCalendarError(errorMessage(err, "Could not load the scheduling calendar."));
      }
    },
    [rescheduleId, fetchCalendar],
  );

  /** Re-cut the offer window. Never repeats the stage move. */
  const refreshSlots = useCallback(
    async (id?: number) => {
      const target = id ?? rescheduleId;
      if (!target) return;
      setSlotsError(null);
      try {
        const res = await fetchSlots({ rescheduleId: target }).unwrap();
        setSlots(res.slots ?? []);
        setSlotsMessage(res.message ?? null);
      } catch (err) {
        setSlotsError(errorMessage(err, "Could not load engineer slots."));
      }
    },
    [rescheduleId, fetchSlots],
  );

  /** Moves the wizard forward and remembers this as the furthest point reached. */
  const goToStep = useCallback((target: number) => {
    setStep(target);
    setFurthestStep((f) => Math.max(f, target));
  }, []);

  // Adopt an attempt that a previous session left open instead of creating a
  // second one - CRQ_SP_RESCHEDULE_INITIATE would happily insert another row.
  // Every reopen still shows Reschedule Details first; the step the attempt
  // had actually reached is only applied once the user presses Continue.
  useEffect(() => {
    if (!open || resumed || step !== STEP_DETAILS || !context?.activeRescheduleId) return;
    const target = resumeStep(context.activeRescheduleStatus, context.activeDesiredDate);
    setRescheduleId(context.activeRescheduleId);
    setDesiredDate(context.activeDesiredDate ?? null);
    setToStage(context.activeToStage ?? null);
    setResumeTarget(target);
    setResumed(true);
  }, [open, resumed, step, context]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.label === selectedSlotLabel) ?? null,
    [slots, selectedSlotLabel],
  );

  /**
   * Step 1 -> 2. Reuses the resumed attempt rather than opening a second one.
   * A resumed attempt jumps straight to wherever it had actually reached
   * (`resumeTarget`); one already advanced earlier this session just goes on
   * to Select Date.
   */
  const submitDetails = useCallback(async () => {
    if (!crqId) return;
    setStepError(null);

    if (rescheduleId) {
      const target = resumeTarget ?? STEP_DATE;
      setResumeTarget(null);
      goToStep(target);
      if (target === STEP_SLOT) {
        if (slots.length === 0) void refreshSlots();
      } else if (!calendar) {
        void refreshCalendar();
      }
      return;
    }
    try {
      const res = await initiate({
        crqId,
        reason: selectedReason ?? "",
        remark: reasonNote.trim(),
      }).unwrap();
      if (!res.rescheduleId) {
        // "blocked" never reaches here (the backend raises it), so a missing id
        // means the procedure answered without creating an attempt.
        setStepError(res.message || "Reschedule could not be initiated.");
        return;
      }
      setRescheduleId(res.rescheduleId);
      // The calendar came back with the attempt; only fall back to a separate
      // fetch if the procedure could not compute it.
      if (res.startDate) setCalendar(toCalendarModel(res));
      else void refreshCalendar(res.rescheduleId);
      goToStep(STEP_DATE);
      if (res.status === "partial" && res.message) toast.warn(res.message);
    } catch (err) {
      const msg = errorMessage(err, "Reschedule could not be initiated.");
      setStepError(msg);
      toast.error(msg);
    }
  }, [
    crqId,
    selectedReason,
    reasonNote,
    rescheduleId,
    resumeTarget,
    calendar,
    slots,
    initiate,
    refreshCalendar,
    refreshSlots,
    goToStep,
  ]);

  /** Step 2 -> 3. CRQ_SP_RESCHEDULE_SAVE_DATE re-validates the future date. */
  const submitDate = useCallback(async () => {
    if (!rescheduleId || !desiredDate) return;
    setStepError(null);
    try {
      await saveDate({ rescheduleId, desiredDate }).unwrap();
      if (reofferingDate) {
        // The stage move is committed history and must never run twice - it
        // would move the CRQ back another stage and spend a second of the three
        // allowed reschedules. Only the offer window is re-cut, against the date
        // just saved; the procedure leaves the attempt at STAGE_MOVED so
        // CRQ_SP_RESCHEDULE_GET_SLOTS still accepts it.
        setReofferingDate(false);
        setSelectedSlotLabel(null);
        goToStep(STEP_SLOT);
        await refreshSlots();
        return;
      }
      goToStep(STEP_STAGE);
    } catch (err) {
      const msg = errorMessage(err, "The selected date could not be saved.");
      setStepError(msg);
      toast.error(msg);
    }
  }, [rescheduleId, desiredDate, saveDate, reofferingDate, refreshSlots, goToStep]);

  /**
   * Escape hatch from a slot step that came back empty. Sends the user back to
   * the calendar without repeating the stage move, so losing the race for the
   * last capacity on a date costs a re-pick rather than the whole attempt.
   */
  const chooseAnotherDate = useCallback(() => {
    setStepError(null);
    setSlotsError(null);
    setSelectedSlotLabel(null);
    setReofferingDate(true);
    goToStep(STEP_DATE);
    // A resumed attempt reaches the slot step without ever loading a calendar.
    if (!calendar) void refreshCalendar();
  }, [calendar, refreshCalendar, goToStep]);

  /** Step 3 -> 4. Moves the CRQ and returns the offer window in one call. */
  const submitStage = useCallback(async () => {
    if (!rescheduleId || !toStage || !crqId) return;
    setStepError(null);
    try {
      const res = await moveStage({ rescheduleId, toStage, crqId }).unwrap();
      setSlots(res.slots ?? []);
      setSlotsMessage(res.message ?? null);
      setSlotsError(null);
      goToStep(STEP_SLOT);
      // The stage move committed even when the slot computation behind it did
      // not; the Slot step's own Refresh retries just that half.
      if (res.status === "partial" && res.message) toast.warn(res.message);
    } catch (err) {
      const msg = errorMessage(err, "The CRQ stage could not be moved.");
      setStepError(msg);
      toast.error(msg);
    }
  }, [rescheduleId, toStage, crqId, moveStage, goToStep]);

  /** Step 4 -> 5. Purely local: nothing is reserved until Confirm. */
  const submitSlot = useCallback(() => {
    if (!selectedSlotLabel) return;
    setStepError(null);
    goToStep(STEP_CONFIRM);
  }, [selectedSlotLabel, goToStep]);

  /** Step 5 -> Success. CRQ_SP_RESCHEDULE_CONFIRM_SLOT does all the writes. */
  const submitConfirm = useCallback(async () => {
    if (!rescheduleId || !selectedSlotLabel || !crqId) return;
    setStepError(null);
    try {
      const res = await confirmSlot({ rescheduleId, slotLabel: selectedSlotLabel, crqId }).unwrap();
      setConfirmation(res);
      goToStep(STEP_SUCCESS);
      onCompleted?.();
    } catch (err) {
      const msg = errorMessage(err, "The reschedule could not be confirmed.");
      setStepError(msg);
      toast.error(msg);
    }
  }, [rescheduleId, selectedSlotLabel, crqId, confirmSlot, onCompleted, goToStep]);

  /**
   * Abandons an in-flight attempt via CRQ_SP_RESCHEDULE_CANCEL: restores the
   * reservation MOVE_STAGE parked and reverts the stage move, so closing the
   * dialog mid-flow never leaves a half-applied reschedule behind - the
   * attempt is either carried through to Confirm, or fully rolled back.
   * A no-op once the slot is already confirmed (nothing left to undo) or no
   * attempt was ever created.
   */
  const cancelAttempt = useCallback(async () => {
    if (!rescheduleId || !crqId || step === STEP_SUCCESS) return true;
    try {
      await cancelRescheduleAttempt({ rescheduleId, crqId }).unwrap();
      return true;
    } catch (err) {
      toast.error(errorMessage(err, "The reschedule attempt could not be cancelled."));
      return false;
    }
  }, [rescheduleId, crqId, step, cancelRescheduleAttempt]);

  return {
    // step state
    step,
    stepError,
    isBusy,
    // step 1
    context,
    isContextLoading,
    contextError: isContextError ? errorMessage(contextError, "Could not load CRQ details.") : null,
    reasonOptions: reasonOptions ?? [],
    isReasonOptionsLoading,
    selectedReason,
    setSelectedReason,
    reasonNote,
    setReasonNote,
    // step 2
    calendar,
    isCalendarLoading,
    calendarError,
    refreshCalendar,
    desiredDate,
    setDesiredDate,
    reofferingDate,
    chooseAnotherDate,
    // step 3
    toStage,
    setToStage,
    // step 4
    slots,
    slotsMessage,
    isSlotsLoading,
    slotsError,
    refreshSlots,
    selectedSlotLabel,
    setSelectedSlotLabel,
    selectedSlot,
    // step 5 / success
    confirmation,
    // actions
    submitDetails,
    submitDate,
    submitStage,
    submitSlot,
    submitConfirm,
    // navigation
    furthestStep,
    rescheduleId,
    // cancel (Close icon)
    cancelAttempt,
    isCancelling,
  };
}

export type RescheduleWizard = ReturnType<typeof useRescheduleWizard>;
