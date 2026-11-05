import {describe,it,expect} from 'vitest';
import {pendingCardView,type PendingCardPlay} from '../../src/hooks/useCardPlay';
import type {RoomDocument,Card} from '../../src/types/game';
const card:Card={id:'S-2',suit:'spades',rank:'2',value:2};
const other:Card={id:'H-4',suit:'hearts',rank:'4',value:4};
const room=()=>({id:'room',gameState:{version:1,currentDeal:1,currentTurnSeatIndex:0,turnStartedAt:1000,status:'playing',completedTricks:[],currentTrick:{cards:[]}}} as unknown as RoomDocument);
const pending=():PendingCardPlay=>({roomId:'room',deal:1,stateVersion:1,turn:'',handCount:2,play:{card,seatIndex:0,playerId:'p0',playedAt:1},settled:false});
import {turnKey} from '../../src/game-engine/turnClock';
describe('card play reconciliation',()=>{
 it('shows a local play immediately, then waits for both Firestore streams',()=>{
  const r=room(),p=pending();p.turn=turnKey(r.gameState!);
  expect(pendingCardView(r,[card,other],p).trick?.cards[0].card.id).toBe(card.id);
  expect(pendingCardView(r,[card,other],p).hand).toEqual([other]);
  r.gameState!.version=2;r.gameState!.currentTrick.cards=[p.play];
  p.settled=true;
  const publicFirst=pendingCardView(r,[card,other],p);
  expect(publicFirst.hand).toEqual([other]);expect(publicFirst.finished).toBe(false);
  expect(pendingCardView(r,[other],p).finished).toBe(true);
 });
 it('handles private-hand-first delivery without adding the card twice',()=>{
  const r=room(),p=pending();p.turn=turnKey(r.gameState!);p.settled=true;
  const result=pendingCardView(r,[other],p);
  expect(result.trick?.cards).toHaveLength(1);expect(result.finished).toBe(false);
 });
 it('accepts the authoritative timeout card and restores the requested card if still held',()=>{
  const r=room(),p=pending();r.gameState!.version=2;p.settled=true;
  r.gameState!.currentTrick.cards=[{...p.play,card:other}];
  const result=pendingCardView(r,[card],p);
  expect(result.hand).toEqual([card]);expect(result.trick?.cards[0].card.id).toBe(other.id);expect(result.finished).toBe(true);
 });
 it('discards pending visuals on a new deal and restores a failed play',()=>{
  const r=room(),p=pending();r.gameState!.currentDeal=2;
  expect(pendingCardView(r,[card,other],p).finished).toBe(true);
  expect(pendingCardView(r,[card,other],null).hand).toEqual([card,other]);
 });
});
