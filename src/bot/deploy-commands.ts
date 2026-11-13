import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import { config, validateConfig } from '../config';

export async function deployCommands(guildId?: string) {
  const check = validateConfig();
  if (!check.isValid) {
    console.warn(`[Deploy Commands] Missing required config: ${check.missing.join(', ')}`);
    console.warn('[Deploy Commands] Slash commands registration skipped. Set these in .env when ready.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  const commandData = commands.map((cmd) => cmd.data.toJSON());

  try {
    console.log(`[Deploy Commands] Registering ${commandData.length} application slash commands...`);

    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, guildId),
        { body: commandData }
      );
      console.log(`[Deploy Commands] Successfully registered commands to test guild: ${guildId}`);
    } else {
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandData }
      );
      console.log('[Deploy Commands] Successfully registered global application commands!');
    }
  } catch (error) {
    console.error('[Deploy Commands] Error deploying commands:', error);
  }
}

// Allow standalone execution via `npm run deploy:commands`
if (process.argv[1]?.includes('deploy-commands')) {
  deployCommands();
}
