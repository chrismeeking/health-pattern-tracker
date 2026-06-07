import type { TriggerTag } from '@/types';
import { ALL_TRIGGER_TAGS, TRIGGER_TAG_LABELS } from '@/types';
import { cn } from '@/utils/helpers';

interface TriggerTagSelectorProps {
  selected: TriggerTag[];
  onChange: (tags: TriggerTag[]) => void;
}

export function TriggerTagSelector({ selected, onChange }: TriggerTagSelectorProps) {
  const toggle = (tag: TriggerTag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TRIGGER_TAGS.map((tag) => {
        const isSelected = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={cn(
              'px-3 py-2 rounded-full text-sm font-medium min-h-[40px] transition-colors',
              isSelected
                ? 'bg-teal-500 text-white'
                : 'bg-slate-100 text-slate-600 active:bg-slate-200'
            )}
          >
            {TRIGGER_TAG_LABELS[tag]}
          </button>
        );
      })}
    </div>
  );
}
