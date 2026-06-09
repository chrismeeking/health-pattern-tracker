import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId, getProfileData } from '@/services/storage';
import {
  getSuggestedNutritionTargets,
  profileMatchesSuggestedTargets,
  suggestedTargetsToProfileFields,
} from '@/utils/nutritionTargets';
import { DataExportSection } from '@/components/DataExportSection';
import {
  loadReminderSettings,
  requestNotificationPermission,
  saveReminderSettings,
} from '@/services/reminders';
import { SettingsSection } from '@/components/SettingsSection';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { AppUpdateCard } from '@/components/AppUpdateCard';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  AI_STATUS_LABEL,
  ALL_TRIGGER_TAGS,
  APP_VERSION,
  GOAL_TYPE_LABELS,
  MEDICAL_DISCLAIMER,
  TRIGGER_TAG_LABELS,
  type ActivityLevel,
  type GoalType,
  type Profile,
  type ProfileModule,
} from '@/types';
import { getSupabaseConfigLabel } from '@/services/sync/supabaseClient';
import { getScannerStatusLabel } from '@/services/food/barcodeScanner';
import { getFavouritesForProfile } from '@/services/food/favouriteMeals';
import { getLookupStatusLabel, getSavedFoodsForProfile } from '@/services/food/foodLookup';
import { ModulePresetPicker } from '@/components/ModulePresetPicker';
import { hasModule, normalizeEnabledModules } from '@/utils/profileModules';
import { getWeightSummary } from '@/utils/health';
import { calculateBmi, getBmiCategory } from '@/utils/bmi';
import { BodyMetricsFields } from '@/components/BodyMetricsFields';
import type { MeasurementSystem } from '@/types';

const GOAL_TYPES = Object.keys(GOAL_TYPE_LABELS) as GoalType[];
const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active'];
const SEX_OPTIONS: NonNullable<Profile['sex']>[] = [
  'male',
  'female',
  'other',
  'preferNotToSay',
];

type DestructiveAction = 'clearActiveProfile' | 'clearDemo' | 'clearAll' | 'resetApp' | null;

