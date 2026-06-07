import { useEffect, useMemo, useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'health-pattern-install-card-dismissed';

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return true;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isLikelyMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');
  const [installed, setInstalled] = useState(isStandaloneDisplay);
  const showIosInstructions = useMemo(() => isIos(), []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (installed || dismissed || (!installEvent && !showIosInstructions && !isLikelyMobile())) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }
    setInstallEvent(null);
  };

  return (
    <Card className="bg-teal-50 border-teal-100 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal-900">Install as an app</p>
          <p className="text-xs text-teal-800/80 mt-1">
            Add Health Pattern Tracker to your home screen for a full-screen app experience.
          </p>
        </div>
        <button type="button" className="text-[11px] text-teal-700" onClick={dismiss}>
          Hide
        </button>
      </div>

      {installEvent ? (
        <Button type="button" size="sm" variant="secondary" onClick={() => void install()}>
          Install app
        </Button>
      ) : (
        <p className="text-xs text-teal-800">
          On iPhone: tap Share, then Add to Home Screen. On Android: open the browser menu and
          choose Install app or Add to Home screen.
        </p>
      )}
    </Card>
  );
}
