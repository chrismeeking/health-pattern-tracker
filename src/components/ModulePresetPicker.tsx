import type { ProfileModule } from '@/types';
import { MODULE_LABELS } from '@/types';
import {
  ALL_PROFILE_MODULES,
  detectPreset,
  MODULE_PRESETS,
  normalizeEnabledModules,
  toggleModuleList,
  type ModulePresetId,
} from '@/utils/profileModules';

interface ModulePresetPickerProps {
  modules: ProfileModule[];
  onChange: (modules: ProfileModule[]) => void;
}

const HEALTH_PATTERN_MODULES: ProfileModule[] = ['healthIssues', 'digestive'];
const CUSTOM_MODULES = ALL_PROFILE_MODULES.filter(
  (mod) => !HEALTH_PATTERN_MODULES.includes(mod)
);

export function ModulePresetPicker({ modules, onChange }: ModulePresetPickerProps) {
  const activePreset = detectPreset(modules);
  const normalized = normalizeEnabledModules(modules);
  const healthPatternsOn = HEALTH_PATTERN_MODULES.every((mod) => normalized.includes(mod));

  const applyPreset = (presetId: ModulePresetId) => {
    if (presetId === 'custom') return;
    const preset = MODULE_PRESETS.find((p) => p.id === presetId);
    if (preset) onChange([...preset.modules]);
  };

  const toggle = (mod: ProfileModule) => {
    onChange(toggleModuleList(normalized, mod));
  };

  const toggleHealthPatterns = () => {
    if (healthPatternsOn) {
      onChange(normalized.filter((m) => !HEALTH_PATTERN_MODULES.includes(m)));
    } else {
      onChange(normalizeEnabledModules([...normalized, ...HEALTH_PATTERN_MODULES]));
    }
  };

  const chipClass = (selected: boolean) =>
    `px-3 py-2 rounded-xl text-xs min-h-[36px] ${
      selected
        ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-100'
        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
    }`;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-slate-500 mb-2 dark:text-slate-400">What do you want to track?</p>
        <div className="space-y-2">
          {MODULE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                activePreset === preset.id
                  ? 'border-teal-300 bg-teal-50 dark:border-teal-600 dark:bg-teal-500/10'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'
              }`}
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{preset.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2 dark:text-slate-400">
          Customise modules {activePreset === 'custom' ? '(custom)' : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleHealthPatterns}
            className={chipClass(healthPatternsOn)}
          >
            Health patterns
          </button>
          {CUSTOM_MODULES.map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => toggle(mod)}
              className={chipClass(normalized.includes(mod))}
            >
              {MODULE_LABELS[mod]}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2 dark:text-slate-500">
          Dashboard, quick links, and insights only show what you enable. You can change this anytime in Settings.
        </p>
      </div>
    </div>
  );
}
