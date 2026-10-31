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
      const msg = err instanceof Error ? err.message : 'Error starting game';
      setErrorMsg(msg);
      setIsStarting(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-[#0b0d11] text-neutral-100 flex flex-col justify-between p-6 sm:p-8">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-lg w-full mx-auto">
        <span className="text-xs text-neutral-400 font-medium">Court Piece Table</span>
        <div className="flex items-center gap-3">
          {onOpenRulesModal && (
            <button
              type="button"
              onClick={onOpenRulesModal}
              className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Rules
            </button>
          )}
          <button
            onClick={onLeaveRoom}
            className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto flex flex-col items-center">
        {/* Room Code Pill */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-xs text-neutral-400 mb-2">Invite 3 players with code</span>
          <button
            type="button"
            onClick={handleCopyCode}
            title="Click to copy room code"
            className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-full px-5 py-2 hover:border-neutral-700 transition-colors cursor-pointer active:scale-98"
          >
            <span className="text-xl font-medium tracking-widest text-white">
              {room.code}
            </span>
            <span className="text-xs text-neutral-400">
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
        <div className="w-full grid grid-cols-2 gap-2.5 mb-6">
          {room.seats.map((seatPlayer, idx) => {
            const isMe = seatPlayer?.id === localPlayerId;
            const teamLabel = idx % 2 === 0 ? 'Team 1' : 'Team 2';

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  seatPlayer
                    ? isMe
                      ? 'bg-neutral-900 border-neutral-700'
                      : 'bg-neutral-900/60 border-neutral-800'
                    : 'bg-transparent border-dashed border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {seatPlayer ? (
                    <Avatar seed={seatPlayer.id} teamId={seatPlayer.teamId} size="sm" />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-neutral-600 border border-dashed border-neutral-800">
                      {idx + 1}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-medium text-xs text-white truncate">
                        {seatPlayer ? seatPlayer.nickname : 'Empty'}
                      </span>
                      {seatPlayer?.isHost && (
                        <span className="text-[10px] text-amber-400 font-medium">Host</span>
                      )}
                    </div>
                    {seatPlayer && (
                      <span className="text-[10px] text-neutral-400">
                        {teamLabel}
                      </span>
                    )}
                  </div>
                </div>

                {seatPlayer && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
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
              className="w-full py-3 rounded-xl bg-white text-black font-medium text-xs sm:text-sm hover:bg-neutral-200 active:scale-98 transition-transform transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starting deal...' : isFull ? 'Start Game' : `Waiting for players (${occupiedCount}/4)`}
            </button>
          ) : (
            <div className="text-xs text-neutral-400 flex items-center gap-2 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>
                {isFull ? 'Waiting for host to start...' : `Waiting for players (${occupiedCount}/4)...`}
              </span>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-neutral-500">
        Team 1: Seats 1 &amp; 3 &bull; Team 2: Seats 2 &amp; 4
      </footer>
    </div>
  );
};
