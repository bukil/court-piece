import { applyCard } from '../../src/game-engine/court-piece/applyCard';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { LocalSimulatorService } from '../../src/services/localSimulator';
import { isTurnExpired, lowestLegalCard, remainingSeconds, turnDeadline, turnKey } from '../../src/game-engine/turnClock';
import { playerIsOnline } from '../../src/hooks/useRoomPresence';
import type { Card, PublicGameState } from '../../src/types/game';

async function startDeal(sim: LocalSimulatorService) {
  const room = await sim.createRoom({ id: 'p0', nickname: 'Host' });
  for (let i=1;i<4;i++) await sim.joinRoom(room.code, { id: `p${i}`, nickname: `Player ${i}` });
  await sim.startGame(room.id, 'p0'); await sim.selectTrump(room.id, 'p1', 'hearts');
  return (await sim.findRoomByCode(room.code))!;
}
function handOf(sim: LocalSimulatorService, roomId: string, playerId: string) {
  let hand: Card[] = []; const off = sim.subscribePrivateHand(roomId, playerId, cards => { hand = cards; }); off(); return hand;
}
describe('20-second shared turn clock', () => {
  let sim: LocalSimulatorService;
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(100_000); sim = new LocalSimulatorService(); sim.clearAll(); });
  afterEach(() => vi.useRealTimers());
  it('starts on the first lead, warns at seven seconds, and expires at exactly twenty', async () => {
    const room = await startDeal(sim); const state = room.gameState!;
    expect(turnDeadline(state)).toBe(120_000);
    expect(remainingSeconds(turnDeadline(state), 112_999)).toBe(8);
    expect(remainingSeconds(turnDeadline(state), 113_000)).toBe(7);
    expect(isTurnExpired(state, 119_999)).toBe(false);
    expect(isTurnExpired(state, 120_000)).toBe(true);
  });
  it('chooses the lowest card of the led suit even when a lower off-suit card exists', async () => {
    const room = await startDeal(sim);
    const state = { ...room.gameState!, currentTrick: { leadSuit: 'spades', cards: [{ card: {id:'S-A',suit:'spades',rank:'A',value:14},seatIndex:0,playerId:'p0',playedAt:0 }] } } as PublicGameState;
    expect(lowestLegalCard(state,[{id:'H-2',suit:'hearts',rank:'2',value:2},{id:'S-K',suit:'spades',rank:'K',value:13},{id:'S-7',suit:'spades',rank:'7',value:7}])?.id).toBe('S-7');
  });
  it('does not expire early and auto-plays one legal card when an offline seat times out', async () => {
    const room = await startDeal(sim); const state = room.gameState!; const key = turnKey(state);
    const lowest = lowestLegalCard(state, handOf(sim,room.id,'p1'))!;
    expect(await sim.expireTurn(room.id,'p0',key)).toBe(false);
    vi.setSystemTime(120_000);
    expect(await sim.expireTurn(room.id,'p0',key)).toBe(true);
    const next = (await sim.findRoomByCode(room.code))!.gameState!;
    expect(next.currentTrick.cards[0].card.id).toBe(lowest.id);
    expect(next.remainingCardCounts[1]).toBe(12);
    expect(turnDeadline(next)).toBe(140_000);
    expect(await sim.expireTurn(room.id,'p2',key)).toBe(false);
  });
  it('does not reset the active turn after a message or heartbeat', async () => {
    const room = await startDeal(sim); const initial = turnDeadline(room.gameState!);
    vi.setSystemTime(110_000);
    await sim.updatePresence(room.id,'p1','connection',true);
    await sim.sendChatMessage(room.id,{playerId:'p0',nickname:'Host',teamId:0,text:'Hello'});
    expect(turnDeadline((await sim.findRoomByCode(room.code))!.gameState!)).toBe(initial);
  });
  it('resolves a timeout on the fourth card into the correct match-winning trick', async () => {
    const room = await startDeal(sim);
    const state = room.gameState!;
    state.currentTurnSeatIndex = 3; state.teamDealScores[0].tricksWon = 6; state.matchScores[0] = 6;
    state.currentTrick = { leadSuit: 'spades', cards: [10,9,8].map((value,index) => ({ playerId: `p${index}`, seatIndex: index as 0|1|2, card: {id:`S-${value}`,suit:'spades',rank:String(value) as '10'|'9'|'8',value}, playedAt:100_000 })) };
    const hand: Card[] = [{id:'S-7',suit:'spades',rank:'7',value:7}];
    expect(applyCard(room,room.seats[3]!,hand[0],hand,120_000)).toEqual([]);
    expect(room.status).toBe('match_complete');
    expect(state.matchWinnerTeamId).toBe(0);
    expect(state.matchScores).toEqual([7,0]);
    expect(turnDeadline(state)).toBeNull();
  });
  it('detects a crashed connection once its heartbeat is stale', async () => {
    const room = await startDeal(sim);
    await sim.updatePresence(room.id,'p1','connection',true);
    const player=(await sim.findRoomByCode(room.code))!.seats[1]!;
    expect(playerIsOnline(player,124_999)).toBe(true);
    expect(playerIsOnline(player,125_000)).toBe(false);
  });
});
