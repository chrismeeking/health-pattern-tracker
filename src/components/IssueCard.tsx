import type { HealthIssue } from '@/types';
import { ISSUE_CATEGORY_LABELS } from '@/types';
import { Card } from './Card';
import { EntityActions } from './EntityActions';

interface IssueCardProps {
  issue: HealthIssue;
  onDelete?: () => void;
  showActions?: boolean;
}

export function IssueCard({ issue, onDelete, showActions = true }: IssueCardProps) {
  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-slate-800">{issue.name}</h3>
          <p className="text-xs text-slate-400 capitalize">
            {ISSUE_CATEGORY_LABELS[issue.category]}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
            issue.active ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {issue.active ? 'Active' : 'Paused'}
        </span>
      </div>
      {issue.description && (
        <p className="text-sm text-slate-500 leading-relaxed">{issue.description}</p>
      )}
      {issue.possibleTriggers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.possibleTriggers.slice(0, 6).map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {t}
            </span>
          ))}
        </div>
      )}
      {showActions && (
        <EntityActions editTo={`/issues/${issue.id}/edit`} onDelete={onDelete} />
      )}
    </Card>
  );
}
