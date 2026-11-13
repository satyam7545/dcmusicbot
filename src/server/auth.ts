import { Router } from 'express';
import axios from 'axios';
import { config } from '../config';

export const authRouter = Router();

// 1. Redirect to Discord OAuth2
authRouter.get('/discord', (req, res) => {
  if (!config.clientId || !config.clientSecret) {
    return res.status(500).json({
      error: 'Discord OAuth credentials (DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET) not set in .env',
      canDevLogin: true,
    });
  }

  const redirectUri = encodeURIComponent(`${config.dashboardUrl}/api/auth/callback`);
  const scope = encodeURIComponent('identify guilds');
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  
  return res.redirect(discordAuthUrl);
});

// 2. OAuth2 Callback
authRouter.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.redirect(`${config.dashboardUrl}/?error=no_code`);
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
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user details
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Fetch user's guilds
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const discordUser = userResponse.data;
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

    // Store in session
    (req.session as any).user = {
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator || '0',
      avatar: avatarUrl,
      accessToken,
      guilds: guildsResponse.data,
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

// 4. Developer / Demo login (for testing when credentials are not configured yet)
authRouter.post('/dev-login', (req, res) => {
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
    res.json({ success: true });
  });
});
