import { describe, it, expect, beforeEach } from 'vitest';
import { LocalSimulatorService } from '../../src/services/localSimulator';
import type { Card } from '../../src/types/game';

describe('Room Lifecycle & Multiplayer Seating Integration', () => {
  let sim: LocalSimulatorService;

  beforeEach(() => {
    sim = new LocalSimulatorService();
    sim.clearAll();
  });

  it('creates a room, assigns host to Seat 0 and team 0', async () => {
    const host = { id: 'user_host', nickname: 'HostAce' };
    const room = await sim.createRoom(host);

    expect(room.id).toBeDefined();
    expect(room.code).toHaveLength(6);
    expect(room.status).toBe('waiting');
    expect(room.hostPlayerId).toBe(host.id);

    expect(room.seats[0]).not.toBeNull();
    expect(room.seats[0]?.id).toBe(host.id);
    expect(room.seats[0]?.nickname).toBe(host.nickname);
    expect(room.seats[0]?.seatIndex).toBe(0);
    expect(room.seats[0]?.teamId).toBe(0); // Team Alpha
    expect(room.seats[0]?.isHost).toBe(true);

    expect(room.seats[1]).toBeNull();
    expect(room.seats[2]).toBeNull();
    expect(room.seats[3]).toBeNull();
  });

  it('allows exactly 3 more players to join into seats 1, 2, and 3', async () => {
    const host = { id: 'user_host', nickname: 'HostAce' };
    const room = await sim.createRoom(host);

    const p2 = await sim.joinRoom(room.code, { id: 'user_p2', nickname: 'PlayerTwo' });
    expect(p2.seatIndex).toBe(1);
    expect(p2.room.seats[1]?.teamId).toBe(1); // Team Beta

    const p3 = await sim.joinRoom(room.code, { id: 'user_p3', nickname: 'PlayerThree' });
    expect(p3.seatIndex).toBe(2);
    expect(p3.room.seats[2]?.teamId).toBe(0); // Team Alpha (Host's partner)

    const p4 = await sim.joinRoom(room.code, { id: 'user_p4', nickname: 'PlayerFour' });
    expect(p4.seatIndex).toBe(3);
    expect(p4.room.seats[3]?.teamId).toBe(1); // Team Beta (P2's partner)

    const updated = await sim.findRoomByCode(room.code);
    expect(updated?.seats.filter(Boolean)).toHaveLength(4);
  });

  it('rejects a 5th player joining when all 4 seats are occupied', async () => {
    const host = { id: 'p0', nickname: 'Player0' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'Player1' });
    await sim.joinRoom(room.code, { id: 'p2', nickname: 'Player2' });
    await sim.joinRoom(room.code, { id: 'p3', nickname: 'Player3' });

    await expect(
      sim.joinRoom(room.code, { id: 'p5', nickname: 'PlayerExtra' })
    ).rejects.toThrow('Room is full (4/4 players already seated).');
  });

  it('allows an already seated player to reconnect without taking an extra seat', async () => {
    const host = { id: 'p0', nickname: 'Player0' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'Player1' });

    const reconnect = await sim.joinRoom(room.code, { id: 'p1', nickname: 'Player1_NewName' });
    expect(reconnect.seatIndex).toBe(1);
    expect(reconnect.room.seats[1]?.nickname).toBe('Player1_NewName');
    expect(reconnect.room.seats[1]?.isConnected).toBe(true);

    expect(reconnect.room.seats.filter(Boolean)).toHaveLength(2);
  });

  it('prevents non-host from starting the game', async () => {
    const host = { id: 'host_id', nickname: 'Host' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'P1' });
    await sim.joinRoom(room.code, { id: 'p2', nickname: 'P2' });
    await sim.joinRoom(room.code, { id: 'p3', nickname: 'P3' });

    await expect(sim.startGame(room.id, 'p1')).rejects.toThrow(
      'Only the room host can start the game.'
    );
  });

  it('prevents host from starting when fewer than 4 players are present', async () => {
    const host = { id: 'host_id', nickname: 'Host' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'P1' });

    await expect(sim.startGame(room.id, host.id)).rejects.toThrow(
      'Exactly 4 players are required to start the game. Currently: 2/4.'
    );
  });

  it('starts Court Piece game: distributes 5 cards per player, enters trump_selection, then completes deal upon trump selection', async () => {
    const host = { id: 'p0', nickname: 'P0' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'P1' });
    await sim.joinRoom(room.code, { id: 'p2', nickname: 'P2' });
    await sim.joinRoom(room.code, { id: 'p3', nickname: 'P3' });

    await sim.startGame(room.id, host.id);

    const startedRoom = await sim.findRoomByCode(room.code);
    expect(startedRoom?.status).toBe('trump_selection');
    expect(startedRoom?.gameState?.status).toBe('trump_selection');
    expect(startedRoom?.gameState?.trumpCallerSeatIndex).toBe(1); // Clockwise from dealer 0

    // Initial 5-card hands
    const phase1Hands: Card[][] = [];
    for (let i = 0; i < 4; i++) {
      let hand: Card[] = [];
      const unsub = sim.subscribePrivateHand(room.id, `p${i}`, (cards) => {
        hand = cards;
      });
      phase1Hands.push(hand);
      unsub();
    }
    phase1Hands.forEach((h) => expect(h).toHaveLength(5));

    // Player 1 (Trump Caller) selects trump
    await sim.selectTrump(room.id, 'p1', 'spades');

    const playingRoom = await sim.findRoomByCode(room.code);
    expect(playingRoom?.status).toBe('playing');
    expect(playingRoom?.gameState?.trumpSuit).toBe('spades');
    expect(playingRoom?.gameState?.currentTurnSeatIndex).toBe(1); // Trump caller leads trick 1
    expect(playingRoom?.gameState?.remainingCardCounts).toEqual([13, 13, 13, 13]);

    // Full 13-card hands verified
    const fullHands: Card[][] = [];
    for (let i = 0; i < 4; i++) {
      let hand: Card[] = [];
      const unsub = sim.subscribePrivateHand(room.id, `p${i}`, (cards) => {
        hand = cards;
      });
      fullHands.push(hand);
      unsub();
    }
    fullHands.forEach((h) => expect(h).toHaveLength(13));

    // Invariant: 52 unique cards
    const allIds = new Set(fullHands.flatMap((h) => h.map((c) => c.id)));
    expect(allIds.size).toBe(52);
  });

  it('prevents non-caller from selecting trump', async () => {
    const host = { id: 'p0', nickname: 'P0' };
    const room = await sim.createRoom(host);

    await sim.joinRoom(room.code, { id: 'p1', nickname: 'P1' });
    await sim.joinRoom(room.code, { id: 'p2', nickname: 'P2' });
    await sim.joinRoom(room.code, { id: 'p3', nickname: 'P3' });

    await sim.startGame(room.id, host.id);

    // Host (Seat 0) attempts to select trump instead of Trump Caller (Seat 1)
    await expect(sim.selectTrump(room.id, 'p0', 'hearts')).rejects.toThrow(
      'Only the designated trump caller can choose the trump suit.'
    );
  });
});
