import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { cn } from '@/utils/helpers';
import { showInsightsNav } from '@/utils/profileModules';
import { Icon, type IconName } from './Icon';

const navItems = [
  { to: '/', label: 'Home', icon: 'home' as IconName, match: (path: string) => path === '/' },
  { to: '/meals', label: 'Meals', icon: 'meals' as IconName, match: (path: string) => path.startsWith('/meals') },
  { to: '/add', label: 'Add', icon: 'plus' as IconName, isAdd: true },
  {
    to: '/insights',
    label: 'Insights',
    icon: 'insights' as IconName,
    match: (path: string) => path.startsWith('/insights'),
    requiresInsights: true,
  },
  {
    to: '/profile',
    label: 'Settings',
    icon: 'settings' as IconName,
    match: (path: string) =>
      path.startsWith('/profile') || path.startsWith('/health') || path.startsWith('/issues'),
  },
];

export function BottomNav() {
  const location = useLocation();
  const { activeProfile } = useApp();
  const insightsEnabled = activeProfile ? showInsightsNav(activeProfile) : false;

  const visibleItems = navItems.filter(
    (item) => !item.requiresInsights || insightsEnabled
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 z-50 pb-[env(safe-area-inset-bottom)] dark:bg-slate-950/95 dark:border-slate-800">
      <div className="max-w-lg mx-auto flex items-end justify-around px-1 pt-1 pb-1">
        {visibleItems.map((item) => {
          if (item.isAdd) {
            const isActive = location.pathname.startsWith('/add');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center -mt-4"
              >
                <span
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center text-2xl font-light shadow-lg transition-colors',
                    isActive ? 'bg-teal-600 text-white' : 'bg-teal-500 text-white'
                  )}
                >
                  <Icon name="plus" className="h-7 w-7" />
                </span>
              </NavLink>
            );
          }

          const isActive = item.match
            ? item.match(location.pathname)
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-2 min-w-[52px] min-h-[52px] justify-center rounded-xl transition-colors',
                isActive ? 'text-teal-500' : 'text-slate-400 dark:text-slate-500'
              )}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
