import type { ReactNode } from 'react';
import { cn } from '@/utils/helpers';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, subtext, icon, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        {icon && <span className="text-teal-500">{icon}</span>}
      </div>
      <span className="text-2xl font-semibold text-slate-800">{value}</span>
      {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
    </Card>
  );
}
