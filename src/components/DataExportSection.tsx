import type { AppData, Profile } from '@/types';
import {
  exportAllDataJson,
  exportDailyCheckInsCsv,
  exportGpSummaryCsv,
  exportGpSummaryText,
  exportMealsCsv,
  exportProfileDataJson,
  exportSymptomEpisodesCsv,
  exportWeightEntriesCsv,
  shareGpSummary,
} from '@/services/export';
import { hasHealthTracking } from '@/utils/profileModules';
import { Button } from './Button';
import { Card } from './Card';

interface DataExportSectionProps {
  data: AppData;
  activeProfile?: Profile;
}

export function DataExportSection({ data, activeProfile }: DataExportSectionProps) {
  const showGp = activeProfile != null && hasHealthTracking(activeProfile);

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Back up</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          JSON backup restores everything in the app. Use this before sync or clearing data.
        </p>
        {activeProfile && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => exportProfileDataJson(data, activeProfile.id)}
          >
            Back up {activeProfile.name}
          </Button>
        )}
        <Button variant="outline" fullWidth onClick={() => exportAllDataJson(data)}>
          Back up all profiles
        </Button>
      </Card>

      {showGp && activeProfile && (
        <Card className="space-y-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">GP summary</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Last 2 weeks of check-ins, symptoms, and trigger notes — to share with a doctor.
          </p>
          <Button variant="secondary" fullWidth onClick={() => void shareGpSummary(data, activeProfile.id)}>
            Share GP summary
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => exportGpSummaryText(data, activeProfile.id)}
          >
            Download GP summary (text)
          </Button>
        </Card>
      )}

      <details className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          Spreadsheet exports (CSV)
          <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
            For Excel — meals, symptoms, check-ins, and weight
          </span>
        </summary>
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          {activeProfile && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                {activeProfile.name}
              </p>
              <div className="grid gap-2">
                <Button variant="outline" fullWidth onClick={() => exportMealsCsv(data, activeProfile.id)}>
                  Meals
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => exportSymptomEpisodesCsv(data, activeProfile.id)}
                >
                  Symptom episodes
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => exportDailyCheckInsCsv(data, activeProfile.id)}
                >
                  Daily check-ins
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => exportWeightEntriesCsv(data, activeProfile.id)}
                >
                  Weight entries
                </Button>
                {showGp && (
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => exportGpSummaryCsv(data, activeProfile.id)}
                  >
                    GP summary
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              All profiles
            </p>
            <div className="grid gap-2">
              <Button variant="outline" fullWidth onClick={() => exportMealsCsv(data)}>
                All meals
              </Button>
              <Button variant="outline" fullWidth onClick={() => exportSymptomEpisodesCsv(data)}>
                All symptom episodes
              </Button>
              <Button variant="outline" fullWidth onClick={() => exportDailyCheckInsCsv(data)}>
                All check-ins
              </Button>
              <Button variant="outline" fullWidth onClick={() => exportWeightEntriesCsv(data)}>
                All weight entries
              </Button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
