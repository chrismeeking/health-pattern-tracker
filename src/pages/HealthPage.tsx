import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId, removeById } from '@/services/storage';
import { nowISO } from '@/utils/helpers';
import {
  getSuggestedGoals,
  getWeeklyProgress,
  getWeightSummary,
  isDigestiveProfile,
} from '@/utils/health';
import { hasModule, showInsightsNav } from '@/utils/profileModules';
import { WeightChart } from '@/components/WeightChart';
import { GoalCard } from '@/components/GoalCard';
import { WeeklyProgressCard } from '@/components/WeeklyProgressCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function HealthPage() {
  const { data, activeProfile, update } = useApp();
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  if (!activeProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No profile loaded.</p>
      </div>
    );
  }

  const weights = data.weightEntries.filter((w) => w.profileId === activeProfile.id);
  const goals = data.goals.filter((g) => g.profileId === activeProfile.id);
  const weightSummary = getWeightSummary(weights, activeProfile);
  const weeklyProgress = getWeeklyProgress(data, activeProfile.id);
  const showSymptoms = isDigestiveProfile(activeProfile);
  const showWeightModule = hasModule(activeProfile, 'weight');

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals
    .filter((g) => g.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 5);

  const existingTitles = goals.map((g) => g.title);
  const suggestions = getSuggestedGoals(activeProfile, existingTitles);

  const completeGoal = (id: string) => {
    update((d) => ({
      ...d,
      goals: d.goals.map((g) =>
        g.id === id
          ? { ...g, status: 'completed' as const, completedAt: nowISO(), updatedAt: nowISO() }
          : g
      ),
    }));
  };

  const skipGoal = (id: string) => {
    update((d) => ({
      ...d,
      goals: d.goals.map((g) =>
        g.id === id ? { ...g, status: 'skipped' as const, updatedAt: nowISO() } : g
      ),
    }));
  };

  const deleteGoal = (id: string) => {
    update((d) => ({ ...d, goals: removeById(d.goals, id) }));
    setDeleteGoalId(null);
  };

  const addSuggestedGoal = (suggestion: (typeof suggestions)[0]) => {
    const now = nowISO();
    update((d) => ({
      ...d,
      goals: [
        ...d.goals,
        {
          id: generateId(),
          profileId: activeProfile.id,
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category,
          status: 'active',
          difficulty: suggestion.difficulty,
          startDate: new Date().toISOString().split('T')[0],
          createdAt: now,
          updatedAt: now,
        },
      ],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Health & progress</h1>
          <p className="text-sm text-slate-400">Small improvements, not strict rules</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {showInsightsNav(activeProfile) && (
            <Link to="/insights">
              <Button size="sm" variant="outline">
                Insights
              </Button>
            </Link>
          )}
          <Link to="/add/weight">
            <Button size="sm" variant="outline">
              Log weight
            </Button>
          </Link>
        </div>
      </div>

      <WeightChart
        entries={weightSummary.entries}
        weekChange={weightSummary.weekChange}
        monthChange={weightSummary.monthChange}
        latestWeight={weightSummary.latest}
        targetWeight={weightSummary.target ?? undefined}
        heightCm={showWeightModule ? activeProfile.height : undefined}
      />

      <WeeklyProgressCard progress={weeklyProgress} showSymptoms={showSymptoms} />

      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-medium text-slate-600">Active goals</h2>
          <Link to="/health/goals/new" className="text-xs text-teal-500">
            + New goal
          </Link>
        </div>
        {activeGoals.length === 0 ? (
          <Card className="text-sm text-slate-400 text-center py-6">
            No active goals. Try a small experiment below.
          </Card>
        ) : (
          activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onComplete={() => completeGoal(goal.id)}
              onSkip={() => skipGoal(goal.id)}
              onDelete={() => setDeleteGoalId(goal.id)}
            />
          ))
        )}
      </section>

      {completedGoals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600">Completed goals</h2>
          {completedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              showActions={false}
              compact
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Suggested small goals</h2>
        <p className="text-xs text-slate-400">
          Gentle experiments tailored to your profile — pick one that feels doable.
        </p>
        {suggestions.map((s) => (
          <Card key={s.title} className="space-y-2">
            <div>
              <p className="text-sm font-medium text-slate-800">{s.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => addSuggestedGoal(s)}>
              Try this experiment
            </Button>
          </Card>
        ))}
      </section>

      {weights.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-slate-600">Weight history</h2>
          {[...weights]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map((entry) => (
              <Card key={entry.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-slate-800">{entry.weight} kg</p>
                  <p className="text-xs text-slate-400">
                    {new Date(entry.date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-slate-500 mt-1">{entry.notes}</p>
                  )}
                </div>
                <Link to={`/add/weight?edit=${entry.id}`} className="text-xs text-teal-500">
                  Edit
                </Link>
              </Card>
            ))}
        </section>
      )}

      <ConfirmDialog
        open={deleteGoalId != null}
        title="Remove goal?"
        message="This removes the goal from your list."
        confirmLabel="Remove"
        onConfirm={() => deleteGoalId && deleteGoal(deleteGoalId)}
        onCancel={() => setDeleteGoalId(null)}
      />
    </div>
  );
}
