const DAYS_PER_WEEK = 7;

export interface WeekRange {
  start: Date;
  lastDay: Date;
  startMs: number;
  endMs: number;
}

export function getWeekRange(weekOffset: number): WeekRange {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + weekOffset * DAYS_PER_WEEK);

  const lastDay = new Date(start);
  lastDay.setDate(lastDay.getDate() + DAYS_PER_WEEK - 1);

  const end = new Date(start);
  end.setDate(end.getDate() + DAYS_PER_WEEK);

  return { start, lastDay, startMs: start.getTime(), endMs: end.getTime() };
}
