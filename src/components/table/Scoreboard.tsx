import React from 'react';
import type { TeamScore, Suit } from '../../types/game';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';
interface ScoreboardProps {
  dealScores: [TeamScore, TeamScore]; matchScores: [number, number]; matchTarget: number;
  currentDeal: number; trumpSuit: Suit | null; onClick?: () => void;
}
export const Scoreboard: React.FC<ScoreboardProps> = ({ dealScores, matchScores, trumpSuit, onClick }) => (
  <button type="button" className="scoreboard" onClick={onClick} aria-label={`View scores. Team 1: ${dealScores[0].tricksWon} tricks. Team 2: ${dealScores[1].tricksWon} tricks. Match points ${matchScores[0]} to ${matchScores[1]}.`}>
    <span className="team-score team-one"><span>Team 1</span><b>{dealScores[0].tricksWon}</b></span>
    <span className="trump-score"><span>Trump</span><b className={trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? 'red-suit' : ''}>{trumpSuit ? SUIT_SYMBOLS[trumpSuit] : '—'}</b></span>
    <span className="team-score team-two"><b>{dealScores[1].tricksWon}</b><span>Team 2</span></span>
    <span className="score-expand" aria-hidden="true">↗</span>
  </button>
);
