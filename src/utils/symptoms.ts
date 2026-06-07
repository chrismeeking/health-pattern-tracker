import type { DailyCheckIn, Meal, SymptomEpisode } from '@/types';
import { formatDate, formatTime } from './helpers';

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

export function getLastCheckInStatus(checkIns: DailyCheckIn[]): string {
  const recent = [...checkIns].sort(
    (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
  )[0];

  if (!recent) return 'No check-ins yet';
  if (recent.noSymptomsReported) return 'Last check-in: no symptoms';
  if (recent.indigestion) return 'Last check-in: indigestion reported';
  if (recent.mildBloatingPressure) return 'Last check-in: mild bloating';
  if (recent.gas) return 'Last check-in: gas reported';
  if (recent.painEpisode) return 'Last check-in: pain reported';
  if (recent.headache) return 'Last check-in: headache reported';
  if (recent.tiredness) return 'Last check-in: tiredness reported';
  return 'Last check-in: symptoms reported';
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
