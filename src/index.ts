import http from 'http';
import { createExpressApp } from './server/app';
import { initSocket } from './server/socket';
import { client } from './bot/client';
import { initPlayer } from './music/player';
import { handleInteraction } from './bot/events/interactionCreate';
import { config, validateConfig } from './config';
import { deployCommands } from './bot/deploy-commands';

async function bootstrap() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('          HARMONIX - DISCORD MUSIC BOT & WEB DASHBOARD        ');
  console.log('══════════════════════════════════════════════════════════════');

  // 1. Initialize Express & HTTP Server
  const app = createExpressApp();
  const httpServer = http.createServer(app);

  // 2. Initialize Socket.IO
  initSocket(httpServer);

  // 3. Initialize Discord Player Extractors & Event Listeners
  await initPlayer();

  // 4. Bind Discord Client Events
  client.on('interactionCreate', handleInteraction);

  // 5. Start HTTP & WebSocket Server
  httpServer.listen(config.port, () => {
    console.log(`[Harmonix Web] Dashboard & API Server live at: http://localhost:${config.port}`);
    console.log(`[Harmonix Web] WebSocket Gateway listening on ws://localhost:${config.port}`);
  });

  // 6. Connect Discord Bot
  const check = validateConfig();
  if (check.isValid) {
    try {
      console.log('[Discord Bot] Logging in to Discord Gateway...');
      await client.login(config.discordToken);
      console.log('[Discord Bot] Connected and ready!');

      // Register slash commands
      await deployCommands();
    } catch (err: any) {
      console.error('[Discord Bot] Login failed:', err.message);
    }
  } else {
    console.warn(`[Discord Bot] Bot startup skipped: ${check.missing.join(', ')} not configured in .env`);
    console.warn('[Discord Bot] You can add your Discord Bot Token to .env anytime.');
    console.warn('[Discord Bot] The Web Dashboard is fully functional and ready for testing!');
  }
}

bootstrap().catch((err) => {
  console.error('[Fatal Bootstrap Error]:', err);
});
