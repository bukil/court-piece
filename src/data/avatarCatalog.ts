import { PHOTO_AVATARS } from './photoAvatars';
import { AVATAR_PACK } from './reactionPack';
export const EMOJI_AVATARS = AVATAR_PACK.map(item => ({ id: `emoji-${item.code}`, emoji: item.emoji, label: item.label }));
const ids = new Set<string>([...PHOTO_AVATARS.map(item => item.id), ...EMOJI_AVATARS.map(item => item.id)]);
export function defaultAvatarId(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return EMOJI_AVATARS[Math.abs(hash) % EMOJI_AVATARS.length].id;
}
export function normalizeAvatarId(value: string | undefined, seed: string) {
  return value && ids.has(value) ? value : defaultAvatarId(seed);
}
export function resolveAvatar(value: string | undefined, seed: string) {
  const id = normalizeAvatarId(value, seed);
  return PHOTO_AVATARS.find(item => item.id === id) ?? EMOJI_AVATARS.find(item => item.id === id)!;
}
