export interface LeaveEmployee {
  id: string;
  name: string;
  role: string;
  type: "Sick Leave" | "Casual Leave" | "WFH" | "Vacation";
  avatar?: string;
}

export const onLeaveEmployees: LeaveEmployee[] = [
  {
    id: "1",
    name: "Rohan Singh",
    role: "Frontend Developer",
    type: "Sick Leave",
  },
  {
    id: "2",
    name: "Anita Sharma",
    role: "HR Executive",
    type: "Vacation",
  },
  {
    id: "3",
    name: "Vikram Patel",
    role: "QA Engineer",
    type: "Casual Leave",
  },
  {
    id: "4",
    name: "Vikram Patel",
    role: "QA Engineer",
    type: "Casual Leave",
  },
  {
    id: "5",
    name: "Vikram Patel",
    role: "QA Engineer",
    type: "Casual Leave",
  },
  {
    id: "6",
    name: "Vikram Patel",
    role: "QA Engineer",
    type: "Casual Leave",
  },
];
