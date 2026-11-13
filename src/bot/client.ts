import { Client, GatewayIntentBits, Partials } from 'discord.js';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User],
});

client.once('ready', (c) => {
  console.log(`[Discord Bot] Logged in successfully as ${c.user.tag}`);
});
