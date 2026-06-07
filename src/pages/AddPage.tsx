import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';

const actions = [
  { to: '/add/meal', label: 'Add Meal', icon: '🍽️', desc: 'Log food quickly' },
  { to: '/health', label: 'Health & Goals', icon: '❤️', desc: 'Weight and progress' },
  { to: '/add/weight', label: 'Add Weight', icon: '⚖️', desc: 'Record your weight' },
  { to: '/add/water', label: 'Add Water', icon: '💧', desc: 'Track hydration' },
  { to: '/add/symptom', label: 'Log Symptom', icon: '🩺', desc: 'Record a symptom episode' },
  { to: '/add/check-in', label: 'Daily Check-In', icon: '✅', desc: 'How are you today?' },
  { to: '/issues', label: 'Health Issues', icon: '🔍', desc: 'Manage tracked patterns' },
  { to: '/add/issue', label: 'Create Issue', icon: '➕', desc: 'Track a new health pattern' },
];

export function AddPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Quick Add</h1>
      <div className="grid gap-3">
        {actions.map((action) => (
          <Link key={action.to} to={action.to}>
            <Card className="flex items-center gap-4 active:scale-[0.99] transition-transform">
              <span className="text-2xl">{action.icon}</span>
              <div>
                <h3 className="font-medium text-slate-800">{action.label}</h3>
                <p className="text-xs text-slate-400">{action.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
