import { Router } from 'express';
import { client } from '../../bot/client';
import { player, broadcastGuildState, getGuildPlayerState, fetchLyrics } from '../../music/player';
import { QueueRepeatMode } from 'discord-player';
import { requireAuth, requireGuildAccess } from '../middleware/auth';

export const playerRouter = Router();

// Apply authentication and strict guild access control
playerRouter.use(requireAuth);
playerRouter.use('/:guildId', requireGuildAccess);

// 1. Play / Enqueue Track or Playlist from Dashboard
playerRouter.post('/:guildId/play', async (req, res) => {
  const { guildId } = req.params;
  const { query, voiceChannelId } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or invalid query string' });
  }

  // Prevent absurdly long string attacks
  if (query.length > 1000) {
    return res.status(400).json({ error: 'Query exceeds maximum allowed length' });
  }

  // Demo fallback
  if ((req.session as any)?.user?.isDev && guildId.startsWith('demo_')) {
    return res.json({ success: true, message: `Added "${query}" to demo queue` });
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return res.status(404).json({ error: 'Guild not found' });
  }

  try {
    let targetChannel = voiceChannelId ? guild.channels.cache.get(voiceChannelId) : null;
    if (!targetChannel) {
      // Find active queue channel or any populated voice channel
      const queue = player.nodes.get(guildId);
      targetChannel = queue?.channel || guild.channels.cache.find((c: any) => c.isVoiceBased());
    }

    if (!targetChannel || !targetChannel.isVoiceBased()) {
      return res.status(400).json({
        error: 'No active voice channel found. Please connect to a voice channel or select one.',
      });
    }

    const searchResult = await player.search(query.trim(), {
      requestedBy: (req.session as any).user,
    });

    if (!searchResult || !searchResult.tracks.length) {
      return res.status(404).json({ error: 'No songs found matching query' });
    }

    const { track } = await player.play(targetChannel as any, searchResult, {
      nodeOptions: {
        volume: 80,
        bufferingTimeout: 3000,
        leaveOnEmpty: true,
      },
    });

    broadcastGuildState(guildId);
    return res.json({
      success: true,
      track: {
        title: track.title,
        author: track.author,
        url: track.url,
        duration: track.duration,
      },
      isPlaylist: !!searchResult.playlist,
    });
  } catch (error: any) {
    console.error('[Dashboard API /play Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to play track' });
  }
});

// 2. Play / Pause Toggle
playerRouter.post('/:guildId/pause', (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);

  if (!queue || !queue.isPlaying()) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true, isPaused: true });
    return res.status(404).json({ error: 'No active player for this guild' });
  }

  if (queue.node.isPaused()) {
    queue.node.resume();
  } else {
    queue.node.pause();
  }

  broadcastGuildState(guildId);
  return res.json({ success: true, isPaused: queue.node.isPaused() });
});

// 3. Skip Track
playerRouter.post('/:guildId/skip', (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);

  if (!queue || !queue.isPlaying()) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true });
    return res.status(404).json({ error: 'No active player for this guild' });
  }

  queue.node.skip();
  broadcastGuildState(guildId);
  return res.json({ success: true });
});

// 4. Previous Track
playerRouter.post('/:guildId/previous', async (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);

  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true });
    return res.status(404).json({ error: 'No active player' });
  }

  try {
    await queue.history.previous();
    broadcastGuildState(guildId);
    return res.json({ success: true });
  } catch {
    return res.status(400).json({ error: 'No previous track in history' });
  }
});

// 5. Stop Playback & Clear
playerRouter.post('/:guildId/stop', (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);

  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true });
    return res.status(404).json({ error: 'No active player' });
  }

  queue.delete();
  broadcastGuildState(guildId);
  return res.json({ success: true });
});

// 6. Seek Progress
playerRouter.post('/:guildId/seek', async (req, res) => {
  const { guildId } = req.params;
  const timeMs = Number(req.body.timeMs);

  if (isNaN(timeMs) || timeMs < 0) {
    return res.status(400).json({ error: 'Invalid timeMs parameter' });
  }

  const queue = player.nodes.get(guildId);
  if (!queue || !queue.currentTrack) {
    return res.status(404).json({ error: 'No active track to seek' });
  }

  try {
    await queue.node.seek(timeMs);
    broadcastGuildState(guildId);
    return res.json({ success: true, progressMs: timeMs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Seek failed' });
  }
});

// 7. Adjust Volume
playerRouter.post('/:guildId/volume', (req, res) => {
  const { guildId } = req.params;
  const volume = Number(req.body.volume);

  if (isNaN(volume) || volume < 0 || volume > 150) {
    return res.status(400).json({ error: 'Volume must be a number between 0 and 150' });
  }

  const queue = player.nodes.get(guildId);
  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true, volume });
    return res.status(404).json({ error: 'No active player' });
  }

  queue.node.setVolume(volume);
  broadcastGuildState(guildId);
  return res.json({ success: true, volume });
});

