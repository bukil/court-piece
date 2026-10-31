import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-full transition-transform transition-colors focus:outline-none focus:ring-1 focus:ring-white/40 active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-white text-black hover:bg-neutral-200 border border-transparent',
    secondary:
      'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10',
    accent:
      'bg-amber-400 hover:bg-amber-300 text-black font-semibold border border-transparent',
    danger:
      'bg-rose-900/60 hover:bg-rose-900/80 text-rose-200 border border-rose-700/40',
    ghost:
      'bg-transparent hover:bg-white/5 text-neutral-400 hover:text-white border border-transparent',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
