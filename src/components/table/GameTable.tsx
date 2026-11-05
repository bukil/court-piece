import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
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
  onOpenRulesModal,
}) => {
  const [hand, setHand] = useState<Card[]>([]);
  const [initialCards, setInitialCards] = useState<Card[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeReactions, setActiveReactions] = useState<Record<number, { emoji: string; id: string } | null>>({});
  const reactionTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const seenReaction = useRef<string | null>(null);

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

  // Each seat owns its expiry timer, so overlapping reactions never leave a bubble behind.
  const lastReaction = gameState?.lastReaction;
  useEffect(() => {
    if (!lastReaction || seenReaction.current === lastReaction.id || Date.now() - lastReaction.timestamp > 2200) return;
    seenReaction.current = lastReaction.id;
    const { seatIndex, emoji, id } = lastReaction;
    soundService.playReactionSound();
    clearTimeout(reactionTimers.current[seatIndex]);
    setActiveReactions(prev => ({ ...prev, [seatIndex]: { emoji, id } }));
    reactionTimers.current[seatIndex] = setTimeout(() => {
      setActiveReactions(prev => ({ ...prev, [seatIndex]: null }));
      delete reactionTimers.current[seatIndex];
    }, 2200);
  }, [lastReaction]);
  useEffect(() => () => {
    Object.values(reactionTimers.current).forEach(clearTimeout);
    reactionTimers.current = {};
    seenReaction.current = null;
  }, []);

  // Reset read messages when chat drawer is opened
  useEffect(() => {
    if (isChatOpen) {
      setLastReadMessageCount(messages.length);
    }
  }, [isChatOpen, messages.length]);

  const completedTrickCount = gameState?.completedTricks.length ?? 0;
  // Trigger shuffle animation on new deal
  useEffect(() => {
    if (gameState?.status === 'trump_selection' && completedTrickCount === 0) {
      setShowShuffleAnimation(true);
    }
  }, [gameState?.currentDeal, gameState?.status, completedTrickCount]);

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

  const handleSendReaction = async (emoji: string) => {
    try { await roomService.sendReaction(room.id, localPlayerId, emoji); }
    catch { setActionError('Couldn’t send your reaction. Try again.'); }
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

  const handlePlayCard = useCallback((card: Card) => {
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
  }, [room.id, localPlayerId]);

  const renderSeat = (seat: { player: Player | null; seatIndex: number }, position: RelativePosition, teammate: boolean) => (
    <SeatView player={seat.player} seatIndex={seat.seatIndex} position={position} isTeammate={teammate}
      isTurn={gameState?.status === 'playing' && gameState.currentTurnSeatIndex === seat.seatIndex}
      isDealer={gameState?.dealerSeatIndex === seat.seatIndex} isCaller={gameState?.trumpCallerSeatIndex === seat.seatIndex}
      cardCount={gameState?.remainingCardCounts[seat.seatIndex] ?? 0} activeReaction={activeReactions[seat.seatIndex]?.emoji} reactionId={activeReactions[seat.seatIndex]?.id} />
  );

  return (
    <div className="game-shell">
      {showShuffleAnimation && gameState && <ShuffleDistributionOverlay dealNumber={gameState.currentDeal} onAnimationComplete={() => setShowShuffleAnimation(false)} />}
      <header className="game-header">
        <div className="game-brand"><span className="brand-mark" aria-hidden="true">♧</span><h1>Court Piece</h1><button className="room-code" onClick={handleCopyCode} aria-label="Copy room code">{copiedCode ? 'Copied!' : room.code} <span aria-hidden="true">⧉</span></button></div>
        <nav className="table-tools" aria-label="Table controls">
          <button className="tool-button" onClick={() => setIsChatOpen(!isChatOpen)}>Chat {unreadCount > 0 && <b className="unread-count">{unreadCount}</b>}</button>
          <ReactionPicker onSendReaction={handleSendReaction} />
          {onOpenRulesModal && <button className="tool-button" onClick={onOpenRulesModal}>Rules</button>}
          <button className="tool-button sound-toggle" onClick={handleToggleMute} aria-label={isMuted ? 'Unmute sound' : 'Mute sound'} aria-pressed={!isMuted}>{isMuted ? 'Sound off' : 'Sound on'}</button>
          <button className="tool-button leave-button" onClick={onLeaveRoom}>Leave</button>
        </nav>
      </header>
      <div className="game-info">
        <span className="deal-label">Deal {gameState?.currentDeal ?? 1}<span>Single Sir · First to 7 tricks</span></span>
        {gameState && <Scoreboard dealScores={gameState.teamDealScores} matchScores={gameState.matchScores} matchTarget={gameState.matchTarget} currentDeal={gameState.currentDeal} trumpSuit={gameState.trumpSuit} onClick={() => setIsScoreDrawerOpen(true)} />}
        <span className="table-note">Partners sit opposite</span>
      </div>
      {actionError && <div className="game-error" role="alert">{actionError}</div>}
      <main className="table-stage" aria-label="Court Piece table">
        <div className="felt-table" aria-hidden="true" />
        <div className="table-seat table-seat-top">{renderSeat(topSeat, 'top', true)}</div>
        <div className="table-seat table-seat-left">{renderSeat(leftSeat, 'left', false)}</div>
        <div className="table-center">{gameState && <TrickArea lastCompletedTrick={gameState.completedTricks.at(-1)} trick={gameState.currentTrick} getRelativePosition={getRelativePosition} seats={room.seats.filter((s): s is Player => s !== null)} />}</div>
        <div className="table-seat table-seat-right">{renderSeat(rightSeat, 'right', false)}</div>
        <div className="local-seat-label"><span className="status-dot" />{bottomSeat.player?.nickname ?? 'You'}<span>You · Team {(bottomSeat.player?.teamId ?? 0) + 1}</span>
          {activeReactions[bottomSeat.seatIndex] && <div key={activeReactions[bottomSeat.seatIndex]?.id} className="seat-reaction" role="status">{activeReactions[bottomSeat.seatIndex]?.emoji}</div>}
        </div>
      </main>
      <section className="hand-dock" aria-label="Your cards">
        {gameState && <TurnBanner currentTurnPlayerName={currentTurnPlayer?.nickname || 'Player'} isLocalPlayerTurn={isMyTurn && gameState.status === 'playing'} lastMoveNotice={gameState.lastMoveNotice} />}
        <HandView cards={displayHand} isMyTurn={isMyTurn && gameState?.status === 'playing'} leadSuit={gameState?.currentTrick.leadSuit} trumpSuit={gameState?.trumpSuit} onPlayCard={handlePlayCard} isLoading={isPending} />
      </section>

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
