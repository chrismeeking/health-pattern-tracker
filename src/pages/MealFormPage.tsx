import { useMemo, useState } from 'react';

import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useApp } from '@/hooks/useAppData';

import { findById, generateId, getProfileData, updateById } from '@/services/storage';

import { assessMealRisk } from '@/services/riskEngine';

import { favouriteToFormValues, mealToFavourite } from '@/services/food/favouriteMeals';

import { foodItemToMealFormValues } from '@/services/food/foodLookup';

import {

  getRecentMeals,

  getUniqueRecentByName,

  getYesterdayMealByType,

  repeatMealFormValues,

} from '@/utils/recentMeals';

import { nowISO } from '@/utils/helpers';

import { MealForm, mealToFormValues, type MealFormValues } from '@/components/MealForm';

import { MealQuickAddPanel } from '@/components/MealQuickAddPanel';

import { Button } from '@/components/Button';

import { Card } from '@/components/Card';

import type { Meal, MealType } from '@/types';



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

    saturatedFat: values.saturatedFat || undefined,

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

  const location = useLocation();

  const [searchParams] = useSearchParams();

  const copyFromId = searchParams.get('copy');

  const favouriteId = searchParams.get('favourite');

  const foodId = searchParams.get('food');



  if (!activeProfile) return null;



  const profileData = getProfileData(data, activeProfile.id);

  const profileMeals = profileData.meals;



  const copyMeal = copyFromId ? findById(profileMeals, copyFromId) : null;

  const favourite = favouriteId

    ? findById(profileData.favouriteMeals, favouriteId)

    : null;

  const savedFood = foodId ? findById(profileData.savedFoods, foodId) : null;



  const locationState = location.state as {
    prefilled?: Partial<MealFormValues>;
    fromBarcode?: boolean;
  } | null;

  const prefilledFromState = locationState?.prefilled;

  const fromBarcode = locationState?.fromBarcode ?? false;



  const initialFromSource = copyMeal

    ? mealToFormValues(copyMeal)

    : favourite

      ? favouriteToFormValues(favourite)

      : savedFood

        ? foodItemToMealFormValues(savedFood)

        : prefilledFromState;



  const [liveValues, setLiveValues] = useState<MealFormValues>(() => ({

    mealName: '',

    mealType: 'lunch',

    source: 'unknown',

    calories: 0,

    protein: 0,

    carbs: 0,

    fat: 0,

    saturatedFat: 0,

    fibre: 0,

    sugar: 0,

    salt: 0,

    portionSize: 'normal',

    triggerTags: [],

    notes: '',

    ...initialFromSource,

  }));



  const [aiApplied, setAiApplied] = useState<Partial<MealFormValues> | null>(() =>
    prefilledFromState ? prefilledFromState : null
  );

  const [aiAppliedKey, setAiAppliedKey] = useState(() => (prefilledFromState ? 1 : 0));

  const [showAiBanner, setShowAiBanner] = useState(
    () => !!prefilledFromState || !!savedFood
  );

  const [savedFavourite, setSavedFavourite] = useState(false);



  const risk = useMealRisk(liveValues, data, activeProfile.id);



  const recentUnique = getUniqueRecentByName(profileMeals, 5);

  const yesterdayOptions: { type: MealType; meal: Meal | null }[] = [

    { type: 'breakfast', meal: getYesterdayMealByType(profileMeals, 'breakfast') },

    { type: 'lunch', meal: getYesterdayMealByType(profileMeals, 'lunch') },

    { type: 'dinner', meal: getYesterdayMealByType(profileMeals, 'dinner') },

  ];



  const applyMealTemplate = (meal: Meal) => {

    const values = repeatMealFormValues(meal);

    setAiApplied(values);

    setAiAppliedKey((k) => k + 1);

    setLiveValues(values);

  };

  const quickSaveMealTemplate = (meal: Meal) => {
    const mealValues = repeatMealFormValues(meal);
    const newMeal = buildMeal(mealValues, activeProfile.id);
    update((d) => ({ ...d, meals: [...d.meals, newMeal] }));
    navigate('/meals');
  };



  const saveAsFavourite = () => {

    if (!liveValues.mealName.trim()) return;

    const meal = buildMeal(liveValues, activeProfile.id);

    const fav = mealToFavourite(meal);

    update((d) => ({ ...d, favouriteMeals: [...d.favouriteMeals, fav] }));

    setSavedFavourite(true);

  };



  const formKey = `${copyFromId ?? favouriteId ?? foodId ?? 'new'}-${aiAppliedKey}-${location.key}`;



  return (

    <div className="space-y-4">

      <h1 className="text-xl font-semibold text-slate-800">Add Meal</h1>



      <MealQuickAddPanel

        recentMeals={recentUnique.length ? recentUnique : getRecentMeals(profileMeals, 4)}

        onCopyMeal={(id) => navigate(`/add/meal?copy=${id}`, { replace: true })}

        onQuickSaveMeal={(id) => {
          const meal = profileMeals.find((m) => m.id === id);
          if (meal) quickSaveMealTemplate(meal);
        }}

        onRepeatYesterday={(type) => {

          const meal = getYesterdayMealByType(profileMeals, type);

          if (meal) applyMealTemplate(meal);

        }}

        yesterdayOptions={yesterdayOptions}

      />



      {(favourite || savedFood) && (

        <Card className="bg-teal-50 border-teal-100 text-sm text-teal-800">

          {favourite && `Adding from favourite: ${favourite.name}`}

          {savedFood && `Adding packaged food: ${savedFood.name}`}

        </Card>

      )}



      <MealForm

          key={formKey}

          quickMode

          initial={initialFromSource}

          appliedValues={aiApplied}

          showAiEstimateBanner={showAiBanner}

          estimateBannerMessage={
            fromBarcode || savedFood
              ? 'Packaged food — review before saving.'
              : 'Estimate applied — review before saving.'
          }

          profileId={activeProfile.id}

          favourites={profileData.favouriteMeals}

          recentMeals={profileMeals}

          onSuggestApply={(values) => {

            setAiApplied(values);

            setAiAppliedKey((k) => k + 1);

            setShowAiBanner(true);

            setLiveValues((prev) => ({ ...prev, ...values }));

          }}

          onValuesChange={setLiveValues}

          riskAssessment={risk}

          onSubmit={(values) => {

            const meal = buildMeal(values, activeProfile.id);

            update((d) => ({ ...d, meals: [...d.meals, meal] }));

            navigate('/meals');

          }}

          onCancel={() => navigate('/add')}

        />

      {liveValues.mealName.trim() && (

        <Button variant="outline" fullWidth onClick={saveAsFavourite} disabled={savedFavourite}>

          {savedFavourite ? 'Saved as favourite ✓' : 'Save as favourite'}

        </Button>

      )}

    </div>

  );

}



export function EditMealPage() {

  const { id } = useParams<{ id: string }>();

  const { data, activeProfile, update } = useApp();

  const navigate = useNavigate();

  const [savedFavourite, setSavedFavourite] = useState(false);



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



  const saveAsFavourite = () => {

    const fav = mealToFavourite(meal);

    update((d) => ({ ...d, favouriteMeals: [...d.favouriteMeals, fav] }));

    setSavedFavourite(true);

  };



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

      <Button variant="outline" fullWidth onClick={saveAsFavourite} disabled={savedFavourite}>

        {savedFavourite ? 'Saved as favourite ✓' : 'Save as favourite'}

      </Button>

    </div>

  );

}


