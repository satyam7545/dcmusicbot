import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  GuildMember,
} from 'discord.js';
import { player, broadcastGuildState } from '../../music/player';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song or playlist from YouTube, Spotify, or SoundCloud')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('Song title, artist, YouTube URL, or Spotify track/album/playlist link')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused();
  if (!focusedValue || focusedValue.trim().length === 0) {
    return interaction.respond([]);
  }

  try {
    const results = await player.search(focusedValue, {
      requestedBy: interaction.user,
    });

    const choices = results.tracks.slice(0, 5).map((track) => {
      const title = `${track.title} (${track.duration}) by ${track.author}`;
      return {
        name: title.length > 100 ? title.substring(0, 97) + '...' : title,
        value: track.url,
      };
    });

    await interaction.respond(choices);
  } catch (err) {
    await interaction.respond([]);
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    return interaction.reply({
      content: '❌ You must be connected to a voice channel to use this command!',
      ephemeral: true,
    });
  }

  const query = interaction.options.getString('query', true);
  await interaction.deferReply();

  try {
    const searchResult = await player.search(query, {
      requestedBy: interaction.user,
    });

    if (!searchResult || !searchResult.tracks.length) {
      return interaction.editReply({
        content: `❌ No results found for **${query}**!`,
      });
    }

    const { track } = await player.play(voiceChannel, searchResult, {
      nodeOptions: {
        metadata: {
          channel: interaction.channel,
          client: interaction.guild?.members.me,
          requestedBy: interaction.user,
        },
        volume: 80,
        bufferingTimeout: 3000,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300_000,
        leaveOnEnd: false,
      },
    });

    broadcastGuildState(interaction.guildId!);

    if (searchResult.playlist) {
      return interaction.editReply({
        content: `🎶 Loaded playlist **[${searchResult.playlist.title}](${searchResult.playlist.url})** with **${searchResult.tracks.length}** tracks!`,
      });
    }

    return interaction.editReply({
      content: `🎵 Enqueued **[${track.title}](${track.url})** by \`${track.author}\` (\`${track.duration}\`)`,
    });
  } catch (error: any) {
    console.error('[Command: play] Error:', error);
    return interaction.editReply({
      content: `❌ An error occurred while trying to play: \`${error.message || 'Unknown error'}\``,
    });
  }
}
