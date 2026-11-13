import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { player, broadcastGuildState } from '../../music/player';

export const data = new SlashCommandBuilder()
  .setName('volume')
  .setDescription('Adjust the music playback volume')
  .addIntegerOption((option) =>
    option
      .setName('level')
      .setDescription('Volume percentage (1 - 150%)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(150)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const queue = player.nodes.get(interaction.guildId!);
  if (!queue || !queue.isPlaying()) {
    return interaction.reply({
      content: '❌ Nothing is currently playing in this server!',
      ephemeral: true,
    });
  }

  const level = interaction.options.getInteger('level', true);
  queue.node.setVolume(level);
  broadcastGuildState(interaction.guildId!);

  return interaction.reply({
    content: `🔊 Volume set to **${level}%**`,
  });
}
