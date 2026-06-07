import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/helpers';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠', match: (path: string) => path === '/' },
  { to: '/meals', label: 'Meals', icon: '🍽️', match: (path: string) => path.startsWith('/meals') },
  { to: '/add', label: 'Add', icon: '+', isAdd: true },
  { to: '/insights', label: 'Insights', icon: '💡', match: (path: string) => path.startsWith('/insights') },
  {
    to: '/profile',
    label: 'Settings',
    icon: '⚙️',
    match: (path: string) =>
      path.startsWith('/profile') || path.startsWith('/health') || path.startsWith('/issues'),
  },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex items-end justify-around px-1 pt-1 pb-1">
        {navItems.map((item) => {
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
                  +
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
                isActive ? 'text-teal-500' : 'text-slate-400'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
