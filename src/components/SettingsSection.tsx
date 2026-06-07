import type { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium text-slate-700">{title}</h2>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
