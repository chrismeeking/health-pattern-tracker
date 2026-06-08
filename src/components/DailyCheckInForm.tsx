import { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';

export type CheckInFormValues = {
  noSymptomsReported: boolean;
  mildBloatingPressure: boolean;
  indigestion: boolean;
  gas: boolean;
  painEpisode: boolean;
  nausea: boolean;
  headache: boolean;
  tiredness: boolean;
  other: boolean;
  sweating: boolean;
  vomiting: boolean;
  fever: boolean;
  diarrhoea: boolean;
  constipation: boolean;
  skinIssue: boolean;
  sleepAffected: boolean;
  stressLevel: number;
  energyLevel: number;
  notes: string;
  selectedIssueIds: string[];
};

interface ActiveIssue {
  id: string;
  name: string;
}

interface DailyCheckInFormProps {
  onSubmit: (values: CheckInFormValues) => void;
  onCancel?: () => void;
  activeIssues?: ActiveIssue[];
}

type SymptomKey =
  | 'noSymptoms'
  | 'mildBloatingPressure'
  | 'indigestion'
  | 'gas'
  | 'painEpisode'
  | 'nausea'
  | 'headache'
  | 'tiredness'
  | 'other';

const options: { key: SymptomKey; label: string }[] = [
  { key: 'noSymptoms', label: 'No symptoms' },
  { key: 'mildBloatingPressure', label: 'Mild bloating / pressure' },
  { key: 'indigestion', label: 'Indigestion' },
  { key: 'gas', label: 'Gas' },
  { key: 'painEpisode', label: 'Pain episode' },
  { key: 'nausea', label: 'Nausea' },
  { key: 'headache', label: 'Headache' },
  { key: 'tiredness', label: 'Tiredness' },
  { key: 'other', label: 'Other' },
];

export function DailyCheckInForm({ onSubmit, onCancel, activeIssues = [] }: DailyCheckInFormProps) {
  const [selected, setSelected] = useState<SymptomKey[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [stressLevel, setStressLevel] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [notes, setNotes] = useState('');

  const toggle = (key: SymptomKey) => {
    if (key === 'noSymptoms') {
      setSelected(['noSymptoms']);
      return;
    }
    setSelected((prev) => {
      const filtered = prev.filter((k) => k !== 'noSymptoms');
      return filtered.includes(key)
        ? filtered.filter((k) => k !== key)
        : [...filtered, key];
    });
  };

  const toggleIssue = (id: string) => {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;

    const noSymptoms = selected.includes('noSymptoms');
    onSubmit({
      noSymptomsReported: noSymptoms,
      mildBloatingPressure: selected.includes('mildBloatingPressure'),
      indigestion: selected.includes('indigestion'),
      gas: selected.includes('gas'),
      painEpisode: selected.includes('painEpisode'),
      nausea: selected.includes('nausea'),
      headache: selected.includes('headache'),
      tiredness: selected.includes('tiredness'),
      other: selected.includes('other'),
      sweating: false,
      vomiting: false,
      fever: false,
      diarrhoea: false,
      constipation: false,
      skinIssue: false,
      sleepAffected: false,
      stressLevel,
      energyLevel,
      notes,
      selectedIssueIds: selectedIssues,
    });
  };

  const buttonClass = (key: SymptomKey) => {
    const isSelected = selected.includes(key);
    if (!isSelected) {
      return 'w-full px-4 py-4 rounded-xl text-left text-sm font-medium min-h-[52px] bg-white border border-slate-200 text-slate-700 active:bg-slate-50';
    }
    if (key === 'noSymptoms') {
      return 'w-full px-4 py-4 rounded-xl text-left text-sm font-medium min-h-[52px] bg-sage-500 text-white';
    }
    return 'w-full px-4 py-4 rounded-xl text-left text-sm font-medium min-h-[52px] bg-teal-500 text-white';
  };

  const issueChipClass = (id: string) =>
    `px-3 py-2 rounded-xl text-sm font-medium min-h-[40px] ${
      selectedIssues.includes(id)
        ? 'bg-teal-500 text-white'
        : 'bg-slate-100 text-slate-600'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="space-y-1">
        <h2 className="font-medium text-slate-800">Any symptoms since your last check-in?</h2>
        <p className="text-xs text-slate-400">
          Recording normal days helps compare patterns over time.
        </p>
      </Card>

      <div className="grid gap-2">
        {options.map((opt) => (
          <button key={opt.key} type="button" onClick={() => toggle(opt.key)} className={buttonClass(opt.key)}>
            {opt.label}
          </button>
        ))}
      </div>

      {activeIssues.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Which issues apply today?</p>
          <div className="flex flex-wrap gap-2">
            {activeIssues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => toggleIssue(issue.id)}
                className={issueChipClass(issue.id)}
              >
                {issue.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!selected.includes('noSymptoms') && selected.length > 0 && (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Stress level</span>
              <span className="text-teal-600 font-medium">{stressLevel}/10</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              className="w-full accent-teal-500 h-3"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Energy level</span>
              <span className="text-teal-600 font-medium">{energyLevel}/10</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="w-full accent-teal-500 h-3"
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={selected.includes('other') ? 'Describe other symptoms...' : 'Optional notes'}
          className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" fullWidth size="lg" disabled={selected.length === 0}>
          Save check-in
        </Button>
      </div>
    </form>
  );
}
