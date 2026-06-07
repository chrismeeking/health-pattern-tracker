import type { SyncDisplayStatus } from '@/services/sync/types';
import { cn } from '@/utils/helpers';

const styles: Record<SyncDisplayStatus, string> = {
  'local-only': 'bg-slate-100 text-slate-600',
  synced: 'bg-sage-100 text-sage-700',
  'sync-error': 'bg-coral-100 text-coral-600',
  syncing: 'bg-teal-100 text-teal-700',
};

const labels: Record<SyncDisplayStatus, string> = {
  'local-only': 'Local only',
  synced: 'Synced',
  'sync-error': 'Sync error',
  syncing: 'Syncing…',
};

interface SyncStatusBadgeProps {
  status: SyncDisplayStatus;
  className?: string;
}

export function SyncStatusBadge({ status, className }: SyncStatusBadgeProps) {
  return (
    <span
      className={cn(
        'text-xs font-medium px-2.5 py-1 rounded-full capitalize',
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
