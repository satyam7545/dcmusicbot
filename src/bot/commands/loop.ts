import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { player, broadcastGuildState } from '../../music/player';
import { QueueRepeatMode } from 'discord-player';

export const data = new SlashCommandBuilder()
  .setName('loop')
  .setDescription('Set the loop repeat mode')
  .addStringOption((option) =>
    option
      .setName('mode')
      .setDescription('Loop mode')
      .setRequired(true)
      .addChoices(
        { name: 'Off', value: 'off' },
        { name: 'Track', value: 'track' },
        { name: 'Queue', value: 'queue' },
        { name: 'Autoplay (Endless similar tracks)', value: 'autoplay' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const queue = player.nodes.get(interaction.guildId!);
  if (!queue || !queue.isPlaying()) {
    return interaction.reply({
      content: '❌ Nothing is currently playing in this server!',
      ephemeral: true,
    });
  }

  const mode = interaction.options.getString('mode', true);
  let repeatMode: any = QueueRepeatMode.OFF;
  let label = 'Off';

  if (mode === 'track') {
    repeatMode = QueueRepeatMode.TRACK;
    label = '🔂 Current Track';
  } else if (mode === 'queue') {
    repeatMode = QueueRepeatMode.QUEUE;
    label = '🔁 Entire Queue';
  } else if (mode === 'autoplay') {
    repeatMode = QueueRepeatMode.AUTOPLAY;
    label = '♾️ Autoplay Recommended Music';
  }

  queue.setRepeatMode(repeatMode);
  broadcastGuildState(interaction.guildId!);

  return interaction.reply({
    content: `🔁 Loop mode set to: **${label}**`,
  });
}
