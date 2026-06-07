import type { SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'meals'
  | 'plus'
  | 'insights'
  | 'settings'
  | 'health'
  | 'issues'
  | 'check'
  | 'symptom';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

const paths: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
  meals: 'M7 3v8M5 3v8M9 3v8M5 11h4v10M17 3v18M14 3h6v8a3 3 0 0 1-3 3',
  plus: 'M12 5v14M5 12h14',
  insights: 'M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-.9.7-1.5 1.7-1.8 3H9.8C9.5 15.7 8.9 14.7 8 14Z',
  settings: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5ZM19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05-2.12 2.12-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.09 1.65V21h-3v-.07a1.8 1.8 0 0 0-1.09-1.65 1.8 1.8 0 0 0-1.98.36l-.05.05-2.12-2.12.05-.05A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.65-1.09H3v-3h.07A1.8 1.8 0 0 0 4.72 9.8a1.8 1.8 0 0 0-.36-1.98l-.05-.05 2.12-2.12.05.05a1.8 1.8 0 0 0 1.98.36 1.8 1.8 0 0 0 1.09-1.65V4h3v.07a1.8 1.8 0 0 0 1.09 1.65 1.8 1.8 0 0 0 1.98-.36l.05-.05 2.12 2.12-.05.05a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.65 1.09H21v3h-.07A1.8 1.8 0 0 0 19.4 15Z',
  health: 'M20.8 8.6c0 5.4-8.8 10.6-8.8 10.6S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 1.9Z',
  issues: 'M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21l-2 2-5.1-5.2A7.5 7.5 0 0 1 10.5 18Z',
  check: 'M20 6 9 17l-5-5',
  symptom: 'M8 3v6a4 4 0 0 0 8 0V3M6 21h12M12 13v8',
};

export function Icon({ name, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
