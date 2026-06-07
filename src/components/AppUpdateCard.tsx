import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/types';
import { Button } from './Button';
import { Card } from './Card';

type UpdateState = 'unsupported' | 'ready' | 'checking' | 'updated' | 'error';

export function AppUpdateCard() {
  const [state, setState] = useState<UpdateState>(
    'serviceWorker' in navigator ? 'ready' : 'unsupported'
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      setState('updated');
      setMessage('A fresh app version is ready. Reload to use it.');
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const checkForUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    setState('checking');
    setMessage(null);
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update()));
      setState('ready');
      setMessage('Checked for updates. If Render has deployed a new version, refresh the app.');
    } catch {
      setState('error');
      setMessage('Could not check for updates. Try refreshing the browser.');
    }
  };

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-700">App version & updates</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Version {APP_VERSION}. If the phone keeps an older PWA cached, check for updates or
          refresh after Render deploys.
        </p>
      </div>

      {message && (
        <p
          className={`text-xs rounded-lg px-3 py-2 ${
            state === 'error' ? 'bg-coral-50 text-coral-700' : 'bg-teal-50 text-teal-800'
          }`}
        >
          {message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void checkForUpdate()}
          disabled={state === 'checking' || state === 'unsupported'}
        >
          {state === 'checking' ? 'Checking...' : 'Check updates'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => window.location.reload()}>
          Refresh app
        </Button>
      </div>
    </Card>
  );
}
