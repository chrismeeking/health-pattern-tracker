interface PainSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function PainSlider({ value, onChange, label = 'Pain score' }: PainSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-semibold text-teal-600">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>None</span>
        <span>Severe</span>
      </div>
    </div>
  );
}
