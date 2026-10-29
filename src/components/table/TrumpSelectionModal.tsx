import React, { useState } from 'react';
import type { Card, Suit, Player } from '../../types/game';
import { CardView } from './CardView';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';
import { Button } from '../common/Button';

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

  const suits: { suit: Suit; label: string; symbol: string; color: string; bg: string }[] = [
    { suit: 'spades', label: 'Spades', symbol: SUIT_SYMBOLS.spades, color: 'text-slate-100', bg: 'hover:border-slate-400 bg-slate-900/90' },
    { suit: 'hearts', label: 'Hearts', symbol: SUIT_SYMBOLS.hearts, color: 'text-rose-500', bg: 'hover:border-rose-400 bg-rose-950/40' },
    { suit: 'diamonds', label: 'Diamonds', symbol: SUIT_SYMBOLS.diamonds, color: 'text-orange-500', bg: 'hover:border-orange-400 bg-orange-950/40' },
    { suit: 'clubs', label: 'Clubs', symbol: SUIT_SYMBOLS.clubs, color: 'text-slate-100', bg: 'hover:border-slate-400 bg-slate-900/90' },
  ];

  const handleConfirm = async () => {
    if (!selectedSuit) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSelectTrump(selectedSuit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set trump.';
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trump-selection-title"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 text-center">
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {isCaller ? (
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold uppercase tracking-wider mb-3">
              👑 You Are The Trump Caller
            </div>

            <h2 id="trump-selection-title" className="text-2xl sm:text-3xl font-black font-mono text-white mb-2">
              Select Trump Suit
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
              Review your initial 5 cards below. Choose which suit will be Trump for this deal. You will lead the first trick.
            </p>

            {/* Initial 5 Cards */}
            <div className="flex justify-center -space-x-3 sm:-space-x-4 mb-8">
              {callerCards.slice(0, 5).map((card) => (
                <div key={card.id} className="transition-transform hover:-translate-y-2">
                  <CardView card={card} size="sm" />
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-200 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* 4 Large Suit Selection Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {suits.map((item) => {
                const isSelected = selectedSuit === item.suit;
                return (
                  <button
                    key={item.suit}
                    type="button"
                    onClick={() => setSelectedSuit(item.suit)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      item.bg
                    } ${
                      isSelected
                        ? 'border-amber-400 ring-4 ring-amber-400/20 scale-105 shadow-xl'
                        : 'border-slate-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className={`text-3xl sm:text-4xl ${item.color} mb-1 leading-none`}>
                      {item.symbol}
                    </span>
                    <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-200">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="accent"
              size="lg"
              disabled={!selectedSuit}
              isLoading={isSubmitting}
              onClick={handleConfirm}
              className="w-full text-base py-3 font-black"
            >
              {selectedSuit
                ? `Confirm ${selectedSuit.toUpperCase()} as Trump`
                : 'Select a Suit Above'}
            </Button>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl mb-4 animate-bounce">
              🃏
            </div>

            <h2 id="trump-selection-title" className="text-xl sm:text-2xl font-black font-mono text-white mb-2">
              Trump Selection In Progress
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
              Waiting for <strong className="text-amber-300 font-bold">{callerPlayer?.nickname || 'Trump Caller'}</strong> to evaluate their initial 5 cards and select Trump...
            </p>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Deal will proceed automatically once selected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

