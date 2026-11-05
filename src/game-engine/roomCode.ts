const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateRoomCode(): string {
  const bytes = new Uint8Array(3);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i=0;i<3;i++) bytes[i] = Math.floor(Math.random()*256);
  return Array.from(bytes, byte => ALPHABET[byte % ALPHABET.length]).join('');
}
