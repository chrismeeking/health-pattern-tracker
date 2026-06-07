import { Link } from 'react-router-dom';
import { Card } from './Card';

const links = [
  { to: '/health', label: 'Health', icon: '❤️', desc: 'Weight, goals & progress' },
  { to: '/issues', label: 'Issues', icon: '🔍', desc: 'Health patterns' },
  { to: '/add/check-in', label: 'Daily check-in', icon: '✅', desc: 'How are you today?' },
  { to: '/add/symptom', label: 'Log symptom', icon: '🩺', desc: 'Record an episode' },
];

export function QuickNavLinks() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <Link key={link.to} to={link.to}>
          <Card className="h-full p-3 space-y-1 active:scale-[0.99] transition-transform min-h-[72px]">
            <div className="flex items-center gap-2">
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm font-medium text-slate-800">{link.label}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">{link.desc}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
