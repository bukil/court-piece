import React, { useEffect, useRef, useState } from 'react';
import { soundService } from '../../services/soundService';
interface ShuffleDistributionOverlayProps { dealNumber: number; onAnimationComplete: () => void; }
export const ShuffleDistributionOverlay: React.FC<ShuffleDistributionOverlayProps> = ({ dealNumber, onAnimationComplete }) => {
  const [phase, setPhase] = useState('shuffle');
  const complete = useRef(onAnimationComplete);
  useEffect(() => { complete.current = onAnimationComplete; }, [onAnimationComplete]);
  useEffect(() => {
    soundService.playShuffle();
    const deal = setTimeout(() => { setPhase('deal'); soundService.playCardDeal(); }, 480);
    const finish = setTimeout(() => complete.current(), 1250);
    return () => { clearTimeout(deal); clearTimeout(finish); };
  }, [dealNumber]);
  return <div className="deal-overlay" aria-live="polite" aria-label="Dealing cards">
    <div className={`shuffle-deck phase-${phase}`}>{[0, 1, 2, 3].map(i => <i key={i} style={{ '--deck-index': i } as React.CSSProperties}><span>♧</span></i>)}</div>
    <span>{phase === 'shuffle' ? 'A fresh shuffle' : 'Your cards are on their way'}</span>
  </div>;
};
