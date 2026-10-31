import React from 'react';
import type { PublicGameState, Player } from '../../types/game';
import { SUIT_SYMBOLS } from '../../game-engine/utils/deck';

interface ScoreRecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: PublicGameState | null;
  seats: (Player | null)[];
}

export const ScoreRecordDrawer: React.FC<ScoreRecordDrawerProps> = ({
  isOpen,
  onClose,
  gameState,
  seats,
}) => {
  if (!isOpen || !gameState) return null;

  const t0Tricks = gameState.teamDealScores[0].tricksWon;
  const t1Tricks = gameState.teamDealScores[1].tricksWon;
  const t0Match = gameState.matchScores[0];
  const t1Match = gameState.matchScores[1];

  const getPlayerName = (seatIdx: number) => {
    return seats[seatIdx]?.nickname || `Seat ${seatIdx + 1}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-white max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-5">
          <h2 className="text-sm font-semibold tracking-tight text-white">
            Score & Hand Record
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Current Deal Hands / Tricks Tally */}
        <div className="mb-6">
          <div className="text-xs font-medium text-neutral-400 mb-3">
            Deal #{gameState.currentDeal} — Hands Won (First to 7)
          </div>

          <div className="space-y-4">
            {/* Team 1 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-neutral-300">Team 1</span>
                <span className="font-semibold text-white">{t0Tricks} / 7</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-colors ${
                      i < t0Tricks ? 'bg-emerald-500' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Team 2 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-neutral-300">Team 2</span>
                <span className="font-semibold text-white">{t1Tricks} / 7</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-colors ${
                      i < t1Tricks ? 'bg-amber-500' : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Match Score */}
        <div className="mb-6 p-4 rounded-xl bg-neutral-950">
          <div className="text-xs font-medium text-neutral-400 mb-3">
            Match Series (Target: {gameState.matchTarget} Points)
          </div>
          <div className="flex items-center justify-around py-1">
            <div className="text-center">
              <span className="text-[11px] text-neutral-400 block">Team 1</span>
              <span className="text-2xl font-bold text-white tabular-nums">{t0Match}</span>
            </div>
            <span className="text-neutral-600 text-sm">—</span>
            <div className="text-center">
              <span className="text-[11px] text-neutral-400 block">Team 2</span>
              <span className="text-2xl font-bold text-white tabular-nums">{t1Match}</span>
            </div>
          </div>
        </div>

        {/* Trick Log History */}
        <div>
          <div className="text-xs font-medium text-neutral-400 mb-2">
            Trick History ({gameState.completedTricks.length} completed)
          </div>
          {gameState.completedTricks.length === 0 ? (
            <div className="text-xs text-neutral-500 text-center py-3">
              No completed tricks yet
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {gameState.completedTricks.map((trick, idx) => {
                const winnerName = trick.winnerSeatIndex !== undefined ? getPlayerName(trick.winnerSeatIndex) : 'Player';
                const winnerTeam = trick.winnerSeatIndex !== undefined && trick.winnerSeatIndex % 2 === 0 ? 'Team 1' : 'Team 2';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 tabular-nums">#{idx + 1}</span>
                      <span className="text-neutral-200 font-medium">{winnerName}</span>
                      <span className="text-[11px] text-neutral-500">({winnerTeam})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs tabular-nums">
                      {trick.cards.map((p, cIdx) => (
                        <span key={cIdx} className="text-neutral-300">
                          {p.card.rank}{SUIT_SYMBOLS[p.card.suit]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

