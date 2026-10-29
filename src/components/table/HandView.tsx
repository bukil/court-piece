import React, { useState, useRef } from 'react';
import type { Card } from '../../types/game';
import { CardView } from './CardView';

interface HandViewProps {
  cards: Card[];
  isMyTurn: boolean;
  leadSuit?: Card['suit'];
  trumpSuit?: Card['suit'] | null;
  onPlayCard: (card: Card) => void;
  isLoading?: boolean;
}

export const HandView: React.FC<HandViewProps> = ({
  cards,
  isMyTurn,
  leadSuit,
  trumpSuit,
  onPlayCard,
  isLoading = false,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);

  const dragStartYRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  // Check if player holds the led suit
  const hasLeadSuit = leadSuit ? cards.some((c) => c.suit === leadSuit) : false;

  const isCardPlayable = (card: Card): { playable: boolean; reason?: string } => {
    if (!isMyTurn) {
      return { playable: false };
    }
    if (leadSuit && card.suit !== leadSuit && hasLeadSuit) {
      return { playable: false, reason: `Must follow ${leadSuit}` };
    }
    return { playable: true };
  };

  const executePlay = (card: Card) => {
    const check = isCardPlayable(card);
    if (!check.playable) {
      if (check.reason) {
        setValidationError(check.reason);
        setTimeout(() => setValidationError(null), 2500);
      }
      return;
    }
    setValidationError(null);
    setSelectedCardId(null);
    setDragCardId(null);
    setDragOffsetY(0);
    onPlayCard(card);
  };

  // Touch gesture handling (slide/swipe up or double-tap)
  const handleTouchStart = (card: Card, e: React.TouchEvent) => {
    if (!isMyTurn || isLoading) return;
    dragStartYRef.current = e.touches[0].clientY;
    setDragCardId(card.id);
    setDragOffsetY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragCardId || dragStartYRef.current === null) return;
    const diffY = e.touches[0].clientY - dragStartYRef.current;
    if (diffY < 0) {
      // Swiping upward towards table
      setDragOffsetY(Math.max(diffY, -120));
    } else {
      setDragOffsetY(0);
    }
  };

  const handleTouchEnd = (card: Card) => {
    if (dragCardId === card.id && dragOffsetY < -45) {
      // Swiped up past threshold -> play card!
      executePlay(card);
      dragStartYRef.current = null;
      return;
    }

    setDragCardId(null);
    setDragOffsetY(0);
    dragStartYRef.current = null;

    // Double-tap detection (< 350ms on same card)
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === card.id && now - lastTapRef.current.time < 350) {
      lastTapRef.current = null;
      executePlay(card);
      return;
    }
    lastTapRef.current = { id: card.id, time: now };

    // Single tap toggles selection
    const check = isCardPlayable(card);
    if (!check.playable) {
      if (check.reason) {
        setValidationError(check.reason);
        setTimeout(() => setValidationError(null), 2500);
      }
      return;
    }
    setSelectedCardId((prev) => (prev === card.id ? null : card.id));
  };

  // Mouse click handling (click to select, second click or double click plays)
  const handleCardClick = (card: Card) => {
    if (isLoading) return;
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === card.id && now - lastTapRef.current.time < 400) {
      lastTapRef.current = null;
      executePlay(card);
      return;
    }
    lastTapRef.current = { id: card.id, time: now };

    const check = isCardPlayable(card);
    if (!check.playable) {
      if (check.reason) {
        setValidationError(check.reason);
        setTimeout(() => setValidationError(null), 2500);
      }
      return;
    }

    if (selectedCardId === card.id) {
      executePlay(card);
    } else {
      setSelectedCardId(card.id);
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Validation feedback */}
      {validationError && (
        <div className="mb-1 text-xs text-rose-400 font-medium animate-fade-in">
          {validationError}
        </div>
      )}

      {/* Cards fan container */}
      <div className="w-full overflow-x-auto pb-3 pt-2 px-2 flex justify-center no-scrollbar">
        <div className="flex items-end -space-x-3 sm:-space-x-4 md:-space-x-5 transition-all">
          {cards.map((card, idx) => {
            const check = isCardPlayable(card);
            const isSelected = selectedCardId === card.id;
            const isBeingDragged = dragCardId === card.id;
            const isTrump = Boolean(trumpSuit && card.suit === trumpSuit);

            const dragStyle: React.CSSProperties = isBeingDragged && dragOffsetY !== 0
              ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' }
              : {};

            return (
              <div
                key={card.id}
                style={{
                  animationDelay: `${idx * 40}ms`,
                  ...dragStyle,
                }}
                onTouchStart={(e) => handleTouchStart(card, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(card)}
                className="animate-deal-fly transition-transform duration-150 touch-none"
              >
                <CardView
                  card={card}
                  isPlayable={check.playable}
                  isSelected={isSelected}
                  isTrump={isTrump}
                  isDisabled={!isMyTurn}
                  size="md"
                  onClick={() => handleCardClick(card)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Play button when a card is selected */}
      {selectedCardId && isMyTurn && (
        <div className="mt-1 flex items-center gap-2 animate-fade-in">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              const card = cards.find((c) => c.id === selectedCardId);
              if (card) executePlay(card);
            }}
            className="px-5 py-1.5 rounded-full bg-white text-black font-medium text-xs hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isLoading ? '...' : 'Play Card'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCardId(null)}
            className="px-3 py-1.5 rounded-full text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
