import { useRef, useState } from 'react';
import type { MealSource } from '@/types';
import { TRIGGER_TAG_LABELS } from '@/types';
import { analyseMeal, type ParsedMealAnalysis } from '@/services/ai/mealAnalysisClient';
import type { MealAnalysisType } from '@/services/ai/types';
import {
  AI_ESTIMATE_REVIEW_LABEL,
  AI_NUTRITION_DISCLAIMER,
  MAX_IMAGE_FILE_BYTES,
} from '@/services/ai/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Button } from './Button';
import { Card } from './Card';
import type { MealFormValues } from './MealForm';

type InputMode = 'photo' | 'menu';

interface MealVisualAnalysisAssistProps {
  profileId: string;
  onApply: (values: Partial<MealFormValues>) => void;
  onClose: () => void;
}

function providerLabel(provider: ParsedMealAnalysis['provider']): string {
  switch (provider) {
    case 'openai':
      return 'Secure AI';
    case 'server-mock':
      return 'Server mock';
    case 'local-mock':
      return 'Local estimate';
    case 'local-database':
      return 'Local database';
    default:
      return 'Estimate';
  }
}

export function MealVisualAnalysisAssist({
  profileId,
  onApply,
  onClose,
}: MealVisualAnalysisAssistProps) {
  const [inputMode, setInputMode] = useState<InputMode>('photo');
  const [mealHint, setMealHint] = useState('');
  const [menuText, setMenuText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedMealAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100';

  const handlePhotoChange = (file: File | undefined) => {
    if (!file) {
      setImagePreview(null);
      setImageBase64(null);
      return;
    }

    if (file.size > MAX_IMAGE_FILE_BYTES) {
      setError('Photo is too large. Please use an image under 4MB.');
      setImagePreview(null);
      setImageBase64(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1] ?? null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    const text =
      inputMode === 'menu'
        ? menuText.trim()
        : mealHint.trim() || 'meal from photo';

    if (inputMode === 'photo' && !imageBase64) {
      setError('Add a photo first, or switch to menu / packaging text.');
      return;
    }
    if (inputMode === 'menu' && !menuText.trim()) {
      setError('Paste menu or packaging text to analyse.');
      return;
    }

    setLoading(true);
    setError(null);
    setFallbackNotice(null);
    setResult(null);

    try {
      const type: MealAnalysisType =
        inputMode === 'menu' &&
        /ingredients|nutrition|per 100|kcal|salt|fat/i.test(menuText)
          ? 'packaging'
          : inputMode === 'menu'
            ? 'menu'
            : 'photo';

      const outcome = await analyseMeal({
        profileId,
        mealText: text,
        imageBase64: inputMode === 'photo' ? imageBase64 : null,
        analysisType: type,
      });

      setResult(outcome.analysis);
      if (outcome.usedLocalFallback) {
        setFallbackNotice(
          outcome.backendError ?? 'Backend unavailable — showing a local estimate instead.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Analysis could not complete. Try again or enter details manually.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inferSource = (analysis: ParsedMealAnalysis): MealSource => {
    const lower = `${analysis.mealName} ${mealHint} ${menuText}`.toLowerCase();
    if (/takeaway|delivery|pizza/i.test(lower)) return 'takeaway';
    if (/packaging|label|ingredients/i.test(menuText)) return 'packaged';
    if (/restaurant|menu/i.test(lower)) return 'restaurant';
    if (inputMode === 'photo') return 'unknown';
    return 'homemade';
  };

  const applyToForm = () => {
    if (!result) return;
    onApply({
      mealName: result.mealName,
      calories: result.estimatedCalories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      saturatedFat: result.saturatedFat,
      fibre: result.fibre,
      sugar: result.sugar,
      salt: result.salt,
      triggerTags: result.triggerTags,
      source: inferSource(result),
      notes: result.notes,
    });
    onClose();
  };

  const modeChip = (mode: InputMode, label: string) => (
    <button
      type="button"
      onClick={() => setInputMode(mode)}
      className={`px-3 py-2 rounded-xl text-sm min-h-[40px] ${
        inputMode === mode ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <Card className="mt-2 space-y-3 border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Photo or menu analysis
        </p>
        <button
          type="button"
          className="text-xs text-slate-400 hover:text-slate-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {modeChip('photo', 'Photo')}
        {modeChip('menu', 'Menu / packaging')}
      </div>

      {inputMode === 'photo' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhotoChange(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full py-6 rounded-xl border-2 border-dashed border-slate-200 bg-white text-sm text-slate-500 min-h-[48px] dark:bg-slate-950 dark:border-slate-700"
          >
            {imagePreview ? 'Change photo' : 'Take or upload meal photo (max 4MB)'}
          </button>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Meal preview"
              className="w-full max-h-36 object-cover rounded-xl"
            />
          )}
          <input
            type="text"
            value={mealHint}
            onChange={(e) => setMealHint(e.target.value)}
            className={inputClass}
            placeholder="Optional: describe what is in the photo"
            disabled={loading}
          />
        </div>
      )}

      {inputMode === 'menu' && (
        <textarea
          value={menuText}
          onChange={(e) => setMenuText(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Paste menu item, ingredients list, or packaging label"
          disabled={loading}
        />
      )}

      <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 leading-relaxed dark:bg-amber-950/30 dark:text-amber-200">
        {AI_NUTRITION_DISCLAIMER}
      </p>

      {error && <p className="text-xs text-coral-700">{error}</p>}
      {fallbackNotice && <p className="text-xs text-amber-800">{fallbackNotice}</p>}

      <Button type="button" fullWidth size="sm" onClick={runAnalysis} disabled={loading}>
        {loading ? 'Analysing…' : 'Analyse'}
      </Button>

      {result && !loading && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              {AI_ESTIMATE_REVIEW_LABEL}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
              {providerLabel(result.provider)}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-xl p-3 space-y-1.5 text-sm">
            <p className="font-medium text-slate-800 dark:text-slate-100">{result.mealName}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {result.estimatedCalories} kcal · P {result.protein}g · C {result.carbs}g · F{' '}
              {result.fat}g · Sat. {result.saturatedFat}g
            </p>
            {result.triggerTags.length > 0 && (
              <p className="text-[11px] text-slate-500">
                Tags: {result.triggerTags.map((t) => TRIGGER_TAG_LABELS[t]).join(', ')}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <ConfidenceBadge level={result.confidence.calories} />
              <ConfidenceBadge level={result.confidence.ingredients} />
              <ConfidenceBadge level={result.confidence.triggerTags} />
            </div>
          </div>

          <Button type="button" variant="secondary" fullWidth size="sm" onClick={applyToForm}>
            Apply to form
          </Button>
        </div>
      )}
    </Card>
  );
}
