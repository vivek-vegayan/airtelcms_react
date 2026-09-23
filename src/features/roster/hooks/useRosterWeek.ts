import { useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

export const useRosterWeek = () => {
  const [weekStart, setWeekStart] = useState(dayjs().startOf("isoWeek"));

  const weekEnd = weekStart.endOf("isoWeek");

  const goNextWeek = () => setWeekStart((prev) => prev.add(1, "week"));
  const goPrevWeek = () => setWeekStart((prev) => prev.subtract(1, "week"));

  return {
    weekStart,
    weekEnd,
    startDate: weekStart.format("YYYY-MM-DD"),
    endDate: weekEnd.format("YYYY-MM-DD"),
    goNextWeek,
    goPrevWeek,
  };
};