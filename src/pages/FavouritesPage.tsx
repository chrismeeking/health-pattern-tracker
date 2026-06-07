import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { removeById } from '@/services/storage';
import { getFavouritesForProfile } from '@/services/food/favouriteMeals';
import { FavouriteMealCard } from '@/components/FavouriteMealCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function FavouritesPage() {
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pickMode = searchParams.get('pick') === '1';
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!activeProfile) return null;

  const favourites = getFavouritesForProfile(data, activeProfile.id);

  const confirmDelete = () => {
    if (!deleteId) return;
    update((d) => ({ ...d, favouriteMeals: removeById(d.favouriteMeals, deleteId) }));
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            {pickMode ? 'Add from favourite' : 'Favourite meals'}
          </h1>
          <p className="text-sm text-slate-400">Profile-specific — household sharing later</p>
        </div>
        {!pickMode && (
          <Link to="/favourites/new">
            <Button size="sm">+ New</Button>
          </Link>
        )}
      </div>

      {favourites.length === 0 ? (
        <Card className="text-center py-8 space-y-3">
          <p className="text-sm text-slate-500">No favourites yet.</p>
          <p className="text-xs text-slate-400">
            Save any meal as a favourite from the meal log or when adding a meal.
          </p>
          <Link to="/add/meal">
            <Button variant="outline" size="sm">
              Add a meal
            </Button>
          </Link>
        </Card>
      ) : (
        favourites.map((fav) => (
          <FavouriteMealCard
            key={fav.id}
            favourite={fav}
            pickMode={pickMode}
            onUse={() => navigate(`/add/meal?favourite=${fav.id}`)}
            onDelete={() => setDeleteId(fav.id)}
          />
        ))
      )}

      {!pickMode && (
        <Link to="/profile">
          <Button variant="ghost" fullWidth>
            Back to settings
          </Button>
        </Link>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="Delete favourite?"
        message="This favourite will be removed. Your meal history is not affected."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
