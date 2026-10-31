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
    sm: 'w-11 h-16 text-xs rounded-md',
    md: 'w-15 h-22 text-xs sm:w-18 sm:h-26 sm:text-sm rounded-lg',
    lg: 'w-20 h-28 text-sm sm:w-22 sm:h-32 sm:text-base rounded-xl',
  }[size];

  const interactiveClasses = isDisabled
    ? 'opacity-40 cursor-not-allowed'
    : isPlayable
    ? 'cursor-pointer hover:-translate-y-2'
    : 'cursor-default opacity-90';

  const trumpClasses = isTrump
    ? 'bg-white border-amber-400 ring-1 ring-amber-400/60'
    : 'bg-white border-neutral-300';

  const selectedClass = isSelected ? '-translate-y-4 ring-2 ring-white z-20' : '';

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
      className={`relative select-none transition-transform duration-150 transform border text-neutral-900 flex flex-col justify-between p-1.5 font-medium ${sizeStyles} ${trumpClasses} ${interactiveClasses} ${selectedClass}`}
    >
      {/* Trump badge */}
      {isTrump && (
        <span
          title="Trump"
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-black text-[9px] font-bold flex items-center justify-center leading-none"
        >
          T
        </span>
      )}

      {/* Top-left rank & suit */}
      <div className={`flex flex-col items-start leading-none font-semibold ${isRed ? 'text-[#c22026]' : 'text-[#1a1a1a]'}`}>
        <span>{card.rank}</span>
        <span className="text-[11px] sm:text-xs">{symbol}</span>
      </div>

      {/* Center suit emblem */}
      <div
        className={`absolute inset-0 flex items-center justify-center text-xl sm:text-2xl pointer-events-none opacity-80 ${
          isRed ? 'text-[#c22026]' : 'text-[#1a1a1a]'
        }`}
      >
        {symbol}
      </div>

      {/* Bottom-right inverted rank & suit */}
      <div
        className={`flex flex-col items-end leading-none font-semibold rotate-180 ${
          isRed ? 'text-[#c22026]' : 'text-[#1a1a1a]'
        }`}
      >
        <span>{card.rank}</span>
        <span className="text-[11px] sm:text-xs">{symbol}</span>
      </div>
    </div>
  );
};
