import type { ReactionEvent, ReactionInput } from '../types/game';
export const EMOJI_REACTION_MS = 3200;
export const GIF_REACTION_MS = 5000;
export function normalizeReaction(input: ReactionInput): Pick<ReactionEvent, 'emoji' | 'gif'> {
  if (typeof input === 'string') {
    if (!input.trim() || input.length > 16) throw new Error('Invalid reaction.');
    return { emoji: input };
  }
  if (input?.type !== 'gif' || !/^[a-zA-Z0-9]{1,80}$/.test(input.id)) throw new Error('Invalid GIF reaction.');
  // Share only the selected GIF identity. Media is resolved from GIPHY on each viewer.
  return { emoji: '🎞', gif: { type: 'gif', id: input.id, title: String(input.title || 'GIF reaction').slice(0,100) } };
}
export function reactionDuration(reaction: Pick<ReactionEvent, 'gif'>) { return reaction.gif ? GIF_REACTION_MS : EMOJI_REACTION_MS; }
