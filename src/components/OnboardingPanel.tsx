import { useMemo, useState } from 'react';
import { useApp } from '@/hooks/useAppData';
import { generateId } from '@/services/storage';
import {
  getSuggestedNutritionTargets,
  suggestedTargetsToProfileFields,
} from '@/utils/nutritionTargets';
import {
  detectPreset,
  modulesForPreset,
  normalizeEnabledModules,
} from '@/utils/profileModules';
import {
  GOAL_TYPE_LABELS,
  type ActivityLevel,
  type GoalType,
  type MeasurementSystem,
  type Profile,
  type ProfileModule,
} from '@/types';
import { BodyMetricsFields } from './BodyMetricsFields';
import { ModulePresetPicker } from './ModulePresetPicker';
import { Button } from './Button';
import { Card } from './Card';

const GOAL_TYPES = Object.keys(GOAL_TYPE_LABELS) as GoalType[];
const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active'];

const DEFAULT_MODULES: ProfileModule[] = ['nutrition', 'macros', 'weight', 'water', 'exercise', 'goals'];

function presetShowsWeightFields(modules: ProfileModule[]): boolean {
  const preset = detectPreset(modules);
  if (preset === 'digestiveHealth') return false;
  if (preset === 'simpleCalories') return false;
  return modules.includes('weight') || modules.includes('macros');
}

function presetShowsNutritionTargets(modules: ProfileModule[]): boolean {
  const preset = detectPreset(modules);
  return preset !== 'digestiveHealth' && modules.includes('nutrition');
}

export function OnboardingPanel() {
  const { update, loadDemo } = useApp();
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('generalHealth');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [currentWeightKg, setCurrentWeightKg] = useState<number | undefined>();
  const [targetWeightKg, setTargetWeightKg] = useState<number | undefined>();
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');
  const [age, setAge] = useState('');
  const [modules, setModules] = useState<ProfileModule[]>(DEFAULT_MODULES);

  const handleModulesChange = (next: ProfileModule[]) => {
    const preset = detectPreset(next);
    if (preset === 'digestiveHealth') {
      setModules(modulesForPreset('digestiveHealth'));
      return;
    }
    setModules(next);
  };

  const previewProfile = useMemo<Profile>(
    () => ({
      id: 'preview',
      name: name.trim() || 'Your profile',
      activityLevel,
      goalType,
      enabledModules: normalizeEnabledModules(modules),
      currentWeight: currentWeightKg,
      targetWeight: targetWeightKg,
      height: heightCm,
      measurementSystem,
      age: age ? Number(age) : undefined,
    }),
    [activityLevel, age, currentWeightKg, goalType, heightCm, measurementSystem, modules, name, targetWeightKg]
  );

  const suggestedTargets = getSuggestedNutritionTargets(previewProfile);
  const showWeightFields = presetShowsWeightFields(modules);
  const showNutritionTargets = presetShowsNutritionTargets(modules);

  const createProfile = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const id = generateId();
    const baseProfile: Profile = {
      ...previewProfile,
      id,
      name: trimmedName,
      enabledModules: normalizeEnabledModules(modules),
    };
    const profile: Profile = showNutritionTargets
      ? {
          ...baseProfile,
          ...suggestedTargetsToProfileFields(getSuggestedNutritionTargets(baseProfile)),
        }
      : baseProfile;

    update((data) => ({
      ...data,
      profiles: [...data.profiles, profile],
      activeProfileId: id,
      demoLoaded: true,
    }));
  };

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30 min-h-[48px] dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100';

  return (
    <div className="space-y-4">
      <Card className="bg-teal-50 border-teal-100 space-y-3 dark:bg-teal-500/10 dark:border-teal-500/20">
        <div>
          <p className="text-xs uppercase tracking-wide text-teal-700 font-semibold dark:text-teal-200">
            Welcome
          </p>
          <h1 className="text-xl font-semibold text-teal-950 mt-1 dark:text-teal-50">
            Set up your profile
          </h1>
          <p className="text-sm text-teal-800/80 mt-1 dark:text-teal-100/80">
            Each person gets their own dashboard — pick only the tracking areas you care about.
          </p>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">Your name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Alex"
            className={inputClass}
            autoFocus
          />
        </div>

        <ModulePresetPicker modules={modules} onChange={handleModulesChange} />

        {showNutritionTargets && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">Goal</label>
              <select
                value={goalType}
                onChange={(event) => setGoalType(event.target.value as GoalType)}
                className={inputClass}
              >
                {GOAL_TYPES.map((goal) => (
                  <option key={goal} value={goal}>
                    {GOAL_TYPE_LABELS[goal]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">Activity</label>
              <select
                value={activityLevel}
                onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)}
                className={inputClass}
              >
                {ACTIVITY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {showWeightFields && (
          <>
            <BodyMetricsFields
              system={measurementSystem}
              onSystemChange={setMeasurementSystem}
              heightCm={heightCm}
              currentWeightKg={currentWeightKg}
              targetWeightKg={targetWeightKg}
              onHeightChange={setHeightCm}
              onCurrentWeightChange={setCurrentWeightKg}
              onTargetWeightChange={setTargetWeightKg}
              inputClass={inputClass}
            />
            <div>
              <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">Age (optional)</label>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="Age"
                className={inputClass}
              />
            </div>
          </>
        )}

        {showNutritionTargets && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 dark:bg-slate-950 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-100">Starting targets</p>
            <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
              {suggestedTargets.dailyCalorieTarget} kcal · P {suggestedTargets.proteinTarget}g ·
              C {suggestedTargets.carbTarget}g · F {suggestedTargets.fatTarget}g · Fibre{' '}
              {suggestedTargets.fibreTarget}g
            </p>
            <p className="text-[10px] text-slate-400 mt-1 dark:text-slate-500">
              NHS / NICE-backed estimates — adjust anytime in Settings.
            </p>
          </div>
        )}

        <Button fullWidth size="lg" onClick={createProfile} disabled={!name.trim()}>
          Create profile
        </Button>
      </Card>

      <Button variant="ghost" fullWidth onClick={loadDemo}>
        Load demo data instead
      </Button>
    </div>
  );
}
