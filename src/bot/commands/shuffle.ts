import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { player, broadcastGuildState } from '../../music/player';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Shuffle the tracks currently in the queue');

export async function execute(interaction: ChatInputCommandInteraction) {
  const queue = player.nodes.get(interaction.guildId!);
  if (!queue || !queue.isPlaying()) {
    return interaction.reply({
      content: '❌ Nothing is currently playing in this server!',
      ephemeral: true,
    });
  }

  if (queue.tracks.size < 2) {
    return interaction.reply({
      content: '⚠️ You need at least 2 tracks in the queue to shuffle!',
      ephemeral: true,
    });
  }

  queue.tracks.shuffle();
  broadcastGuildState(interaction.guildId!);

  return interaction.reply({
    content: `🔀 Shuffled **${queue.tracks.size}** tracks in the queue!`,
  });
}
