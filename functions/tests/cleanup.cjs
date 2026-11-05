const {test}=require('node:test');
const assert=require('node:assert/strict');
const {roomIsExpired,deleteExpiredRoom,ROOM_RETENTION_MS}=require('../lib/roomCleanup');
const now=2_000_000_000_000, old=now-ROOM_RETENTION_MS-1;
const room=()=>({updatedAt:{toMillis:()=>old},createdAt:old,seats:[{lastSeen:old,isConnected:true,connections:{tab:old}}]});
test('cleanup expires stale connections but protects heartbeats, reconnects and recent moves',()=>{
 assert.equal(roomIsExpired(room(),now),true);
 assert.equal(roomIsExpired({...room(),lastActiveAt:{toMillis:()=>now}},now),false);
 assert.equal(roomIsExpired({...room(),updatedAt:now},now),false);
 assert.equal(roomIsExpired({...room(),seats:[{lastSeen:now,connections:{tab:now}}]},now),false);
 assert.equal(roomIsExpired({seats:[]},now),false);
 assert.equal(roomIsExpired({...room(),updatedAt:now-ROOM_RETENTION_MS+1},now),false);
});
function mock(data, fail=false){
 const calls=[];
 const ref={get:async()=>({exists:!!data,data:()=>data,updateTime:'lock-time'}),listCollections:async()=>['privateHands','serverData'],delete:async precondition=>calls.push(['parent',precondition])};
 const db={runTransaction:async fn=>fn({get:ref.get,update:(_,patch)=>{data={...data,...patch};calls.push(['claim',patch.status]);}}),recursiveDelete:async collection=>{calls.push(['children',collection]);if(fail)throw Error('retry');}};
 return {db,ref,calls};
}
test('cleanup rechecks inside a transaction, removes private data before releasing the room code',async()=>{
 const stale=mock(room()); assert.equal(await deleteExpiredRoom(stale.db,stale.ref,now),true);
 assert.deepEqual(stale.calls,[['claim','abandoned'],['children','privateHands'],['children','serverData'],['parent',{lastUpdateTime:'lock-time'}]]);
 const reconnected=mock({...room(),lastActiveAt:now}); assert.equal(await deleteExpiredRoom(reconnected.db,reconnected.ref,now),false); assert.deepEqual(reconnected.calls,[]);
});
test('failed private cleanup retains the tombstone and can be retried safely',async()=>{
 const stale=mock(room(),true); await assert.rejects(deleteExpiredRoom(stale.db,stale.ref,now));
 assert.equal(stale.calls.some(call=>call[0]==='parent'),false);
 const retry=mock({...room(),cleanupStartedAt:old,status:'abandoned'}); assert.equal(await deleteExpiredRoom(retry.db,retry.ref,now),true);
 assert.equal(retry.calls.some(call=>call[0]==='claim'),false);
});
