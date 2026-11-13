import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('dashboard')
  .setDescription('Get the direct link to the Harmonix Web Dashboard');

export async function execute(interaction: ChatInputCommandInteraction) {
  const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
  const targetUrl = interaction.guildId
    ? `${dashboardUrl}/dashboard?guild=${interaction.guildId}`
    : dashboardUrl;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🎛️ Harmonix Music Web Dashboard')
    .setDescription(
      `Control playback, view the real-time queue, drag-and-drop tracks, search YouTube/Spotify, and toggle 3D audio filters directly in your browser!`
    )
    .addFields(
      { name: 'Server', value: `\`${interaction.guild?.name || 'Current Guild'}\``, inline: true },
      { name: 'Dashboard URL', value: targetUrl, inline: true }
    )
    .setFooter({ text: 'Harmonix Music System' });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Open Web Dashboard')
      .setStyle(ButtonStyle.Link)
      .setURL(targetUrl)
      .setEmoji('🎛️')
  );

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}
