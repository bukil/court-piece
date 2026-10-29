import React, { useState } from 'react';
import type { Card, Suit, Player } from '../../types/game';
import { CardView } from './CardView';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface TrumpSelectionModalProps {
  isOpen: boolean;
  isCaller: boolean;
  callerPlayer: Player | null;
  callerCards: Card[];
  onSelectTrump: (suit: Suit) => Promise<void>;
}

export const TrumpSelectionModal: React.FC<TrumpSelectionModalProps> = ({
  isOpen,
  isCaller,
  callerPlayer,
  callerCards,
  onSelectTrump,
}) => {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const suits: { suit: Suit; label: string; symbol: string; color: string }[] = [
    { suit: 'spades', label: 'Spades', symbol: SUIT_SYMBOLS.spades, color: 'text-white' },
    { suit: 'hearts', label: 'Hearts', symbol: SUIT_SYMBOLS.hearts, color: 'text-rose-500' },
    { suit: 'diamonds', label: 'Diamonds', symbol: SUIT_SYMBOLS.diamonds, color: 'text-amber-500' },
    { suit: 'clubs', label: 'Clubs', symbol: SUIT_SYMBOLS.clubs, color: 'text-white' },
  ];

  const handlePick = async (suit: Suit) => {
    if (isSubmitting) return;
    setSelectedSuit(suit);
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSelectTrump(suit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error setting trump';
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm bg-neutral-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl text-center backdrop-blur-2xl">
        {isCaller ? (
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white/90 mb-4">
              Choose Trump
            </h2>

            {/* Initial 5 Cards */}
            <div className="flex justify-center -space-x-3 mb-6">
              {callerCards.slice(0, 5).map((card) => (
                <div key={card.id} className="transition-transform hover:-translate-y-1">
                  <CardView card={card} size="sm" />
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="mb-3 text-xs text-rose-400 font-medium">
                {errorMsg}
              </div>
            )}

            {/* 4 Apple-style Suit buttons */}
            <div className="grid grid-cols-4 gap-2">
              {suits.map((item) => {
                const isSelected = selectedSuit === item.suit && isSubmitting;
                return (
                  <button
                    key={item.suit}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handlePick(item.suit)}
                    className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-white/20 border-white text-white shadow-lg'
                        : 'bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.1] hover:border-white/20'
                    }`}
                  >
                    <span className={`text-2xl ${item.color} leading-none mb-1`}>
                      {item.symbol}
                    </span>
                    <span className="text-[10px] font-medium tracking-wide text-white/70">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Waiting for {callerPlayer?.nickname || 'Caller'} to choose trump</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
