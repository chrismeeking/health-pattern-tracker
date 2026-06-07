import { useState } from 'react';
import { useApp } from '@/hooks/useAppData';
import { generateId } from '@/services/storage';
import {
  exportAllDataJson,
  exportDailyCheckInsCsv,
  exportMealsCsv,
  exportSymptomEpisodesCsv,
  exportWeightEntriesCsv,
} from '@/services/export';
import { SettingsSection } from '@/components/SettingsSection';
import { QuickNavLinks } from '@/components/QuickNavLinks';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  AI_STATUS_LABEL,
  ALL_TRIGGER_TAGS,
  APP_VERSION,
  GOAL_TYPE_LABELS,
  MEDICAL_DISCLAIMER,
  MODULE_LABELS,
  TRIGGER_TAG_LABELS,
  type ActivityLevel,
  type GoalType,
  type Profile,
  type ProfileModule,
} from '@/types';

const ALL_MODULES: ProfileModule[] = [
  'nutrition',
  'macros',
  'weight',
  'water',
  'healthIssues',
  'digestive',
  'goals',
];

const GOAL_TYPES = Object.keys(GOAL_TYPE_LABELS) as GoalType[];
const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active'];
const SEX_OPTIONS: NonNullable<Profile['sex']>[] = [
  'male',
  'female',
  'other',
  'preferNotToSay',
];

type DestructiveAction = 'clearDemo' | 'clearAll' | 'resetApp' | null;

