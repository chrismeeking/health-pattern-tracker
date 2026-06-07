import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { findById, generateId, updateById } from '@/services/storage';
import { assessMealRisk } from '@/services/riskEngine';
import { nowISO } from '@/utils/helpers';
import { MealForm, mealToFormValues, type MealFormValues } from '@/components/MealForm';
import { MealAiAnalysisPanel } from '@/components/MealAiAnalysisPanel';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { Meal } from '@/types';

function buildMeal(
  values: MealFormValues,
  profileId: string,
  existing?: Meal
): Meal {
  const now = nowISO();
  return {
    id: existing?.id ?? generateId(),
    profileId,
    dateTime: existing?.dateTime ?? now,
    mealType: values.mealType,
    mealName: values.mealName.trim(),
    source: values.source,
    calories: values.calories,
    protein: values.protein,
    carbs: values.carbs,
    fat: values.fat,
    fibre: values.fibre,
    sugar: values.sugar || undefined,
    salt: values.salt || undefined,
    portionSize: values.portionSize,
    notes: values.notes.trim() || undefined,
    triggerTags: values.triggerTags,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function useMealRisk(
  values: MealFormValues,
  data: ReturnType<typeof useApp>['data'],
  profileId: string
) {
  return useMemo(() => {
    if (!values.mealName && values.triggerTags.length === 0) return null;
    return assessMealRisk(
      {
        triggerTags: values.triggerTags,
        mealName: values.mealName || 'New meal',
        portionSize: values.portionSize,
      },
      data,
      profileId
    );
  }, [values, data, profileId]);
}

export function AddMealPage() {
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get('copy');

  if (!activeProfile) return null;

  const profileMeals = data.meals
    .filter((m) => m.profileId === activeProfile.id)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const copyMeal = copyFromId ? findById(profileMeals, copyFromId) : null;
  const latestMeal = profileMeals[0];
  const initial = copyMeal ? mealToFormValues(copyMeal) : undefined;

  const [liveValues, setLiveValues] = useState<MealFormValues>(() => ({
    mealName: '',
    mealType: 'lunch',
    source: 'unknown',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fibre: 0,
    sugar: 0,
    salt: 0,
    portionSize: 'normal',
    triggerTags: [],
    notes: '',
    ...initial,
  }));

  const [aiApplied, setAiApplied] = useState<Partial<MealFormValues> | null>(null);
  const [aiAppliedKey, setAiAppliedKey] = useState(0);
  const [showAiBanner, setShowAiBanner] = useState(false);

  const risk = useMealRisk(liveValues, data, activeProfile.id);

  const handleAiApply = (values: Partial<MealFormValues>) => {
    setAiApplied(values);
    setAiAppliedKey((k) => k + 1);
    setShowAiBanner(true);
    setLiveValues((prev) => ({ ...prev, ...values }));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Add Meal</h1>

      <MealAiAnalysisPanel profileId={activeProfile.id} onApply={handleAiApply} />

      {latestMeal && !copyMeal && (
        <Card className="space-y-2">
          <p className="text-xs text-slate-500">Quick add</p>
          <Button
            variant="outline"
            fullWidth
            size="sm"
            onClick={() =>
              navigate(`/add/meal?copy=${latestMeal.id}`, { replace: true })
            }
          >
            Copy previous meal — {latestMeal.mealName}
          </Button>
        </Card>
      )}

      <MealForm
        key={`${copyFromId ?? 'new'}-${aiAppliedKey}`}
        initial={initial}
        appliedValues={aiApplied}
        showAiEstimateBanner={showAiBanner}
        onValuesChange={setLiveValues}
        riskAssessment={risk}
        onSubmit={(values) => {
          const meal = buildMeal(values, activeProfile.id);
          update((d) => ({ ...d, meals: [...d.meals, meal] }));
          navigate('/meals');
        }}
        onCancel={() => navigate('/add')}
      />
    </div>
  );
}

export function EditMealPage() {
  const { id } = useParams<{ id: string }>();
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile || !id) return null;

  const meal = findById(
    data.meals.filter((m) => m.profileId === activeProfile.id),
    id
  );

  if (!meal) {
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-slate-500">Meal not found.</p>
        <Link to="/meals" className="text-teal-500 text-sm">
          Back to meals
        </Link>
      </div>
    );
  }

  const initial = mealToFormValues(meal);
  const [liveValues, setLiveValues] = useState<MealFormValues>(initial);
  const risk = useMealRisk(liveValues, data, activeProfile.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Edit Meal</h1>
      <MealForm
        initial={initial}
        onValuesChange={setLiveValues}
        riskAssessment={risk}
        submitLabel="Save changes"
        onSubmit={(values) => {
          const updated = buildMeal(values, activeProfile.id, meal);
          update((d) => ({
            ...d,
            meals: updateById(d.meals, meal.id, updated),
          }));
          navigate('/meals');
        }}
        onCancel={() => navigate('/meals')}
      />
    </div>
  );
}
