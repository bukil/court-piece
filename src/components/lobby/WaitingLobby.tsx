import React, { useState } from 'react';
import type { RoomDocument } from '../../types/game';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';

interface WaitingLobbyProps {
  room: RoomDocument;
  localPlayerId: string;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => void;
  onOpenRulesModal: () => void;
}

export const WaitingLobby: React.FC<WaitingLobbyProps> = ({
  room,
  localPlayerId,
  onStartGame,
  onLeaveRoom,
  onOpenRulesModal,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isHost = room.hostPlayerId === localPlayerId;
  const occupiedCount = room.seats.filter((s) => s !== null).length;
  const isFull = occupiedCount === 4;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleStart = async () => {
    setErrorMsg(null);
    setIsStarting(true);
    try {
      await onStartGame();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start game.';
      setErrorMsg(msg);
      setIsStarting(false);
    }
  };

  const getTeamName = (seatIdx: number) => {
    return seatIdx % 2 === 0 ? 'Team Alpha' : 'Team Beta';
  };

  return (
    <div className="relative min-h-screen bg-[#0d151c] text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="absolute inset-0 bg-radial from-[#122820]/30 via-[#0d151c] to-[#070b0e] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl font-mono font-black text-emerald-400">CODEBASE</span>
          <Badge variant="emerald" size="sm">
            4-Player Lobby
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRulesModal}
            className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-4"
          >
            Demo Engine Rules Info
          </button>
          <Button variant="ghost" size="sm" onClick={onLeaveRoom}>
            Leave Lobby
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl w-full mx-auto my-auto flex flex-col items-center">
        {/* Room Code Card */}
        <div className="flex flex-col items-center text-center mb-6">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">
            Private Room Code
          </span>
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-700/80 rounded-2xl px-6 py-3 shadow-xl">
            <span className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-wider">
              {room.code}
            </span>
            <Button variant="secondary" size="sm" onClick={handleCopyCode}>
              {copied ? '✓ Copied' : 'Copy Code'}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Share this 6-character room code with 3 friends to join your table.
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="w-full max-w-md mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs text-center font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 4 Seats Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {room.seats.map((seatPlayer, idx) => {
            const isMe = seatPlayer?.id === localPlayerId;
            const team = getTeamName(idx);
            const isTeamAlpha = idx % 2 === 0;

            return (
              <div
                key={idx}
                className={`relative flex items-center justify-between p-4 rounded-xl border transition-all ${
                  seatPlayer
                    ? isMe
                      ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/70 border-slate-700/80'
                    : 'bg-slate-950/40 border-dashed border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Seat Avatar / Number */}
                  {seatPlayer ? (
                    <Avatar seed={seatPlayer.id} teamId={seatPlayer.teamId} size="md" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm bg-slate-800 text-slate-500 border border-dashed border-slate-700">
                      {idx + 1}
                    </div>
                  )}

                  {/* Player Info */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-100">
                        {seatPlayer ? seatPlayer.nickname : 'Waiting for player...'}
                      </span>
                      {seatPlayer?.isHost && (
                        <span title="Host" className="text-xs text-amber-400 font-bold">
                          👑 Host
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 rounded border border-emerald-500/30">
                          YOU
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className={isTeamAlpha ? 'text-emerald-400/80' : 'text-indigo-400/80'}>
                        {team}
                      </span>
                      <span>•</span>
                      <span>Seat {idx + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Status Dot */}
                <div>
                  {seatPlayer ? (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600 font-mono">EMPTY</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lobby Status and Action Button */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md text-center">
          <div className="text-xs text-slate-400 font-mono">
            {occupiedCount} OF 4 SEATS OCCUPIED
          </div>

          {isHost ? (
            <div className="w-full flex flex-col gap-2">
              <Button
                variant={isFull ? 'accent' : 'secondary'}
                size="lg"
                disabled={!isFull}
                isLoading={isStarting}
                onClick={handleStart}
                className="w-full text-base py-3"
              >
                {isFull ? '🚀 Start Game' : `Waiting for ${4 - occupiedCount} more player(s)...`}
              </Button>
              {!isFull && (
                <p className="text-[11px] text-slate-500">
                  The host can start the game once all 4 seats are occupied.
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 w-full animate-pulse">
              {isFull
                ? 'All 4 players are seated! Waiting for the host to start the game...'
                : `Waiting for ${4 - occupiedCount} more player(s) to join...`}
            </div>
          )}
        </div>
      </main>

      {/* Footer Team info */}
      <footer className="relative z-10 max-w-3xl w-full mx-auto pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Team Alpha: Seats 1 & 3 (Opposite partners) • Team Beta: Seats 2 & 4 (Opposite partners)
      </footer>
    </div>
  );
};

