import { useEffect, useState, useSyncExternalStore } from 'react';
import { getGif, type GiphyGif } from '../../services/giphyService';
import type { GifReaction as GifReactionData } from '../../types/game';
const subscribe = (callback: () => void) => { const media = matchMedia('(prefers-reduced-motion: reduce)'); media.addEventListener('change',callback); return () => media.removeEventListener('change',callback); };
export function GifMedia({ gif }: { gif: GiphyGif }) {
  const reduced = useSyncExternalStore(subscribe, () => matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  return <img src={reduced ? gif.still : gif.animated} alt={gif.title} loading="lazy" decoding="async" onError={event => { if (event.currentTarget.src !== gif.still) event.currentTarget.src = gif.still; }} />;
}
export function GiphyCredit() { return <img className="giphy-credit" src={`${import.meta.env.BASE_URL}brand/powered-by-giphy.png`} alt="Powered by GIPHY" />; }
export function GifReaction({ reaction }: { reaction: GifReactionData }) {
  const [gif,setGif] = useState<GiphyGif | null>(null);
  useEffect(() => { const controller = new AbortController(); getGif(reaction.id,controller.signal).then(setGif).catch(() => {}); return () => controller.abort(); }, [reaction.id]);
  return <div className="gif-reaction-visual">{gif ? <GifMedia gif={gif} /> : <span aria-label={reaction.title}>🎞</span>}<GiphyCredit /></div>;
}
