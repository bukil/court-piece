import React, { useState } from 'react';
import type { Card } from '../../types/game';
import { CardView } from './CardView';
import { Button } from '../common/Button';

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
      return { playable: false, reason: 'Waiting for your turn' };
    }
    if (leadSuit && card.suit !== leadSuit && hasLeadSuit) {
      return { playable: false, reason: `Must follow lead suit (${leadSuit})` };
    }
    return { playable: true };
  };

  const handleCardClick = (card: Card) => {
    const check = isCardPlayable(card);
    if (!check.playable) {
      setValidationError(check.reason || 'Cannot play this card.');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    setValidationError(null);
    if (selectedCardId === card.id) {
      // Double click / second tap plays immediately
      onPlayCard(card);
      setSelectedCardId(null);
    } else {
      setSelectedCardId(card.id);
    }
  };

  const handlePlaySelected = () => {
    if (!selectedCardId) return;
    const card = cards.find((c) => c.id === selectedCardId);
    if (!card) return;
    onPlayCard(card);
    setSelectedCardId(null);
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Turn banner & Validation notice */}
      <div className="flex items-center gap-3 mb-2 h-7">
        {validationError && (
          <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-950/90 text-rose-300 border border-rose-500/40 animate-bounce">
            ⚠️ {validationError}
          </div>
        )}
        {!validationError && isMyTurn && (
          <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            YOUR TURN — Select a card to play
          </div>
        )}
        {!validationError && !isMyTurn && (
          <div className="text-xs text-slate-400">
            Waiting for other players...
          </div>
        )}
      </div>

      {/* Cards row / fan container */}
      <div className="w-full overflow-x-auto pb-4 pt-4 px-2 flex justify-center no-scrollbar">
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

      {/* Action bar when a card is selected */}
      {selectedCard && isMyTurn && (
        <div className="mt-1 flex items-center gap-3 animate-fade-in">
          <Button
            variant="accent"
            size="md"
            isLoading={isLoading}
            onClick={handlePlaySelected}
          >
            Play {selectedCard.rank} of {selectedCard.suit}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCardId(null)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

