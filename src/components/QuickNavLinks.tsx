import { Link } from 'react-router-dom';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

const links = [
  { to: '/health', label: 'Health', icon: 'health' as IconName, desc: 'Weight, goals & progress' },
  { to: '/issues', label: 'Issues', icon: 'issues' as IconName, desc: 'Health patterns' },
  { to: '/add/check-in', label: 'Daily check-in', icon: 'check' as IconName, desc: 'How are you today?' },
  { to: '/add/symptom', label: 'Log symptom', icon: 'symptom' as IconName, desc: 'Record an episode' },
];

export function QuickNavLinks() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <Link key={link.to} to={link.to}>
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
