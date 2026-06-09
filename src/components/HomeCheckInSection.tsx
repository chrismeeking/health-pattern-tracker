import { Link } from 'react-router-dom';
import type { DailyCheckIn } from '@/types';
import { formatTime } from '@/utils/helpers';
import { summarizeDailyCheckIn } from '@/utils/symptoms';
import { Button } from './Button';
import { Card } from './Card';

interface HomeCheckInSectionProps {
  todayCheckIn: DailyCheckIn | null;
  issueName: (id: string) => string | undefined;
  /** Primary CTA style on digestive-focused home. */
  prominent?: boolean;
}

export function TodayCheckInSummary({
  checkIn,
  issueName,
}: {
  checkIn: DailyCheckIn;
  issueName: (id: string) => string | undefined;
}) {
  const issueLabels = checkIn.selectedIssues
    .map((id) => issueName(id))
    .filter((name): name is string => Boolean(name));

  return (
    <Card className="border-teal-200 bg-teal-50/60 dark:border-teal-800 dark:bg-teal-950/40">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700 dark:bg-teal-900 dark:text-teal-200">
          ✓
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-teal-900 dark:text-teal-100">Checked in today</p>
          <p className="text-xs text-teal-800/90 dark:text-teal-200/90">
            {summarizeDailyCheckIn(checkIn, issueName)}
          </p>
          {issueLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {checkIn.selectedIssues.map((issueId) => {
                const label = issueName(issueId);
                if (!label) return null;
                return (
                  <Link
                    key={issueId}
                    to={`/issues/${issueId}/edit`}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-teal-800 border border-teal-200 dark:bg-slate-900 dark:border-teal-800 dark:text-teal-200"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-teal-700/70 dark:text-teal-300/60">
            {formatTime(checkIn.checkInTime)}
            {issueLabels.length > 0 && (
              <>
                {' '}
                ·{' '}
                <Link to="/issues" className="underline">
                  All issues
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function HomeCheckInActions({
  todayCheckIn,
  issueName,
  prominent = false,
}: HomeCheckInSectionProps) {
  if (todayCheckIn) {
    return (
      <div className="space-y-2">
        <TodayCheckInSummary checkIn={todayCheckIn} issueName={issueName} />
        <Link to="/add/symptom">
          <Button variant={prominent ? 'primary' : 'secondary'} fullWidth size="sm">
            Log symptom
          </Button>
        </Link>
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
          Something changed later? Log a symptom — you&apos;ve already checked in today.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Link to="/add/check-in" className="flex-1">
        <Button variant={prominent ? 'primary' : 'secondary'} fullWidth size="sm">
          Daily check-in
        </Button>
      </Link>
      <Link to="/add/symptom" className="flex-1">
        <Button variant="outline" fullWidth size="sm">
          Log symptom
        </Button>
      </Link>
    </div>
  );
}
