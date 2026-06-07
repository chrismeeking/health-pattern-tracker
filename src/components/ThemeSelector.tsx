import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { Card } from './Card';

const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'system', label: 'System', description: 'Match your phone setting' },
  { value: 'light', label: 'Light', description: 'Bright daytime theme' },
  { value: 'dark', label: 'Dark', description: 'Lower light at night' },
];

export function ThemeSelector() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-100">Appearance</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Current display: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`rounded-xl border px-2 py-2 text-left min-h-[64px] ${
              theme === option.value
                ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-500/15 dark:text-teal-100'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
            }`}
          >
            <span className="block text-xs font-semibold">{option.label}</span>
            <span className="block text-[10px] opacity-70 mt-1">{option.description}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
