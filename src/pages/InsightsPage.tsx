import { useApp } from '@/hooks/useAppData';
import {
  generateEarlyObservations,
  generateInsights,
  getRecentSymptomPatterns,
  getSuspectedTriggers,
  getToleratedFoods,
  getTriggerReports,
} from '@/services/insightEngine';
import { assessMealRisk } from '@/services/riskEngine';
import { hasModule } from '@/utils/nutrition';
import { formatDate, formatTime } from '@/utils/helpers';
import { InsightCard } from '@/components/InsightCard';
import { RiskCard } from '@/components/RiskCard';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { Card } from '@/components/Card';
import { MEDICAL_DISCLAIMER, INSIGHTS_DISCLAIMER, TRIGGER_TAG_LABELS } from '@/types';

export function InsightsPage() {
  const { data, activeProfile } = useApp();

  if (!activeProfile) return null;

  const showHealth =
    hasModule(activeProfile.enabledModules, 'healthIssues') ||
    hasModule(activeProfile.enabledModules, 'digestive');

  const earlyObs = generateEarlyObservations(data, activeProfile.id);
  const insights = generateInsights(data, activeProfile.id);
  const suspected = getSuspectedTriggers(data, activeProfile.id);
  const tolerated = getToleratedFoods(data, activeProfile.id);
  const triggerReports = getTriggerReports(data, activeProfile.id);
  const symptomPatterns = getRecentSymptomPatterns(data, activeProfile.id);

  const profileMeals = data.meals.filter((m) => m.profileId === activeProfile.id);
  const exampleRisk =
    profileMeals.length > 0
      ? assessMealRisk(profileMeals[0], data, activeProfile.id)
      : null;

  if (!showHealth) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-800">Insights</h1>
        <Card className="bg-teal-50 border-teal-100">
          <p className="text-xs text-teal-800 leading-relaxed">{INSIGHTS_DISCLAIMER}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500 text-center py-6">
            Enable health issue or digestive tracking in Settings to see pattern insights.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Insights</h1>

      <Card className="bg-teal-50 border-teal-100 space-y-2">
        <p className="text-xs text-teal-800 leading-relaxed">{INSIGHTS_DISCLAIMER}</p>
        <p className="text-xs text-teal-700/80 leading-relaxed">{MEDICAL_DISCLAIMER}</p>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-600">Early observations</h2>
        {earlyObs.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </section>

      {suspected.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600">Current suspected triggers</h2>
          <Card className="space-y-3">
            {suspected.map((t) => (
              <div key={t.trigger} className="flex justify-between items-start gap-2 border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{t.label}</p>
                  <p className="text-xs text-slate-500">
                    {Math.round(t.symptomRate * 100)}% symptom rate · {t.episodeCount} episode{t.episodeCount !== 1 ? 's' : ''}
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
          <h2 className="text-sm font-medium text-slate-600">Current tolerated foods</h2>
          <Card className="space-y-2">
            {tolerated.map((item) => (
              <div key={`${item.type}-${item.name}`} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{item.type} · {item.count} times</p>
                </div>
                <ConfidenceBadge level={item.confidence} />
              </div>
            ))}
          </Card>
        </section>
      )}

      {triggerReports.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600">Trigger analysis</h2>
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
          <div className="space-y-2">
            {triggerReports.slice(0, 6).map((r) => (
              <p key={`exp-${r.trigger}`} className="text-xs text-slate-500 leading-relaxed">
                {r.explanation}
              </p>
            ))}
          </div>
        </section>
      )}

      {symptomPatterns.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600">Recent symptom patterns</h2>
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
        <h2 className="text-sm font-medium text-slate-600">Pattern insights</h2>
        {insights.filter((i) => i.category !== 'early').map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </section>

      {exampleRisk && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-600">Risk estimate example</h2>
          <p className="text-xs text-slate-400">
            Based on your most recent logged meal — the same estimate appears when adding meals.
          </p>
          <RiskCard assessment={exampleRisk} />
        </section>
      )}
    </div>
  );
}
