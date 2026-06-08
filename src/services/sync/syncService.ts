import type {
  AppData,
  DailyCheckIn,
  ExerciseEntry,
  FavouriteMeal,
  FoodItem,
  Goal,
  HealthIssue,
  Meal,
  Profile,
  SymptomEpisode,
  WaterEntry,
  WeightEntry,
} from '@/types';
import { migrateAppData } from '@/utils/profileModules';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import {
  DEFAULT_SYNC_META,
  type AuthSession,
  type HouseholdInfo,
  type PullResult,
  type SignInResult,
  type SyncMeta,
  type SyncResult,
} from './types';

const SYNC_META_KEY = 'health-pattern-tracker-sync-meta';

export function loadSyncMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return { ...DEFAULT_SYNC_META };
    const parsed = JSON.parse(raw) as Partial<SyncMeta>;
    return {
      ...DEFAULT_SYNC_META,
      ...parsed,
      session: { ...DEFAULT_SYNC_META.session, ...parsed.session },
      household: { ...DEFAULT_SYNC_META.household, ...parsed.household },
    };
  } catch {
    return { ...DEFAULT_SYNC_META };
  }
}

export function saveSyncMeta(meta: SyncMeta): void {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

export function isCloudSyncAvailable(): boolean {
  return isSupabaseConfigured();
}

export function getSyncStatusLabel(meta: SyncMeta): string {
  if (!isSupabaseConfigured()) return 'Local only';
  if (!meta.session.userId) return 'Local only';
  switch (meta.displayStatus) {
    case 'synced':
      return 'Synced';
    case 'sync-error':
      return 'Sync error';
    case 'syncing':
      return 'Syncing…';
    default:
      return 'Local only';
  }
}

export async function restoreSessionFromSupabase(): Promise<SyncMeta> {
  const meta = loadSyncMeta();
  const supabase = getSupabaseClient();
  if (!supabase) return meta;

  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) {
    return {
      ...meta,
      session: { userId: null, email: null },
      displayStatus: 'local-only',
    };
  }

  return {
    ...meta,
    session: {
      userId: data.session.user.id,
      email: data.session.user.email ?? null,
    },
    displayStatus: meta.lastSyncedAt ? meta.displayStatus : 'local-only',
  };
}

async function upsertUserProfile(userId: string, email: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from('users').upsert({
    id: userId,
    email,
    updated_at: new Date().toISOString(),
  });
}

