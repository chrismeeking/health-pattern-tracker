import type { DailyCheckIn, Meal, SymptomEpisode } from '@/types';
import { formatDate, formatTime, todayISO } from './helpers';

const CHECK_IN_SYMPTOM_FIELDS: { key: keyof DailyCheckIn; label: string }[] = [
  { key: 'mildBloatingPressure', label: 'mild bloating' },
  { key: 'indigestion', label: 'indigestion' },
  { key: 'painEpisode', label: 'pain' },
  { key: 'gas', label: 'gas' },
  { key: 'nausea', label: 'nausea' },
  { key: 'sweating', label: 'sweating' },
  { key: 'vomiting', label: 'vomiting' },
  { key: 'fever', label: 'fever' },
  { key: 'diarrhoea', label: 'diarrhoea' },
  { key: 'constipation', label: 'constipation' },
  { key: 'headache', label: 'headache' },
  { key: 'tiredness', label: 'tiredness' },
  { key: 'skinIssue', label: 'skin issue' },
  { key: 'sleepAffected', label: 'sleep affected' },
];

export const ISSUE_SUGGESTED_TRIGGERS: Record<string, string[]> = {
  digestion: [
    'tomato', 'onion', 'garlic', 'spicy', 'fatty', 'fried', 'dairy', 'alcohol',
    'caffeine', 'carbonated drinks', 'large portions', 'late meals', 'stress', 'poor sleep',
  ],
  pain: ['stress', 'poor sleep', 'caffeine', 'alcohol', 'large portions', 'late meals'],
  sleep: ['caffeine', 'alcohol', 'late meals', 'stress', 'spicy'],
  skin: ['dairy', 'gluten', 'spicy', 'processed meat', 'stress'],
  energy: ['caffeine', 'poor sleep', 'large portions', 'late meals', 'stress'],
  mood: ['caffeine', 'alcohol', 'poor sleep', 'stress'],
  other: ['stress', 'poor sleep', 'caffeine'],
};

export const ISSUE_EXAMPLES = [
  { name: 'Indigestion', question: 'Why do I get indigestion?', category: 'digestion' as const },
  { name: 'Bloating', question: 'Why am I bloated at night?', category: 'digestion' as const },
  { name: 'Gas', question: 'Why do I get gas after meals?', category: 'digestion' as const },
  { name: 'Upper abdominal pain', question: 'Why do I get upper abdominal pain?', category: 'pain' as const },
  { name: 'Headaches', question: 'Why do I get headaches?', category: 'pain' as const },
  { name: 'Tiredness', question: 'Why am I tired in the afternoon?', category: 'energy' as const },
  { name: 'Skin flare-up', question: 'What triggers my skin flare-ups?', category: 'skin' as const },
  { name: 'Sleep problems', question: 'Why is my sleep affected?', category: 'sleep' as const },
];

export function getDaysSinceSevereEpisode(episodes: SymptomEpisode[]): number | null {
  const severe = episodes
    .filter((e) => e.severity === 'severe')
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

  if (severe.length === 0) return null;
  const last = new Date(severe[0].startDateTime);
  const now = new Date();
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

export function getTodayCheckIn(
  checkIns: DailyCheckIn[],
  date: string = todayISO()
): DailyCheckIn | null {
  return checkIns.find((c) => c.date === date) ?? null;
}

export function summarizeDailyCheckIn(
  checkIn: DailyCheckIn,
  issueName?: (id: string) => string | undefined
): string {
  if (checkIn.noSymptomsReported) return 'No symptoms';

  const symptoms = CHECK_IN_SYMPTOM_FIELDS.filter(({ key }) => checkIn[key]).map(
    ({ label }) => label
  );
  const issues = checkIn.selectedIssues
    .map((id) => issueName?.(id))
    .filter((name): name is string => Boolean(name));

  const parts: string[] = [];
  if (symptoms.length > 0) parts.push(symptoms.join(', '));
  if (issues.length > 0) parts.push(issues.join(', '));
  if (checkIn.stressLevel != null) parts.push(`stress ${checkIn.stressLevel}/5`);
  if (checkIn.energyLevel != null) parts.push(`energy ${checkIn.energyLevel}/5`);

  return parts.length > 0 ? parts.join(' · ') : 'Symptoms reported';
}

export function getCheckInHomeStat(
  checkIns: DailyCheckIn[],
  issueName?: (id: string) => string | undefined
): { value: string; subtext: string } {
  const today = getTodayCheckIn(checkIns);
  if (today) {
    return {
      value: 'Done',
      subtext: summarizeDailyCheckIn(today, issueName),
    };
  }

  const recent = [...checkIns].sort(
    (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
  )[0];

  if (!recent) {
    return { value: '—', subtext: 'Not checked in yet today' };
  }

  return {
    value: 'Pending',
    subtext: `Last: ${summarizeDailyCheckIn(recent, issueName)}`,
  };
}

/** @deprecated Prefer getCheckInHomeStat for dashboard display. */
export function getLastCheckInStatus(checkIns: DailyCheckIn[]): string {
  const stat = getCheckInHomeStat(checkIns);
  if (stat.value === 'Done') return `Checked in today · ${stat.subtext}`;
  if (stat.value === 'Pending') return stat.subtext;
  return stat.subtext;
}

export function getRecentSymptoms(episodes: SymptomEpisode[], limit = 3): SymptomEpisode[] {
  return [...episodes]
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
    .slice(0, limit);
}

export function getMealsInLastHours(meals: Meal[], hours: number): Meal[] {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return meals
    .filter((m) => new Date(m.dateTime).getTime() >= cutoff)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

export function formatSymptomSummary(episode: SymptomEpisode): string {
  const parts = [
    episode.severity,
    episode.painScore != null ? `pain ${episode.painScore}/10` : null,
    ...episode.symptoms.slice(0, 2),
  ].filter(Boolean);
  return parts.join(' · ');
}

export function formatCheckInDate(checkIn: DailyCheckIn): string {
  return `${formatDate(checkIn.date)} ${formatTime(checkIn.checkInTime)}`;
}
