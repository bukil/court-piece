import React, { useState } from 'react';
import type { Card } from '../../types/game';
import { CardView } from './CardView';

interface HandViewProps {
  cards: Card[];
  isMyTurn: boolean;
  leadSuit?: Card['suit'];
  onPlayCard: (card: Card) => void;
  isLoading?: boolean;
}

export const HandView: React.FC<HandViewProps> = ({
  cards,
  isMyTurn,
  leadSuit,
  onPlayCard,
  isLoading = false,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if player holds the lead suit
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

  const handleCardClick = (card: Card) => {
    if (isLoading) return;
    const check = isCardPlayable(card);
    if (!check.playable) {
      if (check.reason) {
        setValidationError(check.reason);
        setTimeout(() => setValidationError(null), 2500);
      }
      return;
    }

    setValidationError(null);
    if (selectedCardId === card.id) {
      // Second tap plays immediately
      onPlayCard(card);
      setSelectedCardId(null);
    } else {
      setSelectedCardId(card.id);
    }
  };

  const handlePlaySelected = () => {
    if (!selectedCardId || isLoading) return;
    const card = cards.find((c) => c.id === selectedCardId);
    if (!card) return;
    onPlayCard(card);
    setSelectedCardId(null);
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Subtle feedback if non-playable card tapped */}
      {validationError && (
        <div className="mb-1 text-xs text-rose-400 font-medium animate-fade-in">
          {validationError}
        </div>
      )}

      {/* Cards fan container */}
      <div className="w-full overflow-x-auto pb-3 pt-2 px-2 flex justify-center no-scrollbar">
        <div className="flex items-end -space-x-3 sm:-space-x-4 md:-space-x-5 transition-all">
          {cards.map((card) => {
            const check = isCardPlayable(card);
            const isSelected = selectedCardId === card.id;

            return (
              <div key={card.id} className="transition-transform duration-150">
                <CardView
                  card={card}
                  isPlayable={check.playable}
                  isSelected={isSelected}
                  isDisabled={!isMyTurn}
                  size="md"
                  onClick={() => handleCardClick(card)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Sleek action button when a card is lifted */}
      {selectedCardId && isMyTurn && (
        <div className="mt-1 flex items-center gap-2 animate-fade-in">
          <button
            type="button"
            disabled={isLoading}
            onClick={handlePlaySelected}
            className="px-5 py-2 rounded-full bg-white text-black font-medium text-xs hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isLoading ? '...' : 'Play Card'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCardId(null)}
            className="px-3 py-2 rounded-full text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
