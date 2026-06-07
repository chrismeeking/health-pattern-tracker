import { useMemo, useState } from 'react';
import { useApp } from '@/hooks/useAppData';
import { generateId } from '@/services/storage';
import {
  getSuggestedNutritionTargets,
  suggestedTargetsToProfileFields,
} from '@/utils/nutritionTargets';
import {
  GOAL_TYPE_LABELS,
  MODULE_LABELS,
  type ActivityLevel,
  type GoalType,
  type Profile,
  type ProfileModule,
} from '@/types';
import { Button } from './Button';
import { Card } from './Card';

const GOAL_TYPES = Object.keys(GOAL_TYPE_LABELS) as GoalType[];
const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active'];

const DEFAULT_MODULES: ProfileModule[] = ['nutrition', 'macros', 'weight', 'water', 'goals'];
const OPTIONAL_MODULES: ProfileModule[] = ['healthIssues', 'digestive'];

export function OnboardingPanel() {
  const { update, loadDemo } = useApp();
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('generalHealth');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [modules, setModules] = useState<ProfileModule[]>(DEFAULT_MODULES);

  const previewProfile = useMemo<Profile>(
    () => ({
      id: 'preview',
      name: name.trim() || 'Your profile',
      activityLevel,
      goalType,
      enabledModules: modules,
      currentWeight: currentWeight ? Number(currentWeight) : undefined,
      targetWeight: targetWeight ? Number(targetWeight) : undefined,
      height: height ? Number(height) : undefined,
      age: age ? Number(age) : undefined,
    }),
    [activityLevel, age, currentWeight, goalType, height, modules, name, targetWeight]
  );

  const suggestedTargets = getSuggestedNutritionTargets(previewProfile);

  const toggleModule = (module: ProfileModule) => {
    setModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    );
  };

  const createProfile = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const id = generateId();
    const baseProfile: Profile = {
      ...previewProfile,
      id,
      name: trimmedName,
    };
    const profile: Profile = {
      ...baseProfile,
      ...suggestedTargetsToProfileFields(getSuggestedNutritionTargets(baseProfile)),
    };

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
            Set up your first profile
          </h1>
          <p className="text-sm text-teal-800/80 mt-1 dark:text-teal-100/80">
            Targets and logs are profile-specific, so each person can have their own goals,
            meals, symptoms, and saved foods.
          </p>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Chris"
            className={inputClass}
            autoFocus
          />
        </div>

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

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="decimal"
            value={currentWeight}
            onChange={(event) => setCurrentWeight(event.target.value)}
            placeholder="Current kg"
            className={inputClass}
          />
          <input
            type="number"
            inputMode="decimal"
            value={targetWeight}
            onChange={(event) => setTargetWeight(event.target.value)}
            placeholder="Target kg"
            className={inputClass}
          />
          <input
            type="number"
            inputMode="numeric"
            value={height}
            onChange={(event) => setHeight(event.target.value)}
            placeholder="Height cm"
            className={inputClass}
          />
          <input
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            placeholder="Age"
            className={inputClass}
          />
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2 dark:text-slate-400">Optional modules</p>
          <div className="flex flex-wrap gap-2">
            {OPTIONAL_MODULES.map((module) => (
              <button
                key={module}
                type="button"
                onClick={() => toggleModule(module)}
                className={`px-3 py-2 rounded-xl text-xs min-h-[36px] ${
                  modules.includes(module)
                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-100'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {MODULE_LABELS[module]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 dark:bg-slate-950 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-100">Starting targets</p>
          <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
            {suggestedTargets.dailyCalorieTarget} kcal · P {suggestedTargets.proteinTarget}g ·
            C {suggestedTargets.carbTarget}g · F {suggestedTargets.fatTarget}g · Fibre{' '}
            {suggestedTargets.fibreTarget}g
          </p>
        </div>

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
