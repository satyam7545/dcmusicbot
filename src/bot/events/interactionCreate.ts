import type { Interaction } from 'discord.js';
import { commandMap } from '../commands';
import { player, broadcastGuildState, fetchLyrics } from '../../music/player';
import { QueueRepeatMode } from 'discord-player';

export async function handleInteraction(interaction: Interaction) {
  // 1. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[Interaction] Error in /${interaction.commandName}:`, error);
      const replyFn = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
      await interaction[replyFn]({
        content: '⚠️ An unexpected error occurred while executing this command!',
      }).catch(() => {});
    }
    return;
  }

  // 2. Handle Autocomplete
  if (interaction.isAutocomplete()) {
    const command = commandMap.get(interaction.commandName);
    if (command && typeof command.autocomplete === 'function') {
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error(`[Autocomplete] Error in /${interaction.commandName}:`, err);
      }
    }
    return;
  }

  // 3. Handle Button Interactions from Embeds
  if (interaction.isButton()) {
    const queue = player.nodes.get(interaction.guildId!);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ Nothing is currently playing in this server!',
        ephemeral: true,
      });
    }

    const customId = interaction.customId;

    switch (customId) {
      case 'btn_play_pause': {
        if (queue.node.isPaused()) {
          queue.node.resume();
          broadcastGuildState(interaction.guildId!);
          return interaction.reply({ content: '▶️ Resumed music playback.', ephemeral: true });
        } else {
          queue.node.pause();
          broadcastGuildState(interaction.guildId!);
          return interaction.reply({ content: '⏸️ Paused music playback.', ephemeral: true });
        }
      }

      case 'btn_skip': {
        const title = queue.currentTrack?.title;
        queue.node.skip();
        broadcastGuildState(interaction.guildId!);
        return interaction.reply({ content: `⏭️ Skipped **${title || 'track'}**!`, ephemeral: true });
      }

      case 'btn_prev': {
        try {
          await queue.history.previous();
          broadcastGuildState(interaction.guildId!);
          return interaction.reply({ content: '⏮️ Playing previous track.', ephemeral: true });
        } catch {
          return interaction.reply({ content: '❌ No previous track in history!', ephemeral: true });
        }
      }

      case 'btn_loop': {
        const nextMode =
          queue.repeatMode === QueueRepeatMode.OFF
            ? QueueRepeatMode.TRACK
            : queue.repeatMode === QueueRepeatMode.TRACK
            ? QueueRepeatMode.QUEUE
            : QueueRepeatMode.OFF;

        queue.setRepeatMode(nextMode);
        broadcastGuildState(interaction.guildId!);
        const labels: Record<number, string> = {
          0: 'Off',
          1: '🔂 Current Track',
          2: '🔁 Queue',
        };
        return interaction.reply({
          content: `🔁 Loop mode set to: **${labels[nextMode]}**`,
          ephemeral: true,
        });
      }

      case 'btn_shuffle': {
        if (queue.tracks.size < 2) {
          return interaction.reply({
            content: '⚠️ Need at least 2 tracks in queue to shuffle!',
            ephemeral: true,
          });
        }
        queue.tracks.shuffle();
        broadcastGuildState(interaction.guildId!);
        return interaction.reply({
          content: `🔀 Shuffled **${queue.tracks.size}** tracks!`,
          ephemeral: true,
        });
      }

      case 'btn_stop': {
        queue.delete();
        broadcastGuildState(interaction.guildId!);
        return interaction.reply({
          content: '⏹️ Stopped playback and cleared queue.',
          ephemeral: true,
        });
      }

      case 'btn_lyrics': {
        if (!queue.currentTrack) {
          return interaction.reply({ content: '❌ No track currently playing!', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const cleanTitle = queue.currentTrack.title
          .replace(/\(.*\)|\[.*\]/g, '')
          .replace(/ft\..*|feat\..*/i, '')
          .trim();
        try {
          const lyricsData = await fetchLyrics(cleanTitle);
          if (!lyricsData || !lyricsData.lyrics) {
            return interaction.editReply(`❌ No lyrics found for **${cleanTitle}**`);
          }
          const text =
            lyricsData.lyrics.length > 1950
              ? lyricsData.lyrics.substring(0, 1940) + '...\n*(truncated)*'
              : lyricsData.lyrics;
          return interaction.editReply(`📜 **Lyrics for ${lyricsData.title || cleanTitle}:**\n\n${text}`);
        } catch {
          return interaction.editReply(`❌ Could not fetch lyrics for **${cleanTitle}**`);
        }
      }

      default:
        return;
    }
  }
}
