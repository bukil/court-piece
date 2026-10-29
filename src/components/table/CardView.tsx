import React from 'react';
import type { Card } from '../../types/game';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface CardViewProps {
  card: Card;
  isPlayable?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isTrump?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isPlayable = false,
  isSelected = false,
  isDisabled = false,
  isTrump = false,
  size = 'md',
  onClick,
}) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit];

  const sizeStyles = {
    sm: 'w-12 h-18 text-xs rounded-lg',
    md: 'w-16 h-24 text-sm rounded-xl sm:w-20 sm:h-28 sm:text-base',
    lg: 'w-20 h-30 text-base rounded-2xl sm:w-24 sm:h-36 sm:text-lg',
  }[size];

  const interactiveClasses = isDisabled
    ? 'opacity-40 cursor-not-allowed'
    : isPlayable
    ? 'cursor-pointer hover:-translate-y-3 hover:shadow-xl'
    : 'cursor-default opacity-85';

  const auraClasses = isTrump
    ? 'ring-2 ring-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.6)] border-amber-300'
    : 'border-slate-300/80';

  const selectedClass = isSelected ? '-translate-y-5 ring-4 ring-white shadow-2xl z-20' : '';

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
      aria-label={`${card.rank} of ${card.suit}${isTrump ? ' (Trump)' : ''}${isPlayable ? ' (playable)' : ''}${isSelected ? ' (selected)' : ''}`}
      onClick={!isDisabled && isPlayable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      className={`relative select-none transition-all duration-200 transform bg-slate-50 border text-slate-900 shadow-md flex flex-col justify-between p-1.5 sm:p-2 font-mono font-bold ${sizeStyles} ${auraClasses} ${interactiveClasses} ${selectedClass}`}
    >
      {/* Trump golden spark indicator */}
      {isTrump && (
        <span
          title="Trump Card"
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] flex items-center justify-center font-black shadow-md z-10"
        >
          ★
        </span>
      )}

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
