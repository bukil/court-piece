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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-neutral-900/95 border border-white/10 rounded-3xl p-6 shadow-2xl text-white backdrop-blur-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-5">
          <h2 className="text-sm font-semibold tracking-tight text-white">
            Score & Hand Record
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Deal Hands / Tricks Tally */}
        <div className="mb-6">
          <div className="text-[11px] font-medium text-white/50 mb-3 uppercase tracking-wider">
            Deal #{gameState.currentDeal} — Hands Won (First to 7)
          </div>

          <div className="space-y-4">
            {/* Team 1 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-white/90">Team 1</span>
                <span className="font-semibold text-white">{t0Tricks} / 7</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i < t0Tricks ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Team 2 */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-white/90">Team 2</span>
                <span className="font-semibold text-white">{t1Tricks} / 7</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all ${
                      i < t1Tricks ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Match Score */}
        <div className="mb-6 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="text-[11px] font-medium text-white/50 mb-2 uppercase tracking-wider">
            Match Series (Target: {gameState.matchTarget} Points)
          </div>
          <div className="flex items-center justify-around py-1">
            <div className="text-center">
              <span className="text-[10px] text-white/40 block">Team 1</span>
              <span className="text-2xl font-bold text-white">{t0Match}</span>
            </div>
            <span className="text-white/20 text-sm">—</span>
            <div className="text-center">
              <span className="text-[10px] text-white/40 block">Team 2</span>
              <span className="text-2xl font-bold text-white">{t1Match}</span>
            </div>
          </div>
        </div>

        {/* Trick Log History */}
        <div>
          <div className="text-[11px] font-medium text-white/50 mb-2 uppercase tracking-wider">
            Trick History ({gameState.completedTricks.length} completed)
          </div>
          {gameState.completedTricks.length === 0 ? (
            <div className="text-xs text-white/30 text-center py-3">
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
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 font-mono">#{idx + 1}</span>
                      <span className="text-white/80 font-medium">{winnerName}</span>
                      <span className="text-[10px] text-white/40">({winnerTeam})</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      {trick.cards.map((p, cIdx) => (
                        <span key={cIdx} className="text-white/70">
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
