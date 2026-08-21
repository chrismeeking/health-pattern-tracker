import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import {
  addDays,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

export const LONDON_TZ = "Europe/London";

/** Current instant as a Date (UTC under the hood; interpret with London helpers). */
export function now(): Date {
  return new Date();
}

/** Today's calendar date in Europe/London as YYYY-MM-DD. */
export function todayDateString(reference: Date = now()): string {
  return formatInTimeZone(reference, LONDON_TZ, "yyyy-MM-dd");
}

/** Monday (start of ISO week) for a London calendar date string. */
export function weekStartMonday(dateStr: string): string {
  const local = toZonedTime(`${dateStr}T12:00:00`, LONDON_TZ);
  const monday = startOfWeek(local, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export function weekDatesFromMonday(mondayStr: string): string[] {
  const monday = parseISO(`${mondayStr}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), "yyyy-MM-dd"));
}

export function shiftWeek(mondayStr: string, weeks: number): string {
  const monday = parseISO(`${mondayStr}T12:00:00`);
  return format(addWeeks(monday, weeks), "yyyy-MM-dd");
}

export function formatDayHeading(dateStr: string): { weekday: string; dayMonth: string } {
  const d = parseISO(`${dateStr}T12:00:00`);
  return {
    weekday: format(d, "EEEE"),
    dayMonth: format(d, "d MMM"),
  };
}

export function formatWeekRangeLabel(mondayStr: string): string {
  const dates = weekDatesFromMonday(mondayStr);
  const start = parseISO(`${dates[0]}T12:00:00`);
  const end = parseISO(`${dates[6]}T12:00:00`);
  const sameMonth = format(start, "MMM") === format(end, "MMM");
  if (sameMonth) {
    return `${format(start, "d")}–${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
}

/** Format HH:mm or HH:mm:ss from DB into HH:mm for display. */
export function formatTimeDisplay(time: string | null | undefined): string | null {
  if (!time) return null;
  const match = /^(\d{2}):(\d{2})/.exec(time);
  if (!match) return time;
  return `${match[1]}:${match[2]}`;
}

export function isSameDate(a: string, b: string): boolean {
  return a === b;
}
