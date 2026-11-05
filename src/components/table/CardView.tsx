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

export const CardView: React.FC<CardViewProps> = React.memo(({
  card, isPlayable = false, isSelected = false, isDisabled = false,
  isTrump = false, size = 'md', onClick,
}) => {
  const symbol = SUIT_SYMBOLS[card.suit];
  const content = <>
    <span className="card-corner"><b>{card.rank}</b><span>{symbol}</span></span>
    <span className="card-emblem" aria-hidden="true">{symbol}</span>

    <span className="card-corner card-corner-bottom" aria-hidden="true"><b>{card.rank}</b><span>{symbol}</span></span>
    {isTrump && <span className="card-trump" title="Trump suit" aria-hidden="true">◆</span>}
  </>;
  const className = `playing-card card-${size} suit-${card.suit}${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}${isPlayable ? ' is-playable' : ''}${isTrump ? ' is-trump' : ''}`;
  const label = `${card.rank} of ${card.suit}${isTrump ? ', trump' : ''}${isSelected ? ', selected' : ''}`;
  return onClick ? (
    <button type="button" className={className} disabled={isDisabled || !isPlayable} aria-label={label} aria-pressed={isSelected} onClick={onClick}>{content}</button>
  ) : <div className={className} aria-label={label}>{content}</div>;
});
