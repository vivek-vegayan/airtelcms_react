/** The "i" note of every card: what it shows, how it is worked out, and how to read it. */
export interface P1InfoNote {
  what: string;
  how: string;
  read: string;
}

export const P1_INFO = {
  "p-grid": {
    what: "Every CRQ that is still open right now, by team and by how many days old it is.",
    how: "Age = now minus the time the CRQ was raised. With CCB = it is in one of the first four stages; With SE = one of the last three. Slot Lapse = the booked slot is already over and the CRQ is still open. Those CRQs sit in the Slot Lapse column instead of an age column, so each CRQ is counted once and every row adds up to its Total.",
    read: "Shaded cells hold the most CRQs. Slot Lapse and the right-hand columns are the ones to chase first. The date range does not change this card. Click any number for the CRQs.",
  },
  "p-team": {
    what: "One line per team: what is open now, and what finished in the date range.",
    how: "Open, With CCB and With SE are counted right now. Closed, Cancelled and Rejected are CRQs that ended inside the date range. Total = Open + Closed + Cancelled + Rejected, so every row adds up.",
    read: "A team with a big Open and a small Closed is falling behind. Click any number for the CRQs.",
  },
  "r-kpis": {
    what: "The headline numbers. The first row is for the date range you picked; the second row is right now.",
    how: "Received = raised in the range. Done = closed in the range. Cancelled / Rejected = stopped in the range. Open right now = not closed, cancelled or rejected. Assigned = a person is named on the stage the CRQ is in (for Execution the booked engineer also counts). Unassigned = nobody is named. Assigned + Unassigned = Open right now.",
    read: "The small line shows the trend across the range. ▲ / ▼ compares with the same length of time just before. Click a box for the CRQs.",
  },
  "r-exec": {
    what: "Every CRQ received in the date range, put in one box by where it stands now.",
    how: "Completed = closed. Failed and Rescheduled come from the CRQ's current status. Cancelled / Rejected = stopped. Open = everything else still open. Each CRQ is in one box only, so the boxes add up to Total.",
    read: "Click a box to split it by stage in the table below (the stage it is in now, or the stage where it was stopped). Click a number for the CRQs.",
  },
  "r-period": {
    what: "The same counts for the last 24 hours, 7 days and 30 days, side by side.",
    how: "Received by the date raised. Done on planned night = closed and never moved to another night. Done after reschedule = closed after being moved at least once. Cancelled / Rejected by the date stopped. Failed = a FAIL was recorded in that time. Rescheduled = moved to another night in that time.",
    read: "Read across a row to see if things are getting better or worse. The highlighted column is the range you picked; a Custom range gets its own column.",
  },
  "r-daily": {
    what: "The daily status sheet: what came in, what each side cancelled or closed, what moved from CCB to SE, and what each side still had pending.",
    how: "One column per day (4-hour block for 24 h, week for longer ranges, month beyond 6 months). CCB bin = first four stages, SE bin = last three. MOP transferred to SE = MOP Validation finished. Pending = CRQs sitting in that bin at the end of the column.",
    read: "Watch the two pending rows. If they keep growing day after day, that bin is falling behind. Click a number for the CRQs.",
  },
  "r-flow": {
    what: "How CRQs move along: received in CCB, handed to SE, and closed by SE.",
    how: "Received in CCB = raised. Moved to SE = MOP Validation finished. SE to closed = CRQ closed. Counted in each step of the date range.",
    read: "If the three bars stay about the same height, work is flowing. Received taller than Moved to SE = CCB is building a queue. Moved to SE taller than SE to closed = SE is.",
  },
  "r-inout": {
    what: "CRQs received against CRQs done, step by step through the range.",
    how: "Received = raised in that step. Done = closed in that step.",
    read: "Done taller than Received = we are catching up. Received taller for many steps in a row = we are falling behind.",
  },
  "r-cfn": {
    what: "Cancelled CRQs, split by who had them when they were cancelled.",
    how: "Stage at cancel in the first four stages = CCB, in the last three = SE. Counted by the cancel date in the range. Rejected CRQs are shown in the table.",
    read: "Click a part of the ring for the CRQs.",
  },
  "r-cmon": {
    what: "Cancelled and rejected CRQs, month by month.",
    how: "Counted by the month the cancel or reject happened. The current month is not over yet.",
    read: "Use 6 or 12 months on the card. This card does not follow the date range at the top.",
  },
  "r-why": {
    what: "The reasons written when CRQs were cancelled or rejected, most common first.",
    how: "Reason text exactly as stored with the cancel. Empty = Not recorded. Counted by the cancel date in the range.",
    read: "The number is count · share. Hover a bar for the running total — the first few reasons usually explain most stops.",
  },
  "r-where": {
    what: "The stage each CRQ was in when it was cancelled or rejected.",
    how: "The stage saved with the cancel; if it is empty, the stage the CRQ was in at that time. Counted by the cancel date in the range.",
    read: "Many stops early (CRQ Review, Impact Analysis) = requests come in incomplete. Many stops late (Scheduling, Execution) = plans change close to the night.",
  },
  "r-circle": {
    what: "Cancelled and rejected CRQs for each circle — or each region on the Region tab — with the most common reason.",
    how: "Grouped by the CRQ's circle (or the region of that circle) and counted by the cancel date in the range. Share = this row's total ÷ all stopped CRQs.",
    read: "Use the Circle / Region tab on the card. Sorted by total, so the one with the most stops is on top. Click a number for the CRQs.",
  },
  "r-trend7": {
    what: "The last 7 days, day by day: CRQs received, closed, cancelled and rejected, and how many were still open at the end of each day.",
    how: "Received by the date raised. Closed by the date closed. Cancelled and Rejected are counted separately, by the date stopped. Open at day end = raised before the end of that day and not closed, cancelled or rejected by then. Today runs up to now.",
    read: "Always the last 7 days — the date range at the top does not change it; the filters do. A rising Open number means more is coming in than going out. Click a bar or a number for the CRQs.",
  },
  "r-ct": {
    what: "CRQs received in the date range, split by team and circle — or by team and region on the Region tab.",
    how: "Circle = the circle stored on the CRQ (one circle per CRQ, so every CRQ is counted once). Region = the region that circle belongs to. Team = the CRQ's team. Counted by the date raised. Empty circle = Circle not set.",
    read: "Use the Circle / Region tab on the card. Read across a row for one team, down a column for one circle or region. Darker cells hold more CRQs. Click a number for the CRQs.",
  },
  "r-geo": {
    what: "Circle-wise or region-wise view of CRQ work: what came in, what finished and how, and what is still open.",
    how: "Received = raised in the range. Done = closed in the range. Cancelled and Rejected = stopped in the range. Failed = a FAIL was recorded in the range. Rescheduled = moved to another slot in the range. Open now = still open right now. Region comes from the circle → region mapping. These are separate counts, not parts of one total.",
    read: "Use the Circle / Region tab on the card. The chart shows Received against Done and Open now; the table has every column. Click a number for the CRQs.",
  },
  "r-dn": {
    what: "Day slots against Night slots: how many CRQs closed, completed, were cancelled, rejected or failed.",
    how: "Night = the current booking is on the N shift; any other shift = Day. CRQs never given a slot (stopped before scheduling) are shown as No slot. Closed = CRQ closed in the range. Completed = Execution finished in the range (closure may still be pending). Cancelled and Rejected = stopped in the range. Failed = a FAIL recorded in the range.",
    read: "Compare the two bars in each group. A much higher Failed or Cancelled share on one side points at that shift. Click a bar for the CRQs.",
  },
  "r-rsr": {
    what: "Why CRQs were moved to another slot, month by month.",
    how: "Each reschedule saved with its reason. The most common reasons in the months shown get their own colour; all others are grouped as Other. Counted as CRQs: a CRQ moved twice in one month for the same reason counts once. Empty reason = Not recorded.",
    read: "A reason whose band grows month after month is a rising problem. Use 6 or 12 months on the card; this card does not follow the date range. Click a bar part for the CRQs.",
  },
  "r-rsm": {
    what: "How many CRQs were rescheduled each month, and how many moves that took.",
    how: "CRQs rescheduled = different CRQs moved at least once in that month. Moves = all moves in that month (one CRQ can move more than once).",
    read: "Bars = CRQs. Hover for the number of moves. Use 6 or 12 months on the card; this card does not follow the date range. Click a bar for the CRQs.",
  },
  "t-tasks": {
    what: "Hours each person worked on each task in the date range, and how much of their rostered shift time that used (Utilization %).",
    how: "A task = one stage of one CRQ, counted when it is finished in the range. Person = who did it (if empty, who it was assigned to). Hours = picked up → finished, minus time on hold. On hold is shown in its own column. Execution = the booked slot window. Team = the team of most of the engineer's tasks. Rostered hrs = the part of each rostered shift that falls inside the date range; week offs and approved full-day leave are left out, half-day leave counts half a shift. Utilization % = Total hrs ÷ Rostered hrs × 100.",
    read: "Sorted by total hours. Under 50% = spare capacity; over 100% = work done outside the rostered shift. Blank = no roster entry in the range. Click hours or tasks for the CRQs.",
  },
  "t-type": {
    what: "Total hours spent on each task type in the date range.",
    how: "The same hours as the engineer table, added up per task. Average = total minutes ÷ tasks finished.",
    read: "CCB tasks and SE tasks have their own colour. The table also shows the usual minutes one task takes.",
  },
  "t-req": {
    what: "Who raised the CRQs received in the date range, and where those CRQs stand now.",
    how: "Requestor type stored with each CRQ in Cygnet. Empty = Not recorded. Open / Done / Cancelled / Rejected are as of now.",
    read: "Click a part of the ring or a number for the CRQs.",
  },
  "t-nplan": {
    what: "CRQs booked on each night, and where they stand now.",
    how: "Night = the date of the booked slot start; a slot starting before 06:00 belongs to the night before. Counts every CRQ whose current booked night is that date, open or closed. Cancelled and rejected CRQs are left out. Done = closed. Still to run = open and the booked window is not over yet. Slot Lapse = open but the booked window is already over.",
    read: "Tall bars ahead = busy nights coming. Slot Lapse = CRQs whose booked slot is over and still need action. This card has its own night selector and does not follow the date range or the Side filter. Click a bar for the CRQs.",
  },
  "t-neng": {
    what: "For each night: how many engineers are booked on CRQs, against how many are on duty in the roster.",
    how: "Booked = different engineers named on the CRQs planned for that night. On roster = people of the selected teams who have a roster entry that date, not on week off and not on approved full-day leave. CRQs per engineer = CRQs planned ÷ engineers booked.",
    read: "Booked close to On roster = little spare capacity that night. A high CRQs-per-engineer = a heavy night for the people booked. Own night selector; the date range, Circle (roster) and Side filters do not apply. Click the Booked bar for the CRQs.",
  },
  "t-book": {
    what: "For each engineer and each date: minutes booked against minutes available, shown as booked / available (for example 360/480).",
    how: "Booked = the time the engineer is booked for on that shift date: stage assignments (assigned start → assigned end) plus the execution slot of each CRQ booked on them. Cancelled and rejected CRQs are left out of execution bookings. A slot starting before 06:00 counts on the shift of the day before. Available = the activity window of the rostered shift. WO = week off, Leave = approved full-day leave; both have 0 available. Level and Vendor come from the engineer's user record.",
    read: "Green = under 80% booked, amber = 80–100%, red = booked more than available. Empty cells (0/480) are free capacity. The Total row adds all engineers shown. Uses the night selector of this section; the date range and Circle filter do not apply, Team and Side do. Click a cell for the CRQs booked on that engineer that day.",
  },
} satisfies Record<string, P1InfoNote>;

export type P1InfoKey = keyof typeof P1_INFO;
