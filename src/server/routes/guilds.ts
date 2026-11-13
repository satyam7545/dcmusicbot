import { Router } from 'express';
import { client } from '../../bot/client';
import { player, getGuildPlayerState } from '../../music/player';
import type { UserGuild } from '../../shared/types';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { requireAuth } from '../middleware/auth';

export const guildsRouter = Router();

guildsRouter.use(requireAuth);

// 1. Get guilds accessible by the user
guildsRouter.get('/', (req, res) => {
  const sessionUser = (req.session as any).user;
  const userGuilds: any[] = sessionUser.guilds || [];
  const isDev = sessionUser.isDev;

  // If in dev mode or bot is in servers
  const botGuilds = client.guilds.cache;

  if (isDev && botGuilds.size === 0) {
    // Provide demo guilds for visual UI testing if bot has not joined any real guild yet
    return res.json([
      {
        id: 'demo_guild_1',
        name: 'Harmonix Chill Lounge',
        icon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
        canManage: true,
        botPresent: true,
        botInVoice: true,
      },
      {
        id: 'demo_guild_2',
        name: 'Cyberpunk Gaming HQ',
        icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop&q=80',
        canManage: true,
        botPresent: true,
        botInVoice: false,
      },
    ]);
  }

  const results: UserGuild[] = [];

  // Match user guilds with bot guilds
  for (const [, botGuild] of botGuilds) {
    const userMatch = userGuilds.find((g) => g.id === botGuild.id);
    const hasPermission =
      isDev ||
      (userMatch &&
        (BigInt(userMatch.permissions) & PermissionFlagsBits.ManageGuild) ===
          PermissionFlagsBits.ManageGuild) ||
      (userMatch &&
        (BigInt(userMatch.permissions) & PermissionFlagsBits.Administrator) ===
          PermissionFlagsBits.Administrator);

    const queue = player.nodes.get(botGuild.id);
    const botInVoice = !!(queue && queue.channel);

    results.push({
      id: botGuild.id,
      name: botGuild.name,
      icon: botGuild.iconURL(),
      canManage: !!hasPermission || isDev,
      botPresent: true,
      botInVoice,
    });
  }

  // Also include user guilds where bot is NOT present (so they can invite the bot!)
  for (const ug of userGuilds) {
    if (!botGuilds.has(ug.id)) {
      const canManage =
        (BigInt(ug.permissions) & PermissionFlagsBits.ManageGuild) ===
          PermissionFlagsBits.ManageGuild ||
        (BigInt(ug.permissions) & PermissionFlagsBits.Administrator) ===
          PermissionFlagsBits.Administrator;

      if (canManage) {
        results.push({
          id: ug.id,
          name: ug.name,
          icon: ug.icon
            ? `https://cdn.discordapp.com/icons/${ug.id}/${ug.icon}.png`
            : null,
          canManage: true,
          botPresent: false,
          botInVoice: false,
        });
      }
    }
  }

  return res.json(results);
});

// 2. Get specific guild player state
guildsRouter.get('/:guildId', (req, res) => {
  const { guildId } = req.params;
  const state = getGuildPlayerState(guildId);

  if (!state) {
    // If demo guild in dev mode
    if ((req.session as any)?.user?.isDev && guildId.startsWith('demo_')) {
      return res.json({
        guildId,
        guildName: 'Harmonix Chill Lounge',
        guildIcon: null,
        voiceChannelId: 'vc_demo',
        voiceChannelName: 'General Voice',
        isPlaying: true,
        isPaused: false,
        currentTrack: {
          id: 'demo_track_1',
          title: 'Starboy (Official Music Video)',
          author: 'The Weeknd ft. Daft Punk',
          url: 'https://www.youtube.com/watch?v=34Na4j8AVgA',
          thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
          duration: '3:50',
          durationMs: 230000,
          source: 'spotify',
          requestedBy: {
            id: 'dev_user_123',
            username: 'DemoCommander',
            avatar: 'https://cdn-icons-png.flaticon.com/512/3845/3845814.png',
          },
        },
        queue: [
          {
            id: 'demo_track_2',
            title: 'Blinding Lights',
            author: 'The Weeknd',
            url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
            thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
            duration: '3:20',
            durationMs: 200000,
            source: 'spotify',
          },
          {
            id: 'demo_track_3',
            title: 'Midnight City',
            author: 'M83',
            url: 'https://www.youtube.com/watch?v=dX3k_QDnzHE',
            thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
            duration: '4:03',
            durationMs: 243000,
            source: 'youtube',
          },
        ],
        volume: 85,
        repeatMode: 'off',
        progressMs: 65000,
        activeFilters: ['bassboost'],
        membersInVoice: 4,
      });
    }

    return res.status(404).json({ error: 'Guild not found or bot not in guild' });
  }

  return res.json(state);
});

// 3. Get voice channels in guild
guildsRouter.get('/:guildId/channels', (req, res) => {
  const { guildId } = req.params;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    if ((req.session as any)?.user?.isDev) {
      return res.json([
        { id: 'vc_demo', name: 'General Voice' },
        { id: 'vc_music', name: 'Music Lounge' },
      ]);
    }
    return res.status(404).json({ error: 'Guild not found' });
  }

  const voiceChannels = guild.channels.cache
    .filter((c) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice)
    .map((c) => ({
      id: c.id,
      name: c.name,
      membersCount: c.members.size,
    }));

  return res.json(voiceChannels);
});
