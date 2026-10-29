import { describe, it, expect, beforeEach } from 'vitest';
import { LocalSimulatorService } from '../../src/services/localSimulator';
import type { Card } from '../../src/types/game';

describe('Authoritative Card Play & Trick Resolution Integration (Single Sir)', () => {
  let sim: LocalSimulatorService;

  beforeEach(() => {
    sim = new LocalSimulatorService();
    sim.clearAll();
  });

  it('rejects out of turn moves and plays legal moves in clockwise sequence', async () => {
    const host = { id: 'p0', nickname: 'Alice' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'Bob' });
    await sim.joinRoom(room.code, { id: 'p2', nickname: 'Charlie' });
    await sim.joinRoom(room.code, { id: 'p3', nickname: 'Diana' });

    await sim.startGame(room.id, host.id);
    await sim.selectTrump(room.id, 'p1', 'hearts');

    const activeRoom = await sim.findRoomByCode(room.code);
    expect(activeRoom?.gameState?.currentTurnSeatIndex).toBe(1); // Bob leads trick 1

    // Alice (Seat 0) attempts to play out of turn
    let p0Hand: Card[] = [];
    const unsub0 = sim.subscribePrivateHand(room.id, 'p0', (h) => (p0Hand = h));
    unsub0();
    await expect(sim.playCard(room.id, 'p0', p0Hand[0])).rejects.toThrow('It is not your turn');

    // Bob (Seat 1) plays a legal card
    let p1Hand: Card[] = [];
    const unsub1 = sim.subscribePrivateHand(room.id, 'p1', (h) => (p1Hand = h));
    unsub1();

    const playedCard = p1Hand[0];
    await sim.playCard(room.id, 'p1', playedCard);

    let updatedP1Hand: Card[] = [];
    const unsubP1New = sim.subscribePrivateHand(room.id, 'p1', (h) => (updatedP1Hand = h));
    unsubP1New();
    expect(updatedP1Hand).toHaveLength(12);

    const afterPlayRoom = await sim.findRoomByCode(room.code);
    expect(afterPlayRoom?.gameState?.currentTrick.cards).toHaveLength(1);
    expect(afterPlayRoom?.gameState?.currentTrick.leadSuit).toBe(playedCard.suit);
    expect(afterPlayRoom?.gameState?.currentTurnSeatIndex).toBe(2); // Turn moves to Seat 2
  });

  it('completes a 4-player trick under Single Sir rules, awards trick immediately, and winner leads next', async () => {
    const host = { id: 'p0', nickname: 'Alice' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'Bob' });
    await sim.joinRoom(room.code, { id: 'p2', nickname: 'Charlie' });
    await sim.joinRoom(room.code, { id: 'p3', nickname: 'Diana' });

    await sim.startGame(room.id, host.id);
    await sim.selectTrump(room.id, 'p1', 'hearts');

    // 4 plays: 1 -> 2 -> 3 -> 0
    const playerOrder = ['p1', 'p2', 'p3', 'p0'];
    let leadSuit: Card['suit'] | undefined;

    for (const pid of playerOrder) {
      let hand: Card[] = [];
      const unsub = sim.subscribePrivateHand(room.id, pid, (h) => (hand = h));
      unsub();

      let cardToPlay = hand[0];
      if (leadSuit) {
        const matching = hand.find((c) => c.suit === leadSuit);
        if (matching) cardToPlay = matching;
      } else {
        leadSuit = cardToPlay.suit;
      }

      await sim.playCard(room.id, pid, cardToPlay);
    }

    const finishedTrickRoom = await sim.findRoomByCode(room.code);
    expect(finishedTrickRoom?.gameState?.completedTricks).toHaveLength(1);

    const completedTrick = finishedTrickRoom?.gameState?.completedTricks[0];
    expect(completedTrick?.cards).toHaveLength(4);
    expect(completedTrick?.winnerSeatIndex).toBeDefined();

    const team0Tricks = finishedTrickRoom?.gameState?.teamDealScores[0].tricksWon || 0;
    const team1Tricks = finishedTrickRoom?.gameState?.teamDealScores[1].tricksWon || 0;
    expect(team0Tricks + team1Tricks).toBe(1);

    expect(finishedTrickRoom?.gameState?.currentTrick.cards).toHaveLength(0);
    expect(finishedTrickRoom?.gameState?.currentTurnSeatIndex).toBe(completedTrick?.winnerSeatIndex);
  });

  it('preserves player identity and cards on disconnect without exposing cards', async () => {
    const host = { id: 'p0', nickname: 'Alice' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'Bob' });
    await sim.joinRoom(room.code, { id: 'p2', nickname: 'Charlie' });
    await sim.joinRoom(room.code, { id: 'p3', nickname: 'Diana' });

    await sim.startGame(room.id, host.id);
    await sim.selectTrump(room.id, 'p1', 'spades');

    await sim.leaveRoom(room.id, 'p1');

    const updated = await sim.findRoomByCode(room.code);
    expect(updated?.seats[1]).not.toBeNull();
    expect(updated?.seats[1]?.isConnected).toBe(false);

    let p1Hand: Card[] = [];
    const unsub = sim.subscribePrivateHand(room.id, 'p1', (h) => (p1Hand = h));
    unsub();
    expect(p1Hand).toHaveLength(13);
  });
});
