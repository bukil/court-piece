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
    sm: isHorizontal ? 'w-13 h-9' : 'w-9 h-13',
    md: isHorizontal ? 'w-16 h-11 sm:w-18 sm:h-13' : 'w-11 h-16 sm:w-13 sm:h-18',
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Stack depth if multiple cards held */}
      {count > 1 && (
        <div
          className={`absolute translate-x-1 translate-y-1 bg-[#1e232d] border border-neutral-700 rounded-lg ${sizeClasses}`}
        />
      )}

      {/* Primary physical card back */}
      <div
        className={`relative select-none rounded-lg bg-[#18202f] border border-neutral-700 flex items-center justify-center overflow-hidden ${sizeClasses}`}
      >
        {/* Subtle classic card inner frame */}
        <div className="absolute inset-1 border border-neutral-600/40 rounded pointer-events-none" />
        <div className="absolute inset-2 border border-neutral-600/20 rounded pointer-events-none" />

        {/* Card count */}
        {count > 0 && (
          <span className="relative z-10 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/80 text-white/90">
            {count}
          </span>
        )}
      </div>
    </div>
  );
};
