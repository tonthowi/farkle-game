import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  // gold and link map to CSS classes directly
  if (variant === 'gold') {
    return (
      <button className={cn('btn-gold', className)} {...props}>
        {children}
      </button>
    );
  }

  if (variant === 'link') {
    return (
      <button className={cn('btn-link', className)} {...props}>
        {children}
      </button>
    );
  }

  // ghost maps to btn-ghost CSS class
  if (variant === 'ghost') {
    return (
      <button className={cn('btn-ghost', className)} {...props}>
        {children}
      </button>
    );
  }

  // primary → btn-gold, secondary → btn-ghost, danger → own styles
  const base = 'font-cinzel font-semibold rounded-sm border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 uppercase tracking-widest inline-flex items-center justify-center gap-2';

  const variants: Record<string, string> = {
    primary: 'btn-gold',
    secondary: 'btn-ghost',
    danger: 'bg-gradient-to-b from-[#c84545] to-[#5a1818] border-[#3a0808] text-parchment-bright hover:brightness-110',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-5 py-3 text-sm',
    lg: 'px-7 py-4 text-sm',
  };

  if (variant === 'primary' || variant === 'secondary') {
    return (
      <button className={cn(variants[variant], className)} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
