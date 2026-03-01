import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const base = 'font-cinzel font-semibold rounded-lg border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95';

  const variants = {
    primary: 'bg-gold text-wood-dark border-gold-bright hover:bg-gold-bright shadow-lg hover:shadow-gold/30',
    secondary: 'bg-wood text-parchment border-wood-light hover:bg-wood-light hover:border-parchment-dim',
    danger: 'bg-danger text-white border-danger-light hover:bg-danger-light',
    ghost: 'bg-transparent text-parchment-dim border-transparent hover:text-parchment hover:bg-wood/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
