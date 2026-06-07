import type { AppData } from '@/types';
import { APP_VERSION } from '@/types';

function escapeCsv(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsv).join(',');
}

function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function dateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

function profileName(data: AppData, profileId: string): string {
  return data.profiles.find((p) => p.id === profileId)?.name ?? profileId;
}

export function exportAllDataJson(data: AppData): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    ...data,
  };
  downloadText(
    JSON.stringify(payload, null, 2),
    `health-pattern-tracker-${dateStamp()}.json`,
    'application/json;charset=utf-8'
  );
}

export function exportMealsCsv(data: AppData): void {
  const headers = [
    'Profile',
    'Profile ID',
    'Date time',
    'Meal type',
    'Meal name',
    'Source',
    'Calories',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)',
    'Fibre (g)',
    'Sugar (g)',
    'Salt (g)',
    'Portion size',
    'Trigger tags',
    'Notes',
  ];

  const rows = data.meals.map((m) =>
    toCsvRow([
      profileName(data, m.profileId),
      m.profileId,
      m.dateTime,
      m.mealType,
      m.mealName,
      m.source,
      m.calories,
      m.protein,
      m.carbs,
      m.fat,
      m.fibre,
      m.sugar ?? '',
      m.salt ?? '',
      m.portionSize,
      m.triggerTags.join('; '),
      m.notes ?? '',
    ])
  );

  downloadText(
    [toCsvRow(headers), ...rows].join('\r\n'),
    `meals-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}

export function exportSymptomEpisodesCsv(data: AppData): void {
  const headers = [
    'Profile',
    'Profile ID',
    'Start',
    'End',
    'Severity',
    'Pain score',
    'Symptoms',
    'Issue ID',
    'Pain location',
    'Pain description',
    'Suspected trigger',
    'Related meal IDs',
    'Notes',
  ];

  const rows = data.symptomEpisodes.map((s) =>
    toCsvRow([
      profileName(data, s.profileId),
      s.profileId,
      s.startDateTime,
      s.endDateTime ?? '',
      s.severity,
      s.painScore ?? '',
      s.symptoms.join('; '),
      s.issueId ?? '',
      s.painLocation ?? '',
      s.painDescription ?? '',
      s.suspectedTrigger ?? '',
      (s.relatedMealIds ?? []).join('; '),
      s.notes ?? '',
    ])
  );

  downloadText(
    [toCsvRow(headers), ...rows].join('\r\n'),
    `symptom-episodes-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}

export function exportDailyCheckInsCsv(data: AppData): void {
  const headers = [
    'Profile',
    'Profile ID',
    'Date',
    'Check-in time',
    'No symptoms reported',
    'Symptoms since last check-in',
    'Selected issues',
    'Stress level',
    'Energy level',
    'Notes',
  ];

  const rows = data.dailyCheckIns.map((c) =>
    toCsvRow([
      profileName(data, c.profileId),
      c.profileId,
      c.date,
      c.checkInTime,
      c.noSymptomsReported ? 'Yes' : 'No',
      c.symptomsSinceLastCheckIn ? 'Yes' : 'No',
      c.selectedIssues.join('; '),
      c.stressLevel ?? '',
      c.energyLevel ?? '',
      c.notes ?? '',
    ])
  );

  downloadText(
    [toCsvRow(headers), ...rows].join('\r\n'),
    `daily-check-ins-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}

export function exportWeightEntriesCsv(data: AppData): void {
  const headers = ['Profile', 'Profile ID', 'Date', 'Weight (kg)', 'Notes'];

  const rows = data.weightEntries.map((w) =>
    toCsvRow([
      profileName(data, w.profileId),
      w.profileId,
      w.date,
      w.weight,
      w.notes ?? '',
    ])
  );

  downloadText(
    [toCsvRow(headers), ...rows].join('\r\n'),
    `weight-entries-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}
