import type { DailyCheckIn } from '@/types';
import { todayISO } from './helpers';

/** Consecutive days with a check-in ending today (or yesterday if not checked in today). */
export function getCheckInStreak(checkIns: DailyCheckIn[]): number {
  if (checkIns.length === 0) return 0;

  const dates = new Set(checkIns.map((c) => c.date));
  const today = todayISO();

  let cursor: Date;
  if (dates.has(today)) {
    cursor = new Date(today);
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (!dates.has(yesterdayStr)) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().split('T')[0];
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
