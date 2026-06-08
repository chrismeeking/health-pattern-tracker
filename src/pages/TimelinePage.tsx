import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { getProfileData } from '@/services/storage';
import { formatDate, formatTime } from '@/utils/helpers';
import { formatSymptomSummary } from '@/utils/symptoms';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';

type TimelineItem =
  | { kind: 'meal'; id: string; dateTime: string; title: string; detail: string }
  | { kind: 'symptom'; id: string; dateTime: string; title: string; detail: string };

function itemsInLastDays(items: TimelineItem[], days: number): TimelineItem[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items
    .filter((item) => new Date(item.dateTime).getTime() >= cutoff)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

export function TimelinePage() {
  const { data, activeProfile } = useApp();

  if (!activeProfile) return null;

  const profileData = getProfileData(data, activeProfile.id);
  const issueName = (issueId?: string) =>
    profileData.issues.find((i) => i.id === issueId)?.name;

  const items: TimelineItem[] = [
    ...profileData.meals.map((meal) => ({
      kind: 'meal' as const,
      id: meal.id,
      dateTime: meal.dateTime,
      title: meal.mealName,
      detail: `${meal.calories} kcal · ${meal.mealType}`,
    })),
    ...profileData.symptomEpisodes.map((ep) => ({
      kind: 'symptom' as const,
      id: ep.id,
      dateTime: ep.startDateTime,
      title: issueName(ep.issueId) ?? 'Symptom episode',
      detail: formatSymptomSummary(ep),
    })),
  ];

  const recent = itemsInLastDays(items, 7);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Meal–symptom timeline</h1>
        <p className="text-sm text-slate-400 mt-0.5">Last 7 days for {activeProfile.name}</p>
      </div>

      {recent.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-slate-500">No meals or symptoms logged in the last 7 days.</p>
          <div className="flex gap-2 justify-center mt-4">
            <Link to="/add/meal" className="text-xs text-teal-500">
              Add meal
            </Link>
            <Link to="/add/symptom" className="text-xs text-teal-500">
              Log symptom
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((item) => (
            <Card key={`${item.kind}-${item.id}`} className="flex gap-3 items-start">
              <span
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  item.kind === 'meal'
                    ? 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-200'
                    : 'bg-coral-50 text-coral-600 dark:bg-coral-500/15 dark:text-coral-200'
                }`}
              >
                <Icon name={item.kind === 'meal' ? 'meals' : 'symptom'} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {formatDate(item.dateTime)} · {formatTime(item.dateTime)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
