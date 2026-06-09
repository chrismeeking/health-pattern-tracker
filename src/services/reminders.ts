const REMINDER_SETTINGS_KEY = 'health-pattern-tracker-reminders';

export interface ReminderSettings {
  checkInReminderEnabled: boolean;
  reminderHour: number;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  checkInReminderEnabled: false,
  reminderHour: 20,
};

export function loadReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveReminderSettings(settings: ReminderSettings): void {
  localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function scheduleCheckInReminderIfNeeded(
  hasCheckedInToday: boolean,
  settings: ReminderSettings = loadReminderSettings()
): void {
  if (!settings.checkInReminderEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (hasCheckedInToday) return;

  const now = new Date();
  if (now.getHours() < settings.reminderHour) return;

  const lastKey = 'health-pattern-tracker-last-reminder';
  const today = now.toISOString().split('T')[0];
  if (localStorage.getItem(lastKey) === today) return;

  try {
    new Notification('Health Pattern Tracker', {
      body: "You haven't checked in today. A quick tap helps spot patterns.",
      tag: 'check-in-reminder',
    });
    localStorage.setItem(lastKey, today);
  } catch {
    // Silent — reminders are optional
  }
}
