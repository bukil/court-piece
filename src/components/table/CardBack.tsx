import React from 'react';

interface CardBackProps {
  count?: number;
  size?: 'sm' | 'md';
  orientation?: 'horizontal' | 'vertical';
}

export const CardBack: React.FC<CardBackProps> = ({
  count = 1,
  size = 'md',
  orientation = 'vertical',
}) => {
  const isHorizontal = orientation === 'horizontal';

  const sizeClasses = {
    sm: isHorizontal ? 'w-14 h-10' : 'w-10 h-14',
    md: isHorizontal ? 'w-18 h-12 sm:w-20 sm:h-14' : 'w-12 h-18 sm:w-16 sm:h-24',
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Subtle stacked card behind if count > 1 */}
      {count > 1 && (
        <div
          className={`absolute translate-x-1 translate-y-1 bg-indigo-950 border border-indigo-700/60 rounded-lg shadow-sm ${sizeClasses}`}
        />
      )}

      {/* Main card back */}
      <div
        className={`relative select-none rounded-lg bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/40 shadow-md flex items-center justify-center overflow-hidden ${sizeClasses}`}
      >
        {/* Geometric crosshatch pattern */}
        <div
          className="absolute inset-1 border border-indigo-400/20 rounded opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(165, 180, 252, 0.25) 1px, transparent 1px)',
            backgroundSize: '6px 6px',
          }}
        />

        {/* Card count badge */}
        {count > 0 && (
          <span className="relative z-10 text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-900/90 text-indigo-200 border border-indigo-500/30">
            {count}
          </span>
        )}
      </div>
    </div>
  );
};