export function ProfileSettingsPage() {
  const { data, activeProfile, setActiveProfile, update, loadDemo, clearDemoData, resetApp } =
    useApp();
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [destructiveAction, setDestructiveAction] = useState<DestructiveAction>(null);

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30 min-h-[48px]';

  const updateProfileField = <K extends keyof Profile>(
    profileId: string,
    field: K,
    value: Profile[K]
  ) => {
    update((d) => ({
      ...d,
      profiles: d.profiles.map((p) =>
        p.id === profileId ? { ...p, [field]: value } : p
      ),
    }));
  };

  const createProfile = () => {
    if (!newName.trim()) return;
    const id = generateId();
    const profile: Profile = {
      id,
      name: newName.trim(),
      activityLevel: 'moderate',
      goalType: 'generalHealth',
      enabledModules: ['nutrition', 'weight', 'water', 'goals'],
      dailyCalorieTarget: 2000,
      proteinTarget: 100,
      waterTarget: 2000,
    };
    update((d) => ({
      ...d,
      profiles: [...d.profiles, profile],
      activeProfileId: id,
    }));
    setNewName('');
    setShowNew(false);
  };

  const toggleModule = (profileId: string, mod: ProfileModule) => {
    update((d) => ({
      ...d,
      profiles: d.profiles.map((p) => {
        if (p.id !== profileId) return p;
        const enabled = p.enabledModules.includes(mod)
          ? p.enabledModules.filter((m) => m !== mod)
          : [...p.enabledModules, mod];
        return { ...p, enabledModules: enabled };
      }),
    }));
  };

  const handleDestructiveConfirm = () => {
    if (destructiveAction === 'clearDemo' || destructiveAction === 'clearAll') {
      clearDemoData();
    } else if (destructiveAction === 'resetApp') {
      resetApp();
      return;
    }
    setDestructiveAction(null);
  };

  const destructiveCopy: Record<
    Exclude<DestructiveAction, null>,
    { title: string; message: string; warning: string; confirmLabel: string }
  > = {
    clearDemo: {
      title: 'Clear demo data?',
      message:
        'This removes all profiles, meals, symptoms, goals, and other data currently stored on this device.',
      warning: 'This cannot be undone. Export your data first if you want a backup.',
      confirmLabel: 'Clear demo data',
    },
    clearAll: {
      title: 'Clear all data?',
      message:
        'Every profile, meal, symptom log, check-in, weight entry, and goal will be permanently deleted from this device.',
      warning:
        'There is no undo. Make sure you have exported anything you want to keep before continuing.',
      confirmLabel: 'Delete everything',
    },
    resetApp: {
      title: 'Reset app?',
      message:
        'The app will reload with a completely empty state. All local data will be removed.',
      warning:
        'This is permanent. Export your data first if you need a copy.',
      confirmLabel: 'Reset app',
    },
  };

  const dialogCopy = destructiveAction ? destructiveCopy[destructiveAction] : null;

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Profiles, export, and app preferences</p>
      </div>

      <SettingsSection title="Quick navigation" description="Reach key areas from one place.">
        <QuickNavLinks />
      </SettingsSection>

      <SettingsSection
        title="Profile settings"
        description="Switch profile or edit details for the active profile."
      >
        <div className="flex flex-wrap gap-2">
          {data.profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveProfile(p.id)}
              className={`text-sm px-3 py-2 rounded-full min-h-[44px] ${
                activeProfile?.id === p.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {activeProfile ? (
          <Card className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  value={activeProfile.name}
                  onChange={(e) =>
                    updateProfileField(activeProfile.id, 'name', e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Age</label>
                  <input
                    type="number"
                    min={0}
                    value={activeProfile.age ?? ''}
                    onChange={(e) =>
                      updateProfileField(
                        activeProfile.id,
                        'age',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Sex</label>
                  <select
                    value={activeProfile.sex ?? ''}
                    onChange={(e) =>
                      updateProfileField(
                        activeProfile.id,
                        'sex',
                        (e.target.value || undefined) as Profile['sex']
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">Not set</option>
                    {SEX_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s === 'preferNotToSay' ? 'Prefer not to say' : s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={activeProfile.height ?? ''}
                    onChange={(e) =>
                      updateProfileField(
                        activeProfile.id,
                        'height',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Current weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={activeProfile.currentWeight ?? ''}
                    onChange={(e) =>
                      updateProfileField(
                        activeProfile.id,
                        'currentWeight',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Target weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={activeProfile.targetWeight ?? ''}
                    onChange={(e) =>
                      updateProfileField(
                        activeProfile.id,
                        'targetWeight',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Activity level</label>
                  <select
                    value={activeProfile.activityLevel}
                    onChange={(e) =>
                      updateProfileField(
                        activeProfile.id,
                        'activityLevel',
                        e.target.value as ActivityLevel
                      )
                    }
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

              <div>
                <label className="block text-xs text-slate-500 mb-1">Goal type</label>
                <select
                  value={activeProfile.goalType}
                  onChange={(e) =>
                    updateProfileField(activeProfile.id, 'goalType', e.target.value as GoalType)
                  }
                  className={inputClass}
                >
                  {GOAL_TYPES.map((gt) => (
                    <option key={gt} value={gt}>
                      {GOAL_TYPE_LABELS[gt]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-2">Enabled modules</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_MODULES.map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => toggleModule(activeProfile.id, mod)}
                      className={`text-xs px-3 py-2 rounded-full min-h-[36px] ${
                        activeProfile.enabledModules.includes(mod)
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {MODULE_LABELS[mod]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="text-sm text-slate-400 text-center py-6">
            No profile yet. Create one below or reload demo data.
          </Card>
        )}

        {showNew ? (
          <Card className="space-y-2">
            <input
              type="text"
              placeholder="Profile name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={createProfile}>
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <Button variant="outline" fullWidth onClick={() => setShowNew(true)}>
            + Add profile
          </Button>
        )}
      </SettingsSection>

      {activeProfile && (
        <SettingsSection
          title="Nutrition targets"
          description="Daily targets for the active profile."
        >
          <Card className="grid grid-cols-2 gap-3">
            {[
              { field: 'dailyCalorieTarget' as const, label: 'Calories (kcal/day)' },
              { field: 'proteinTarget' as const, label: 'Protein (g/day)' },
              { field: 'carbTarget' as const, label: 'Carbs (g/day)' },
              { field: 'fatTarget' as const, label: 'Fat (g/day)' },
              { field: 'fibreTarget' as const, label: 'Fibre (g/day)' },
              { field: 'waterTarget' as const, label: 'Water (ml/day)' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-xs text-slate-500 mb-1">{label}</label>
                <input
                  type="number"
                  value={activeProfile[field] ?? ''}
                  onChange={(e) =>
                    updateProfileField(
                      activeProfile.id,
                      field,
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                  className={inputClass}
                />
              </div>
            ))}
          </Card>
        </SettingsSection>
      )}

      <SettingsSection
        title="Trigger categories"
        description="Tags you can apply when logging meals to explore possible patterns — not confirmed causes."
      >
        <Card className="flex flex-wrap gap-2">
          {ALL_TRIGGER_TAGS.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600"
            >
              {TRIGGER_TAG_LABELS[tag]}
            </span>
          ))}
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Data export"
        description="Download a copy of your data. CSV files open in Excel."
      >
        <div className="grid gap-2">
          <Button variant="outline" fullWidth onClick={() => exportAllDataJson(data)}>
            Export all data as JSON
          </Button>
          <Button variant="outline" fullWidth onClick={() => exportMealsCsv(data)}>
            Export meals as CSV
          </Button>
          <Button variant="outline" fullWidth onClick={() => exportSymptomEpisodesCsv(data)}>
            Export symptom episodes as CSV
          </Button>
          <Button variant="outline" fullWidth onClick={() => exportDailyCheckInsCsv(data)}>
            Export daily check-ins as CSV
          </Button>
          <Button variant="outline" fullWidth onClick={() => exportWeightEntriesCsv(data)}>
            Export weight entries as CSV
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Data management"
        description="Destructive actions require confirmation."
      >
        <div className="grid gap-2">
          <Button variant="outline" fullWidth onClick={loadDemo}>
            Reload demo data
          </Button>
          <Button variant="outline" fullWidth onClick={() => setDestructiveAction('clearDemo')}>
            Clear demo data
          </Button>
          <Button variant="danger" fullWidth onClick={() => setDestructiveAction('clearAll')}>
            Clear all data
          </Button>
          <Button variant="danger" fullWidth onClick={() => setDestructiveAction('resetApp')}>
            Reset app
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Medical disclaimer">
        <Card className="bg-teal-50 border-teal-100">
          <p className="text-sm text-teal-900 leading-relaxed">{MEDICAL_DISCLAIMER}</p>
        </Card>
      </SettingsSection>

      <SettingsSection title="App information">
        <Card className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">App version</span>
            <span className="font-medium text-slate-800">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Storage</span>
            <span className="font-medium text-slate-800 text-right">Local device only</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">AI status</span>
            <span className="font-medium text-slate-800 text-right max-w-[60%]">
              {AI_STATUS_LABEL}
            </span>
          </div>
        </Card>
      </SettingsSection>

      <ConfirmDialog
        open={destructiveAction != null}
        title={dialogCopy?.title ?? ''}
        message={dialogCopy?.message ?? ''}
        warning={dialogCopy?.warning}
        confirmLabel={dialogCopy?.confirmLabel}
        onConfirm={handleDestructiveConfirm}
        onCancel={() => setDestructiveAction(null)}
      />
    </div>
  );
}
