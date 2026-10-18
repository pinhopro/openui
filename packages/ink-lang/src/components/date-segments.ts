/** A calendar date without a time zone. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/** 0 is the year, 1 the month, 2 the day. */
export type DateSegment = 0 | 1 | 2;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The date in an ISO `YYYY-MM-DD` string (a longer timestamp keeps its date part). */
export function parseIsoDate(value: unknown): CalendarDate | undefined {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
  }
  if (typeof value !== "string") return undefined;
  const match = ISO_DATE.exec(value);
  if (match === null) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return undefined;
  return { year, month, day };
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

export function formatIsoDate(date: CalendarDate): string {
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

/** Today's local date. */
export function todayDate(): CalendarDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** The date after moving one segment by `delta`; months wrap into years and the day stays valid. */
export function stepDate(date: CalendarDate, segment: DateSegment, delta: number): CalendarDate {
  let year = date.year;
  let month = date.month;
  let day = date.day;
  if (segment === 0) year += delta;
  if (segment === 1) {
    month += delta;
    while (month < 1) {
      month += 12;
      year -= 1;
    }
    while (month > 12) {
      month -= 12;
      year += 1;
    }
  }
  if (segment === 2) {
    day += delta;
    const count = daysInMonth(year, month);
    if (day < 1) day = 1;
    if (day > count) day = count;
  }
  if (year < 1) year = 1;
  if (year > 9999) year = 9999;
  const clampedDay = Math.min(day, daysInMonth(year, month));
  return { year, month, day: clampedDay };
}

/** The three text segments of a date (or of the `YYYY-MM-DD` mask when there is none). */
export function dateSegments(date: CalendarDate | undefined): string[] {
  if (date === undefined) return ["YYYY", "MM", "DD"];
  return [pad(date.year, 4), pad(date.month, 2), pad(date.day, 2)];
}
