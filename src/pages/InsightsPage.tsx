import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import {
  generateEarlyObservations,
  generateInsights,
  getRecentSymptomPatterns,
  getSuspectedTriggers,
  getToleratedFoods,
  getTriggerReports,
} from '@/services/insightEngine';
import { generateProgressInsights } from '@/services/progressInsightEngine';
import { formatDate, formatTime } from '@/utils/helpers';
import {
  hasPatternInsights,
  hasProgressInsights,
  showInsightsNav,
} from '@/utils/profileModules';
import { InsightCard } from '@/components/InsightCard';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { Card } from '@/components/Card';
import { MEDICAL_DISCLAIMER, INSIGHTS_DISCLAIMER, TRIGGER_TAG_LABELS } from '@/types';

export function InsightsPage() {
  const { data, activeProfile } = useApp();

  if (!activeProfile) return null;

  const showPatterns = hasPatternInsights(activeProfile);
  const showProgress = hasProgressInsights(activeProfile);

  const progressInsights = showProgress
    ? generateProgressInsights(data, activeProfile)
    : [];
  const earlyObs = showPatterns
    ? generateEarlyObservations(data, activeProfile.id)
    : [];
  const patternInsights = showPatterns
    ? generateInsights(data, activeProfile.id)
    : [];
  const suspected = showPatterns ? getSuspectedTriggers(data, activeProfile.id) : [];
  const tolerated = showPatterns ? getToleratedFoods(data, activeProfile.id) : [];
  const triggerReports = showPatterns ? getTriggerReports(data, activeProfile.id) : [];
  const symptomPatterns = showPatterns
    ? getRecentSymptomPatterns(data, activeProfile.id)
    : [];

  const symptomEpisodeCount = data.symptomEpisodes.filter(
    (s) => s.profileId === activeProfile.id
  ).length;
  const showTriggerAnalysis = symptomEpisodeCount >= 3;

  if (!showInsightsNav(activeProfile)) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Insights</h1>
        <Card>
          <p className="text-sm text-slate-500 text-center py-6">
            Enable nutrition, macros, weight, or health tracking in{' '}
            <Link to="/profile" className="text-teal-600 font-medium">
              Settings
            </Link>{' '}
            to see personalised insights for {activeProfile.name}.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Insights</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tailored to {activeProfile.name}&apos;s enabled modules
        </p>
      </div>

      {showPatterns && (
        <Card className="bg-teal-50 border-teal-100 space-y-2 dark:bg-teal-500/10 dark:border-teal-500/20">
          <p className="text-xs text-teal-800 leading-relaxed dark:text-teal-100">{INSIGHTS_DISCLAIMER}</p>
          <p className="text-xs text-teal-700/80 leading-relaxed dark:text-teal-200/80">{MEDICAL_DISCLAIMER}</p>
        </Card>
      )}

      {showProgress && progressInsights.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Weekly progress</h2>
          <p className="text-xs text-slate-400">
            Calorie, macro, weight, and goal trends based on this week&apos;s logs.
          </p>
          {progressInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </section>
      )}

      {showPatterns && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Early observations</h2>
            {earlyObs.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </section>

          {suspected.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Current suspected triggers
              </h2>
              <Card className="space-y-3">
                {suspected.map((t) => (
                  <div
                    key={t.trigger}
                    className="flex justify-between items-start gap-2 border-b border-slate-50 last:border-0 pb-2 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{t.label}</p>
                      <p className="text-xs text-slate-500">
                        {Math.round(t.symptomRate * 100)}% symptom rate · {t.episodeCount} episode
                        {t.episodeCount !== 1 ? 's' : ''}
                        {t.severeCount > 0 ? ` · ${t.severeCount} severe` : ''}
                      </p>
                    </div>
                    <ConfidenceBadge level={t.confidence} />
                  </div>
                ))}
              </Card>
            </section>
          )}

          {tolerated.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Current tolerated foods
              </h2>
              <Card className="space-y-2">
                {tolerated.map((item) => (
                  <div key={`${item.type}-${item.name}`} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400 capitalize">
                        {item.type} · {item.count} times
                      </p>
                    </div>
                    <ConfidenceBadge level={item.confidence} />
                  </div>
                ))}
              </Card>
            </section>
          )}

          {showTriggerAnalysis && triggerReports.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Trigger analysis</h2>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs min-w-[320px]">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="py-2 pr-2">Trigger</th>
                      <th className="py-2 px-1">Eaten</th>
                      <th className="py-2 px-1">Symptoms</th>
                      <th className="py-2 px-1">None</th>
                      <th className="py-2 px-1">Rate</th>
                      <th className="py-2 pl-1">Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {triggerReports.map((r) => (
                      <tr key={r.trigger} className="border-b border-slate-50">
                        <td className="py-2 pr-2 font-medium">{TRIGGER_TAG_LABELS[r.trigger]}</td>
                        <td className="py-2 px-1">{r.timesEaten}</td>
                        <td className="py-2 px-1">{r.symptomsAfter}</td>
                        <td className="py-2 px-1">{r.noSymptomsAfter}</td>
                        <td className="py-2 px-1">{Math.round(r.symptomRate * 100)}%</td>
                        <td className="py-2 pl-1">
                          <ConfidenceBadge level={r.confidence} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {symptomPatterns.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Recent symptom patterns
              </h2>
              {symptomPatterns.map((p) => (
                <Card key={p.id} className="space-y-1">
                  <p className="font-medium text-sm text-slate-800 capitalize">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.description}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(p.dateTime)} · {formatTime(p.dateTime)}
                  </p>
                </Card>
              ))}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Pattern insights</h2>
            {patternInsights
              .filter((i) => i.category !== 'early')
              .map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
          </section>

          {!showTriggerAnalysis && showPatterns && (
            <Card className="text-sm text-slate-500 text-center py-4">
              Log at least 3 symptom episodes to unlock trigger analysis for {activeProfile.name}.
            </Card>
          )}
        </>
      )}
    </div>
  );
}
