import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { getProfileData, removeById } from '@/services/storage';
import { getSavedFoodsForProfile } from '@/services/food/foodLookup';
import { FOOD_ITEM_SOURCE_LABELS } from '@/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function SavedFoodsPage() {
  const { data, activeProfile, update } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);

  if (!activeProfile) return null;

  const profileData = getProfileData(data, activeProfile.id);
  const foods = getSavedFoodsForProfile(profileData.savedFoods, activeProfile.id);

  const confirmDelete = () => {
    if (!deleteId) return;
    update((d) => ({ ...d, savedFoods: removeById(d.savedFoods, deleteId) }));
    setDeleteId(null);
  };

  const clearAll = () => {
    update((d) => ({
      ...d,
      savedFoods: d.savedFoods.filter((f) => f.profileId !== activeProfile.id),
    }));
    setShowClearAll(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Saved foods</h1>
          <p className="text-sm text-slate-400">
            Personal and shared barcode foods for {activeProfile.name}
          </p>
        </div>
        <Link to="/add/meal/scan?from=saved">
          <Button size="sm" variant="outline">
            Scan
          </Button>
        </Link>
      </div>

      {foods.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-sm text-slate-500">No saved foods yet.</p>
          <p className="text-xs text-slate-400 mt-2">
            Scan an unknown barcode to save a custom food for next time.
          </p>
        </Card>
      ) : (
        foods.map((food) => (
          <Card key={food.id} className="space-y-2">
            <div className="flex justify-between gap-2">
              <div>
                <h3 className="font-medium text-slate-800">{food.name}</h3>
                {food.brand && <p className="text-xs text-slate-400">{food.brand}</p>}
                <p className="text-xs text-slate-500 mt-1">
                  {food.barcode ? `Barcode ${food.barcode} · ` : ''}
                  {food.servingSize} · {food.calories} kcal
                </p>
                <p className="text-[10px] text-slate-400">
                  {FOOD_ITEM_SOURCE_LABELS[food.source]} ·{' '}
                  {food.profileId ? `Personal to ${activeProfile.name}` : 'Shared household food'}
                </p>
              </div>
              <Link to={`/add/meal?food=${food.id}`} className="text-sm text-teal-600 shrink-0">
                Add
              </Link>
            </div>
            <Button variant="ghost" size="sm" className="text-coral-500" onClick={() => setDeleteId(food.id)}>
              Remove
            </Button>
          </Card>
        ))
      )}

      {foods.length > 0 && (
        <Button variant="danger" fullWidth onClick={() => setShowClearAll(true)}>
          Clear personal saved foods for {activeProfile.name}
        </Button>
      )}

      <Link to="/profile">
        <Button variant="ghost" fullWidth>
          Back to settings
        </Button>
      </Link>

      <ConfirmDialog
        open={deleteId != null}
        title="Remove saved food?"
        message="This food will be removed from your saved list."
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={showClearAll}
        title="Clear personal saved foods?"
        message={`Saved foods personal to ${activeProfile.name} will be removed. Shared household foods stay available.`}
        warning="This cannot be undone."
        confirmLabel="Clear all"
        onConfirm={clearAll}
        onCancel={() => setShowClearAll(false)}
      />
    </div>
  );
}
