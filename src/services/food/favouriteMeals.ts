import type { AppData, FavouriteMeal, Meal } from '@/types';
import type { MealFormValues } from '@/components/MealForm';
import { generateId } from '@/services/storage';
import { nowISO } from '@/utils/helpers';

export function getFavouritesForProfile(data: AppData, profileId: string): FavouriteMeal[] {
  return data.favouriteMeals
    .filter((f) => f.profileId === profileId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function favouriteToFormValues(fav: FavouriteMeal): MealFormValues {
  return {
    mealName: fav.name,
    mealType: fav.mealType,
    source: fav.source,
    calories: fav.calories,
    protein: fav.protein,
    carbs: fav.carbs,
    fat: fav.fat,
    fibre: fav.fibre,
    sugar: fav.sugar,
    salt: fav.salt,
    portionSize: fav.portionSize,
    triggerTags: fav.triggerTags,
    notes: fav.notes ?? '',
  };
}

export function mealToFavourite(meal: Meal, displayName?: string): FavouriteMeal {
  const now = nowISO();
  return {
    id: generateId(),
    profileId: meal.profileId,
    name: displayName?.trim() || meal.mealName,
    mealType: meal.mealType,
    source: meal.source,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fibre: meal.fibre,
    sugar: meal.sugar ?? 0,
    salt: meal.salt ?? 0,
    portionSize: meal.portionSize,
    triggerTags: meal.triggerTags,
    notes: meal.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function formValuesToFavourite(
  values: MealFormValues,
  profileId: string,
  existing?: FavouriteMeal
): FavouriteMeal {
  const now = nowISO();
  return {
    id: existing?.id ?? generateId(),
    profileId,
    name: values.mealName.trim(),
    mealType: values.mealType,
    source: values.source,
    calories: values.calories,
    protein: values.protein,
    carbs: values.carbs,
    fat: values.fat,
    fibre: values.fibre,
    sugar: values.sugar,
    salt: values.salt,
    portionSize: values.portionSize,
    triggerTags: values.triggerTags,
    notes: values.notes.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function isFavouriteNameTaken(
  data: AppData,
  profileId: string,
  name: string,
  excludeId?: string
): boolean {
  const lower = name.trim().toLowerCase();
  return data.favouriteMeals.some(
    (f) =>
      f.profileId === profileId &&
      f.id !== excludeId &&
      f.name.toLowerCase() === lower
  );
}
