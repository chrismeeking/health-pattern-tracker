import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  AI_STATUS_LABEL,
  ALL_TRIGGER_TAGS,
  APP_VERSION,
  FOOD_LOOKUP_STATUS_LABEL,
  GOAL_TYPE_LABELS,
  MEDICAL_DISCLAIMER,
  MODULE_LABELS,
  TRIGGER_TAG_LABELS,
  type ActivityLevel,
  type GoalType,
  type Profile,
  type ProfileModule,
} from '@/types';
import { getSupabaseConfigLabel } from '@/services/sync/supabaseClient';
import { getScannerStatusLabel } from '@/services/food/barcodeScanner';
import { getFavouritesForProfile } from '@/services/food/favouriteMeals';
import { getSavedFoodsForProfile } from '@/services/food/foodLookup';

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
  const {
    data,
    activeProfile,
    setActiveProfile,
    update,
    loadDemo,
    clearDemoData,
    resetApp,
    syncMeta,
    isCloudAvailable,
    isSignedIn,
    signIn,
    signUp,
    signOutUser,
    syncNow,
  } = useApp();
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [destructiveAction, setDestructiveAction] = useState<DestructiveAction>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

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

  const handleAuth = async () => {
    if (!authEmail.trim() || !authPassword) {
      setAuthMessage('Enter email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthMessage(null);
    const error =
      authMode === 'sign-in'
        ? await signIn(authEmail.trim(), authPassword)
        : await signUp(authEmail.trim(), authPassword);
    setAuthLoading(false);
    if (error) {
      setAuthMessage(error);
    } else {
      setAuthMessage(
        authMode === 'sign-up'
          ? 'Account created. Check email if confirmation is required, then sync.'
          : 'Signed in. You can sync your local data to the cloud.'
      );
      setAuthPassword('');
    }
  };

  const handleSyncNow = async () => {
    setSyncLoading(true);
    setAuthMessage(null);
    const error = await syncNow();
    setSyncLoading(false);
    if (error) setAuthMessage(error);
    else setAuthMessage('Data synced to cloud.');
  };

  const storageLabel = isSignedIn
    ? `Local + cloud (${syncMeta.household.name ?? 'household'})`
    : 'Local device only';

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
        title="Cloud sync & account"
        description="Optional Supabase sync for household profiles across devices. Login is never required."
      >
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-slate-600">Sync status</span>
            <SyncStatusBadge status={syncMeta.displayStatus} />
          </div>

          {syncMeta.lastSyncedAt && (
            <p className="text-xs text-slate-400">
              Last synced: {new Date(syncMeta.lastSyncedAt).toLocaleString('en-GB')}
            </p>
          )}

          {syncMeta.lastError && syncMeta.displayStatus === 'sync-error' && (
            <p className="text-xs text-coral-600 bg-coral-50 rounded-lg px-3 py-2">
              {syncMeta.lastError}
            </p>
          )}

          {!isCloudAvailable ? (
            <p className="text-sm text-slate-500 leading-relaxed">
              Cloud sync is not configured. The app uses local storage only — fully usable offline.
              Add <code className="text-xs bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to
              enable sync. See <code className="text-xs">docs/supabase-schema.md</code>.
            </p>
          ) : isSignedIn ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Signed in as <span className="font-medium">{syncMeta.session.email}</span>
              </p>
              {syncMeta.household.name && (
                <p className="text-xs text-slate-500">
                  Household: {syncMeta.household.name}
                </p>
              )}
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                Export your data before first sync if you want a backup. Cloud sync uploads local
                profiles, meals, symptoms, and goals to your household.
              </p>
              <div className="grid gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleSyncNow}
                  disabled={syncLoading || syncMeta.displayStatus === 'syncing'}
                >
                  {syncLoading || syncMeta.displayStatus === 'syncing'
                    ? 'Syncing…'
                    : 'Sync now'}
                </Button>
                <Button variant="outline" fullWidth onClick={() => void signOutUser()}>
                  Sign out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Sign in to sync data across devices. Your household can share multiple tracking
                profiles (e.g. Chris & Jenny).
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                Export your data before signing in for the first time — sync uploads local data to
                the cloud.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('sign-in')}
                  className={`flex-1 py-2 rounded-xl text-sm min-h-[44px] ${
                    authMode === 'sign-in'
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('sign-up')}
                  className={`flex-1 py-2 rounded-xl text-sm min-h-[44px] ${
                    authMode === 'sign-up'
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Create account
                </button>
              </div>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Email"
                className={inputClass}
                autoComplete="email"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Password"
                className={inputClass}
                autoComplete={
                  authMode === 'sign-in' ? 'current-password' : 'new-password'
                }
              />
              <Button fullWidth onClick={() => void handleAuth()} disabled={authLoading}>
                {authLoading
                  ? 'Please wait…'
                  : authMode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </Button>
              <p className="text-[10px] text-slate-400">
                Server: {getSupabaseConfigLabel()}
              </p>
            </div>
          )}

          {authMessage && (
            <p
              className={`text-xs rounded-lg px-3 py-2 ${
                authMessage.includes('sync') || authMessage.includes('Signed')
                  ? 'bg-teal-50 text-teal-800'
                  : 'bg-coral-50 text-coral-700'
              }`}
            >
              {authMessage}
            </p>
          )}
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Favourites & packaged foods"
        description="Quick-add meals and offline barcode lookup."
      >
        <Card className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Favourites</span>
            <span className="font-medium text-slate-800">
              {activeProfile
                ? getFavouritesForProfile(data, activeProfile.id).length
                : 0}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Saved foods</span>
            <span className="font-medium text-slate-800">
              {activeProfile
                ? getSavedFoodsForProfile(data.savedFoods, activeProfile.id).length
                : 0}
            </span>
          </div>
          <div className="flex justify-between text-sm gap-4">
            <span className="text-slate-500">Barcode lookup</span>
            <span className="font-medium text-slate-800 text-right text-xs">
              {FOOD_LOOKUP_STATUS_LABEL}
            </span>
          </div>
          <div className="flex justify-between text-sm gap-4">
            <span className="text-slate-500">Scanner</span>
            <span className="font-medium text-slate-800 text-right text-xs">
              {getScannerStatusLabel()}
            </span>
          </div>
          <div className="grid gap-2 pt-1">
            <Link to="/favourites">
              <Button variant="outline" fullWidth>
                Manage favourite meals
              </Button>
            </Link>
            <Link to="/saved-foods">
              <Button variant="outline" fullWidth>
                Manage saved foods
              </Button>
            </Link>
          </div>
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
            <span className="font-medium text-slate-800 text-right max-w-[60%]">
              {storageLabel}
            </span>
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
