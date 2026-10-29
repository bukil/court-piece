import React, { useEffect, useState, useTransition } from 'react';
import type {
  RoomDocument,
  Card,
  SeatIndex,
  RelativePosition,
  Player,
  Suit,
} from '../../types/game';
import { roomService } from '../../services/roomService';
import { soundService } from '../../services/soundService';
import { SeatView } from './SeatView';
import { TrickArea } from './TrickArea';
import { HandView } from './HandView';
import { Scoreboard } from './Scoreboard';
import { TurnBanner } from './TurnBanner';
import { TrumpSelectionModal } from './TrumpSelectionModal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface GameTableProps {
  room: RoomDocument;
  localPlayerId: string;
  onLeaveRoom: () => void;
  onOpenRulesModal: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  room,
  localPlayerId,
  onLeaveRoom,
  onOpenRulesModal,
}) => {
  const [hand, setHand] = useState<Card[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const gameState = room.gameState;
  const localPlayer = room.seats.find((s) => s?.id === localPlayerId);
  const localSeatIndex: SeatIndex = localPlayer ? localPlayer.seatIndex : 0;

  // Subscribe to private hand
  useEffect(() => {
    const unsubscribe = roomService.subscribePrivateHand(room.id, localPlayerId, (cards) => {
      setHand(cards);
    });
    return () => unsubscribe();
  }, [room.id, localPlayerId]);

  // Audio feedback when turn changes
  useEffect(() => {
    if (gameState?.currentTurnSeatIndex === localSeatIndex && gameState.status === 'playing') {
      soundService.playTurnNotification();
    }
  }, [gameState?.currentTurnSeatIndex, localSeatIndex, gameState?.status]);

  // Relative seat position calculation (local player always at bottom)
  const getRelativePosition = (seatIndex: number): RelativePosition => {
    const diff = (seatIndex - localSeatIndex + 4) % 4;
    switch (diff) {
      case 0:
        return 'bottom';
      case 1:
        return 'left';
      case 2:
        return 'top';
      case 3:
        return 'right';
      default:
        return 'bottom';
    }
  };

  const getPlayerAtPosition = (pos: RelativePosition): { player: Player | null; seatIndex: number } => {
    for (let s = 0; s < 4; s++) {
      if (getRelativePosition(s) === pos) {
        return { player: room.seats[s], seatIndex: s };
      }
    }
    return { player: null, seatIndex: 0 };
  };

  const topSeat = getPlayerAtPosition('top');
  const leftSeat = getPlayerAtPosition('left');
  const rightSeat = getPlayerAtPosition('right');
  const bottomSeat = getPlayerAtPosition('bottom');

  const isMyTurn = gameState ? gameState.currentTurnSeatIndex === localSeatIndex : false;
  const currentTurnPlayer = gameState ? room.seats[gameState.currentTurnSeatIndex] : null;

  const isTrumpSelection = room.status === 'trump_selection' || gameState?.status === 'trump_selection';
  const isTrumpCaller = gameState ? gameState.trumpCallerSeatIndex === localSeatIndex : false;
  const trumpCallerPlayer = gameState ? room.seats[gameState.trumpCallerSeatIndex] : null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleToggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectTrump = async (suit: Suit) => {
    soundService.playCardDeal();
    await roomService.selectTrump(room.id, localPlayerId, suit);
  };

  const handlePlayCard = (card: Card) => {
    setActionError(null);
    startTransition(async () => {
      try {
        soundService.playCardPlay();
        await roomService.playCard(room.id, localPlayerId, card);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to play card.';
        setActionError(msg);
        setTimeout(() => setActionError(null), 4000);
      }
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0d151c] text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Table Background Glow / Felt Accent */}
      <div className="absolute inset-0 bg-radial from-[#122820]/40 via-[#0d151c] to-[#070b0e] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-mono font-black text-lg tracking-wider">CODEBASE</span>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">COURT PIECE (SINGLE SIR)</span>
          </div>

          {/* Room Code Badge & Copy */}
          <button
            onClick={handleCopyCode}
            title="Click to copy room code"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-xs font-mono font-bold text-slate-200 transition-colors"
          >
            <span>ROOM: {room.code}</span>
            <span className="text-[10px] text-slate-400">
              {copiedCode ? '✓ Copied' : '📋'}
            </span>
          </button>

          {/* Rules info */}
          <button
            onClick={onOpenRulesModal}
            className="hidden md:inline-flex items-center gap-1"
          >
            <Badge variant="emerald" size="sm">
              ✓ Single Sir Rules
            </Badge>
          </button>
        </div>

        {/* Center Scoreboard */}
        {gameState && (
          <div className="hidden lg:block">
            <Scoreboard
              dealScores={gameState.teamDealScores}
              matchScores={gameState.matchScores}
              matchTarget={gameState.matchTarget}
              currentDeal={gameState.currentDeal}
              trumpSuit={gameState.trumpSuit}
            />
          </div>
        )}

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            title={isMuted ? 'Unmute sound' : 'Mute sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onLeaveRoom}
          >
            Leave
          </Button>
        </div>
      </header>

      {/* Mobile Scoreboard */}
      {gameState && (
        <div className="lg:hidden flex justify-center py-1.5 px-3 bg-slate-950/40 border-b border-slate-800/50">
          <Scoreboard
            dealScores={gameState.teamDealScores}
            matchScores={gameState.matchScores}
            matchTarget={gameState.matchTarget}
            currentDeal={gameState.currentDeal}
            trumpSuit={gameState.trumpSuit}
          />
        </div>
      )}

      {/* Action error banner */}
      {actionError && (
        <div className="relative z-30 mx-auto mt-2 px-4 py-1.5 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-semibold shadow-lg">
          ⚠️ {actionError}
        </div>
      )}

      {/* Main Table Felt Stage */}
      <main className="relative z-10 flex-1 flex flex-col justify-between items-center px-2 py-2 sm:px-4 max-w-6xl w-full mx-auto">
        {/* Top: Partner Seat */}
        <div className="w-full flex justify-center pt-1 sm:pt-2">
          <SeatView
            player={topSeat.player}
            seatIndex={topSeat.seatIndex}
            position="top"
            isTeammate={true}
            isTurn={gameState?.currentTurnSeatIndex === topSeat.seatIndex}
            isDealer={gameState?.dealerSeatIndex === topSeat.seatIndex}
            isCaller={gameState?.trumpCallerSeatIndex === topSeat.seatIndex}
            cardCount={gameState?.remainingCardCounts[topSeat.seatIndex] ?? 0}
          />
        </div>

        {/* Middle Row: Left Opponent, Central Trick Area, Right Opponent */}
        <div className="w-full flex items-center justify-between my-auto py-2">
          {/* Left Opponent */}
          <div className="flex justify-start">
            <SeatView
              player={leftSeat.player}
              seatIndex={leftSeat.seatIndex}
              position="left"
              isTeammate={false}
              isTurn={gameState?.currentTurnSeatIndex === leftSeat.seatIndex}
              isDealer={gameState?.dealerSeatIndex === leftSeat.seatIndex}
              isCaller={gameState?.trumpCallerSeatIndex === leftSeat.seatIndex}
              cardCount={gameState?.remainingCardCounts[leftSeat.seatIndex] ?? 0}
            />
          </div>

          {/* Central Trick Playing Surface */}
          <div className="flex flex-col items-center justify-center mx-2 sm:mx-6">
            {gameState && (
              <TrickArea
                trick={gameState.currentTrick}
                getRelativePosition={getRelativePosition}
                seats={room.seats.filter((s): s is Player => s !== null)}
              />
            )}
          </div>

          {/* Right Opponent */}
          <div className="flex justify-end">
            <SeatView
              player={rightSeat.player}
              seatIndex={rightSeat.seatIndex}
              position="right"
              isTeammate={false}
              isTurn={gameState?.currentTurnSeatIndex === rightSeat.seatIndex}
              isDealer={gameState?.dealerSeatIndex === rightSeat.seatIndex}
              isCaller={gameState?.trumpCallerSeatIndex === rightSeat.seatIndex}
              cardCount={gameState?.remainingCardCounts[rightSeat.seatIndex] ?? 0}
            />
          </div>
        </div>

        {/* Bottom Section: Turn Banner, Local Player Seat, and Interactive Hand */}
        <div className="w-full flex flex-col items-center">
          {gameState && (
            <TurnBanner
              currentTurnPlayerName={currentTurnPlayer?.nickname || 'Player'}
              isLocalPlayerTurn={isMyTurn}
              lastMoveNotice={gameState.lastMoveNotice}
            />
          )}

          <div className="mt-2 w-full flex flex-col items-center">
            {/* Small local seat summary */}
            <div className="mb-1">
              <SeatView
                player={bottomSeat.player}
                seatIndex={bottomSeat.seatIndex}
                position="bottom"
                isLocalPlayer={true}
                isTeammate={false}
                isTurn={isMyTurn}
                isDealer={gameState?.dealerSeatIndex === bottomSeat.seatIndex}
                isCaller={gameState?.trumpCallerSeatIndex === bottomSeat.seatIndex}
                cardCount={hand.length}
              />
            </div>

            {/* Hand View with interactive cards */}
            <HandView
              cards={hand}
              isMyTurn={isMyTurn && gameState?.status === 'playing'}
              leadSuit={gameState?.currentTrick.leadSuit}
              onPlayCard={handlePlayCard}
              isLoading={isPending}
            />
          </div>
        </div>
      </main>

      {/* Trump Selection Modal */}
      <TrumpSelectionModal
        isOpen={isTrumpSelection}
        isCaller={isTrumpCaller}
        callerPlayer={trumpCallerPlayer}
        callerCards={hand}
        onSelectTrump={handleSelectTrump}
      />
    </div>
  );
};
