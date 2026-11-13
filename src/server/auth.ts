import { Router } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config';

export const authRouter = Router();

// 1. Redirect to Discord OAuth2 with CSRF state token
authRouter.get('/discord', (req, res) => {
  if (!config.clientId || !config.clientSecret) {
    return res.status(500).json({
      error: 'Discord OAuth credentials (DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET) not set in .env',
      canDevLogin: config.allowDevLogin,
    });
  }

  // Generate cryptographic state token to prevent OAuth CSRF attacks
  const state = crypto.randomBytes(24).toString('hex');
  (req.session as any).oauthState = state;

  const redirectUri = encodeURIComponent(`${config.dashboardUrl}/api/auth/callback`);
  const scope = encodeURIComponent('identify guilds');
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

  return res.redirect(discordAuthUrl);
});

// 2. OAuth2 Callback with State Nonce Verification
authRouter.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const sessionState = (req.session as any)?.oauthState;

  // Clear state from session
  delete (req.session as any).oauthState;

  if (!code) {
    return res.redirect(`${config.dashboardUrl}/?error=no_code`);
  }

  // Verify OAuth2 CSRF state token
  if (!state || !sessionState || state !== sessionState) {
    console.warn('[Security] Discord OAuth2 state mismatch or missing token');
    return res.status(403).redirect(`${config.dashboardUrl}/?error=csrf_detected`);
  }

  try {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${config.dashboardUrl}/api/auth/callback`,
    });

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user details
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });

    // Fetch user's guilds
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });

    const discordUser = userResponse.data;
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    // Store minimal required info in session
    (req.session as any).user = {
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator || '0',
      avatar: avatarUrl,
      guilds: (guildsResponse.data || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        permissions: g.permissions,
      })),
      isDev: false,
    };

    return res.redirect(`${config.dashboardUrl}/dashboard`);
  } catch (error: any) {
    console.error('[OAuth Error]:', error.response?.data || error.message);
    return res.redirect(`${config.dashboardUrl}/?error=auth_failed`);
  }
});

// 3. Get current session
authRouter.get('/me', (req, res) => {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    user: {
      id: sessionUser.id,
      username: sessionUser.username,
      discriminator: sessionUser.discriminator,
      avatar: sessionUser.avatar,
    },
  });
});

// 4. Developer / Demo login (Disabled in production unless explicitly enabled)
authRouter.post('/dev-login', (req, res) => {
  if (!config.allowDevLogin) {
    return res.status(403).json({
      error: 'Developer login is disabled in production environment.',
    });
  }

  (req.session as any).user = {
    id: 'dev_user_123',
    username: 'DemoCommander',
    discriminator: '0',
    avatar: 'https://cdn-icons-png.flaticon.com/512/3845/3845814.png',
    guilds: [],
    isDev: true,
  };

  return res.json({
    authenticated: true,
    user: (req.session as any).user,
  });
});

// 5. Logout
authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});
