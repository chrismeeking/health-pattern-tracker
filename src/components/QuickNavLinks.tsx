import { Link } from 'react-router-dom';
import type { Profile, ProfileModule } from '@/types';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { hasHealthTracking, hasModule, showHealthNav } from '@/utils/profileModules';

interface QuickLink {
  id: string;
  to: string;
  label: string;
  icon: IconName;
  desc: string;
  module?: ProfileModule | 'health' | 'healthHub';
}

const ALL_LINKS: QuickLink[] = [
  { id: 'health-hub', to: '/health', label: 'Health hub', icon: 'health', desc: 'Weight, goals & progress', module: 'healthHub' },
  { id: 'log-weight', to: '/add/weight', label: 'Log weight', icon: 'check', desc: "Record today's weight", module: 'weight' },
  { id: 'exercise', to: '/add/exercise', label: 'Exercise', icon: 'check', desc: 'Log activity & earn kcal', module: 'exercise' },
  { id: 'issues', to: '/issues', label: 'Issues', icon: 'issues', desc: 'Health patterns', module: 'health' },
  { id: 'check-in', to: '/add/check-in', label: 'Daily check-in', icon: 'check', desc: 'How are you today?', module: 'health' },
  { id: 'symptom', to: '/add/symptom', label: 'Log symptom', icon: 'symptom', desc: 'Record an episode', module: 'health' },
];

interface QuickNavLinksProps {
  profile: Profile;
  compact?: boolean;
  checkInDoneToday?: boolean;
}

export function QuickNavLinks({ profile, compact = false, checkInDoneToday = false }: QuickNavLinksProps) {
  const links = ALL_LINKS.filter((link) => {
    if (link.id === 'check-in' && checkInDoneToday) return false;
    if (link.module === 'health') return hasHealthTracking(profile);
    if (link.module === 'healthHub') return showHealthNav(profile);
    if (link.module) return hasModule(profile, link.module);
    return true;
  });

  if (links.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.id}
            to={link.to}
            className="text-xs font-medium text-teal-600 bg-teal-50 px-3 py-2 rounded-full dark:bg-teal-500/15 dark:text-teal-200"
          >
            {link.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <Link key={link.id} to={link.to}>
          <Card className="h-full p-3 space-y-1 active:scale-[0.99] transition-transform min-h-[72px]">
            <div className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center dark:bg-teal-500/15 dark:text-teal-200">
                <Icon name={link.icon} className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{link.label}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug dark:text-slate-500">{link.desc}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
