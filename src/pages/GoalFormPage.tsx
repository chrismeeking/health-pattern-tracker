import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { findById, generateId } from '@/services/storage';
import { nowISO } from '@/utils/helpers';
import { GoalForm, goalToFormValues, type GoalFormValues } from '@/components/GoalForm';

export function CreateGoalPage() {
  const { activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile) return null;

  const handleSubmit = (values: GoalFormValues) => {
    const now = nowISO();
    update((d) => ({
      ...d,
      goals: [
        ...d.goals,
        {
          id: generateId(),
          profileId: activeProfile.id,
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          category: values.category,
          status: 'active',
          difficulty: values.difficulty,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
          createdAt: now,
          updatedAt: now,
        },
      ],
    }));
    navigate('/health');
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">New small goal</h1>
      <p className="text-sm text-slate-400">
        A small improvement to experiment with — no pressure to be perfect.
      </p>
      <GoalForm submitLabel="Start experiment" onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
}

export function EditGoalPage() {
  const { id } = useParams<{ id: string }>();
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile || !id) return null;

  const goal = findById(data.goals, id);
  if (!goal || goal.profileId !== activeProfile.id) {
    return <p className="text-slate-500">Goal not found.</p>;
  }

  const handleSubmit = (values: GoalFormValues) => {
    update((d) => ({
      ...d,
      goals: d.goals.map((g) =>
        g.id === id
          ? {
              ...g,
              title: values.title.trim(),
              description: values.description.trim() || undefined,
              category: values.category,
              difficulty: values.difficulty,
              startDate: values.startDate,
              endDate: values.endDate || undefined,
              updatedAt: nowISO(),
            }
          : g
      ),
    }));
    navigate('/health');
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Edit goal</h1>
      <GoalForm
        initial={goalToFormValues(goal)}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
