import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';

const actions = [
  { to: '/add/meal', label: 'Add Meal', icon: 'meals' as IconName, desc: 'Log food quickly' },
  { to: '/health', label: 'Health actions', icon: 'health' as IconName, desc: 'Weight and progress' },
  { to: '/add/weight', label: 'Add Weight', icon: 'health' as IconName, desc: 'Record your weight' },
  { to: '/add/water', label: 'Add Water', icon: 'check' as IconName, desc: 'Track hydration' },
  { to: '/add/symptom', label: 'Log Symptom', icon: 'symptom' as IconName, desc: 'Record a symptom episode' },
  { to: '/add/check-in', label: 'Daily Check-In', icon: 'check' as IconName, desc: 'How are you today?' },
  { to: '/issues', label: 'Health Issues', icon: 'issues' as IconName, desc: 'Manage tracked patterns' },
  { to: '/add/issue', label: 'Create Issue', icon: 'plus' as IconName, desc: 'Track a new health pattern' },
];

export function AddPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Quick Add</h1>
      <div className="grid gap-3">
        {actions.map((action) => (
          <Link key={action.to} to={action.to}>
            <Card className="flex items-center gap-4 active:scale-[0.99] transition-transform">
              <span className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center dark:bg-teal-500/15 dark:text-teal-200">
                <Icon name={action.icon} className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-medium text-slate-800 dark:text-slate-100">{action.label}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{action.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
