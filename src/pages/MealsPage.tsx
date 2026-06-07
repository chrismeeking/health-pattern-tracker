import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { getProfileData, removeById, generateId } from '@/services/storage';
import { getMealsForDate, getTodayNutrition } from '@/utils/nutrition';
import { todayISO, nowISO } from '@/utils/helpers';
import { DailyNutritionSummary } from '@/components/DailyNutritionSummary';
import { MacroSummary } from '@/components/MacroSummary';
import { WaterTracker } from '@/components/WaterTracker';
import { MealCard } from '@/components/MealCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function MealsPage() {
  const { data, activeProfile, update } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!activeProfile) return null;

  const profileData = getProfileData(data, activeProfile.id);
  const today = todayISO();
  const todayMeals = getMealsForDate(profileData.meals, today).sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
  const recentMeals = profileData.meals
    .filter((m) => !m.dateTime.startsWith(today))
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const todayTotals = getTodayNutrition(profileData.meals);
  const todayWater = profileData.waterEntries
    .filter((e) => e.dateTime.startsWith(today))
    .reduce((s, e) => s + e.amountMl, 0);

  const mealToDelete =
    deleteId != null
      ? profileData.meals.find((m) => m.id === deleteId)
      : null;

  const confirmDelete = () => {
    if (!deleteId) return;
    update((d) => ({ ...d, meals: removeById(d.meals, deleteId) }));
    setDeleteId(null);
  };

  const addWater = (amount: number) => {
    update((d) => ({
      ...d,
      waterEntries: [
        ...d.waterEntries,
        {
          id: generateId(),
          profileId: activeProfile.id,
          dateTime: nowISO(),
          amountMl: amount,
        },
      ],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800">Meals</h1>
        <div className="flex gap-2">
          <Link to="/add/water">
            <Button variant="outline" size="sm">Water</Button>
          </Link>
          <Link to="/add/meal">
            <Button size="sm">+ Meal</Button>
          </Link>
        </div>
      </div>

      <DailyNutritionSummary totals={todayTotals} profile={activeProfile} />

      {activeProfile.enabledModules.includes('macros') && (
        <MacroSummary totals={todayTotals} profile={activeProfile} />
      )}

      {activeProfile.enabledModules.includes('water') && (
        <WaterTracker
          currentMl={todayWater}
          targetMl={activeProfile.waterTarget}
          onAdd={addWater}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Today's meals</h2>
        {todayMeals.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 text-center py-4">
              No meals logged today yet.
            </p>
          </Card>
        ) : (
          todayMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onDelete={() => setDeleteId(meal.id)}
            />
          ))
        )}
      </section>

      {recentMeals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600">Meal history</h2>
          {recentMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              showDate
              onDelete={() => setDeleteId(meal.id)}
            />
          ))}
        </section>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete meal?"
        message={
          mealToDelete
            ? `"${mealToDelete.mealName}" will be removed permanently.`
            : 'This meal will be removed permanently.'
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
