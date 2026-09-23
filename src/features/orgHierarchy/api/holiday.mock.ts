export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO string
  type: "National" | "Optional" | "Company";
}

export const upcomingHolidays: Holiday[] = [
  {
    id: "1",
    name: "Republic Day",
    date: "2026-01-26",
    type: "National",
  },
  {
    id: "2",
    name: "Holi",
    date: "2026-03-04",
    type: "Optional",
  },
  {
    id: "3",
    name: "Good Friday",
    date: "2026-04-03",
    type: "National",
  },
  {
    id: "4",
    name: "Company Annual Day",
    date: "2026-05-12",
    type: "Company",
  },
];
