const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.GCLOUD_PROJECT = 'demo-court-piece';
const admin = require('firebase-admin');
const { expireTurn } = require('../lib/index.js');
const { turnKey } = require('../lib/shared/game-engine/turnClock.js');

function fixture() {
  return { id:'test',status:'playing',hostPlayerId:'p0',version:1,seats:[0,1,2,3].map(i=>({id:`p${i}`,nickname:`Player ${i}`,seatIndex:i,teamId:i%2,isConnected:i!==1,lastSeen:0,isHost:i===0})),gameState:{currentDeal:1,currentTurnSeatIndex:1,turnStartedAt:Date.now()-20_001,trumpCallerSeatIndex:1,dealerSeatIndex:0,trumpSuit:'hearts',status:'playing',version:1,completedTricks:[],teamDealScores:[{tricksWon:0},{tricksWon:0}],matchScores:[0,0],matchTarget:7,remainingCardCounts:[12,3,13,13],currentTrick:{leadSuit:'spades',cards:[{playerId:'p0',seatIndex:0,card:{id:'S-A',suit:'spades',rank:'A',value:14},playedAt:0}]}} };
}
test('server expiry keeps private hands hidden, follows suit, and rejects stale or unauthorized requests', async()=>{
  let room=fixture(); let privateReads=0; const writes=[];
  const hand=[{id:'H-2',suit:'hearts',rank:'2',value:2},{id:'S-9',suit:'spades',rank:'9',value:9},{id:'S-4',suit:'spades',rank:'4',value:4}];
  const database=admin.firestore(); const original=database.runTransaction;
  database.runTransaction=async handler=>handler({get:async ref=>{if(ref.path.includes('privateHands')){privateReads++;return {exists:true,data:()=>({cards:hand})};}return {exists:true,data:()=>room};},update:(ref,data)=>writes.push({path:ref.path,data})});
  try{
    const key=turnKey(room.gameState);
    await assert.rejects(expireTurn.run({auth:{uid:'outsider'},data:{roomId:'test',expectedTurn:key}}),error=>error.code==='permission-denied');
    assert.equal(privateReads,0);
    const result=await expireTurn.run({auth:{uid:'p0'},data:{roomId:'test',expectedTurn:key}});
    assert.deepEqual(result,{played:true});
    assert.equal(privateReads,1);
    assert.equal(room.gameState.currentTrick.cards[1].card.id,'S-4');
    const savedHand=writes.find(write=>write.path.includes('privateHands'));
    assert.deepEqual(savedHand.data.cards.map(card=>card.id),['H-2','S-9']);
    assert.deepEqual(await expireTurn.run({auth:{uid:'p2'},data:{roomId:'test',expectedTurn:key}}),{played:false});
    room=fixture(); room.gameState.turnStartedAt=Date.now();
    assert.deepEqual(await expireTurn.run({auth:{uid:'p0'},data:{roomId:'test',expectedTurn:turnKey(room.gameState)}}),{played:false});
    assert.equal(privateReads,1);
  } finally { database.runTransaction=original; await admin.app().delete(); }
});
