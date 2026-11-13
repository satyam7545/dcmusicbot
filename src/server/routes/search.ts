import { Router } from 'express';
import { player } from '../../music/player';
import type { SearchResultItem, AudioSource } from '../../shared/types';

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  const query = req.query.q as string;
  if (!query || query.trim().length === 0) {
    return res.json([]);
  }

  try {
    const results = await player.search(query);
    if (!results || !results.tracks) {
      return res.json([]);
    }

    const items: SearchResultItem[] = results.tracks.slice(0, 15).map((track) => {
      let source: AudioSource = 'other';
      const rawSource = (track.raw as any)?.source;
      if (rawSource === 'youtube' || track.url.includes('youtube') || track.url.includes('youtu.be')) {
        source = 'youtube';
      } else if (rawSource === 'spotify' || track.url.includes('spotify')) {
        source = 'spotify';
      } else if (rawSource === 'soundcloud' || track.url.includes('soundcloud')) {
        source = 'soundcloud';
      }

      return {
        title: track.title,
        author: track.author,
        url: track.url,
        thumbnail: track.thumbnail || '',
        duration: track.duration,
        source,
      };
    });

    return res.json(items);
  } catch (err: any) {
    console.error('[Search API Error]:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
});
