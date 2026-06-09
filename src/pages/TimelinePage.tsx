import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { getProfileData } from '@/services/storage';
import { formatDate, formatTime } from '@/utils/helpers';
import { formatSymptomSummary } from '@/utils/symptoms';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';

const MEALS_BEFORE_SYMPTOM_HOURS = 6;

type TimelineItem =
  | { kind: 'meal'; id: string; dateTime: string; title: string; detail: string }
  | {
      kind: 'symptom';
      id: string;
      dateTime: string;
      title: string;
      detail: string;
      issueId?: string;
      relatedMeals: { id: string; name: string; dateTime: string }[];
    };

function itemsInLastDays(items: TimelineItem[], days: number): TimelineItem[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items
    .filter((item) => new Date(item.dateTime).getTime() >= cutoff)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

function mealsBeforeEpisode(
  episodeStart: string,
  meals: { id: string; mealName: string; dateTime: string }[]
) {
  const end = new Date(episodeStart).getTime();
  const start = end - MEALS_BEFORE_SYMPTOM_HOURS * 60 * 60 * 1000;
  return meals
    .filter((m) => {
      const t = new Date(m.dateTime).getTime();
      return t >= start && t <= end;
    })
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

export function TimelinePage() {
  const { data, activeProfile } = useApp();
  const [days, setDays] = useState<7 | 14>(7);
  const [issueFilter, setIssueFilter] = useState<string>('all');

  if (!activeProfile) return null;

  const profileData = getProfileData(data, activeProfile.id);
  const activeIssues = profileData.issues.filter((i) => i.active);
  const issueName = (issueId?: string) =>
    profileData.issues.find((i) => i.id === issueId)?.name;

  const items: TimelineItem[] = useMemo(() => {
    const mealRows = profileData.meals.map((meal) => ({
      kind: 'meal' as const,
      id: meal.id,
      dateTime: meal.dateTime,
      title: meal.mealName,
      detail: `${meal.calories} kcal · ${meal.mealType}`,
    }));

    const symptomRows = profileData.symptomEpisodes.map((ep) => {
      const relatedFromIds = (ep.relatedMealIds ?? [])
        .map((id) => profileData.meals.find((m) => m.id === id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map((m) => ({ id: m.id, name: m.mealName, dateTime: m.dateTime }));

      const related =
        relatedFromIds.length > 0
          ? relatedFromIds
          : mealsBeforeEpisode(ep.startDateTime, profileData.meals).map((m) => ({
              id: m.id,
              name: m.mealName,
              dateTime: m.dateTime,
            }));

      return {
        kind: 'symptom' as const,
        id: ep.id,
        dateTime: ep.startDateTime,
        title: issueName(ep.issueId) ?? 'Symptom episode',
        detail: formatSymptomSummary(ep),
        issueId: ep.issueId,
        relatedMeals: related,
      };
    });

    return [...mealRows, ...symptomRows];
  }, [profileData.meals, profileData.symptomEpisodes, profileData.issues]);

  const filtered = useMemo(() => {
    let list = itemsInLastDays(items, days);
    if (issueFilter !== 'all') {
      list = list.filter(
        (item) => item.kind !== 'symptom' || item.issueId === issueFilter
      );
    }
    return list;
  }, [items, days, issueFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Meal–symptom timeline
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Last {days} days for {activeProfile.name}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([7, 14] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              days === d ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {activeIssues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIssueFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs ${
              issueFilter === 'all' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            All issues
          </button>
          {activeIssues.map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => setIssueFilter(issue.id)}
              className={`px-3 py-1.5 rounded-full text-xs ${
                issueFilter === issue.id
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {issue.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-slate-500">No meals or symptoms in this period.</p>
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
          {filtered.map((item) => (
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
                {item.kind === 'symptom' && item.relatedMeals.length > 0 && (
                  <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-2 space-y-1">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                      Meals in prior {MEALS_BEFORE_SYMPTOM_HOURS}h
                    </p>
                    {item.relatedMeals.map((meal) => (
                      <p key={meal.id} className="text-xs text-slate-600 dark:text-slate-300">
                        {meal.name} · {formatTime(meal.dateTime)}
                      </p>
                    ))}
                  </div>
                )}
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
