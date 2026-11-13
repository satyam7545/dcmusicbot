import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import type { GuildQueue, Track } from 'discord-player';

export function createMusicEmbed(queue: GuildQueue<any>, track: Track) {
  // Source icon
  let sourceLabel = 'Harmonix Music';
  let color = 0x1db954; // Spotify green default

  if (track.raw?.source === 'youtube' || track.url.includes('youtu')) {
    sourceLabel = 'YouTube Music';
    color = 0xff0000;
  } else if (track.raw?.source === 'spotify' || track.url.includes('spotify')) {
    sourceLabel = 'Spotify';
    color = 0x1db954;
  } else if (track.raw?.source === 'soundcloud' || track.url.includes('soundcloud')) {
    sourceLabel = 'SoundCloud';
    color = 0xff5500;
  }

  const progressBar = queue.node.createProgressBar({
    timecodes: true,
    length: 12,
  }) || `${track.duration}`;

  const isPaused = queue.node.isPaused();
  const loopMode = queue.repeatMode === 1 ? '🔂 Track' : queue.repeatMode === 2 ? '🔁 Queue' : queue.repeatMode === 3 ? '♾️ Autoplay' : 'Off';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `Now Playing • ${sourceLabel}`,
      iconURL: 'https://cdn-icons-png.flaticon.com/512/3845/3845814.png',
    })
    .setTitle(track.title.length > 250 ? track.title.substring(0, 247) + '...' : track.title)
    .setURL(track.url)
    .setThumbnail(track.thumbnail || null)
    .addFields(
      { name: 'Channel / Artist', value: `\`${track.author || 'Unknown'}\``, inline: true },
      { name: 'Duration', value: `\`${track.duration}\``, inline: true },
      { name: 'Requested By', value: track.requestedBy ? `<@${track.requestedBy.id}>` : '`Web Dashboard`', inline: true },
      { name: 'Playback Progress', value: `\`\`\`${progressBar}\`\`\``, inline: false },
    )
    .setFooter({
      text: `🔊 Vol: ${queue.node.volume}% | 🔁 Loop: ${loopMode} | 📋 Queue: ${queue.tracks.size} tracks`,
    });

  // Action Buttons Row 1: Controls
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_prev')
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_play_pause')
      .setEmoji(isPaused ? '▶️' : '⏸️')
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_skip')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_loop')
      .setEmoji('🔁')
      .setStyle(queue.repeatMode !== 0 ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_stop')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger)
  );

  // Action Buttons Row 2: Secondary / Web Dashboard Link
  const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_shuffle')
      .setEmoji('🔀')
      .setLabel('Shuffle')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_lyrics')
      .setEmoji('📜')
      .setLabel('Lyrics')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel('Web Dashboard')
      .setEmoji('🎛️')
      .setStyle(ButtonStyle.Link)
      .setURL(`${dashboardUrl}/dashboard?guild=${queue.guild.id}`)
  );

  return {
    embeds: [embed],
    components: [row1, row2],
  };
}
