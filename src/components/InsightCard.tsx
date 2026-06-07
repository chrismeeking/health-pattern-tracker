import type { Insight } from '@/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Card } from './Card';

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-800 text-sm leading-snug">{insight.title}</h3>
        <ConfidenceBadge level={insight.confidence} />
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
      {insight.dataPoints !== undefined && (
        <p className="text-xs text-slate-400">{insight.dataPoints} data points</p>
      )}
    </Card>
  );
}
