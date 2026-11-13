import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { player, broadcastGuildState } from '../../music/player';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pause the current music playback');

export async function execute(interaction: ChatInputCommandInteraction) {
  const queue = player.nodes.get(interaction.guildId!);
  if (!queue || !queue.isPlaying()) {
    return interaction.reply({
      content: '❌ Nothing is currently playing in this server!',
      ephemeral: true,
    });
  }

  if (queue.node.isPaused()) {
    return interaction.reply({
      content: '⚠️ Playback is already paused! Use `/resume` to resume.',
      ephemeral: true,
    });
  }

  queue.node.pause();
  broadcastGuildState(interaction.guildId!);

  return interaction.reply({
    content: '⏸️ Paused the music playback.',
  });
}