function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</h2>
          {description && (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        <span className="text-slate-400 text-xs group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        {children}
      </div>
    </details>
  );
}

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
    pullFromCloudAndReplace,
    checkCloudHasData,
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
  const [pullLoading, setPullLoading] = useState(false);
  const [cloudHasData, setCloudHasData] = useState(false);
  const [reminderSettings, setReminderSettings] = useState(() => loadReminderSettings());

  useEffect(() => {
    if (!isSignedIn) {
      setCloudHasData(false);
      return;
    }
    void checkCloudHasData().then(setCloudHasData);
  }, [isSignedIn, checkCloudHasData, syncMeta.lastSyncedAt]);

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30 min-h-[48px] dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100';

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

  const applySuggestedTargets = (profile: Profile, overrides: Partial<Profile> = {}) => {
    const nextProfile = { ...profile, ...overrides };
    const targetFields = suggestedTargetsToProfileFields(
      getSuggestedNutritionTargets(nextProfile)
    );

    update((d) => ({
      ...d,
      profiles: d.profiles.map((p) =>
        p.id === profile.id ? { ...p, ...overrides, ...targetFields } : p
      ),
    }));
  };

  const createProfile = () => {
    if (!newName.trim()) return;
    const id = generateId();
    const baseProfile: Profile = {
      id,
      name: newName.trim(),
      activityLevel: 'moderate',
      goalType: 'generalHealth',
      enabledModules: ['nutrition', 'macros', 'weight', 'water', 'exercise', 'goals'],
    };
    const profile: Profile = {
      ...baseProfile,
      ...suggestedTargetsToProfileFields(getSuggestedNutritionTargets(baseProfile)),
    };
    update((d) => ({
      ...d,
      profiles: [...d.profiles, profile],
      activeProfileId: id,
    }));
    setNewName('');
    setShowNew(false);
  };

  const setProfileModules = (profileId: string, modules: ProfileModule[]) => {
    update((d) => ({
      ...d,
      profiles: d.profiles.map((p) =>
        p.id === profileId ? { ...p, enabledModules: normalizeEnabledModules(modules) } : p
      ),
    }));
  };

  const handleDestructiveConfirm = () => {
    if (destructiveAction === 'clearActiveProfile' && activeProfile) {
      update((d) => ({
        ...d,
        meals: d.meals.filter((m) => m.profileId !== activeProfile.id),
        issues: d.issues.filter((i) => i.profileId !== activeProfile.id),
        symptomEpisodes: d.symptomEpisodes.filter((s) => s.profileId !== activeProfile.id),
        dailyCheckIns: d.dailyCheckIns.filter((c) => c.profileId !== activeProfile.id),
        weightEntries: d.weightEntries.filter((w) => w.profileId !== activeProfile.id),
        exerciseEntries: d.exerciseEntries.filter((e) => e.profileId !== activeProfile.id),
        waterEntries: d.waterEntries.filter((w) => w.profileId !== activeProfile.id),
        goals: d.goals.filter((g) => g.profileId !== activeProfile.id),
        favouriteMeals: d.favouriteMeals.filter((f) => f.profileId !== activeProfile.id),
        savedFoods: d.savedFoods.filter((f) => f.profileId !== activeProfile.id),
      }));
    } else if (destructiveAction === 'clearDemo' || destructiveAction === 'clearAll') {
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
    clearActiveProfile: {
      title: 'Clear active profile data?',
      message:
        'This removes meals, symptoms, check-ins, weights, goals, favourites, and saved foods for the selected profile only. The profile itself remains.',
      warning: 'This cannot be undone. Export this profile first if you want a backup.',
      confirmLabel: 'Clear active profile data',
    },
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
          : 'Signed in. You can sync your local data to the cloud or pull existing cloud data.'
      );
      setAuthPassword('');
      void checkCloudHasData().then(setCloudHasData);
    }
  };

  const handlePullFromCloud = async () => {
    setPullLoading(true);
    setAuthMessage(null);
    const error = await pullFromCloudAndReplace();
    setPullLoading(false);
    if (error) setAuthMessage(error);
    else {
      setAuthMessage('Local data replaced with cloud copy.');
      setCloudHasData(false);
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
  const activeProfileLabel = activeProfile?.name ?? 'selected profile';
  const suggestedTargets = activeProfile
    ? getSuggestedNutritionTargets(activeProfile)
    : null;
  const targetsAlreadyApplied =
    activeProfile != null && profileMatchesSuggestedTargets(activeProfile);
  const profileWeightSummary = activeProfile
    ? getWeightSummary(getProfileData(data, activeProfile.id).weightEntries, activeProfile)
    : null;
  const profileBmi =
    activeProfile &&
    hasModule(activeProfile, 'weight') &&
    profileWeightSummary?.latest != null &&
    activeProfile.height != null
      ? calculateBmi(profileWeightSummary.latest, activeProfile.height)
      : null;
  const profileBmiCategory = profileBmi != null ? getBmiCategory(profileBmi) : null;

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {activeProfile
            ? `Editing settings for ${activeProfile.name}`
            : 'Profiles, export, and app preferences'}
        </p>
      </div>

      <CollapsibleSection
        title="Profile & targets"
        description="Name, modules, goals, body metrics, and nutrition targets."
      >
      <SettingsSection
        title={activeProfile ? `Profile settings for ${activeProfile.name}` : 'Profile settings'}
        description="Switch profile or edit details for the selected person."
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

              <BodyMetricsFields
                system={activeProfile.measurementSystem ?? 'metric'}
                onSystemChange={(system: MeasurementSystem) =>
                  updateProfileField(activeProfile.id, 'measurementSystem', system)
                }
                heightCm={activeProfile.height}
                currentWeightKg={activeProfile.currentWeight}
                targetWeightKg={activeProfile.targetWeight}
                onHeightChange={(cm) => updateProfileField(activeProfile.id, 'height', cm)}
                onCurrentWeightChange={(kg) =>
                  updateProfileField(activeProfile.id, 'currentWeight', kg)
                }
                onTargetWeightChange={(kg) =>
                  updateProfileField(activeProfile.id, 'targetWeight', kg)
                }
                goalType={activeProfile.goalType}
                inputClass={inputClass}
              />

              {profileBmi != null && profileBmiCategory && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    BMI {profileBmi} · {profileBmiCategory.label}
                  </p>
                  {profileBmiCategory.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
                      {profileBmiCategory.description}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
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
                <label className="block text-xs text-slate-500 mb-1">
                  Goal type
                </label>
                <select
                  value={activeProfile.goalType}
                  onChange={(e) =>
                    applySuggestedTargets(activeProfile, {
                      goalType: e.target.value as GoalType,
                    })
                  }
                  className={inputClass}
                >
                  {GOAL_TYPES.map((gt) => (
                    <option key={gt} value={gt}>
                      {GOAL_TYPE_LABELS[gt]}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Weight loss (NHS pace) uses a ~600 kcal/day deficit (NICE CG189). Gentle weight
                  loss is slower. Tap Apply on suggested targets after changing.
                </p>
              </div>

              <ModulePresetPicker
                modules={activeProfile.enabledModules}
                onChange={(modules) => setProfileModules(activeProfile.id, modules)}
              />
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
          title={`Nutrition targets for ${activeProfile.name}`}
          description="Daily targets for this profile. Goal type sets sensible defaults; you can still edit them manually."
        >
          <Card className="space-y-4">
            {suggestedTargets && targetsAlreadyApplied ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-2.5 dark:border-teal-800 dark:bg-teal-950/40">
                <p className="text-xs font-medium text-teal-900 dark:text-teal-100">
                  Using suggested targets for {GOAL_TYPE_LABELS[activeProfile.goalType]}
                </p>
                <p className="text-[11px] text-teal-800/80 mt-0.5 dark:text-teal-200/80">
                  {suggestedTargets.dailyCalorieTarget} kcal · P {suggestedTargets.proteinTarget}g
                  · C {suggestedTargets.carbTarget}g · F {suggestedTargets.fatTarget}g · Fibre{' '}
                  {suggestedTargets.fibreTarget}g
                </p>
                <p className="text-[10px] text-teal-700/70 mt-1 dark:text-teal-300/70">
                  Change goal type, weight, or height above, then tap Apply to refresh.
                </p>
              </div>
            ) : (
              suggestedTargets && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 space-y-2 dark:bg-slate-900/50 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        Suggested for {GOAL_TYPE_LABELS[activeProfile.goalType]}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
                        {suggestedTargets.dailyCalorieTarget} kcal · P{' '}
                        {suggestedTargets.proteinTarget}g · C {suggestedTargets.carbTarget}g · F{' '}
                        {suggestedTargets.fatTarget}g · Fibre {suggestedTargets.fibreTarget}g
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => applySuggestedTargets(activeProfile)}
                      className="shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {suggestedTargets.calorieBasis} {suggestedTargets.macroBasis}
                  </p>
                  {suggestedTargets.guidanceNotes.length > 0 && (
                    <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc pl-4 dark:text-slate-500">
                      {suggestedTargets.guidanceNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            )}

            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </Card>
        </SettingsSection>
      )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Data & sync"
        description="Cloud sync, exports, and household backups."
      >
      <SettingsSection
        title="Cloud sync & account"
        description="App-wide sync for all household profiles across devices. Login is never required."
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
                    : 'Sync now (push local)'}
                </Button>
                {cloudHasData && (
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => void handlePullFromCloud()}
                    disabled={pullLoading}
                  >
                    {pullLoading ? 'Pulling…' : 'Replace local with cloud'}
                  </Button>
                )}
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
        title="Data export"
        description="Back up your data or share a GP summary. Spreadsheet exports are under More."
      >
        <DataExportSection data={data} activeProfile={activeProfile ?? undefined} />
      </SettingsSection>
      </CollapsibleSection>

      <CollapsibleSection
        title="Reminders"
        description="Optional gentle check-in nudges."
        defaultOpen={false}
      >
        <Card className="space-y-3">
          <label className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>Daily check-in reminder (after 8pm if not checked in)</span>
            <input
              type="checkbox"
              checked={reminderSettings.checkInReminderEnabled}
              onChange={async (e) => {
                const enabled = e.target.checked;
                if (enabled) {
                  const permission = await requestNotificationPermission();
                  if (permission !== 'granted') return;
                }
                const next = { ...reminderSettings, checkInReminderEnabled: enabled };
                setReminderSettings(next);
                saveReminderSettings(next);
              }}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
          <p className="text-xs text-slate-400">
            One gentle notification per day at most. Requires browser permission. Turn off anytime.
          </p>
        </Card>
      </CollapsibleSection>

      <CollapsibleSection
        title="Advanced"
        description="Destructive actions, trigger reference, favourites, and app updates."
        defaultOpen={false}
      >
      <SettingsSection
        title={`Favourites & packaged foods for ${activeProfileLabel}`}
        description="Quick-add meals and saved barcode foods for the selected profile."
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
              {getLookupStatusLabel()}
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

      <details className="rounded-xl border border-slate-200 dark:border-slate-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          Trigger tag reference
        </summary>
        <Card className="mx-4 mb-4 flex flex-wrap gap-2 border-0 shadow-none">
          {ALL_TRIGGER_TAGS.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-600"
            >
              {TRIGGER_TAG_LABELS[tag]}
            </span>
          ))}
        </Card>
      </details>

      <SettingsSection
        title="Data management"
        description="Profile-specific and app-wide destructive actions require confirmation."
      >
        <div className="grid gap-2">
          {activeProfile && (
            <Button
              variant="danger"
              fullWidth
              onClick={() => setDestructiveAction('clearActiveProfile')}
            >
              Clear {activeProfile.name} data only
            </Button>
          )}
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
        <div className="space-y-3">
          <ThemeSelector />
          <AppUpdateCard />
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
        </div>
      </SettingsSection>
      </CollapsibleSection>

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
