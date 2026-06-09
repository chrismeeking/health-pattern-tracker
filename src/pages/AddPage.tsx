import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { getProfileData } from '@/services/storage';
import type { ProfileModule } from '@/types';
import { Card } from '@/components/Card';
import { hasHealthTracking, hasModule } from '@/utils/profileModules';
import { getTodayCheckIn } from '@/utils/symptoms';

interface AddAction {
  to: string;
  label: string;
  icon: string;
  desc: string;
  always?: boolean;
  module?: ProfileModule | 'health';
}

const ACTIONS: AddAction[] = [
  { to: '/add/meal', label: 'Add Meal', icon: '🍽️', desc: 'Log food quickly', always: true },
  { to: '/health', label: 'Health & Goals', icon: '❤️', desc: 'Weight and progress', module: 'goals' },
  { to: '/add/weight', label: 'Add Weight', icon: '⚖️', desc: 'Record your weight', module: 'weight' },
  { to: '/add/exercise', label: 'Log Exercise', icon: '🏃', desc: 'Earn calories back', module: 'exercise' },
  { to: '/add/water', label: 'Add Water', icon: '💧', desc: 'Track hydration', module: 'water' },
  { to: '/add/symptom', label: 'Log Symptom', icon: '🩺', desc: 'Record a symptom episode', module: 'health' },
  { to: '/add/check-in', label: 'Daily Check-In', icon: '✅', desc: 'How are you today?', module: 'health' },
  { to: '/issues', label: 'Health Issues', icon: '🔍', desc: 'Manage tracked patterns', module: 'healthIssues' },
  { to: '/add/issue', label: 'Create Issue', icon: '➕', desc: 'Track a new health pattern', module: 'healthIssues' },
];

export function AddPage() {
  const { activeProfile, data } = useApp();

  if (!activeProfile) return null;

  const checkedInToday = Boolean(
    getTodayCheckIn(getProfileData(data, activeProfile.id).dailyCheckIns)
  );

  const actions = ACTIONS.filter((action) => {
    if (action.always) return true;
    if (action.module === 'health') return hasHealthTracking(activeProfile);
    if (action.to === '/health') {
      return (
        hasModule(activeProfile, 'goals') ||
        hasModule(activeProfile, 'weight') ||
        hasModule(activeProfile, 'macros')
      );
    }
    if (action.module) return hasModule(activeProfile, action.module);
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Quick Add</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Options match what {activeProfile.name} has enabled in their profile.
      </p>
      <div className="grid gap-3">
        {actions.map((action) => {
          const doneToday = action.to === '/add/check-in' && checkedInToday;
          return (
            <Link key={action.to} to={action.to}>
              <Card
                className={`flex items-center gap-4 active:scale-[0.99] transition-transform ${
                  doneToday ? 'opacity-80' : ''
                }`}
              >
                <span className="text-2xl">{doneToday ? '✓' : action.icon}</span>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">
                    {doneToday ? 'Checked in today' : action.label}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {doneToday ? 'View summary or log a symptom if things change' : action.desc}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
