import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { player, broadcastGuildState } from '../../music/player';
import { AVAILABLE_FILTERS } from '../../shared/constants';

export const data = new SlashCommandBuilder()
  .setName('filters')
  .setDescription('Toggle audio equalizer effects')
  .addStringOption((option) =>
    option
      .setName('effect')
      .setDescription('Audio DSP filter to toggle')
      .setRequired(true)
      .addChoices(
        ...AVAILABLE_FILTERS.map((f) => ({
          name: `${f.name} - ${f.description}`,
          value: f.id,
        })),
        { name: 'Clear All Filters', value: 'clear' }
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

  const effect = interaction.options.getString('effect', true);
  await interaction.deferReply();

  try {
    if (effect === 'clear') {
      await queue.filters.ffmpeg.setFilters([]);
      broadcastGuildState(interaction.guildId!);
      return interaction.editReply('✨ All audio filters cleared.');
    }

    // Toggle filter
    const isEnabled = queue.filters.ffmpeg.isEnabled(effect as any);
    await queue.filters.ffmpeg.toggle(effect as any);
    broadcastGuildState(interaction.guildId!);

    return interaction.editReply(
      `🎛️ **${effect}** filter is now **${!isEnabled ? 'ENABLED 🟢' : 'DISABLED 🔴'}**`
    );
  } catch (err: any) {
    return interaction.editReply(`❌ Failed to toggle filter: ${err.message}`);
  }
}
