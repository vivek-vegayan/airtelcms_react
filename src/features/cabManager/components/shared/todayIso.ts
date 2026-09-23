/**
 * Local (not UTC) yyyy-MM-dd for "today" - the earliest date a CAB slot can be
 * booked for, and the `min` of the date inputs that pick one.
 *
 * `new Date().toISOString()` would answer in UTC, which rolls the date over
 * early evening IST: a planner at 23:00 IST on the 10th would be offered the
 * 11th as "today" and blocked from the day they are actually in.
 */
export const todayIso = (): string => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
