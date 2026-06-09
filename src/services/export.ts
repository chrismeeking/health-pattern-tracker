import type { AppData } from '@/types';
import { APP_VERSION, TRIGGER_TAG_LABELS } from '@/types';
import { getSuspectedTriggers } from './insightEngine';
import { summarizeDailyCheckIn } from '@/utils/symptoms';

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

function filenamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'profile';
}

function filterRowsByProfile<T extends { profileId: string }>(
  rows: T[],
  profileId?: string
): T[] {
  return profileId ? rows.filter((row) => row.profileId === profileId) : rows;
}

function profileFilenameSuffix(data: AppData, profileId?: string): string {
  return profileId ? `-${filenamePart(profileName(data, profileId))}` : '';
}

function filterDataForProfile(data: AppData, profileId: string): AppData {
  return {
    ...data,
    profiles: data.profiles.filter((p) => p.id === profileId),
    meals: data.meals.filter((m) => m.profileId === profileId),
    issues: data.issues.filter((i) => i.profileId === profileId),
    symptomEpisodes: data.symptomEpisodes.filter((s) => s.profileId === profileId),
    dailyCheckIns: data.dailyCheckIns.filter((c) => c.profileId === profileId),
    weightEntries: data.weightEntries.filter((w) => w.profileId === profileId),
    waterEntries: data.waterEntries.filter((w) => w.profileId === profileId),
    goals: data.goals.filter((g) => g.profileId === profileId),
    favouriteMeals: data.favouriteMeals.filter((f) => f.profileId === profileId),
    savedFoods: data.savedFoods.filter((f) => f.profileId === profileId),
    activeProfileId: profileId,
  };
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

export function exportProfileDataJson(data: AppData, profileId: string): void {
  const profileData = filterDataForProfile(data, profileId);
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    ...profileData,
  };
  downloadText(
    JSON.stringify(payload, null, 2),
    `health-pattern-tracker${profileFilenameSuffix(data, profileId)}-${dateStamp()}.json`,
    'application/json;charset=utf-8'
  );
}

export function exportMealsCsv(data: AppData, profileId?: string): void {
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
    'Saturated fat (g)',
    'Fibre (g)',
    'Sugar (g)',
    'Salt (g)',
    'Portion size',
    'Trigger tags',
    'Notes',
  ];

  const rows = filterRowsByProfile(data.meals, profileId).map((m) =>
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
      m.saturatedFat ?? '',
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
    `meals${profileFilenameSuffix(data, profileId)}-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}

export function exportSymptomEpisodesCsv(data: AppData, profileId?: string): void {
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

  const rows = filterRowsByProfile(data.symptomEpisodes, profileId).map((s) =>
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
    `symptom-episodes${profileFilenameSuffix(data, profileId)}-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}

