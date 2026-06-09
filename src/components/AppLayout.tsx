import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { getProfileData } from '@/services/storage';
import { getTodayCheckIn } from '@/utils/symptoms';
import { scheduleCheckInReminderIfNeeded } from '@/services/reminders';
import { BottomNav } from './BottomNav';
import { ProfileSwitcher } from './ProfileSwitcher';
import { SyncStatusBadge } from './SyncStatusBadge';

export function AppLayout() {
  const { data, activeProfile, syncMeta, isSignedIn } = useApp();

  useEffect(() => {
    if (!activeProfile) return;
    const profileData = getProfileData(data, activeProfile.id);
    const todayCheckIn = getTodayCheckIn(profileData.dailyCheckIns);
    scheduleCheckInReminderIfNeeded(Boolean(todayCheckIn));
  }, [activeProfile, data.dailyCheckIns]);

  const syncLabel =
    !isSignedIn
      ? 'Offline'
      : syncMeta.displayStatus === 'synced'
        ? 'Synced'
        : syncMeta.displayStatus === 'syncing'
          ? 'Syncing'
          : syncMeta.displayStatus === 'sync-error'
            ? 'Sync issue'
            : 'Offline';

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto w-full overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur border-b border-slate-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:bg-slate-950/95 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium truncate dark:text-slate-500">Health Pattern Tracker</p>
            <ProfileSwitcher />
          </div>
          <span title={syncLabel} className="shrink-0">
            <SyncStatusBadge status={syncMeta.displayStatus} />
          </span>
        </div>
      </header>
      <main className="flex-1 safe-bottom px-4 py-4 w-full max-w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
