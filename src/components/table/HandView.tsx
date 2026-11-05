import React, { useState, useRef } from 'react';
import type { Card } from '../../types/game';
import { CardView } from './CardView';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface HandViewProps {
  cards: Card[];
  isMyTurn: boolean;
  leadSuit?: Card['suit'];
  trumpSuit?: Card['suit'] | null;
  onPlayCard: (card: Card) => void;
  isLoading?: boolean;
}

export const HandView: React.FC<HandViewProps> = ({ cards, isMyTurn, leadSuit, trumpSuit, onPlayCard, isLoading = false }) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; y: number } | null>(null);
  const pointerStart = useRef<{ id: string; y: number } | null>(null);
  const suppressClick = useRef(false);
  const hasLeadSuit = !!leadSuit && cards.some(c => c.suit === leadSuit);
  const playable = (card: Card) => isMyTurn && !isLoading && (!hasLeadSuit || card.suit === leadSuit);
  const selected = cards.find(c => c.id === selectedCardId && playable(c));
  const executePlay = (card: Card) => {
    if (!playable(card)) return;
    setSelectedCardId(null);
    setDrag(null);
    onPlayCard(card);
  };
  return (
    <div className="player-hand">
      <div className="hand-meta"><span>Your hand <b>{cards.length}</b></span><span>{isLoading ? 'Playing your card…' : isMyTurn ? hasLeadSuit ? `Follow ${SUIT_SYMBOLS[leadSuit!]} ${leadSuit}` : 'Choose any card' : 'Take a moment. Plan your next move.'}</span></div>
      <div className="hand-scroll">
        <div className="hand-fan" style={{ '--card-count': cards.length } as React.CSSProperties}>
          {cards.map((card, idx) => (
            <div key={card.id} className={`hand-card${selected?.id === card.id ? ' hand-card-selected' : ''}`}
              style={{ '--deal-delay': `${idx * 28}ms`, ...(drag?.id === card.id ? { translate: `0 ${drag.y}px` } : {}) } as React.CSSProperties}
              onPointerDown={e => {
                suppressClick.current = false;
                if (!playable(card) || e.button !== 0) return;
                pointerStart.current = { id: card.id, y: e.clientY };
                e.currentTarget.querySelector('button')?.setPointerCapture(e.pointerId);
              }}
              onPointerMove={e => {
                if (pointerStart.current?.id !== card.id) return;
                const y = Math.min(0, Math.max(-110, e.clientY - pointerStart.current.y));
                if (y < -8) setDrag({ id: card.id, y });
              }}
              onPointerUp={e => {
                if (pointerStart.current?.id === card.id) {
                  const distance = e.clientY - pointerStart.current.y;
                  pointerStart.current = null;
                  setDrag(null);
                  if (distance < -45) { suppressClick.current = true; executePlay(card); }
                }
              }}
              onPointerCancel={() => { pointerStart.current = null; setDrag(null); }}>
              <CardView card={card} isPlayable={playable(card)} isSelected={selected?.id === card.id}
                isTrump={!!trumpSuit && card.suit === trumpSuit} isDisabled={isLoading || (isMyTurn && !playable(card))}
                onClick={() => {
                  if (suppressClick.current) { suppressClick.current = false; return; }
                  if (selected?.id === card.id) executePlay(card);
                  else setSelectedCardId(card.id);
                }} />
            </div>
          ))}
        </div>
      </div>
      <div className="hand-action">
        {selected ? <><button className="primary-action" disabled={isLoading} onClick={() => executePlay(selected)}>Play {selected.rank} {SUIT_SYMBOLS[selected.suit]} <span aria-hidden="true">↗</span></button><button className="quiet-action" onClick={() => setSelectedCardId(null)}>Cancel</button></>
        : <span>{isMyTurn ? 'Select a card, then play. Or swipe it toward the table.' : 'Your playable cards will light up when it’s your turn.'}</span>}
      </div>
    </div>
  );
};
