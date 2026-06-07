import { useApp } from '@/hooks/useAppData';
import { cn } from '@/utils/helpers';

export function ProfileSwitcher({ className }: { className?: string }) {
  const { data, activeProfile, setActiveProfile } = useApp();

  if (data.profiles.length <= 1) {
    return activeProfile ? (
      <span className={cn('text-lg font-semibold text-slate-800 dark:text-slate-100', className)}>
        {activeProfile.name}
      </span>
    ) : null;
  }

  return (
    <select
      value={activeProfile?.id ?? ''}
      onChange={(e) => setActiveProfile(e.target.value)}
      className={cn(
        'text-lg font-semibold bg-transparent border-none outline-none text-slate-800 cursor-pointer dark:text-slate-100',
        className
      )}
    >
      {data.profiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
