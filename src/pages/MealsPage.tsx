import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { getProfileData, removeById, generateId } from '@/services/storage';
import { getMealsForDate, getTodayNutrition, getNetCalorieTarget } from '@/utils/nutrition';
import { getTodayExerciseBurn, getExerciseEntriesForDate, EXERCISE_LABELS } from '@/utils/exercise';
import { hasModule } from '@/utils/profileModules';
import { formatWeight, formatWeightChange, getProfileMeasurementSystem } from '@/utils/measurements';
import { getWeightSummary } from '@/utils/health';
import { getWeeklyNutritionSummary } from '@/utils/weeklyNutrition';
import { favouriteToFormValues, getFavouritesForProfile } from '@/services/food/favouriteMeals';
import { repeatMealFormValues } from '@/utils/recentMeals';
import { todayISO, nowISO, formatTime } from '@/utils/helpers';
import { DailyNutritionSummary } from '@/components/DailyNutritionSummary';
import { MacroSummary } from '@/components/MacroSummary';
import { WaterTracker } from '@/components/WaterTracker';
import { MealCard } from '@/components/MealCard';
import { FavouriteMealCard } from '@/components/FavouriteMealCard';
import { StatCard } from '@/components/StatCard';
import { WeeklyNutritionCard } from '@/components/WeeklyNutritionCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { Meal } from '@/types';

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
  const todayExercise = getTodayExerciseBurn(profileData.exerciseEntries);
  const showExercise = hasModule(activeProfile, 'exercise');
  const units = getProfileMeasurementSystem(activeProfile);
  const showWater = hasModule(activeProfile, 'water');
  const showWeight = hasModule(activeProfile, 'weight');
  const todayWater = profileData.waterEntries
    .filter((e) => e.dateTime.startsWith(today))
    .reduce((s, e) => s + e.amountMl, 0);
  const todayExerciseEntries = getExerciseEntriesForDate(profileData.exerciseEntries, today).sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
  const weightSummary = getWeightSummary(profileData.weightEntries, activeProfile);
  const favourites = getFavouritesForProfile(data, activeProfile.id).slice(0, 4);
  const weeklyNutrition = getWeeklyNutritionSummary(data, activeProfile);
  const calorieTarget = activeProfile.dailyCalorieTarget ?? 2000;
  const netTarget = getNetCalorieTarget(calorieTarget, todayExercise);

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

  const quickLogMeal = (source: Meal | import('@/types').FavouriteMeal) => {
    const values =
      'mealName' in source
        ? repeatMealFormValues(source)
        : favouriteToFormValues(source);

    const now = nowISO();
    update((d) => ({
      ...d,
      meals: [
        ...d.meals,
        {
          id: generateId(),
          profileId: activeProfile.id,
          dateTime: now,
          mealType: values.mealType,
          mealName: values.mealName.trim(),
          source: values.source,
          calories: values.calories,
          protein: values.protein,
          carbs: values.carbs,
          fat: values.fat,
          saturatedFat: values.saturatedFat || undefined,
          fibre: values.fibre,
          sugar: values.sugar || undefined,
          salt: values.salt || undefined,
          portionSize: values.portionSize,
          notes: values.notes.trim() || undefined,
          triggerTags: values.triggerTags,
          createdAt: now,
          updatedAt: now,
        },
      ],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800">Meals</h1>
        <div className="flex gap-2">
          <Link to="/favourites">
            <Button variant="outline" size="sm">Favourites</Button>
          </Link>
          {showExercise && (
            <Link to="/add/exercise">
              <Button variant="outline" size="sm">Exercise</Button>
            </Link>
          )}
          {showWater && (
            <Link to="/add/water">
              <Button variant="outline" size="sm">Water</Button>
            </Link>
          )}
          <Link to="/add/meal">
            <Button size="sm">+ Meal</Button>
          </Link>
        </div>
      </div>

      {showWeight && (
        <Link to="/health">
          <StatCard
            label="Current weight"
            value={weightSummary.latest != null ? formatWeight(weightSummary.latest, units) : 'Log'}
            subtext={
              weightSummary.weekChange != null
                ? `${formatWeightChange(weightSummary.weekChange, units)} this week`
                : 'Tap for health hub'
            }
          />
        </Link>
      )}

      {showExercise && (
        <StatCard
          label="Earned calories today"
          value={todayExercise > 0 ? `+${todayExercise} kcal` : '—'}
          subtext={
            todayExercise > 0
              ? `Net daily budget ${netTarget} kcal (target ${calorieTarget})`
              : 'Log exercise to earn extra calories'
          }
        />
      )}

      <DailyNutritionSummary
        totals={todayTotals}
        profile={activeProfile}
        exerciseBurned={todayExercise}
        showExercise={showExercise}
      />

      {activeProfile.enabledModules.includes('macros') && (
        <MacroSummary totals={todayTotals} profile={activeProfile} />
      )}

      <WeeklyNutritionCard summary={weeklyNutrition} />

      {showWater && (
        <WaterTracker
          currentMl={todayWater}
          targetMl={activeProfile.waterTarget}
          onAdd={addWater}
        />
      )}

      {favourites.length > 0 && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-600">Favourites</h2>
            <Link to="/favourites" className="text-xs text-teal-500">
              View all
            </Link>
          </div>
          {favourites.map((fav) => (
            <FavouriteMealCard
              key={fav.id}
              favourite={fav}
              onQuickAdd={() => quickLogMeal(fav)}
            />
          ))}
        </section>
      )}

      {showExercise && todayExerciseEntries.length > 0 && (
        <section className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-600">Today&apos;s exercise</h2>
            <Link to="/add/exercise" className="text-xs text-teal-500">
              + Add
            </Link>
          </div>
          {todayExerciseEntries.map((entry) => (
            <Card key={entry.id} className="flex justify-between items-center text-sm">
              <div>
                <p className="font-medium text-slate-800">
                  {EXERCISE_LABELS[entry.activity]}
                </p>
                <p className="text-xs text-slate-400">
                  {entry.durationMinutes} min · {entry.caloriesBurned} kcal · {formatTime(entry.dateTime)}
                </p>
              </div>
              <Link to={`/add/exercise?edit=${entry.id}`} className="text-xs text-teal-500">
                Edit
              </Link>
            </Card>
          ))}
        </section>
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
              onQuickLog={() => quickLogMeal(meal)}
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
              onQuickLog={() => quickLogMeal(meal)}
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
