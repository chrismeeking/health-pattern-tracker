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

const EXAMPLES = ['pepperoni pizza', 'Thai green curry with rice', 'roast dinner'];

interface MealAiAnalysisPanelProps {
  profileId: string;
  onApply: (values: Partial<MealFormValues>) => void;
}

type InputMode = 'text' | 'photo' | 'menu';

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

export function MealAiAnalysisPanel({ profileId, onApply }: MealAiAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [mealText, setMealText] = useState('');
  const [menuText, setMenuText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedMealAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30';

  const analysisTypeForMode = (mode: InputMode): MealAnalysisType => {
    if (mode === 'photo') return 'photo';
    if (mode === 'menu') return 'menu';
    return 'text';
  };

  const resolveMealText = (): string => {
    if (inputMode === 'menu') return menuText.trim();
    if (inputMode === 'photo') {
      return mealText.trim() || 'meal from photo';
    }
    return mealText.trim();
  };

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
      const base64 = dataUrl.split(',')[1] ?? null;
      setImageBase64(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    const text = resolveMealText();
    if (!text && !imageBase64) {
      setError('Describe your meal, add menu text, or upload a photo.');
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
          : analysisTypeForMode(inputMode);

      const outcome = await analyseMeal({
        profileId,
        mealText: text,
        imageBase64: inputMode === 'photo' ? imageBase64 : null,
        analysisType: type,
      });

      setResult(outcome.analysis);
      if (outcome.usedLocalFallback) {
        setFallbackNotice(
          outcome.backendError ??
            'Backend unavailable — showing a local estimate instead.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Analysis could not complete. Try again or enter details manually.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inferSource = (analysis: ParsedMealAnalysis): MealSource => {
    const lower = `${analysis.mealName} ${mealText} ${menuText}`.toLowerCase();
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
    <Card className="space-y-4 border-teal-100 bg-teal-50/30">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-sm font-medium text-slate-700">Analyse with AI</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Secure backend analysis — edit everything before saving.
          </p>
        </div>
        <Button
          type="button"
          variant={expanded ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Hide' : 'Open'}
        </Button>
      </div>

      {expanded && (
        <>
          <div className="flex flex-wrap gap-2">
            {modeChip('text', 'Describe meal')}
            {modeChip('photo', 'Photo')}
            {modeChip('menu', 'Menu / packaging')}
          </div>

          {inputMode === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 block">
                Describe your meal
              </label>
              <textarea
                value={mealText}
                onChange={(e) => setMealText(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="e.g. pepperoni pizza"
                disabled={loading}
              />
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setMealText(ex)}
                    className="text-xs px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-500"
                    disabled={loading}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {inputMode === 'photo' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoChange(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-8 rounded-xl border-2 border-dashed border-slate-200 bg-white text-sm text-slate-500 min-h-[48px]"
              >
                {imagePreview ? 'Change photo' : 'Upload meal photo (max 4MB)'}
              </button>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Meal preview"
                  className="w-full max-h-40 object-cover rounded-xl"
                />
              )}
              <input
                type="text"
                value={mealText}
                onChange={(e) => setMealText(e.target.value)}
                className={inputClass}
                placeholder="Optional: describe what is in the photo"
                disabled={loading}
              />
            </div>
          )}

          {inputMode === 'menu' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 block">
                Menu or packaging text
              </label>
              <textarea
                value={menuText}
                onChange={(e) => setMenuText(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Paste menu item name, ingredients list, or packaging label text"
                disabled={loading}
              />
            </div>
          )}

          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
            {AI_NUTRITION_DISCLAIMER} This is not medical advice — trigger tags are possible
            patterns to review, not confirmed causes.
          </p>

          {error && (
            <Card className="bg-coral-50 border-coral-100">
              <p className="text-sm text-coral-700">{error}</p>
            </Card>
          )}

          {loading && (
            <Card className="bg-white text-center py-4">
              <p className="text-sm text-slate-600">Analysing meal…</p>
              <p className="text-xs text-slate-400 mt-1">Secure backend request in progress</p>
            </Card>
          )}

          <Button type="button" fullWidth onClick={runAnalysis} disabled={loading}>
            {loading ? 'Analysing…' : 'Analyse with AI'}
          </Button>

          {fallbackNotice && (
            <Card className="bg-amber-50 border-amber-100">
              <p className="text-xs text-amber-800 leading-relaxed">{fallbackNotice}</p>
            </Card>
          )}

          {result && !loading && (
            <div className="space-y-3 pt-2 border-t border-teal-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-700">
                  {AI_ESTIMATE_REVIEW_LABEL}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {providerLabel(result.provider)} · {inputMode}
                </span>
              </div>

              <div className="bg-white rounded-xl p-3 space-y-2 text-sm">
                <p>
                  <span className="text-slate-400">Meal:</span>{' '}
                  <span className="font-medium text-slate-800">{result.mealName}</span>
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
                  <span>Calories: {result.estimatedCalories}</span>
                  <span>Protein: {result.protein}g</span>
                  <span>Carbs: {result.carbs}g</span>
                  <span>Fat: {result.fat}g</span>
                  <span>Sat. fat: {result.saturatedFat}g</span>
                  <span>Fibre: {result.fibre}g</span>
                  <span>Sugar: {result.sugar}g</span>
                  <span>Salt: {result.salt}g</span>
                </div>

                {result.likelyIngredients.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Likely ingredients: {result.likelyIngredients.join(', ')}
                  </p>
                )}

                {result.triggerTags.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Possible trigger tags:{' '}
                    {result.triggerTags.map((t) => TRIGGER_TAG_LABELS[t]).join(', ')}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 self-center">Confidence:</span>
                  <ConfidenceBadge level={result.confidence.calories} />
                  <ConfidenceBadge level={result.confidence.ingredients} />
                  <ConfidenceBadge level={result.confidence.triggerTags} />
                </div>

                {result.notes && (
                  <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-2">
                    {result.notes}
                  </p>
                )}
              </div>

              <Button type="button" variant="secondary" fullWidth onClick={applyToForm}>
                Apply to form (edit before saving)
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
