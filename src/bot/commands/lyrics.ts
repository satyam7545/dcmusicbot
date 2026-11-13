import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { player, fetchLyrics } from '../../music/player';

export const data = new SlashCommandBuilder()
  .setName('lyrics')
  .setDescription('Get lyrics for the current song or a search query')
  .addStringOption((option) =>
    option
      .setName('song')
      .setDescription('Song title (leave empty for current playing track)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const querySong = interaction.options.getString('song');
  const queue = player.nodes.get(interaction.guildId!);

  let searchTitle = querySong;
  if (!searchTitle) {
    if (!queue || !queue.currentTrack) {
      return interaction.reply({
        content: '❌ Nothing is playing. Provide a song name: `/lyrics <song>`',
        ephemeral: true,
      });
    }
    // Clean track title
    searchTitle = queue.currentTrack.title
      .replace(/\(.*\)|\[.*\]/g, '')
      .replace(/ft\..*|feat\..*/i, '')
      .trim();
  }

  await interaction.deferReply();

  try {
    const lyricsData = await fetchLyrics(searchTitle);
    if (!lyricsData || !lyricsData.lyrics) {
      return interaction.editReply(`❌ No lyrics found for **${searchTitle}**`);
    }

    const trimmedLyrics =
      lyricsData.lyrics.length > 4000
        ? lyricsData.lyrics.substring(0, 3990) + '...\n*(truncated)*'
        : lyricsData.lyrics;

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle(`📜 Lyrics: ${lyricsData.title || searchTitle}`)
      .setAuthor({ name: lyricsData.artist || 'Harmonix Lyrics' })
      .setDescription(trimmedLyrics)
      .setFooter({ text: 'Harmonix Music System' });

    return interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    return interaction.editReply(`❌ Could not fetch lyrics: ${err.message || 'Unknown error'}`);
  }
}