// 8. Loop Mode Toggle
playerRouter.post('/:guildId/loop', (req, res) => {
  const { guildId } = req.params;
  const { mode } = req.body;

  const validModes = ['off', 'track', 'queue', 'autoplay'];
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: 'Invalid loop mode' });
  }

  const queue = player.nodes.get(guildId);
  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true, mode });
    return res.status(404).json({ error: 'No active player' });
  }

  const modeMap: Record<string, QueueRepeatMode> = {
    off: QueueRepeatMode.OFF,
    track: QueueRepeatMode.TRACK,
    queue: QueueRepeatMode.QUEUE,
    autoplay: QueueRepeatMode.AUTOPLAY,
  };

  const repeatMode = modeMap[mode] ?? QueueRepeatMode.OFF;
  queue.setRepeatMode(repeatMode);
  broadcastGuildState(guildId);
  return res.json({ success: true, mode });
});

// 9. Shuffle Queue
playerRouter.post('/:guildId/shuffle', (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);

  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true });
    return res.status(404).json({ error: 'No active player' });
  }

  queue.tracks.shuffle();
  broadcastGuildState(guildId);
  return res.json({ success: true });
});

// 10. Remove Single Track from Queue
playerRouter.delete('/:guildId/queue/:index', (req, res) => {
  const { guildId, index } = req.params;
  const idx = parseInt(index, 10);

  if (isNaN(idx) || idx < 0) {
    return res.status(400).json({ error: 'Invalid track index' });
  }

  const queue = player.nodes.get(guildId);
  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true });
    return res.status(404).json({ error: 'No active player' });
  }

  const track = queue.tracks.at(idx);
  if (!track) {
    return res.status(404).json({ error: 'Track index out of range' });
  }

  queue.removeTrack(track);
  broadcastGuildState(guildId);
  return res.json({ success: true, removed: track.title });
});

// 11. Clear Queue
playerRouter.post('/:guildId/queue/clear', (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);

  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true });
    return res.status(404).json({ error: 'No active player' });
  }

  queue.tracks.clear();
  broadcastGuildState(guildId);
  return res.json({ success: true });
});

// 12. Move Track in Queue (Drag-and-Drop)
playerRouter.post('/:guildId/queue/move', (req, res) => {
  const { guildId } = req.params;
  const from = parseInt(req.body.from, 10);
  const to = parseInt(req.body.to, 10);

  if (isNaN(from) || isNaN(to) || from < 0 || to < 0) {
    return res.status(400).json({ error: 'Invalid from or to index' });
  }

  const queue = player.nodes.get(guildId);
  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true });
    return res.status(404).json({ error: 'No active player' });
  }

  if (from >= queue.tracks.size || to >= queue.tracks.size) {
    return res.status(400).json({ error: 'Indices out of range' });
  }

  queue.node.swap(from, to);
  broadcastGuildState(guildId);
  return res.json({ success: true });
});

// 13. Toggle Equalizer Filter
playerRouter.post('/:guildId/filters', async (req, res) => {
  const { guildId } = req.params;
  const { filter } = req.body;

  if (!filter || typeof filter !== 'string') {
    return res.status(400).json({ error: 'Missing filter name' });
  }

  const queue = player.nodes.get(guildId);
  if (!queue) {
    if ((req.session as any)?.user?.isDev) return res.json({ success: true, activeFilters: [filter] });
    return res.status(404).json({ error: 'No active player' });
  }

  try {
    if (filter === 'clear') {
      await queue.filters.ffmpeg.setFilters([]);
    } else {
      await queue.filters.ffmpeg.toggle(filter);
    }
    broadcastGuildState(guildId);
    return res.json({
      success: true,
      activeFilters: queue.filters.ffmpeg.getFiltersEnabled(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 14. Fetch Lyrics
playerRouter.get('/:guildId/lyrics', async (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);

  if (!queue || !queue.currentTrack) {
    if ((req.session as any)?.user?.isDev) {
      return res.json({
        title: 'Starboy',
        artist: 'The Weeknd',
        lyrics: "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah...",
      });
    }
    return res.status(404).json({ error: 'No track playing' });
  }

  const cleanTitle = queue.currentTrack.title
    .replace(/\(.*\)|\[.*\]/g, '')
    .replace(/ft\..*|feat\..*/i, '')
    .trim();

  try {
    const data = await fetchLyrics(cleanTitle);
    return res.json({
      title: data?.title || cleanTitle,
      artist: data?.artist || queue.currentTrack.author,
      lyrics: data?.lyrics || 'No lyrics found.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Could not fetch lyrics' });
  }
});
