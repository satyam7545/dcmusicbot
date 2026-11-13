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
  dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'harmonix_music_bot_secret_session_key',
  isDev: process.env.NODE_ENV !== 'production',

  // YouTube cookie (optional)
  youtubeCookie: process.env.YOUTUBE_COOKIE || '',
};

export function validateConfig() {
  const missing: string[] = [];
  if (!config.discordToken) missing.push('DISCORD_TOKEN');
  if (!config.clientId) missing.push('DISCORD_CLIENT_ID');
  
  return {
    isValid: missing.length === 0,
    missing,
  };
}
