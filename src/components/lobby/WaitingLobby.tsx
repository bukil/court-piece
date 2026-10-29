import React, { useState } from 'react';
import type { RoomDocument } from '../../types/game';
import { Avatar } from '../common/Avatar';

interface WaitingLobbyProps {
  room: RoomDocument;
  localPlayerId: string;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => void;
  onOpenRulesModal?: () => void;
}

export const WaitingLobby: React.FC<WaitingLobbyProps> = ({
  room,
  localPlayerId,
  onStartGame,
  onLeaveRoom,
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
      const msg = err instanceof Error ? err.message : 'Error starting game';
      setErrorMsg(msg);
      setIsStarting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white flex flex-col justify-between p-6 sm:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial from-white/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-lg w-full mx-auto">
        <span className="text-sm font-semibold tracking-tight text-white/90">CODEBASE</span>
        <button
          onClick={onLeaveRoom}
          className="text-xs text-white/40 hover:text-white/80 transition-colors cursor-pointer px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]"
        >
          Leave
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto flex flex-col items-center">
        {/* Room Code Capsule */}
        <div className="flex flex-col items-center mb-8">
          <button
            type="button"
            onClick={handleCopyCode}
            title="Click to copy"
            className="group flex items-center gap-3 bg-neutral-900/80 border border-white/10 rounded-full px-6 py-2.5 shadow-xl hover:border-white/20 transition-all cursor-pointer active:scale-95 backdrop-blur-xl"
          >
            <span className="text-2xl font-mono font-bold tracking-widest text-white">
              {room.code}
            </span>
            <span className="text-xs text-white/40 group-hover:text-white/70 transition-colors">
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>
        </div>

        {errorMsg && (
          <div className="w-full mb-4 text-xs text-rose-400 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* 4 Seats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-8">
          {room.seats.map((seatPlayer, idx) => {
            const isMe = seatPlayer?.id === localPlayerId;
            const teamLabel = idx % 2 === 0 ? 'Team 1' : 'Team 2';

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  seatPlayer
                    ? isMe
                      ? 'bg-white/[0.08] border-white/20 shadow-md'
                      : 'bg-white/[0.03] border-white/[0.06]'
                    : 'bg-transparent border-dashed border-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {seatPlayer ? (
                    <Avatar seed={seatPlayer.id} teamId={seatPlayer.teamId} size="sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white/20 border border-dashed border-white/10">
                      {idx + 1}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-medium text-xs text-white truncate">
                        {seatPlayer ? seatPlayer.nickname : 'Waiting...'}
                      </span>
                      {seatPlayer?.isHost && (
                        <span className="text-[10px] text-amber-400">★</span>
                      )}
                    </div>
                    {seatPlayer && (
                      <span className="text-[10px] text-white/40">
                        {teamLabel}
                      </span>
                    )}
                  </div>
                </div>

                {seatPlayer && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Start Button */}
        <div className="w-full flex flex-col items-center">
          {isHost ? (
            <button
              type="button"
              disabled={!isFull || isStarting}
              onClick={handleStart}
              className="w-full py-3.5 rounded-2xl bg-white text-black font-medium text-sm hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starting...' : isFull ? 'Start Game' : `Waiting for players (${occupiedCount}/4)`}
            </button>
          ) : (
            <div className="text-xs text-white/40 flex items-center gap-2 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>
                {isFull ? 'Waiting for host to start...' : `Waiting for players (${occupiedCount}/4)...`}
              </span>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10" />
    </div>
  );
};
