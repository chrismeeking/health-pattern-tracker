import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

const variants = {
  primary: 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700',
  secondary: 'bg-sage-500 text-white hover:opacity-90',
  outline: 'border-2 border-teal-500 text-teal-500 hover:bg-teal-50',
  ghost: 'text-teal-500 hover:bg-teal-50',
  danger: 'bg-coral-500 text-white hover:opacity-90',
};

const sizes = {
  sm: 'px-3 py-2 text-sm rounded-lg min-h-[40px]',
  md: 'px-4 py-3 text-base rounded-xl min-h-[48px]',
  lg: 'px-6 py-4 text-lg rounded-xl min-h-[56px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
