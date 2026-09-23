
export const isFutureDate = (dateToCheck: string | Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day comparison

  const shiftDate = new Date(dateToCheck);
  shiftDate.setHours(0, 0, 0, 0);

  return shiftDate > today;
};
/** 540 → "9h", 510 → "8h 30m", 45 → "45m". */
export const formatMinutes = (mins: number | null | undefined): string => {
  const total = Math.max(0, Math.round(mins ?? 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};
