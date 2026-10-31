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
import { ScoreRecordDrawer } from './ScoreRecordDrawer';
import { CommonChatDrawer } from './CommonChatDrawer';
import { ShuffleDistributionOverlay } from './ShuffleDistributionOverlay';

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

  // Modals / Drawers
  const [isScoreDrawerOpen, setIsScoreDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);
  const [showShuffleAnimation, setShowShuffleAnimation] = useState(
    room.status === 'trump_selection' && (room.gameState?.completedTricks.length ?? 0) === 0
  );

  const gameState = room.gameState;
  const localPlayer = room.seats.find((s) => s?.id === localPlayerId);
  const localSeatIndex: SeatIndex = localPlayer ? localPlayer.seatIndex : 0;

  const messages = room.messages || [];
  const unreadCount = isChatOpen ? 0 : Math.max(0, messages.length - lastReadMessageCount);

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

  // Reset read messages when chat drawer is opened
  useEffect(() => {
    if (isChatOpen) {
      setLastReadMessageCount(messages.length);
    }
  }, [isChatOpen, messages.length]);

  // Trigger shuffle animation on new deal
  useEffect(() => {
    if (gameState?.status === 'trump_selection' && gameState.completedTricks.length === 0) {
      setShowShuffleAnimation(true);
    }
  }, [gameState?.currentDeal, gameState?.status]);

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

  const handleSendChatMessage = async (text: string) => {
    if (!localPlayer) return;
    await roomService.sendChatMessage(room.id, {
      playerId: localPlayerId,
      nickname: localPlayer.nickname,
      teamId: localPlayer.teamId,
      text,
    });
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
    <div className="relative w-full min-h-dvh bg-[#07090e] text-white flex flex-col justify-between overflow-hidden">
      {/* Shuffling & Distribution Overlay Animation */}
      {showShuffleAnimation && gameState && (
        <ShuffleDistributionOverlay
          dealNumber={gameState.currentDeal}
          onAnimationComplete={() => setShowShuffleAnimation(false)}
        />
      )}

      {/* Top Navigation */}
      <header className="relative z-20 w-full px-4 py-3 flex items-center justify-between bg-[#0e1117]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-white/90">CODEBASE</span>

          <button
            onClick={handleCopyCode}
            title="Click to copy code"
            className="text-xs tabular-nums text-neutral-400 hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800"
          >
            {copiedCode ? 'Copied' : room.code}
          </button>
        </div>

        {/* Center Scoreboard — Clickable to open full hand record */}
        {gameState && (
          <div className="hidden sm:block">
            <Scoreboard
              dealScores={gameState.teamDealScores}
              matchScores={gameState.matchScores}
              matchTarget={gameState.matchTarget}
              currentDeal={gameState.currentDeal}
              trumpSuit={gameState.trumpSuit}
              onClick={() => setIsScoreDrawerOpen(true)}
            />
          </div>
        )}

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Common Chat Button with unread badge */}
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="relative px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-transform transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden sm:inline">Chat</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          <ReactionPicker onSendReaction={handleSendReaction} />

          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          <button
            onClick={onLeaveRoom}
            className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Mobile Scoreboard */}
      {gameState && (
        <div className="sm:hidden flex justify-center py-2 px-3 bg-neutral-950/60">
          <Scoreboard
            dealScores={gameState.teamDealScores}
            matchScores={gameState.matchScores}
            matchTarget={gameState.matchTarget}
            currentDeal={gameState.currentDeal}
            trumpSuit={gameState.trumpSuit}
            onClick={() => setIsScoreDrawerOpen(true)}
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

        {/* Bottom: Turn Status & Local Hand with Slide/Double-Touch Gestures */}
        <div className="w-full flex flex-col items-center relative">
          {/* Floating Reaction for local player */}
          {activeReactions[bottomSeat.seatIndex] && (
            <div className="absolute -top-12 z-30 pointer-events-none animate-reaction-float">
              <div className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-2xl">
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
            {/* Interactive Hand View (Supports slide-up gesture, double-touch, and trump aura) */}
            <HandView
              cards={displayHand}
              isMyTurn={isMyTurn && gameState?.status === 'playing'}
              leadSuit={gameState?.currentTrick.leadSuit}
              trumpSuit={gameState?.trumpSuit}
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

      {/* Score & Hand Record Drawer */}
      <ScoreRecordDrawer
        isOpen={isScoreDrawerOpen}
        onClose={() => setIsScoreDrawerOpen(false)}
        gameState={gameState}
        seats={room.seats}
      />

      {/* Common Chat Drawer */}
      <CommonChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        localPlayerId={localPlayerId}
        onSendMessage={handleSendChatMessage}
      />
    </div>
  );
};
