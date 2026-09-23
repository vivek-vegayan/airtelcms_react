import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

export const getMonthRange = (date: Dayjs) => {
  return {
    startDate: date.startOf("month").format("YYYY-MM-DD"),
    endDate: date.endOf("month").format("YYYY-MM-DD"),
  };
};

export const getWeekRange = (date: Dayjs) => {
  return {
    startDate: date.startOf("isoWeek").format("YYYY-MM-DD"),
    endDate: date.endOf("isoWeek").format("YYYY-MM-DD"),
  };
};