import type { Goal } from '@/types';
import { GOAL_CATEGORY_LABELS } from '@/types';
import { Card } from './Card';
import { Button } from './Button';
import { EntityActions } from './EntityActions';
import { Icon } from './Icon';

interface GoalCardProps {
  goal: Goal;
  onComplete?: () => void;
  onSkip?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function GoalCard({
  goal,
  onComplete,
  onSkip,
  onDelete,
  showActions = true,
  compact,
}: GoalCardProps) {
  const statusStyles = {
    active: 'bg-teal-100 text-teal-700',
    completed: 'bg-sage-100 text-sage-700',
    skipped: 'bg-slate-100 text-slate-500',
  };

  return (
    <Card className={`space-y-2 ${compact ? 'p-3' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-teal-500">
              <Icon name={goal.status === 'completed' ? 'check' : 'health'} className="h-4 w-4" />
            </span>
            <h3 className="font-medium text-slate-800 text-sm leading-snug">{goal.title}</h3>
          </div>
          {goal.description && !compact && (
            <p className="text-xs text-slate-500 mt-1 pl-6">{goal.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2 pl-6">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {GOAL_CATEGORY_LABELS[goal.category]}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
              {goal.difficulty}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${statusStyles[goal.status]}`}
            >
              {goal.status}
            </span>
          </div>
        </div>
      </div>

      {goal.status === 'active' && showActions && (onComplete || onSkip) && (
        <div className="flex gap-2 pl-6">
          {onComplete && (
            <Button variant="secondary" size="sm" onClick={onComplete} className="flex-1">
              Mark done
            </Button>
          )}
          {onSkip && (
            <Button variant="outline" size="sm" onClick={onSkip}>
              Skip
            </Button>
          )}
        </div>
      )}

      {showActions && onDelete && (
        <EntityActions
          editTo={`/health/goals/${goal.id}/edit`}
          onDelete={onDelete}
          editLabel="Edit"
        />
      )}
    </Card>
  );
}
