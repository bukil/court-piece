import { useDialogFocus } from '../../hooks/useDialogFocus';
import React, { useState } from 'react';
import type { Card, Suit, Player } from '../../types/game';
import { CardView } from './CardView';
import { sortHand, SUIT_SYMBOLS, SUITS } from '../../game-engine/utils/deck';
interface TrumpSelectionModalProps { isOpen: boolean; isCaller: boolean; callerPlayer: Player | null; callerCards: Card[]; onSelectTrump: (suit: Suit) => Promise<void>; }
export const TrumpSelectionModal: React.FC<TrumpSelectionModalProps> = ({ isOpen, isCaller, callerPlayer, callerCards, onSelectTrump }) => {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialogFocus(isOpen && isCaller);
  if (!isOpen) return null;
  // Waiting players can keep chatting while the caller decides.
  if (!isCaller) return <div className="trump-waiting" role="status">{callerPlayer?.nickname ?? 'The caller'} is choosing trump.</div>;
  const confirm = async () => {
    if (!selectedSuit || isSubmitting) return;
    setIsSubmitting(true); setError(null);
    try { await onSelectTrump(selectedSuit); }
    catch (err) { setError(err instanceof Error ? err.message : 'Couldn’t set trump. Try again.'); setIsSubmitting(false); }
  };
  return <div ref={dialogRef} tabIndex={-1} aria-labelledby="trump-title" aria-describedby="trump-explained" className="trump-dialog-backdrop" role="dialog" aria-modal="true">
    <div className="trump-dialog">
      <h2 id="trump-title">Your call. Choose trump.</h2>
      <p id="trump-explained">Trump beats every other suit. You can play it when you have no cards in the suit being led.</p>
      <div className="trump-preview">{sortHand(callerCards.slice(0, 5)).map(card => <CardView key={card.id} card={card} isTrump={card.suit === selectedSuit} size="sm" />)}</div>
      <div className="trump-options" aria-label="Choose the trump suit">{SUITS.map(suit => <button key={suit} disabled={isSubmitting} onClick={() => setSelectedSuit(suit)} aria-pressed={selectedSuit === suit} className={`trump-option suit-${suit}`}><span aria-hidden="true">{SUIT_SYMBOLS[suit]}</span><span>{suit}</span>{selectedSuit === suit && <b aria-hidden="true">✓</b>}</button>)}</div>
      {error && <p className="chat-error" role="alert">{error}</p>}
      <button className="primary-action trump-confirm" disabled={!selectedSuit || isSubmitting} onClick={() => void confirm()}>{isSubmitting ? 'Dealing the rest…' : selectedSuit ? `Make ${selectedSuit} trump` : 'Select a suit above'}</button>
    </div>
  </div>;
};
