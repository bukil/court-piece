import React from 'react';
import type { Card } from '../../types/game';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface CardViewProps {
  card: Card;
  isPlayable?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isPlayable = false,
  isSelected = false,
  isDisabled = false,
  size = 'md',
  onClick,
}) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit];

  const sizeStyles = {
    sm: 'w-12 h-18 text-xs rounded-md',
    md: 'w-16 h-24 text-sm rounded-lg sm:w-20 sm:h-28 sm:text-base',
    lg: 'w-20 h-30 text-base rounded-xl sm:w-24 sm:h-36 sm:text-lg',
  }[size];

  const interactiveClasses = isDisabled
    ? 'opacity-40 cursor-not-allowed'
    : isPlayable
    ? 'cursor-pointer hover:-translate-y-3 hover:shadow-xl hover:shadow-emerald-500/20 ring-2 ring-emerald-500/50'
    : 'cursor-default opacity-85';

  const selectedClass = isSelected ? '-translate-y-5 ring-4 ring-amber-400 shadow-2xl z-20' : '';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isPlayable && onClick && !isDisabled) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={isPlayable ? 'button' : undefined}
      tabIndex={isPlayable && !isDisabled ? 0 : -1}
      aria-label={`${card.rank} of ${card.suit}${isPlayable ? ' (playable)' : ''}${isSelected ? ' (selected)' : ''}`}
      onClick={!isDisabled && isPlayable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      className={`relative select-none transition-all duration-200 transform bg-slate-50 border border-slate-300 text-slate-900 shadow-md flex flex-col justify-between p-1.5 sm:p-2 font-mono font-bold ${sizeStyles} ${interactiveClasses} ${selectedClass}`}
    >
      {/* Top-left rank & suit */}
      <div className={`flex flex-col items-start leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        <span className="text-xs sm:text-sm font-black">{card.rank}</span>
        <span className="text-xs sm:text-sm">{symbol}</span>
      </div>

      {/* Center suit emblem */}
      <div
        className={`absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl pointer-events-none opacity-90 ${
          isRed ? 'text-rose-600' : 'text-slate-900'
        }`}
      >
        {symbol}
      </div>

      {/* Bottom-right inverted rank & suit */}
      <div
        className={`flex flex-col items-end leading-none rotate-180 ${
          isRed ? 'text-rose-600' : 'text-slate-900'
        }`}
      >
        <span className="text-xs sm:text-sm font-black">{card.rank}</span>
        <span className="text-xs sm:text-sm">{symbol}</span>
      </div>
    </div>
  );
};

