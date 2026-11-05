import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Card } from '../../types/game';
import { CardView } from './CardView';
import { sortHand, SUIT_SYMBOLS } from '../../game-engine/utils/deck';
import type { CardPlayOrigin } from '../../hooks/useCardPlay';

interface HandViewProps {
  cards: Card[]; isMyTurn: boolean; leadSuit?: Card['suit']; trumpSuit?: Card['suit'] | null;
  onPlayCard: (card: Card, origin?: CardPlayOrigin) => void;
  isLoading?: boolean; reactionControl?: React.ReactNode;
}
interface DragSession {
  id: string; pointerId: number; x: number; y: number; started: number;
  moved: boolean; node: HTMLElement; capture: HTMLElement;
}
export const HandView: React.FC<HandViewProps> = ({ cards, isMyTurn, leadSuit, trumpSuit, onPlayCard, isLoading = false, reactionControl }) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const gesture = useRef<DragSession | null>(null);
  const suppressClick = useRef<string | null>(null);
  const fan = useRef<HTMLDivElement>(null);
  const hand = sortHand(cards);
  const hasLeadSuit = !!leadSuit && hand.some(card => card.suit === leadSuit);
  const playable = (card: Card) => isMyTurn && !isLoading && (!hasLeadSuit || card.suit === leadSuit);
  const selected = hand.find(card => card.id === selectedCardId && playable(card));
  const resetDrag = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    if (current) {
      if (current.moved) suppressClick.current = current.id;
      current.node.style.removeProperty('--drag-x'); current.node.style.removeProperty('--drag-y');
      current.node.style.removeProperty('--drag-rotate');
      if (current.capture.hasPointerCapture(current.pointerId)) current.capture.releasePointerCapture(current.pointerId);
    }
    setDragId(null);
  }, []);
  // Browser interruptions and a changed turn must never leave a card suspended.
  const handKey = hand.map(card => card.id).join(',');
  useEffect(() => { resetDrag(); setSelectedCardId(null); }, [isMyTurn, isLoading, leadSuit, handKey, resetDrag]);
  useEffect(() => {
    const hide = () => { if (document.hidden) resetDrag(); };
    window.addEventListener('blur', resetDrag); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('blur', resetDrag); document.removeEventListener('visibilitychange', hide); };
  }, [resetDrag]);
  const executePlay = (card: Card, origin?: CardPlayOrigin) => {
    if (!playable(card)) return;
    const button = [...(fan.current?.querySelectorAll<HTMLElement>('[data-card-id]') ?? [])].find(node => node.dataset.cardId === card.id)?.querySelector('button');
    const rect = button?.getBoundingClientRect();
    const from = origin ?? (rect ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width } : undefined);
    resetDrag(); setSelectedCardId(null); onPlayCard(card, from);
  };
  return <div className={`player-hand${!isMyTurn || isLoading ? ' hand-muted' : ''}`}>
    <div className="hand-meta"><span>Your hand <b>{hand.length}</b></span><span>{isLoading ? 'Playing…' : isMyTurn ? hasLeadSuit ? `Follow ${SUIT_SYMBOLS[leadSuit!]} ${leadSuit}` : 'Your turn' : 'Waiting for your turn'}</span></div>
    <div className={`hand-scroll${reactionControl ? ' has-reaction-control' : ''}`}>
      <div ref={fan} className="hand-fan" style={{ '--card-count': hand.length } as React.CSSProperties}>
        {hand.map((card, index) => <div key={card.id} data-card-id={card.id}
          className={`hand-card${playable(card) ? ' is-draggable' : ''}${selected?.id === card.id ? ' hand-card-selected' : ''}${dragId === card.id ? ' is-dragging' : ''}`}
          style={{ '--deal-delay': `${index * 18}ms` } as React.CSSProperties}
          onPointerDown={event => {
            suppressClick.current = null;
            if (!playable(card) || event.button !== 0 || !event.isPrimary || gesture.current) return;
            const capture = event.currentTarget.querySelector('button')!;
            const node = event.currentTarget.querySelector<HTMLElement>('.card-gesture')!;
            gesture.current = { id: card.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, started: performance.now(), moved: false, node, capture };
            capture.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            const current = gesture.current;
            if (!current || current.id !== card.id || current.pointerId !== event.pointerId) return;
            const x = event.clientX - current.x, y = event.clientY - current.y;
            if (!current.moved && Math.hypot(x,y) < 6) return;
            if (!current.moved) { current.moved = true; setDragId(card.id); }
            current.node.style.setProperty('--drag-x', `${Math.max(-90, Math.min(90,x))}px`);
            current.node.style.setProperty('--drag-y', `${Math.max(-240, Math.min(60,y))}px`);
            current.node.style.setProperty('--drag-rotate', `${Math.max(-12, Math.min(12,x / 7))}deg`);
          }}
          onPointerUp={event => {
            const current = gesture.current;
            if (!current || current.id !== card.id || current.pointerId !== event.pointerId) return;
            const dx = event.clientX - current.x, dy = event.clientY - current.y;
            const elapsed = Math.max(1, performance.now() - current.started);
            const upward = dy < -48 || (dy < -22 && -dy / elapsed > .55);
            const towardsTable = Math.abs(dx) < Math.max(65, -dy * 1.3);
            if (current.moved) suppressClick.current = card.id;
            if (current.moved && upward && towardsTable) executePlay(card);
            else resetDrag();
          }}
          onPointerCancel={resetDrag}
          onLostPointerCapture={event => { if (gesture.current?.pointerId === event.pointerId) resetDrag(); }}
          onDragStart={event => event.preventDefault()}>
          <div className="card-gesture"><CardView card={card} isPlayable={playable(card)} isSelected={selected?.id === card.id}
            isTrump={!!trumpSuit && card.suit === trumpSuit} isDisabled={!playable(card)}
            onClick={event => {
              if (event.detail > 0 && suppressClick.current === card.id) { suppressClick.current = null; return; }
              if (!playable(card)) return;
              if (selected?.id === card.id) executePlay(card); else setSelectedCardId(card.id);
            }} /></div>
        </div>)}
      </div>
      {reactionControl && <div className="hand-reaction-control">{reactionControl}</div>}
    </div>
    <div className="hand-action">{selected ? <><button className="primary-action" disabled={isLoading} onClick={() => executePlay(selected)}>Play {selected.rank} {SUIT_SYMBOLS[selected.suit]} <span aria-hidden="true">↗</span></button><button className="quiet-action" onClick={() => setSelectedCardId(null)}>Cancel</button></>
      : <span>{isMyTurn && !isLoading ? 'Tap to select · Swipe up to play' : ''}</span>}</div>
  </div>;
};
