import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { player } from '../../music/player';
import { createMusicEmbed } from '../components/musicEmbed';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Show details and interactive buttons for the currently playing track');

export async function execute(interaction: ChatInputCommandInteraction) {
  const queue = player.nodes.get(interaction.guildId!);
  if (!queue || !queue.currentTrack) {
    return interaction.reply({
      content: '❌ Nothing is currently playing in this server!',
      ephemeral: true,
    });
  }

  const payload = createMusicEmbed(queue, queue.currentTrack);
  return interaction.reply(payload);
}