async function ensureHousehold(userId: string, email: string): Promise<HouseholdInfo> {
  const supabase = getSupabaseClient();
  if (!supabase) return { id: null, name: null };

  const { data: membership, error: memberLookupError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (memberLookupError && memberLookupError.code !== 'PGRST116') {
    throw new Error(memberLookupError.message);
  }

  if (membership?.household_id) {
    const { data: household } = await supabase
      .from('households')
      .select('id, name')
      .eq('id', membership.household_id)
      .single();

    return {
      id: membership.household_id,
      name: household?.name ?? 'My household',
    };
  }

  const householdName = email ? `${email.split('@')[0]}'s household` : 'My household';

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name: householdName, created_by: userId })
    .select('id, name')
    .single();

  if (householdError || !household) {
    throw new Error(householdError?.message ?? 'Could not create household.');
  }

  const { error: memberError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'owner',
  });

  if (memberError) {
    throw new Error(memberError.message);
  }

  return { id: household.id, name: household.name };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ meta: SyncMeta; result: SignInResult }> {
  if (!isSupabaseConfigured()) {
    return {
      meta: loadSyncMeta(),
      result: { ok: false, error: 'Cloud sync is not configured on this device.' },
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { meta: loadSyncMeta(), result: { ok: false, error: 'Supabase client unavailable.' } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return {
      meta: { ...loadSyncMeta(), displayStatus: 'sync-error', lastError: error?.message ?? null },
      result: { ok: false, error: error?.message ?? 'Sign in failed.' },
    };
  }

  const session: AuthSession = {
    userId: data.user.id,
    email: data.user.email ?? email,
  };

  try {
    await upsertUserProfile(session.userId!, session.email!);
    const household = await ensureHousehold(session.userId!, session.email!);
    const meta: SyncMeta = {
      displayStatus: 'local-only',
      lastSyncedAt: null,
      lastError: null,
      session,
      household,
    };
    saveSyncMeta(meta);
    return { meta, result: { ok: true, session } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Account setup failed.';
    const meta: SyncMeta = {
      ...loadSyncMeta(),
      session,
      displayStatus: 'sync-error',
      lastError: message,
    };
    saveSyncMeta(meta);
    return { meta, result: { ok: false, error: message, session } };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ meta: SyncMeta; result: SignInResult }> {
  if (!isSupabaseConfigured()) {
    return {
      meta: loadSyncMeta(),
      result: { ok: false, error: 'Cloud sync is not configured on this device.' },
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { meta: loadSyncMeta(), result: { ok: false, error: 'Supabase client unavailable.' } };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return {
      meta: { ...loadSyncMeta(), displayStatus: 'sync-error', lastError: error?.message ?? null },
      result: { ok: false, error: error?.message ?? 'Sign up failed.' },
    };
  }

  const session: AuthSession = {
    userId: data.user.id,
    email: data.user.email ?? email,
  };

  try {
    await upsertUserProfile(session.userId!, session.email!);
    const household = await ensureHousehold(session.userId!, session.email!);
    const meta: SyncMeta = {
      displayStatus: 'local-only',
      lastSyncedAt: null,
      lastError: null,
      session,
      household,
    };
    saveSyncMeta(meta);
    return { meta, result: { ok: true, session } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Account setup failed.';
    return {
      meta: { ...loadSyncMeta(), session, displayStatus: 'sync-error', lastError: message },
      result: { ok: false, error: message, session },
    };
  }
}

export async function signOut(): Promise<SyncMeta> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  const meta: SyncMeta = { ...DEFAULT_SYNC_META };
  saveSyncMeta(meta);
  return meta;
}

function profileRow(profile: Profile, householdId: string, ownerUserId: string) {
  return {
    id: profile.id,
    household_id: householdId,
    owner_user_id: ownerUserId,
    name: profile.name,
    age: profile.age ?? null,
    sex: profile.sex ?? null,
    height: profile.height ?? null,
    current_weight: profile.currentWeight ?? null,
    target_weight: profile.targetWeight ?? null,
    activity_level: profile.activityLevel,
    goal_type: profile.goalType,
    enabled_modules: profile.enabledModules,
    daily_calorie_target: profile.dailyCalorieTarget ?? null,
    protein_target: profile.proteinTarget ?? null,
    carb_target: profile.carbTarget ?? null,
    fat_target: profile.fatTarget ?? null,
    fibre_target: profile.fibreTarget ?? null,
    water_target: profile.waterTarget ?? null,
    updated_at: new Date().toISOString(),
  };
}

function mealRow(meal: Meal, householdId: string) {
  return {
    id: meal.id,
    household_id: householdId,
    profile_id: meal.profileId,
    date_time: meal.dateTime,
    meal_type: meal.mealType,
    meal_name: meal.mealName,
    description: meal.description ?? null,
    source: meal.source,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    saturated_fat: meal.saturatedFat ?? null,
    fibre: meal.fibre,
    sugar: meal.sugar ?? null,
    salt: meal.salt ?? null,
    water_ml: meal.waterMl ?? null,
    portion_size: meal.portionSize,
    notes: meal.notes ?? null,
    trigger_tags: meal.triggerTags,
    created_at: meal.createdAt,
    updated_at: meal.updatedAt,
  };
}

function issueRow(issue: HealthIssue, householdId: string) {
  return {
    id: issue.id,
    household_id: householdId,
    profile_id: issue.profileId,
    name: issue.name,
    description: issue.description ?? null,
    category: issue.category,
    possible_triggers: issue.possibleTriggers,
    active: issue.active,
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
  };
}

function symptomRow(episode: SymptomEpisode, householdId: string) {
  return {
    id: episode.id,
    household_id: householdId,
    profile_id: episode.profileId,
    issue_id: episode.issueId ?? null,
    start_date_time: episode.startDateTime,
    severity: episode.severity,
    payload: episode,
    created_at: episode.createdAt,
  };
}

function checkInRow(checkIn: DailyCheckIn, householdId: string) {
  return {
    id: checkIn.id,
    household_id: householdId,
    profile_id: checkIn.profileId,
    date: checkIn.date,
    check_in_time: checkIn.checkInTime,
    payload: checkIn,
    created_at: checkIn.createdAt,
  };
}

function weightRow(entry: WeightEntry, householdId: string) {
  return {
    id: entry.id,
    household_id: householdId,
    profile_id: entry.profileId,
    date: entry.date,
    weight: entry.weight,
    notes: entry.notes ?? null,
    created_at: entry.date,
  };
}

function exerciseRow(entry: ExerciseEntry, householdId: string) {
  return {
    id: entry.id,
    household_id: householdId,
    profile_id: entry.profileId,
    date_time: entry.dateTime,
    activity: entry.activity,
    duration_minutes: entry.durationMinutes,
    calories_burned: entry.caloriesBurned,
    notes: entry.notes ?? null,
    created_at: entry.dateTime,
  };
}

function waterRow(entry: WaterEntry, householdId: string) {
  return {
    id: entry.id,
    household_id: householdId,
    profile_id: entry.profileId,
    date_time: entry.dateTime,
    amount_ml: entry.amountMl,
    created_at: entry.dateTime,
  };
}

function goalRow(goal: Goal, householdId: string) {
  return {
    id: goal.id,
    household_id: householdId,
    profile_id: goal.profileId,
    title: goal.title,
    description: goal.description ?? null,
    category: goal.category,
    status: goal.status,
    difficulty: goal.difficulty,
    start_date: goal.startDate ?? null,
    end_date: goal.endDate ?? null,
    completed_at: goal.completedAt ?? null,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
  };
}

function favouriteMealRow(favourite: FavouriteMeal, householdId: string) {
  return {
    id: favourite.id,
    household_id: householdId,
    profile_id: favourite.profileId,
    name: favourite.name,
    meal_type: favourite.mealType,
    source: favourite.source,
    calories: favourite.calories,
    protein: favourite.protein,
    carbs: favourite.carbs,
    fat: favourite.fat,
    saturated_fat: favourite.saturatedFat,
    fibre: favourite.fibre,
    sugar: favourite.sugar,
    salt: favourite.salt,
    portion_size: favourite.portionSize,
    trigger_tags: favourite.triggerTags,
    notes: favourite.notes ?? null,
    created_at: favourite.createdAt,
    updated_at: favourite.updatedAt,
  };
}

function savedFoodRow(food: FoodItem, householdId: string) {
  return {
    id: food.id,
    household_id: householdId,
    profile_id: food.profileId ?? null,
    barcode: food.barcode ?? null,
    name: food.name,
    brand: food.brand ?? null,
    serving_size: food.servingSize,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    saturated_fat: food.saturatedFat,
    fibre: food.fibre,
    sugar: food.sugar,
    salt: food.salt,
    trigger_tags: food.triggerTags,
    source: food.source,
    created_at: food.createdAt,
    updated_at: food.updatedAt,
  };
}

async function upsertTable(
  table: string,
  rows: Record<string, unknown>[]
): Promise<string | null> {
  if (rows.length === 0) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return 'Supabase unavailable';

  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  return error?.message ?? null;
}

/** Push local app data to Supabase for the signed-in household. */
export async function pushToCloud(data: AppData, meta: SyncMeta): Promise<SyncResult> {
  if (!isSupabaseConfigured() || !meta.session.userId) {
    return { ok: false, error: 'Sign in required for cloud sync.' };
  }

  const householdId = meta.household.id;
  if (!householdId) {
    return { ok: false, error: 'No household linked to this account.' };
  }

  const syncingMeta: SyncMeta = { ...meta, displayStatus: 'syncing', lastError: null };
  saveSyncMeta(syncingMeta);

  const ownerId = meta.session.userId;
  const errors: string[] = [];

  errors.push(
    (await upsertTable(
      'profiles',
      data.profiles.map((p) => profileRow(p, householdId, ownerId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'meals',
      data.meals.map((m) => mealRow(m, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'health_issues',
      data.issues.map((i) => issueRow(i, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'symptom_episodes',
      data.symptomEpisodes.map((s) => symptomRow(s, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'daily_checkins',
      data.dailyCheckIns.map((c) => checkInRow(c, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'weight_entries',
      data.weightEntries.map((w) => weightRow(w, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'exercise_entries',
      data.exerciseEntries.map((e) => exerciseRow(e, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'water_entries',
      data.waterEntries.map((w) => waterRow(w, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'goals',
      data.goals.map((g) => goalRow(g, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'favourite_meals',
      data.favouriteMeals.map((f) => favouriteMealRow(f, householdId))
    )) ?? ''
  );
  errors.push(
    (await upsertTable(
      'saved_foods',
      data.savedFoods.map((f) => savedFoodRow(f, householdId))
    )) ?? ''
  );

  const failed = errors.filter(Boolean);
  const syncedAt = new Date().toISOString();

  if (failed.length > 0) {
    const errorMessage = failed[0];
    const errorMeta: SyncMeta = {
      ...syncingMeta,
      displayStatus: 'sync-error',
      lastError: errorMessage,
    };
    saveSyncMeta(errorMeta);
    return { ok: false, error: errorMessage };
  }

  const successMeta: SyncMeta = {
    ...syncingMeta,
    displayStatus: 'synced',
    lastSyncedAt: syncedAt,
    lastError: null,
  };
  saveSyncMeta(successMeta);
  return { ok: true, syncedAt };
}

/** Pull household data from Supabase (future merge — returns mapped AppData). */
export async function pullFromCloud(meta: SyncMeta): Promise<PullResult> {
  if (!isSupabaseConfigured() || !meta.session.userId || !meta.household.id) {
    return { ok: false, error: 'Sign in and household required for pull.' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, error: 'Supabase unavailable.' };

  const householdId = meta.household.id;

  try {
    const [
      profilesRes,
      mealsRes,
      issuesRes,
      symptomsRes,
      checkInsRes,
      weightsRes,
      exerciseRes,
      waterRes,
      goalsRes,
      favouritesRes,
      savedFoodsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('household_id', householdId),
      supabase.from('meals').select('*').eq('household_id', householdId),
      supabase.from('health_issues').select('*').eq('household_id', householdId),
      supabase.from('symptom_episodes').select('*').eq('household_id', householdId),
      supabase.from('daily_checkins').select('*').eq('household_id', householdId),
      supabase.from('weight_entries').select('*').eq('household_id', householdId),
      supabase.from('exercise_entries').select('*').eq('household_id', householdId),
      supabase.from('water_entries').select('*').eq('household_id', householdId),
      supabase.from('goals').select('*').eq('household_id', householdId),
      supabase.from('favourite_meals').select('*').eq('household_id', householdId),
      supabase.from('saved_foods').select('*').eq('household_id', householdId),
    ]);

    const firstError =
      profilesRes.error ??
      mealsRes.error ??
      issuesRes.error ??
      symptomsRes.error ??
      checkInsRes.error ??
      weightsRes.error ??
      exerciseRes.error ??
      waterRes.error ??
      goalsRes.error;

    if (firstError) {
      return { ok: false, error: firstError.message };
    }

    const profiles: Profile[] = (profilesRes.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      age: row.age ?? undefined,
      sex: row.sex ?? undefined,
      height: row.height ?? undefined,
      currentWeight: row.current_weight ?? undefined,
      targetWeight: row.target_weight ?? undefined,
      activityLevel: row.activity_level,
      goalType: row.goal_type,
      enabledModules: Array.isArray(row.enabled_modules) ? row.enabled_modules : [],
      dailyCalorieTarget: row.daily_calorie_target ?? undefined,
      proteinTarget: row.protein_target ?? undefined,
      carbTarget: row.carb_target ?? undefined,
      fatTarget: row.fat_target ?? undefined,
      fibreTarget: row.fibre_target ?? undefined,
      waterTarget: row.water_target ?? undefined,
      householdId: row.household_id,
      ownerUserId: row.owner_user_id ?? undefined,
    }));

    const remoteData: AppData = {
      profiles,
      meals: (mealsRes.data ?? []).map((row) => ({
        id: row.id,
        profileId: row.profile_id,
        dateTime: row.date_time,
        mealType: row.meal_type,
        mealName: row.meal_name,
        description: row.description ?? undefined,
        source: row.source,
        calories: Number(row.calories),
        protein: Number(row.protein),
        carbs: Number(row.carbs),
        fat: Number(row.fat),
        saturatedFat: row.saturated_fat ?? undefined,
        fibre: Number(row.fibre),
        sugar: row.sugar ?? undefined,
        salt: row.salt ?? undefined,
        waterMl: row.water_ml ?? undefined,
        portionSize: row.portion_size,
        notes: row.notes ?? undefined,
        triggerTags: row.trigger_tags ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      issues: (issuesRes.data ?? []).map((row) => ({
        id: row.id,
        profileId: row.profile_id,
        name: row.name,
        description: row.description ?? undefined,
        category: row.category,
        possibleTriggers: row.possible_triggers ?? [],
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      symptomEpisodes: (symptomsRes.data ?? []).map(
        (row) => row.payload as SymptomEpisode
      ),
      dailyCheckIns: (checkInsRes.data ?? []).map((row) => row.payload as DailyCheckIn),
      weightEntries: (weightsRes.data ?? []).map((row) => ({
        id: row.id,
        profileId: row.profile_id,
        date: row.date,
        weight: Number(row.weight),
        notes: row.notes ?? undefined,
      })),
      exerciseEntries: exerciseRes.error
        ? []
        : (exerciseRes.data ?? []).map((row) => ({
            id: row.id,
            profileId: row.profile_id,
            dateTime: row.date_time,
            activity: row.activity,
            durationMinutes: Number(row.duration_minutes),
            caloriesBurned: Number(row.calories_burned),
            notes: row.notes ?? undefined,
          })),
      waterEntries: (waterRes.data ?? []).map((row) => ({
        id: row.id,
        profileId: row.profile_id,
        dateTime: row.date_time,
        amountMl: row.amount_ml,
      })),
      goals: (goalsRes.data ?? []).map((row) => ({
        id: row.id,
        profileId: row.profile_id,
        title: row.title,
        description: row.description ?? undefined,
        category: row.category,
        status: row.status,
        difficulty: row.difficulty,
        startDate: row.start_date ?? undefined,
        endDate: row.end_date ?? undefined,
        completedAt: row.completed_at ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      favouriteMeals: favouritesRes.error
        ? []
        : (favouritesRes.data ?? []).map((row) => ({
            id: row.id,
            profileId: row.profile_id,
            name: row.name,
            mealType: row.meal_type,
            source: row.source,
            calories: Number(row.calories),
            protein: Number(row.protein),
            carbs: Number(row.carbs),
            fat: Number(row.fat),
            saturatedFat: Number(row.saturated_fat ?? 0),
            fibre: Number(row.fibre),
            sugar: Number(row.sugar),
            salt: Number(row.salt),
            portionSize: row.portion_size,
            triggerTags: row.trigger_tags ?? [],
            notes: row.notes ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })),
      savedFoods: savedFoodsRes.error
        ? []
        : (savedFoodsRes.data ?? []).map((row) => ({
            id: row.id,
            profileId: row.profile_id ?? undefined,
            barcode: row.barcode ?? undefined,
            name: row.name,
            brand: row.brand ?? undefined,
            servingSize: row.serving_size,
            calories: Number(row.calories),
            protein: Number(row.protein),
            carbs: Number(row.carbs),
            fat: Number(row.fat),
            saturatedFat: Number(row.saturated_fat ?? 0),
            fibre: Number(row.fibre),
            sugar: Number(row.sugar),
            salt: Number(row.salt),
            triggerTags: row.trigger_tags ?? [],
            source: row.source,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })),
      activeProfileId: profiles[0]?.id ?? null,
      demoLoaded: false,
    };

    return { ok: true, data: migrateAppData(remoteData) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Pull failed.',
    };
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced background push after local edits. */
export function scheduleCloudPush(
  data: AppData,
  meta: SyncMeta,
  onComplete?: (meta: SyncMeta) => void,
  delayMs = 3000
): void {
  if (!meta.session.userId || !isSupabaseConfigured()) return;

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushToCloud(data, meta).then(() => {
      onComplete?.(loadSyncMeta());
    });
  }, delayMs);
}

export function cancelScheduledPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}
