import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId, getProfileData } from '@/services/storage';
import {
  getTodayNutrition,
  getTodayWater,
  hasModule,
  isDigestiveProfile,
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
import {
  getWeeklyProgress,
  getWeightSummary,
} from '@/utils/health';
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
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function HomePage() {
  const { data, activeProfile, update } = useApp();

  if (!activeProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No profile loaded. Check Settings.</p>
      </div>
    );
  }

  const profileData = getProfileData(data, activeProfile.id);
  const todayTotals = getTodayNutrition(profileData.meals);
  const todayWater = getTodayWater(profileData.waterEntries);
  const recentMeals = [...profileData.meals]
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 3);

  const macroFocused = isMacroFocusedProfile(activeProfile);
  const digestive = isDigestiveProfile(activeProfile);
  const showHealth = hasModule(activeProfile.enabledModules, 'healthIssues') || digestive;

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
  const topInsight = showHealth ? getTopInsight(data, activeProfile.id) : null;

  const weightSummary = getWeightSummary(profileData.weightEntries, activeProfile);
  const activeGoal = profileData.goals.find((g) => g.status === 'active');
  const weeklyProgress = getWeeklyProgress(data, activeProfile.id);
  const showWeightModule = hasModule(activeProfile.enabledModules, 'weight');

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
        <h1 className="text-xl font-semibold text-slate-800">
          Hello, {activeProfile.name}
        </h1>
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      <InstallAppPrompt />

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-slate-600">Quick links</h2>
        <QuickNavLinks />
      </section>

      {(showWeightModule || activeGoal || weeklyProgress.daysWithMeals > 0) && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-600">Health progress</h2>
            <Link to="/health" className="text-xs text-teal-500">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {showWeightModule && (
              <Link to="/health">
                <StatCard
                  label="Current weight"
                  value={weightSummary.latest != null ? `${weightSummary.latest} kg` : '—'}
                  subtext={
                    weightSummary.weekChange != null
                      ? `${weightSummary.weekChange > 0 ? '+' : ''}${weightSummary.weekChange} kg this week`
                      : activeProfile.targetWeight
                        ? `Target ${activeProfile.targetWeight} kg`
                        : 'Log weight to track trend'
                  }
                />
              </Link>
            )}
            <Link to="/health">
              <StatCard
                label="Active goal"
                value={activeGoal ? '1' : '0'}
                subtext={
                  activeGoal
                    ? activeGoal.title.length > 40
                      ? `${activeGoal.title.slice(0, 40)}…`
                      : activeGoal.title
                    : 'Try a small experiment'
                }
              />
            </Link>
          </div>
          <Link to="/health">
            <WeeklyProgressCard
              progress={weeklyProgress}
              showSymptoms={showHealth}
              compact
            />
          </Link>
        </section>
      )}

      {showHealth && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600">Health snapshot</h2>
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

          {(suspectedTriggers.length > 0 || toleratedFoods.length > 0 || topInsight) && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Pattern snapshot
                </h3>
                <Link to="/insights" className="text-xs text-teal-500">
                  All insights
                </Link>
              </div>

              {topInsight && <InsightCard insight={topInsight} />}

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

      <DailyNutritionSummary totals={todayTotals} profile={activeProfile} />

      {macroFocused ? (
        <MacroSummary totals={todayTotals} profile={activeProfile} />
      ) : (
        activeProfile.enabledModules.includes('macros') && (
          <MacroSummary totals={todayTotals} profile={activeProfile} compact />
        )
      )}

      {activeProfile.enabledModules.includes('water') && (
        <WaterTracker
          currentMl={todayWater}
          targetMl={activeProfile.waterTarget}
          onAdd={addWater}
        />
      )}

      {digestive && !showHealth && (
        <Card className="border-dashed border-slate-200 bg-slate-50/80 space-y-1">
          <p className="text-sm font-medium text-slate-600">Symptom & trigger tracking</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enable health issue tracking in Profile to log symptoms and check-ins.
          </p>
        </Card>
      )}

      <div className="flex gap-2">
        <Link to="/add/meal" className="flex-1">
          <Button fullWidth size="sm">Add meal</Button>
        </Link>
        <Link to="/add/water" className="flex-1">
          <Button variant="outline" fullWidth size="sm">Add water</Button>
        </Link>
      </div>

      {recentMeals.length > 0 && (
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-600">Recent meals</h2>
            <Link to="/meals" className="text-xs text-teal-500">
              View all
            </Link>
          </div>
          {recentMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} showDate />
          ))}
        </section>
      )}
    </div>
  );
}
