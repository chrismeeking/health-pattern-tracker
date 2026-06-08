import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId, getProfileData } from '@/services/storage';
import {
  getTodayNutrition,
  getTodayWater,
  isMacroFocusedProfile,
} from '@/utils/nutrition';
import {
  getDaysSinceSevereEpisode,
  getLastCheckInStatus,
  getRecentSymptoms,
} from '@/utils/symptoms';
import {
  getSuspectedTriggers,
  getToleratedFoods,
  getTopInsight,
} from '@/services/insightEngine';
import { getTopProgressInsight } from '@/services/progressInsightEngine';
import {
  getWeeklyProgress,
  getWeightSummary,
} from '@/utils/health';
import { calculateBmi, getBmiCategory } from '@/utils/bmi';
import { getTodayExerciseBurn } from '@/utils/exercise';
import {
  hasHealthTracking,
  hasModule,
  hasPatternInsights,
  hasProgressInsights,
  showInsightsNav,
} from '@/utils/profileModules';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { InsightCard } from '@/components/InsightCard';
import { nowISO } from '@/utils/helpers';
import { DailyNutritionSummary } from '@/components/DailyNutritionSummary';
import { MacroSummary } from '@/components/MacroSummary';
import { WaterTracker } from '@/components/WaterTracker';
import { MealCard } from '@/components/MealCard';
import { IssueCard } from '@/components/IssueCard';
import { SymptomEpisodeCard } from '@/components/SymptomEpisodeCard';
import { StatCard } from '@/components/StatCard';
import { WeeklyProgressCard } from '@/components/WeeklyProgressCard';
import { QuickNavLinks } from '@/components/QuickNavLinks';
import { InstallAppPrompt } from '@/components/InstallAppPrompt';
import { OnboardingPanel } from '@/components/OnboardingPanel';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function HomePage() {
  const { data, activeProfile, update } = useApp();

  if (!activeProfile) {
    return <OnboardingPanel />;
  }

  const profileData = getProfileData(data, activeProfile.id);
  const todayTotals = getTodayNutrition(profileData.meals);
  const todayExercise = getTodayExerciseBurn(profileData.exerciseEntries);
  const todayWater = getTodayWater(profileData.waterEntries);
  const recentMeals = [...profileData.meals]
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 3);

  const showNutrition = hasModule(activeProfile, 'nutrition');
  const showMacros = hasModule(activeProfile, 'macros');
  const showWater = hasModule(activeProfile, 'water');
  const showWeight = hasModule(activeProfile, 'weight');
  const showExercise = hasModule(activeProfile, 'exercise');
  const showGoals = hasModule(activeProfile, 'goals');
  const showHealth = hasHealthTracking(activeProfile);
  const macroFocused = isMacroFocusedProfile(activeProfile);

  const daysSinceSevere = getDaysSinceSevereEpisode(profileData.symptomEpisodes);
  const lastCheckIn = getLastCheckInStatus(profileData.dailyCheckIns);
  const recentSymptoms = getRecentSymptoms(profileData.symptomEpisodes, 3);
  const activeIssues = profileData.issues.filter((i) => i.active).slice(0, 2);

  const issueName = (issueId?: string) =>
    profileData.issues.find((i) => i.id === issueId)?.name;

  const suspectedTriggers = showHealth
    ? getSuspectedTriggers(data, activeProfile.id).slice(0, 3)
    : [];
  const toleratedFoods = showHealth
    ? getToleratedFoods(data, activeProfile.id).slice(0, 3)
    : [];
  const topPatternInsight = hasPatternInsights(activeProfile)
    ? getTopInsight(data, activeProfile.id)
    : null;
  const topProgressInsight = hasProgressInsights(activeProfile)
    ? getTopProgressInsight(data, activeProfile)
    : null;

  const weightSummary = getWeightSummary(profileData.weightEntries, activeProfile);
  const bmi =
    showWeight && weightSummary.latest != null && activeProfile.height != null
      ? calculateBmi(weightSummary.latest, activeProfile.height)
      : null;
  const bmiCategory = bmi != null ? getBmiCategory(bmi) : null;
  const activeGoal = profileData.goals.find((g) => g.status === 'active');
  const weeklyProgress = getWeeklyProgress(data, activeProfile.id);

  const showHealthProgress =
    showWeight ||
    showGoals ||
    (weeklyProgress.daysWithMeals > 0 && (showNutrition || showMacros));

  const addWater = (amount: number) => {
    update((d) => ({
      ...d,
      waterEntries: [
        ...d.waterEntries,
        {
          id: generateId(),
          profileId: activeProfile.id,
          dateTime: nowISO(),
          amountMl: amount,
        },
      ],
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Hello, {activeProfile.name}
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <InstallAppPrompt />

      <Card className="bg-gradient-to-br from-teal-700 to-slate-900 text-white border-0 shadow-lg dark:from-teal-800 dark:to-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-teal-200 font-semibold">
              Viewing profile
            </p>
            <p className="text-lg font-semibold mt-0.5">{activeProfile.name}</p>
            <p className="text-xs text-slate-300 mt-1">
              {showNutrition && activeProfile.dailyCalorieTarget
                ? `Target ${activeProfile.dailyCalorieTarget} kcal`
                : 'Custom tracking profile'}
              {showHealth && showNutrition ? ' · ' : ''}
              {showHealth ? 'Health patterns on' : ''}
            </p>
          </div>
          <Link
            to="/profile"
            className="text-xs text-teal-100 shrink-0 rounded-full bg-white/10 px-3 py-1.5"
          >
            Switch/edit
          </Link>
        </div>
      </Card>

      {topProgressInsight && (
        <section className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">This week</h2>
            {showInsightsNav(activeProfile) && (
              <Link to="/insights" className="text-xs text-teal-500">
                All insights
              </Link>
            )}
          </div>
          <InsightCard insight={topProgressInsight} />
        </section>
      )}

      <QuickNavLinks profile={activeProfile} />

      {showHealthProgress && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Health progress</h2>
            <Link to="/health" className="text-xs text-teal-500">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {showWeight && (
              <Link to="/health">
                <StatCard
                  label="Current weight"
                  value={weightSummary.latest != null ? `${weightSummary.latest} kg` : 'Log'}
                  subtext={
                    bmi != null && bmiCategory
                      ? `BMI ${bmi} · ${bmiCategory.label}`
                      : weightSummary.weekChange != null
                        ? `${weightSummary.weekChange > 0 ? '+' : ''}${weightSummary.weekChange} kg this week`
                        : activeProfile.targetWeight
                          ? `Target ${activeProfile.targetWeight} kg`
                          : 'Log weight to track trend'
                  }
                />
              </Link>
            )}
            {showGoals && (
              <Link to="/health">
                <StatCard
                  label="Active goal"
                  value={activeGoal ? '1' : 'Start'}
                  subtext={
                    activeGoal
                      ? activeGoal.title.length > 40
                        ? `${activeGoal.title.slice(0, 40)}…`
                        : activeGoal.title
                      : 'Try a small experiment'
                  }
                />
              </Link>
            )}
          </div>
          {(showNutrition || showMacros || showGoals) && (
            <Link to="/health">
              <WeeklyProgressCard
                progress={weeklyProgress}
                showSymptoms={showHealth}
                compact
              />
            </Link>
          )}
        </section>
      )}

      {showHealth && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Health snapshot</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Days since severe episode"
              value={daysSinceSevere ?? '—'}
              subtext={daysSinceSevere != null ? 'Keep tracking progress' : 'No severe episodes logged'}
            />
            <StatCard label="Check-in status" value={lastCheckIn} />
          </div>

          <div className="flex gap-2">
            <Link to="/add/check-in" className="flex-1">
              <Button variant="secondary" fullWidth size="sm">
                Daily check-in
              </Button>
            </Link>
            <Link to="/add/symptom" className="flex-1">
              <Button variant="outline" fullWidth size="sm">
                Log symptom
              </Button>
            </Link>
          </div>

          {activeIssues.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Active issues
                </h3>
                <Link to="/issues" className="text-xs text-teal-500">
                  View all
                </Link>
              </div>
              {activeIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} showActions={false} />
              ))}
            </div>
          )}

          {recentSymptoms.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Recent symptoms
              </h3>
              {recentSymptoms.map((ep) => (
                <SymptomEpisodeCard
                  key={ep.id}
                  episode={ep}
                  issueName={issueName(ep.issueId)}
                />
              ))}
            </div>
          )}

          {(suspectedTriggers.length > 0 || toleratedFoods.length > 0 || topPatternInsight) && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Pattern snapshot
                </h3>
                {showInsightsNav(activeProfile) && (
                  <Link to="/insights" className="text-xs text-teal-500">
                    All insights
                  </Link>
                )}
              </div>

              {topPatternInsight && <InsightCard insight={topPatternInsight} />}

              {suspectedTriggers.length > 0 && (
                <Card className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Top suspected triggers</p>
                  {suspectedTriggers.map((t) => (
                    <div key={t.trigger} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{t.label}</span>
                      <ConfidenceBadge level={t.confidence} />
                    </div>
                  ))}
                </Card>
              )}

              {toleratedFoods.length > 0 && (
                <Card className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Tolerated so far</p>
                  {toleratedFoods.map((item) => (
                    <div key={`${item.type}-${item.name}`} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="text-xs text-slate-400">{item.count}×</span>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
        </section>
      )}

      {showNutrition && (
        <DailyNutritionSummary
          totals={todayTotals}
          profile={activeProfile}
          exerciseBurned={todayExercise}
          showExercise={showExercise}
        />
      )}

      {showMacros &&
        (macroFocused ? (
          <MacroSummary totals={todayTotals} profile={activeProfile} />
        ) : (
          <MacroSummary totals={todayTotals} profile={activeProfile} compact />
        ))}

      {showWater && (
        <WaterTracker
          currentMl={todayWater}
          targetMl={activeProfile.waterTarget}
          onAdd={addWater}
        />
      )}

      <div className="flex gap-2">
        <Link to="/add/meal" className="flex-1">
          <Button fullWidth size="sm">
            Add meal
          </Button>
        </Link>
        {showWater && (
          <Link to="/add/water" className="flex-1">
            <Button variant="outline" fullWidth size="sm">
              Add water
            </Button>
          </Link>
        )}
      </div>

      {recentMeals.length > 0 && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Recent meals</h2>
            <Link to="/meals" className="text-xs text-teal-500">
              View all
            </Link>
          </div>
          {recentMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} showDate />
          ))}
        </section>
      )}
      {recentMeals.length === 0 && (
        <Card className="border-dashed border-slate-200 bg-white/70 text-center space-y-3 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mx-auto h-10 w-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center dark:bg-teal-500/15 dark:text-teal-200">
            <Icon name="meals" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-100">No meals logged yet</p>
            <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">
              Add your first meal to start tracking for {activeProfile.name}.
            </p>
          </div>
          <Link to="/add/meal">
            <Button size="sm" variant="secondary">
              Add first meal
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
