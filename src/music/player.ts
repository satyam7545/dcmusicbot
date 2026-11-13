import { Player, type GuildQueue, type Track } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { YoutubeExtractor } from 'discord-player-youtubei';
import { client } from '../bot/client';
import { config } from '../config';
import { createMusicEmbed } from '../bot/components/musicEmbed';
import type { GuildPlayerState, TrackData, AudioSource } from '../shared/types';
import { io } from '../server/socket';

export const player = new Player(client, {
  skipFFmpeg: false,
});

export async function fetchLyrics(query: string) {
  try {
    const results = await player.lyrics.search({ q: query });
    if (!results || !results.length) return null;
    const top = results[0];
    return {
      title: top.trackName,
      artist: top.artistName,
      lyrics: top.plainLyrics || top.syncedLyrics || null,
    };
  } catch (err) {
    console.warn('[Lyrics] Could not search lyrics:', err);
    return null;
  }
}

export function formatTrack(track: Track): TrackData {
  let source: AudioSource = 'other';
  const rawSource = (track.raw as any)?.source;
  if (rawSource === 'youtube' || track.url.includes('youtube') || track.url.includes('youtu.be')) {
    source = 'youtube';
  } else if (rawSource === 'spotify' || track.url.includes('spotify')) {
    source = 'spotify';
  } else if (rawSource === 'soundcloud' || track.url.includes('soundcloud')) {
    source = 'soundcloud';
  } else if (rawSource === 'apple_music' || track.url.includes('apple')) {
    source = 'apple';
  }

  return {
    id: track.id || track.url,
    title: track.title,
    author: track.author,
    url: track.url,
    thumbnail: track.thumbnail || '',
    duration: track.duration,
    durationMs: track.durationMS || 0,
    source,
    requestedBy: track.requestedBy
      ? {
          id: track.requestedBy.id,
          username: track.requestedBy.username,
          avatar: track.requestedBy.displayAvatarURL?.() || '',
        }
      : undefined,
  };
}

export function getGuildPlayerState(guildId: string): GuildPlayerState | null {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return null;

  const queue = player.nodes.get(guildId);
  if (!queue) {
    return {
      guildId,
      guildName: guild.name,
      guildIcon: guild.iconURL(),
      voiceChannelId: null,
      voiceChannelName: null,
      isPlaying: false,
      isPaused: false,
      currentTrack: null,
      queue: [],
      volume: 80,
      repeatMode: 'off',
      progressMs: 0,
      activeFilters: [],
      membersInVoice: 0,
    };
  }

  const repeatModeNames: Record<number, 'off' | 'track' | 'queue' | 'autoplay'> = {
    0: 'off',
    1: 'track',
    2: 'queue',
    3: 'autoplay',
  };

  const channel = queue.channel;

  return {
    guildId,
    guildName: guild.name,
    guildIcon: guild.iconURL(),
    voiceChannelId: channel?.id || null,
    voiceChannelName: channel?.name || null,
    isPlaying: queue.isPlaying(),
    isPaused: queue.node.isPaused(),
    currentTrack: queue.currentTrack ? formatTrack(queue.currentTrack) : null,
    queue: queue.tracks.toArray().map(formatTrack),
    volume: queue.node.volume,
    repeatMode: repeatModeNames[queue.repeatMode] || 'off',
    progressMs: queue.node.playbackTime || 0,
    activeFilters: queue.filters.ffmpeg.getFiltersEnabled(),
    membersInVoice: channel ? channel.members.filter((m) => !m.user.bot).size : 0,
  };
}

export function broadcastGuildState(guildId: string) {
  const state = getGuildPlayerState(guildId);
  if (state) {
    io.to(`guild:${guildId}`).emit('player:state', state);
  }
}

export async function initPlayer() {
  console.log('[Harmonix Music] Initializing audio extractors...');
  
  // Register YouTube extractor
  try {
    await player.extractors.register(YoutubeExtractor, {});
    console.log('[Harmonix Music] YouTube extractor registered successfully');
  } catch (err) {
    console.warn('[Harmonix Music] Could not register YoutubeExtractor:', err);
  }

  // Register DefaultExtractors (Spotify, SoundCloud, Apple Music, etc.)
  try {
    await player.extractors.loadMulti(DefaultExtractors);
    console.log('[Harmonix Music] Default extractors (Spotify, SoundCloud, etc.) registered');
  } catch (err) {
    console.warn('[Harmonix Music] Could not register DefaultExtractors:', err);
  }

  // Bind player events
  player.events.on('playerStart', (queue, track) => {
    console.log(`[Player] Started playing: "${track.title}" in guild "${queue.guild.name}"`);
    
    // Broadcast to web socket room
    broadcastGuildState(queue.guild.id);
    io.to(`guild:${queue.guild.id}`).emit('player:trackStart', formatTrack(track));

    // Send now-playing embed to the Discord channel
    try {
      const channel = queue.metadata?.channel || queue.channel;
      if (channel && 'send' in channel) {
        const payload = createMusicEmbed(queue, track);
        channel.send(payload).catch((e: any) => console.error('Error sending embed:', e));
      }
    } catch (e) {
      console.error('[Player] Error sending Discord embed:', e);
    }
  });

  player.events.on('audioTrackAdd', (queue, track) => {
    console.log(`[Player] Track added: "${track.title}" in guild "${queue.guild.name}"`);
    broadcastGuildState(queue.guild.id);
  });

  player.events.on('audioTracksAdd', (queue, tracks) => {
    console.log(`[Player] Playlist added: ${tracks.length} tracks in guild "${queue.guild.name}"`);
    broadcastGuildState(queue.guild.id);
  });

  player.events.on('playerFinish', (queue, track) => {
    broadcastGuildState(queue.guild.id);
  });

  player.events.on('emptyQueue', (queue) => {
    console.log(`[Player] Queue finished in guild "${queue.guild.name}"`);
    broadcastGuildState(queue.guild.id);
    io.to(`guild:${queue.guild.id}`).emit('player:trackEnd', null);
  });

  player.events.on('playerPause', (queue) => {
    broadcastGuildState(queue.guild.id);
  });

  player.events.on('playerResume', (queue) => {
    broadcastGuildState(queue.guild.id);
  });

  player.events.on('error', (queue, error) => {
    console.error(`[Player Error] Guild ${queue.guild.id}:`, error);
  });

  player.events.on('playerError', (queue, error) => {
    console.error(`[Player Audio Error] Guild ${queue.guild.id}:`, error);
  });

  // Progress ticker for connected web dashboard users
  setInterval(() => {
    for (const [, queue] of player.nodes.cache) {
      if (queue.isPlaying() && !queue.node.isPaused()) {
        io.to(`guild:${queue.guild.id}`).emit('player:progress', queue.node.playbackTime);
      }
    }
  }, 1000);
}
