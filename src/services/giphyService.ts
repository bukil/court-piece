export interface GiphyGif { id: string; title: string; animated: string; still: string; }
function mediaUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try { const url = new URL(value); return url.protocol === 'https:' && (url.hostname === 'giphy.com' || url.hostname.endsWith('.giphy.com')) ? value : ''; } catch { return ''; }
}
function parseGif(value: unknown): GiphyGif | null {
  const gif = value as { id?: string; title?: string; images?: Record<string, { url?: string }> };
  if (!gif?.id || !/^[a-zA-Z0-9]{1,80}$/.test(gif.id)) return null;
  const animated = mediaUrl(gif.images?.fixed_height?.url || gif.images?.original?.url);
  const still = mediaUrl(gif.images?.fixed_height_still?.url || gif.images?.original_still?.url);
  return animated && still ? { id: gif.id, title: gif.title || 'GIF reaction', animated, still } : null;
}
async function request(path: string, signal?: AbortSignal, query = '') {
  const key = import.meta.env.VITE_GIPHY_API_KEY;
  if (!key) throw new Error('GIF reactions are not configured yet.');
  const url = new URL(`https://api.giphy.com/v1/gifs/${path}`);
  url.search = new URLSearchParams({ api_key: key, rating: 'pg', limit: '12', ...(query ? { q: query.slice(0,50) } : {}) }).toString();
  const response = await fetch(url, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error(response.status === 429 ? 'GIFs are busy. Try again shortly.' : 'GIFs couldn’t load. Please try again.');
  return response.json();
}
export async function findGifs(query: string, signal?: AbortSignal): Promise<GiphyGif[]> {
  const result = await request(query.trim() ? 'search' : 'trending', signal, query.trim());
  return (Array.isArray(result.data) ? result.data : []).map(parseGif).filter((gif: GiphyGif | null): gif is GiphyGif => !!gif);
}
export async function getGif(id: string, signal?: AbortSignal): Promise<GiphyGif> {
  if (!/^[a-zA-Z0-9]{1,80}$/.test(id)) throw new Error('Invalid GIF.');
  const result = parseGif((await request(id, signal)).data);
  if (!result) throw new Error('This GIF is unavailable.');
  return result;
}
