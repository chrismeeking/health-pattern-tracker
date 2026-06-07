import type { RiskAssessment } from '@/types';
import { PATTERN_DISCLAIMER } from '@/types';
import { ConfidenceBadge, RiskBadge } from './ConfidenceBadge';
import { Card } from './Card';

export function RiskCard({ assessment }: { assessment: RiskAssessment }) {
  return (
    <Card className="space-y-2 border-amber-100 bg-amber-50/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Pattern risk estimate</span>
        <RiskBadge level={assessment.level} />
        <ConfidenceBadge level={assessment.confidence} />
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{assessment.explanation}</p>
      {assessment.contributingFactors.length > 0 && (
        <p className="text-xs text-slate-500">
          Contributing factors: {assessment.contributingFactors.join(', ')}
        </p>
      )}
      <p className="text-xs text-slate-400 italic">{PATTERN_DISCLAIMER}</p>
    </Card>
  );
}
