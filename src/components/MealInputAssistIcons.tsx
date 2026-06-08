import type { ReactNode } from 'react';

interface AssistIconButtonProps {
  label: string;
  title: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function AssistIconButton({
  label,
  title,
  active,
  onClick,
  children,
}: AssistIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={onClick}
      className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${
        active
          ? 'border-teal-500 bg-teal-500 text-white'
          : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-teal-600'
      }`}
    >
      {children}
    </button>
  );
}

export function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="w-5 h-5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 8.25h10.5M6.75 8.25A2.25 2.25 0 0 0 4.5 10.5v7.5a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 18V10.5a2.25 2.25 0 0 0-2.25-2.25H6.75ZM12 15.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
      />
    </svg>
  );
}

export function BarcodeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="w-5 h-5"
      aria-hidden
    >
      <path strokeLinecap="round" d="M4 7v10M7 7v10M10 7v10M13 7v4M16 7v10M19 7v10M22 7v10" />
    </svg>
  );
}
