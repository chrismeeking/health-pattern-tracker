import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId } from '@/services/storage';
import {
  createCustomFood,
  foodItemToMealFormValues,
  getLookupStatusLabel,
  lookupBarcode,
  scaleFoodNutrition,
  type ServingMode,
} from '@/services/food/foodLookup';
import {
  getScannerCapabilities,
  getScannerStatusLabel,
  isValidBarcodeFormat,
  normalizeBarcodeInput,
  scanBarcodeFromCamera,
} from '@/services/food/barcodeScanner';
import { nowISO } from '@/utils/helpers';
import type { Meal } from '@/types';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function ScanBarcodePage() {
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [foodItem, setFoodItem] = useState<
    ReturnType<typeof lookupBarcode>['item']
  >(null);
  const [servingMode, setServingMode] = useState<ServingMode>('default');
  const [servingAmount, setServingAmount] = useState(1);
  const [showManualSave, setShowManualSave] = useState(false);
  const [manualName, setManualName] = useState('');

  const caps = getScannerCapabilities();

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (!activeProfile) return null;

  const profileFoods = data.savedFoods.filter(
    (f) => !f.profileId || f.profileId === activeProfile.id
  );

  const runLookup = (code: string) => {
    const normalized = normalizeBarcodeInput(code);
    if (!isValidBarcodeFormat(normalized)) {
      setScanError('Enter a valid 8–14 digit barcode.');
      setFoodItem(null);
      return;
    }
    setBarcode(normalized);
    setScanError(null);
    const result = lookupBarcode(normalized, profileFoods);
    setLookupMessage(result.message ?? null);
    setFoodItem(result.item);
    setShowManualSave(!result.found);
    setManualName('');
  };

  const startCameraScan = async () => {
    if (!videoRef.current) return;
    setScanning(true);
    setScanError(null);
    const result = await scanBarcodeFromCamera(videoRef.current);
    setScanning(false);
    if (result.ok && result.barcode) {
      runLookup(result.barcode);
    } else {
      setScanError(result.error ?? 'Scan failed.');
    }
  };

  const saveMeal = () => {
    if (!foodItem) return;
    const scaled =
      servingMode === 'default'
        ? scaleFoodNutrition(foodItem, 'portions', 1)
        : scaleFoodNutrition(foodItem, servingMode, servingAmount);
    const formValues = foodItemToMealFormValues(foodItem, scaled);
    const now = nowISO();
    const meal: Meal = {
      id: generateId(),
      profileId: activeProfile.id,
      dateTime: now,
      mealType: formValues.mealType,
      mealName: formValues.mealName,
      source: 'packaged',
      calories: formValues.calories,
      protein: formValues.protein,
      carbs: formValues.carbs,
      fat: formValues.fat,
      fibre: formValues.fibre,
      sugar: formValues.sugar,
      salt: formValues.salt,
      portionSize: formValues.portionSize,
      triggerTags: formValues.triggerTags,
      notes: formValues.notes,
      createdAt: now,
      updatedAt: now,
    };
    update((d) => ({ ...d, meals: [...d.meals, meal] }));
    navigate('/meals');
  };

  const saveCustomAndUse = () => {
    if (!manualName.trim()) return;
    const custom = createCustomFood({
      profileId: activeProfile.id,
      barcode: barcode || undefined,
      name: manualName.trim(),
      servingSize: '1 serving',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fibre: 0,
      sugar: 0,
      salt: 0,
    });
    update((d) => ({ ...d, savedFoods: [...d.savedFoods, custom] }));
    navigate(`/add/meal?food=${custom.id}`);
  };

  const scaledPreview =
    foodItem &&
    (servingMode === 'default'
      ? scaleFoodNutrition(foodItem, 'portions', 1)
      : scaleFoodNutrition(foodItem, servingMode, servingAmount));

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30';

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Scan barcode</h1>
      <p className="text-sm text-slate-500">{getScannerStatusLabel()}</p>

      <Card className="space-y-3 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full max-h-48 bg-slate-900 rounded-xl object-cover"
          playsInline
          muted
        />
        {caps.cameraAvailable ? (
          <Button fullWidth variant="secondary" onClick={() => void startCameraScan()} disabled={scanning}>
            {scanning ? 'Scanning…' : 'Scan with camera'}
          </Button>
        ) : (
          <p className="text-xs text-slate-400 text-center">Camera not available — use manual entry.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <label className="text-xs font-medium text-slate-500 block">Manual barcode entry</label>
        <input
          type="text"
          inputMode="numeric"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="e.g. 5000159484695"
          className={inputClass}
        />
        <Button fullWidth onClick={() => runLookup(barcode)}>
          Look up food
        </Button>
        <p className="text-[10px] text-slate-400">{getLookupStatusLabel()}</p>
      </Card>

      {scanError && <p className="text-sm text-coral-600">{scanError}</p>}
      {lookupMessage && !foodItem && (
        <Card className="bg-amber-50 border-amber-100 text-sm text-amber-800">{lookupMessage}</Card>
      )}

      {showManualSave && (
        <Card className="space-y-3">
          <p className="text-sm text-slate-600">Save as custom food and enter details manually.</p>
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Food name"
            className={inputClass}
          />
          <Button fullWidth variant="secondary" onClick={saveCustomAndUse}>
            Save &amp; add manually
          </Button>
        </Card>
      )}

      {foodItem && scaledPreview && (
        <Card className="space-y-3">
          <div>
            <h2 className="font-medium text-slate-800">{foodItem.name}</h2>
            {foodItem.brand && <p className="text-xs text-slate-400">{foodItem.brand}</p>}
            <p className="text-xs text-slate-500 mt-1">Serving: {foodItem.servingSize}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>Calories: {scaledPreview.calories}</span>
            <span>Protein: {scaledPreview.protein}g</span>
            <span>Carbs: {scaledPreview.carbs}g</span>
            <span>Fat: {scaledPreview.fat}g</span>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">Serving size</p>
            <div className="flex flex-wrap gap-2">
              {(['default', 'portions', 'grams'] as ServingMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setServingMode(mode)}
                  className={`px-3 py-2 rounded-xl text-sm capitalize min-h-[40px] ${
                    servingMode === mode ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {mode === 'default' ? '1 serving' : mode}
                </button>
              ))}
            </div>
            {servingMode !== 'default' && (
              <input
                type="number"
                min={0.25}
                step={servingMode === 'grams' ? 10 : 0.25}
                value={servingAmount}
                onChange={(e) => setServingAmount(Number(e.target.value) || 1)}
                className={`${inputClass} mt-2`}
                placeholder={servingMode === 'grams' ? 'Grams' : 'Portions'}
              />
            )}
          </div>

          <Button fullWidth onClick={saveMeal}>
            Add to meal log
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() =>
              navigate('/add/meal', {
                state: {
                  prefilled: foodItemToMealFormValues(foodItem, scaledPreview),
                },
              })
            }
          >
            Edit before saving
          </Button>
        </Card>
      )}

      <Button variant="ghost" fullWidth onClick={() => navigate('/add/meal')}>
        Manual meal entry
      </Button>
    </div>
  );
}
