import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Discord Bot
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || '',

  // Spotify (Optional for metadata extraction)
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',

  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  dashboardUrl: (process.env.DASHBOARD_URL || 'http://localhost:3000').replace(/\/$/, ''),
  sessionSecret: process.env.SESSION_SECRET || 'harmonix_music_bot_secret_session_key',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  allowDevLogin: process.env.ALLOW_DEV_LOGIN === 'true' || process.env.NODE_ENV !== 'production',

  // YouTube cookie (optional)
  youtubeCookie: process.env.YOUTUBE_COOKIE || '',
};

export function validateConfig() {
  const missing: string[] = [];
  if (!config.discordToken) missing.push('DISCORD_TOKEN');
  if (!config.clientId) missing.push('DISCORD_CLIENT_ID');
  if (!config.clientSecret) missing.push('DISCORD_CLIENT_SECRET');

  return {
    isValid: missing.length === 0,
    missing,
  };
}
