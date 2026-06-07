import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId } from '@/services/storage';
import { getTodayWater } from '@/utils/nutrition';
import { nowISO } from '@/utils/helpers';
import { WaterTracker } from '@/components/WaterTracker';
import { Card } from '@/components/Card';

const QUICK_AMOUNTS = [250, 500, 750];

export function AddWaterPage() {
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile) return null;

  const waterEntries = data.waterEntries.filter((e) => e.profileId === activeProfile.id);
  const todayWater = getTodayWater(waterEntries);

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
      <h1 className="text-xl font-semibold text-slate-800">Add Water</h1>

      <Card className="text-center py-4">
        <p className="text-3xl font-semibold text-teal-600">{todayWater}ml</p>
        <p className="text-sm text-slate-500 mt-1">
          of {activeProfile.waterTarget ?? 2000}ml target today
        </p>
      </Card>

      <WaterTracker
        currentMl={todayWater}
        targetMl={activeProfile.waterTarget}
        onAdd={addWater}
        showTitle={false}
      />

      <div className="grid grid-cols-1 gap-3">
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => {
              addWater(amt);
              navigate('/');
            }}
            className="w-full py-4 rounded-2xl bg-teal-500 text-white text-lg font-medium active:bg-teal-600 min-h-[56px]"
          >
            + {amt}ml
          </button>
        ))}
      </div>
    </div>
  );
}
