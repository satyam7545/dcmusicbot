import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { player } from '../../music/player';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('View the current server queue');

export async function execute(interaction: ChatInputCommandInteraction) {
  const queue = player.nodes.get(interaction.guildId!);
  if (!queue || !queue.isPlaying()) {
    return interaction.reply({
      content: '❌ Nothing is currently playing in this server!',
      ephemeral: true,
    });
  }

  const currentTrack = queue.currentTrack;
  const tracks = queue.tracks.toArray();

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🎶 Queue for ${interaction.guild?.name}`)
    .setDescription(
      `**Now Playing:**\n[${currentTrack?.title}](${currentTrack?.url}) - \`${currentTrack?.duration}\` (Requested by: <@${currentTrack?.requestedBy?.id}>)\n\n` +
      `**Up Next (${tracks.length} tracks):**\n` +
      (tracks.length
        ? tracks
            .slice(0, 10)
            .map((t, idx) => `**${idx + 1}.** [${t.title}](${t.url}) - \`${t.duration}\``)
            .join('\n') + (tracks.length > 10 ? `\n*...and ${tracks.length - 10} more tracks*` : '')
        : '*No more tracks in queue.*')
    )
    .setFooter({
      text: `Total Duration: ${queue.durationFormatted} | Loop Mode: ${queue.repeatMode}`,
    });

  return interaction.reply({ embeds: [embed] });
}
