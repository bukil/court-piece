import { afterEach, expect, it, vi } from 'vitest';
import { findGifs, getGif } from '../../src/services/giphyService';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it('queries GIPHY directly, preserves order and media query parameters', async () => {
 vi.stubEnv('VITE_GIPHY_API_KEY','test-key');
 const gif = (id: string) => ({id,title:id,images:{fixed_height:{url:`https://media.giphy.com/media/${id}/giphy.gif?cid=abc`},fixed_height_still:{url:`https://media.giphy.com/media/${id}/still.gif`}}});
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({data:[gif('second'),gif('first')]})}); vi.stubGlobal('fetch',fetcher);
 const result=await findGifs('happy');
 expect(result.map(item=>item.id)).toEqual(['second','first']);
 expect(result[0].animated).toContain('?cid=abc');
 const url=fetcher.mock.calls[0][0] as URL;
 expect(url.hostname).toBe('api.giphy.com'); expect(url.searchParams.get('q')).toBe('happy'); expect(url.searchParams.get('rating')).toBe('pg');
});
it('handles rate limits and rejects arbitrary URLs as GIF identifiers', async()=>{
 vi.stubEnv('VITE_GIPHY_API_KEY','test-key'); vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:429}));
 await expect(findGifs('')).rejects.toThrow('Try again shortly');
 await expect(getGif('https://example.com')).rejects.toThrow('Invalid GIF');
});
