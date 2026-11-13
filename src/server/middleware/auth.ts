import type { Request, Response, NextFunction } from 'express';
import { client } from '../../bot/client';
import { player } from '../../music/player';
import { config } from '../../config';

const MANAGE_GUILD_FLAG = 1n << 5n; // 32n
const ADMINISTRATOR_FLAG = 1n << 3n; // 8n

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login with Discord.' });
  }
  next();
}

export function requireGuildAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { guildId } = req.params;
  if (!guildId) {
    return res.status(400).json({ error: 'Missing guildId parameter' });
  }

  // Developer mode bypass for demo servers in non-production
  if (user.isDev && guildId.startsWith('demo_')) {
    if (config.isProduction && !config.allowDevLogin) {
      return res.status(403).json({ error: 'Demo mode is disabled in production.' });
    }
    return next();
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return res.status(404).json({ error: 'Bot is not present in this server.' });
  }

  // Check 1: Does the user have Administrator or Manage Guild in their Discord OAuth guilds list?
  const userGuilds: any[] = user.guilds || [];
  const matchedGuild = userGuilds.find((g) => g.id === guildId);

  if (matchedGuild && matchedGuild.permissions) {
    try {
      const perms = BigInt(matchedGuild.permissions);
      if ((perms & ADMINISTRATOR_FLAG) === ADMINISTRATOR_FLAG || (perms & MANAGE_GUILD_FLAG) === MANAGE_GUILD_FLAG) {
        return next();
      }
    } catch {
      // BigInt parsing error fallback
    }
  }

  // Check 2: Is the user currently listening in the active voice channel with the bot (DJ listener permission)?
  const queue = player.nodes.get(guildId);
  if (queue && queue.channel) {
    const member = guild.members.cache.get(user.id);
    if (member?.voice?.channelId && member.voice.channelId === queue.channel.id) {
      return next();
    }
  }

  // Check 3: Check cached guild member in Discord bot cache
  const member = guild.members.cache.get(user.id);
  if (member && (member.permissions.has('Administrator') || member.permissions.has('ManageGuild'))) {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden. You do not have permission to control music in this server.',
  });
}
