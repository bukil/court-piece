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
import { ReactionPicker } from './ReactionPicker';

interface GameTableProps {
  room: RoomDocument;
  localPlayerId: string;
  onLeaveRoom: () => void;
  onOpenRulesModal?: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  room,
  localPlayerId,
  onLeaveRoom,
}) => {
  const [hand, setHand] = useState<Card[]>([]);
  const [initialCards, setInitialCards] = useState<Card[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeReactions, setActiveReactions] = useState<Record<number, string | null>>({});

  const gameState = room.gameState;
  const localPlayer = room.seats.find((s) => s?.id === localPlayerId);
  const localSeatIndex: SeatIndex = localPlayer ? localPlayer.seatIndex : 0;

  // Subscribe to private hand
  useEffect(() => {
    const unsubscribe = roomService.subscribePrivateHand(room.id, localPlayerId, (cards, initCards) => {
      setHand(cards);
      if (initCards && initCards.length > 0) {
        setInitialCards(initCards);
      }
    });
    return () => unsubscribe();
  }, [room.id, localPlayerId]);

  // Audio feedback when turn changes
  useEffect(() => {
    if (gameState?.currentTurnSeatIndex === localSeatIndex && gameState.status === 'playing') {
      soundService.playTurnNotification();
    }
  }, [gameState?.currentTurnSeatIndex, localSeatIndex, gameState?.status]);

  // Real-time reaction animation across all 4 screens
  useEffect(() => {
    const rx = gameState?.lastReaction;
    if (!rx) return;
    soundService.playReactionSound();
    setActiveReactions((prev) => ({ ...prev, [rx.seatIndex]: rx.emoji }));
    const timer = setTimeout(() => {
      setActiveReactions((prev) => ({ ...prev, [rx.seatIndex]: null }));
    }, 2200);
    return () => clearTimeout(timer);
  }, [gameState?.lastReaction?.id]);

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

  const displayHand = isTrumpSelection
    ? initialCards.length > 0
      ? initialCards
      : hand.slice(0, 5)
    : hand;

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

  const handleSendReaction = (emoji: string) => {
    roomService.sendReaction(room.id, localPlayerId, emoji);
  };

  const handlePlayCard = (card: Card) => {
    setActionError(null);
    startTransition(async () => {
      try {
        soundService.playCardPlay();
        await roomService.playCard(room.id, localPlayerId, card);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid move';
        setActionError(msg);
        setTimeout(() => setActionError(null), 3000);
      }
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-[#07090e] text-white flex flex-col justify-between overflow-hidden">
      {/* Subtle Table Felt Accent */}
      <div className="absolute inset-0 bg-radial from-emerald-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Floating Top Navigation */}
      <header className="relative z-20 w-full px-4 py-3 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-white/90">CODEBASE</span>

          <button
            onClick={handleCopyCode}
            title="Click to copy code"
            className="text-xs font-mono text-white/40 hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]"
          >
            {copiedCode ? 'Copied' : room.code}
          </button>
        </div>

        {/* Center Scoreboard */}
        {gameState && (
          <div className="hidden sm:block">
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
          <ReactionPicker onSendReaction={handleSendReaction} />

          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={onLeaveRoom}
            className="text-xs text-white/40 hover:text-white/80 transition-colors cursor-pointer px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Mobile Scoreboard */}
      {gameState && (
        <div className="sm:hidden flex justify-center py-2 px-3 border-b border-white/[0.04]">
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
        <div className="relative z-30 mx-auto mt-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
          {actionError}
        </div>
      )}

      {/* Main Table Surface */}
      <main className="relative z-10 flex-1 flex flex-col justify-between items-center px-4 py-2 max-w-5xl w-full mx-auto">
        {/* Top: Partner */}
        <div className="w-full flex justify-center pt-2">
          <SeatView
            player={topSeat.player}
            seatIndex={topSeat.seatIndex}
            position="top"
            isTeammate={true}
            isTurn={gameState?.currentTurnSeatIndex === topSeat.seatIndex}
            isDealer={gameState?.dealerSeatIndex === topSeat.seatIndex}
            isCaller={gameState?.trumpCallerSeatIndex === topSeat.seatIndex}
            cardCount={gameState?.remainingCardCounts[topSeat.seatIndex] ?? 0}
            activeReaction={activeReactions[topSeat.seatIndex]}
          />
        </div>

        {/* Middle: Left, Center Trick, Right */}
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
              activeReaction={activeReactions[leftSeat.seatIndex]}
            />
          </div>

          {/* Central Trick Surface */}
          <div className="flex flex-col items-center justify-center mx-4">
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
              activeReaction={activeReactions[rightSeat.seatIndex]}
            />
          </div>
        </div>

        {/* Bottom: Turn Status & Local Hand */}
        <div className="w-full flex flex-col items-center relative">
          {/* Floating Reaction for local player */}
          {activeReactions[bottomSeat.seatIndex] && (
            <div className="absolute -top-10 z-30 pointer-events-none animate-reaction-float">
              <div className="px-2.5 py-1 rounded-full bg-neutral-900 border border-white/20 shadow-xl text-2xl backdrop-blur-md">
                {activeReactions[bottomSeat.seatIndex]}
              </div>
            </div>
          )}

          {gameState && (
            <div className="mb-2">
              <TurnBanner
                currentTurnPlayerName={currentTurnPlayer?.nickname || 'Player'}
                isLocalPlayerTurn={isMyTurn}
                lastMoveNotice={gameState.lastMoveNotice}
              />
            </div>
          )}

          <div className="w-full flex flex-col items-center">
            {/* Interactive Hand View */}
            <HandView
              cards={displayHand}
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
        callerCards={displayHand}
        onSelectTrump={handleSelectTrump}
      />
    </div>
  );
};
