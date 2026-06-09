import type { AppData, Profile } from '@/types';
import { getProfileData } from '@/services/storage';
import {
  hasHealthTracking,
  hasModule,
  isDigestivePrimaryHome,
  isNutritionPrimaryHome,
} from './profileModules';

export type SetupTier = 'starter' | 'basics' | 'building' | 'established' | 'complete';

export type HomeFocus = 'digestive' | 'nutrition' | 'balanced';

export interface SetupFlags {
  modulesConfigured: boolean;
  hasWeight: boolean;
  hasGoals: boolean;
  hasIssues: boolean;
  hasLoggedMeals: boolean;
  hasCheckIns: boolean;
  hasSymptoms: boolean;
  onboardingStarted: boolean;
}

export interface SetupNextStep {
  id: string;
  label: string;
  to: string;
}

export interface ProfileSetupStatus {
  tier: SetupTier;
  score: number;
  flags: SetupFlags;
  nextSteps: SetupNextStep[];
  homeFocus: HomeFocus;
  showNutritionDashboard: boolean;
  showHealthDashboard: boolean;
  showInsights: boolean;
  showPatterns: boolean;
}

function tierFromScore(score: number): SetupTier {
  if (score >= 85) return 'complete';
  if (score >= 60) return 'established';
  if (score >= 35) return 'building';
  if (score >= 15) return 'basics';
  return 'starter';
}

export function getProfileSetupStatus(
  data: AppData,
  profile: Profile
): ProfileSetupStatus {
  const profileData = getProfileData(data, profile.id);
  const modules = profile.enabledModules ?? [];

  const flags: SetupFlags = {
    modulesConfigured: modules.length > 1,
    hasWeight:
      profile.currentWeight != null ||
      profile.height != null ||
      profileData.weightEntries.length > 0,
    hasGoals: profileData.goals.length > 0,
    hasIssues: profileData.issues.length > 0,
    hasLoggedMeals: profileData.meals.length > 0,
    hasCheckIns: profileData.dailyCheckIns.length > 0,
    hasSymptoms: profileData.symptomEpisodes.length > 0,
    onboardingStarted:
      data.demoLoaded ||
      profileData.meals.length > 0 ||
      profileData.dailyCheckIns.length > 0 ||
      profileData.issues.length > 0,
  };

  let score = 5;
  if (flags.modulesConfigured) score += 10;
  if (flags.onboardingStarted) score += 10;
  if (flags.hasLoggedMeals) score += 20;
  if (flags.hasCheckIns) score += 15;
  if (flags.hasIssues) score += 10;
  if (flags.hasWeight && hasModule(profile, 'weight')) score += 10;
  if (flags.hasGoals && hasModule(profile, 'goals')) score += 10;
  if (flags.hasSymptoms && hasHealthTracking(profile)) score += 10;
  if (profileData.meals.length >= 5) score += 5;
  if (profileData.dailyCheckIns.length >= 3) score += 5;

  const tier = tierFromScore(score);

  const digestiveLean = isDigestivePrimaryHome(profile);
  const nutritionLean = isNutritionPrimaryHome(profile);
  const homeFocus: HomeFocus = digestiveLean
    ? 'digestive'
    : nutritionLean
      ? 'nutrition'
      : 'balanced';

  const nextSteps: SetupNextStep[] = [];
  if (!flags.hasLoggedMeals && hasModule(profile, 'nutrition')) {
    nextSteps.push({ id: 'meal', label: 'Log your first meal', to: '/add/meal' });
  }
  if (hasHealthTracking(profile) && !flags.hasCheckIns) {
    nextSteps.push({ id: 'checkin', label: 'Do a daily check-in', to: '/add/check-in' });
  }
  if (hasModule(profile, 'healthIssues') && !flags.hasIssues) {
    nextSteps.push({ id: 'issues', label: 'Add a health issue to track', to: '/add/issue' });
  }
  if (hasModule(profile, 'weight') && !flags.hasWeight) {
    nextSteps.push({ id: 'weight', label: 'Add your weight', to: '/add/weight' });
  }
  if (hasModule(profile, 'goals') && !flags.hasGoals) {
    nextSteps.push({ id: 'goals', label: 'Set a small goal', to: '/health/goals/new' });
  }

  const showNutritionDashboard =
    hasModule(profile, 'nutrition') &&
    (tier !== 'starter' || nutritionLean) &&
    (nutritionLean || tier !== 'starter');

  const showHealthDashboard =
    hasHealthTracking(profile) &&
    (tier !== 'starter' || digestiveLean || flags.hasCheckIns || flags.hasIssues);

  const showInsights =
    tier === 'established' || tier === 'complete' || profileData.meals.length >= 5;

  const showPatterns =
    showInsights &&
    hasHealthTracking(profile) &&
    (profileData.symptomEpisodes.length >= 2 || profileData.dailyCheckIns.length >= 3);

  return {
    tier,
    score,
    flags,
    nextSteps: nextSteps.slice(0, 3),
    homeFocus,
    showNutritionDashboard,
    showHealthDashboard,
    showInsights,
    showPatterns,
  };
}

export function getSetupTierLabel(tier: SetupTier): string {
  switch (tier) {
    case 'starter':
      return 'Getting started';
    case 'basics':
      return 'Basics in place';
    case 'building':
      return 'Building habits';
    case 'established':
      return 'Well established';
    case 'complete':
      return 'Fully set up';
  }
}
