import { Link } from 'react-router-dom';
import type { ProfileSetupStatus } from '@/utils/profileSetup';
import { getSetupTierLabel } from '@/utils/profileSetup';
import { Card } from './Card';
import { Button } from './Button';

interface SetupGuideCardProps {
  setup: ProfileSetupStatus;
  profileName: string;
}

export function SetupGuideCard({ setup, profileName }: SetupGuideCardProps) {
  if (setup.tier === 'complete' || setup.nextSteps.length === 0) return null;

  return (
    <Card className="border-dashed border-teal-200 bg-teal-50/50 space-y-3 dark:border-teal-800 dark:bg-teal-950/30">
      <div>
        <p className="text-xs font-medium text-teal-700 uppercase tracking-wide dark:text-teal-300">
          {getSetupTierLabel(setup.tier)}
        </p>
        <p className="text-sm text-slate-700 mt-1 dark:text-slate-200">
          Finish setting up {profileName}&apos;s tracker for a richer home dashboard.
        </p>
      </div>
      <div className="space-y-2">
        {setup.nextSteps.map((step) => (
          <Link key={step.id} to={step.to}>
            <Button variant="outline" fullWidth size="sm">
              {step.label}
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  );
}
