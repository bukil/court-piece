import { lowResourceDevice } from '../../hooks/usePhoneTable';
import { useEffect, useState } from 'react';
import { findGifs, type GiphyGif } from '../../services/giphyService';
import { GifMedia, GiphyCredit } from '../common/GifReaction';
import type { ReactionInput } from '../../types/game';
export function GiphyPicker({ onSend }: { onSend: (reaction: ReactionInput) => Promise<void> }) {
  const [draft,setDraft] = useState('');
  const [query,setQuery] = useState('');
  const [retry,setRetry] = useState(0);
  const [gifs,setGifs] = useState<GiphyGif[]>([]);
  const [loading,setLoading] = useState(true);
  const [sending,setSending] = useState(false);
  const [error,setError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setGifs([]);
    findGifs(query,controller.signal).then(setGifs).catch(err => { if (!controller.signal.aborted) setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query,retry]);
  async function send(gif: GiphyGif) {
    setSending(true); setError('');
    try { await onSend({ type: 'gif', id: gif.id, title: gif.title }); } catch { setError('Couldn’t send. Try again.'); } finally { setSending(false); }
  }
  return <div className="giphy-picker"><form onSubmit={event => { event.preventDefault(); setQuery(draft.trim()); }}><input aria-label="Search GIF reactions" placeholder="Search GIFs" maxLength={50} value={draft} onChange={event => setDraft(event.target.value)} /><button type="submit" aria-label="Search GIFs">⌕</button></form>
    {loading && <p role="status">Loading GIFs…</p>}
    {error && <div role="alert">{error}<button onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
    {!loading && !error && !gifs.length && <p>No GIFs found. Try another search.</p>}
    <div className="giphy-grid" aria-busy={sending}>{gifs.map(gif => <button key={gif.id} title={gif.title} aria-label={`React with ${gif.title}`} disabled={sending} onClick={() => void send(gif)}><GifMedia gif={gif} active={!lowResourceDevice()} /></button>)}</div><GiphyCredit />
  </div>;
}