export function exportDailyCheckInsCsv(data: AppData, profileId?: string): void {
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

  const rows = filterRowsByProfile(data.dailyCheckIns, profileId).map((c) =>
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
    `daily-check-ins${profileFilenameSuffix(data, profileId)}-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}

function rowsInLastDays<T extends { dateTime?: string; date?: string; startDateTime?: string }>(
  rows: T[],
  days: number
): T[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return rows.filter((row) => {
    const raw = row.dateTime ?? row.date ?? row.startDateTime ?? '';
    return new Date(raw).getTime() >= cutoff;
  });
}

/** Shareable text summary for GP visits — last 14 days. */
export function buildGpSummaryText(data: AppData, profileId: string): string {
  const profile = data.profiles.find((p) => p.id === profileId);
  const name = profile?.name ?? 'Patient';
  const issueName = (id: string) => data.issues.find((i) => i.id === id)?.name ?? id;

  const checkIns = rowsInLastDays(
    data.dailyCheckIns.filter((c) => c.profileId === profileId),
    14
  ).sort((a, b) => b.date.localeCompare(a.date));

  const episodes = rowsInLastDays(
    data.symptomEpisodes.filter((s) => s.profileId === profileId),
    14
  ).sort(
    (a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
  );

  const triggers = getSuspectedTriggers(data, profileId).slice(0, 5);

  const lines: string[] = [
    `Health Pattern Tracker — summary for GP`,
    `Profile: ${name}`,
    `Generated: ${new Date().toLocaleString('en-GB')}`,
    `Period: last 14 days`,
    '',
    '--- Daily check-ins ---',
  ];

  if (checkIns.length === 0) {
    lines.push('No check-ins in this period.');
  } else {
    for (const c of checkIns) {
      lines.push(`${c.date}: ${summarizeDailyCheckIn(c, issueName)}`);
      if (c.notes) lines.push(`  Notes: ${c.notes}`);
    }
  }

  lines.push('', '--- Symptom episodes ---');
  if (episodes.length === 0) {
    lines.push('No symptom episodes in this period.');
  } else {
    for (const ep of episodes) {
      const issue = ep.issueId ? issueName(ep.issueId) : 'General';
      lines.push(
        `${ep.startDateTime.split('T')[0]} ${issue}: ${ep.severity}, pain ${ep.painScore ?? '—'}/10 — ${ep.symptoms.join(', ') || 'symptoms logged'}`
      );
      if (ep.suspectedTrigger) lines.push(`  Suspected trigger: ${ep.suspectedTrigger}`);
      if (ep.notes) lines.push(`  Notes: ${ep.notes}`);
    }
  }

  lines.push('', '--- Possible food triggers (pattern estimate, not diagnosis) ---');
  if (triggers.length === 0) {
    lines.push('Insufficient data or no triggers flagged.');
  } else {
    for (const t of triggers) {
      lines.push(
        `${TRIGGER_TAG_LABELS[t.trigger]}: symptoms after ${Math.round(t.symptomRate * 100)}% of tagged meals (${t.episodeCount} episodes, ${t.confidence} confidence)`
      );
    }
  }

  lines.push('', 'This summary is for personal tracking only and is not a medical diagnosis.');
  return lines.join('\n');
}

export function exportGpSummaryText(data: AppData, profileId: string): void {
  const content = buildGpSummaryText(data, profileId);
  downloadText(
    content,
    `gp-summary${profileFilenameSuffix(data, profileId)}-${dateStamp()}.txt`,
    'text/plain;charset=utf-8'
  );
}

export function exportGpSummaryCsv(data: AppData, profileId: string): void {
  const checkIns = rowsInLastDays(
    data.dailyCheckIns.filter((c) => c.profileId === profileId),
    14
  );
  const episodes = rowsInLastDays(
    data.symptomEpisodes.filter((s) => s.profileId === profileId),
    14
  );
  const triggers = getSuspectedTriggers(data, profileId);

  const sections = [
    'Section,Date,Detail',
    ...checkIns.map((c) =>
      toCsvRow(['Check-in', c.date, summarizeDailyCheckIn(c, (id) => data.issues.find((i) => i.id === id)?.name)])
    ),
    ...episodes.map((ep) =>
      toCsvRow([
        'Symptom',
        ep.startDateTime.split('T')[0],
        `${ep.severity}; pain ${ep.painScore ?? '—'}; ${ep.symptoms.join('; ')}`,
      ])
    ),
    ...triggers.map((t) =>
      toCsvRow([
        'Trigger estimate',
        dateStamp(),
        `${TRIGGER_TAG_LABELS[t.trigger]}; ${Math.round(t.symptomRate * 100)}% symptom rate`,
      ])
    ),
  ];

  downloadText(
    sections.join('\r\n'),
    `gp-summary${profileFilenameSuffix(data, profileId)}-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}

export async function shareGpSummary(data: AppData, profileId: string): Promise<boolean> {
  const text = buildGpSummaryText(data, profileId);
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Health summary for GP',
        text,
      });
      return true;
    } catch {
      return false;
    }
  }
  exportGpSummaryText(data, profileId);
  return true;
}

export function exportWeightEntriesCsv(data: AppData, profileId?: string): void {
  const headers = ['Profile', 'Profile ID', 'Date', 'Weight (kg)', 'Notes'];

  const rows = filterRowsByProfile(data.weightEntries, profileId).map((w) =>
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
    `weight-entries${profileFilenameSuffix(data, profileId)}-${dateStamp()}.csv`,
    'text/csv;charset=utf-8'
  );
}
