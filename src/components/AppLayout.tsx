import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ProfileSwitcher } from './ProfileSwitcher';

export function AppLayout() {
  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto w-full overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur border-b border-slate-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:bg-slate-950/95 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium truncate dark:text-slate-500">Health Pattern Tracker</p>
            <ProfileSwitcher />
          </div>
        </div>
      </header>
      <main className="flex-1 safe-bottom px-4 py-4 w-full max-w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
