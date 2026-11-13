import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { player, broadcastGuildState } from '../../music/player';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip the currently playing track');

export async function execute(interaction: ChatInputCommandInteraction) {
  const queue = player.nodes.get(interaction.guildId!);
  if (!queue || !queue.isPlaying()) {
    return interaction.reply({
      content: '❌ Nothing is currently playing in this server!',
      ephemeral: true,
    });
  }

  const current = queue.currentTrack;
  queue.node.skip();
  broadcastGuildState(interaction.guildId!);

  return interaction.reply({
    content: `⏭️ Skipped **${current?.title || 'current song'}**!`,
  });
}
