import type { ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-slate-100 p-4 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none',
        onClick && 'cursor-pointer active:scale-[0.99] transition-transform',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  );
}
