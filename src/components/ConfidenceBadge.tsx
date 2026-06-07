import type { ConfidenceLevel, RiskLevel } from '@/types';
import { cn } from '@/utils/helpers';

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const styles = {
    low: 'bg-amber-100 text-amber-700',
    medium: 'bg-teal-100 text-teal-700',
    high: 'bg-sage-100 text-sage-700',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', styles[level])}>
      {level} confidence
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const styles = {
    low: 'bg-sage-100 text-sage-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-coral-100 text-coral-600',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', styles[level])}>
      {level} risk
    </span>
  );
}
