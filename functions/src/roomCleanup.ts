import type { Firestore, DocumentReference } from 'firebase-admin/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
export const ROOM_RETENTION_MS = 30 * 60 * 1000;
function millis(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value && typeof (value as {toMillis?: unknown}).toMillis === 'function') return (value as {toMillis(): number}).toMillis();
  return 0;
}
/** A running heartbeat, recent move or reconnect always protects a room. */
export function roomIsExpired(room: Record<string, any>, now = Date.now()): boolean {
  const activity = [millis(room.updatedAt), millis(room.createdAt), millis(room.lastActiveAt)];
  for (const player of room.seats ?? []) {
    if (!player) continue;
    activity.push(millis(player.lastSeen));
    for (const seen of Object.values(player.connections ?? {})) activity.push(millis(seen));
  }
  const latest = Math.max(...activity);
  return latest > 0 && now - latest >= ROOM_RETENTION_MS;
}
export async function deleteExpiredRoom(db: Firestore, ref: DocumentReference, now = Date.now()): Promise<boolean> {
  const claimed = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || !roomIsExpired(snapshot.data()!,now)) return false;
    // Keep the code reserved until all private data is gone. Clients cannot update a claimed room.
    if (!snapshot.data()!.cleanupStartedAt) transaction.update(ref, { status: 'abandoned', cleanupStartedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (!claimed) return false;
  const locked = await ref.get();
  if (!locked.exists || !locked.data()?.cleanupStartedAt) return false;
  // Deleting only a parent document would leave privateHands and serverData orphaned.
  for (const collection of await ref.listCollections()) await db.recursiveDelete(collection);
  await ref.delete({ lastUpdateTime: locked.updateTime! });
  return true;
}
export async function cleanupExpiredRooms(db: Firestore, now = Date.now()): Promise<number> {
  const cutoff = Timestamp.fromMillis(now - ROOM_RETENTION_MS);
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  let deleted = 0;
  for (;;) {
    let query = db.collection('rooms').where('updatedAt','<=',cutoff).orderBy('updatedAt').limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    for (const room of page.docs) if (await deleteExpiredRoom(db,room.ref,now)) deleted++;
    cursor = page.docs.at(-1);
    if (page.size < 100) break;
  }
  return deleted;
}
