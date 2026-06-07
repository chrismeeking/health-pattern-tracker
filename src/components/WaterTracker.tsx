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

export function WaterTracker({
  currentMl,
  targetMl = 2000,
  onAdd,
  showTitle = true,
}: WaterTrackerProps) {
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
          <Button key={amt} variant="outline" size="sm" onClick={() => onAdd(amt)}>
            +{amt}ml
          </Button>
        ))}
      </div>
    </Card>
  );
}
