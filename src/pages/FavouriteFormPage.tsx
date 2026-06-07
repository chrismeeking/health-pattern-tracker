import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { findById, updateById } from '@/services/storage';
import {
  favouriteToFormValues,
  formValuesToFavourite,
  isFavouriteNameTaken,
} from '@/services/food/favouriteMeals';
import { MealForm, type MealFormValues } from '@/components/MealForm';

export function CreateFavouritePage() {
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();
  const [nameError, setNameError] = useState<string | null>(null);

  if (!activeProfile) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">New favourite</h1>
      {nameError && <p className="text-sm text-coral-600">{nameError}</p>}
      <MealForm
        submitLabel="Save favourite"
        onSubmit={(values) => {
          if (isFavouriteNameTaken(data, activeProfile.id, values.mealName)) {
            setNameError('A favourite with this name already exists.');
            return;
          }
          setNameError(null);
          const fav = formValuesToFavourite(values, activeProfile.id);
          update((d) => ({ ...d, favouriteMeals: [...d.favouriteMeals, fav] }));
          navigate('/favourites');
        }}
        onCancel={() => navigate('/favourites')}
      />
    </div>
  );
}
export function EditFavouritePage() {
  const { id } = useParams<{ id: string }>();
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile || !id) return null;

  const favourite = findById(
    data.favouriteMeals.filter((f) => f.profileId === activeProfile.id),
    id
  );

  if (!favourite) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-slate-500">Favourite not found.</p>
        <Link to="/favourites" className="text-teal-500 text-sm">
          Back
        </Link>
      </div>
    );
  }

  const handleSubmit = (values: MealFormValues) => {
    const updated = formValuesToFavourite(values, activeProfile.id, favourite);
    update((d) => ({
      ...d,
      favouriteMeals: updateById(d.favouriteMeals, favourite.id, updated),
    }));
    navigate('/favourites');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Edit favourite</h1>
      <MealForm
        initial={favouriteToFormValues(favourite)}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/favourites')}
      />
    </div>
  );
}
