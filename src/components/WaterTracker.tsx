import { useRef, useState } from 'react';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { Button } from './Button';

interface WaterTrackerProps {
  currentMl: number;
  targetMl?: number;
  onAdd: (amount: number) => void;
  showTitle?: boolean;
}

const QUICK_AMOUNTS = [250, 500, 750];
const ADD_COOLDOWN_MS = 1200;

export function WaterTracker({
  currentMl,
  targetMl = 2000,
  onAdd,
  showTitle = true,
}: WaterTrackerProps) {
  const lastAddRef = useRef(0);
  const [cooldown, setCooldown] = useState(false);

  const handleAdd = (amount: number) => {
    const now = Date.now();
    if (now - lastAddRef.current < ADD_COOLDOWN_MS) return;
    lastAddRef.current = now;
    setCooldown(true);
    onAdd(amount);
    window.setTimeout(() => setCooldown(false), ADD_COOLDOWN_MS);
  };

  return (
    <Card className="space-y-3">
      {showTitle && (
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-slate-600">Water today</h3>
          <span className="text-lg font-semibold text-teal-600">{currentMl}ml</span>
        </div>
      )}
      <ProgressBar value={currentMl} max={targetMl} showValues unit="ml" color="teal" />
      <div className="grid grid-cols-3 gap-2">
        {QUICK_AMOUNTS.map((amt) => (
          <Button
            key={amt}
            variant="outline"
            size="sm"
            disabled={cooldown}
            onClick={() => handleAdd(amt)}
          >
            +{amt}ml
          </Button>
        ))}
      </div>
    </Card>
  );
}
