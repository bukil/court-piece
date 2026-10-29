import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  }[size];

  const variantClasses = {
    emerald: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-950/70 text-amber-300 border border-amber-500/30',
    blue: 'bg-blue-950/70 text-blue-300 border border-blue-500/30',
    rose: 'bg-rose-950/70 text-rose-300 border border-rose-500/30',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

