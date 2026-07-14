import discord
from discord.ext import commands
import yt_dlp
import asyncio
from dotenv import load_dotenv
import os
import random
import aiohttp
import urllib.parse
import re


# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# FFmpeg options
FFMPEG_OPTIONS = {
    'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
    'options': '-vn'
}

# YTDL options
YTDL_OPTIONS = {
    'format': 'bestaudio/best',
    'noplaylist': True,
    'quiet': True,
    'cookiefile': 'cookies.txt',  # Update this if needed
}

# Store voice clients and queues
voice_clients = {}
queues = {}
current_song = {}
loop_state = {} # 'off', 'song', 'queue'
volumes = {} # 0.0 to 2.0 (default 1.0)

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')

def format_duration(seconds):
    if not seconds:
        return "Unknown"
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"

async def send_np_embed(ctx, info, url):
    embed = discord.Embed(title="Now Playing", description=f"[{info.get('title', 'Unknown')}]({url})", color=discord.Color.green())
    if info.get('thumbnail'):
        embed.set_thumbnail(url=info.get('thumbnail'))
    duration = format_duration(info.get('duration', 0))
    embed.add_field(name="Duration", value=duration, inline=True)

    guild_id = ctx.guild.id
    vol = int(volumes.get(guild_id, 1.0) * 100)
    loop_status = loop_state.get(guild_id, 'off')

    embed.add_field(name="Volume", value=f"{vol}%", inline=True)
    embed.add_field(name="Looping", value=loop_status.capitalize(), inline=True)

    await ctx.send(embed=embed)

def play_next(ctx):
    """Plays the next song in the queue."""
    guild_id = ctx.guild.id

    # Check loop state for current song
    if loop_state.get(guild_id) == 'song' and current_song.get(guild_id):
        # We replay the current song
        song = current_song[guild_id]
        # don't pop from queue
    elif queues.get(guild_id):
        # Get next song from queue
        song = queues[guild_id].pop(0)

        # If queue looping is on, append the current song to the end of the queue
        if loop_state.get(guild_id) == 'queue' and current_song.get(guild_id):
            queues[guild_id].append(current_song[guild_id])

        current_song[guild_id] = song
    else:
        # Nothing left to play
        if loop_state.get(guild_id) == 'queue' and current_song.get(guild_id):
            # queue has 0 items but loop queue is on, and we just finished a song. Replay it.
            song = current_song[guild_id]
        else:
            current_song.pop(guild_id, None)
            asyncio.run_coroutine_threadsafe(ctx.send("Queue is empty!"), bot.loop)
            if guild_id in voice_clients:
                asyncio.run_coroutine_threadsafe(voice_clients[guild_id].disconnect(), bot.loop)
                del voice_clients[guild_id]
            return

    title, url = song['title'], song['url']
    voice_client = voice_clients[guild_id]

    try:
        with yt_dlp.YoutubeDL(YTDL_OPTIONS) as ydl:
            info = ydl.extract_info(url, download=False)
            url2 = info['url']

            audio_source = discord.FFmpegPCMAudio(url2, **FFMPEG_OPTIONS)
            volume = volumes.get(guild_id, 1.0)
            audio_source = discord.PCMVolumeTransformer(audio_source, volume=volume)

            voice_client.play(audio_source, after=lambda e: play_next(ctx))

            # Update current song info with more details for embed
            current_song[guild_id].update({'info': info})

            asyncio.run_coroutine_threadsafe(send_np_embed(ctx, info, url), bot.loop)
    except Exception as e:
        print(f"Error in play_next: {e}")
        asyncio.run_coroutine_threadsafe(ctx.send(f"Error playing {title}: {e}"), bot.loop)
        play_next(ctx) # Skip to next song


@bot.command()
async def play(ctx, *, query: str):
    """Plays a song or playlist from a URL or searches by song name."""
    try:
        if not ctx.author.voice:
            await ctx.send("You need to be in a voice channel to play music!")
            return

        channel = ctx.author.voice.channel
        if ctx.guild.id not in voice_clients:
            voice_client = await channel.connect()
            voice_clients[ctx.guild.id] = voice_client
        else:
            voice_client = voice_clients[ctx.guild.id]

        guild_id = ctx.guild.id
        if guild_id not in queues:
            queues[guild_id] = []

        added_songs = []

        # Check if query is a URL or a search term
        if query.startswith("http://") or query.startswith("https://"):
            playlist_options = dict(YTDL_OPTIONS)
            playlist_options['extract_flat'] = True
            playlist_options['noplaylist'] = False

            with yt_dlp.YoutubeDL(playlist_options) as ydl:
                info = ydl.extract_info(query, download=False)

                if 'entries' in info:
                    # It's a playlist
                    for entry in info['entries']:
                        if not entry:
                            continue
                        url = entry.get('url') or entry.get('webpage_url')
                        title = entry.get('title', 'Unknown Title')
                        added_songs.append({'title': title, 'url': url})
                        queues[guild_id].append({'title': title, 'url': url})

                    embed = discord.Embed(title="Playlist Added", description=f"Added {len(added_songs)} songs to the queue.", color=discord.Color.blue())
                    await ctx.send(embed=embed)
                else:
                    url = query
                    title = info.get('title', 'Unknown Title')
                    added_songs.append({'title': title, 'url': url})
                    queues[guild_id].append({'title': title, 'url': url})
        else:
            # Search YouTube using yt-dlp
            search_options = {
                'format': 'bestaudio/best',
                'noplaylist': True,
                'quiet': True,
                'cookiefile': 'cookies.txt',
                'default_search': 'ytsearch',  # Use YouTube search
                'max_downloads': 1,  # Limit to 1 result
            }
            with yt_dlp.YoutubeDL(search_options) as ydl:
                info = ydl.extract_info(query, download=False)
                if 'entries' not in info or not info['entries']:
                    await ctx.send("No results found for that song!")
                    return
                url = info['entries'][0].get('webpage_url', info['entries'][0].get('url'))
                title = info['entries'][0]['title']
                added_songs.append({'title': title, 'url': url})
                queues[guild_id].append({'title': title, 'url': url})

        # If nothing is playing, start immediately
        if not voice_client.is_playing() and not voice_client.is_paused():
            play_next(ctx)
        elif len(added_songs) == 1:
            embed = discord.Embed(title="Added to Queue", description=f"[{added_songs[0]['title']}]({added_songs[0]['url']})", color=discord.Color.blue())
            await ctx.send(embed=embed)

    except Exception as e:
        await ctx.send(f"An error occurred: {str(e)}")
        if ctx.guild.id in voice_clients and not voice_clients[ctx.guild.id].is_playing():
            await voice_clients[ctx.guild.id].disconnect()
            del voice_clients[ctx.guild.id]

@bot.command()
async def pause(ctx):
    """Pauses the current song."""
    if ctx.guild.id in voice_clients and voice_clients[ctx.guild.id].is_playing():
        voice_clients[ctx.guild.id].pause()
        await ctx.send("Paused the music.")
    else:
        await ctx.send("Nothing is playing!")

@bot.command()
async def resume(ctx):
    """Resumes the paused song."""
    if ctx.guild.id in voice_clients and voice_clients[ctx.guild.id].is_paused():
        voice_clients[ctx.guild.id].resume()
        await ctx.send("Resumed the music.")
    else:
        await ctx.send("Nothing is paused!")

@bot.command()
async def skip(ctx):
    """Skips the current song."""
    guild_id = ctx.guild.id
    if guild_id in voice_clients and voice_clients[guild_id].is_playing():
        # Temporarily disable song loop so it actually skips
        original_loop = loop_state.get(guild_id)
        if original_loop == 'song':
            loop_state[guild_id] = 'off'

        voice_clients[guild_id].stop()
        await ctx.send("Skipped the current song.")

        # Restore loop state if we had to change it
        if original_loop == 'song':
            # Wait for play_next to be called via the 'after' callback, then restore
            import asyncio
            async def restore_loop():
                await asyncio.sleep(1)
                loop_state[guild_id] = 'song'
            asyncio.run_coroutine_threadsafe(restore_loop(), bot.loop)
    else:
        await ctx.send("Nothing is playing to skip!")

@bot.command(aliases=['q'])
async def queue(ctx):
    """Displays the current queue."""
    guild_id = ctx.guild.id

    if guild_id not in queues or not queues[guild_id]:
        if guild_id in current_song and current_song[guild_id]:
            await ctx.send(f"The queue is empty, but currently playing: **{current_song[guild_id]['title']}**")
        else:
            await ctx.send("The queue is empty!")
        return

    queue_list = "\n".join([f"{i+1}. {song['title']}" for i, song in enumerate(queues[guild_id][:10])])
    if len(queues[guild_id]) > 10:
        queue_list += f"\n\n...and {len(queues[guild_id]) - 10} more songs."

    embed = discord.Embed(title=f"Queue for {ctx.guild.name}", description=queue_list, color=discord.Color.blue())

    if guild_id in current_song and current_song[guild_id]:
        embed.set_footer(text=f"Currently playing: {current_song[guild_id]['title']}")

    await ctx.send(embed=embed)

@bot.command()
async def stop(ctx):
    """Stops the music and clears the queue."""
    if ctx.guild.id in voice_clients:
        voice_clients[ctx.guild.id].stop()
        if ctx.guild.id in queues:
            del queues[ctx.guild.id]
        await voice_clients[ctx.guild.id].disconnect()
        del voice_clients[ctx.guild.id]
        await ctx.send("Stopped and disconnected.")
    else:
        await ctx.send("I'm not playing anything!")

@bot.command()
async def leave(ctx):
    """Makes the bot leave the voice channel."""
    if ctx.guild.id in voice_clients:
        if ctx.guild.id in queues:
            del queues[ctx.guild.id]
        await voice_clients[ctx.guild.id].disconnect()
        del voice_clients[ctx.guild.id]
        await ctx.send("Left the voice channel.")
    else:
        await ctx.send("I'm not in a voice channel!")


@bot.command(aliases=['np', 'nowplaying'])
async def now_playing(ctx):
    """Displays information about the currently playing song."""
    guild_id = ctx.guild.id
    if guild_id in current_song and current_song[guild_id]:
        song = current_song[guild_id]
        if 'info' in song:
            await send_np_embed(ctx, song['info'], song['url'])
        else:
            await ctx.send(f"Currently playing: {song['title']}")
    else:
        await ctx.send("Nothing is playing right now!")

@bot.command()
async def remove(ctx, index: int):
    """Removes a specific song from the queue by its index (e.g. !remove 1)."""
    guild_id = ctx.guild.id
    if guild_id in queues and queues[guild_id]:
        if 1 <= index <= len(queues[guild_id]):
            removed = queues[guild_id].pop(index - 1)
            await ctx.send(f"Removed **{removed['title']}** from the queue.")
        else:
            await ctx.send("Invalid queue index.")
    else:
        await ctx.send("The queue is empty.")

@bot.command()
async def clear(ctx):
    """Clears the entire queue."""
    guild_id = ctx.guild.id
    if guild_id in queues:
        queues[guild_id].clear()
        await ctx.send("Cleared the queue.")
    else:
        await ctx.send("The queue is already empty.")

@bot.command()
async def shuffle(ctx):
    """Randomizes the order of songs in the current queue."""
    guild_id = ctx.guild.id
    if guild_id in queues and len(queues[guild_id]) > 1:
        random.shuffle(queues[guild_id])
        await ctx.send("Shuffled the queue!")
    else:
        await ctx.send("Not enough songs in the queue to shuffle.")

@bot.command()
async def loop(ctx, mode: str = None):
    """Toggles loop mode: 'off', 'song', or 'queue'."""
    guild_id = ctx.guild.id
    if mode not in ['off', 'song', 'queue']:
        await ctx.send("Invalid mode. Use `!loop off`, `!loop song`, or `!loop queue`.")
        return

    loop_state[guild_id] = mode
    await ctx.send(f"Loop mode set to: **{mode}**")

@bot.command()
async def volume(ctx, volume: int):
    """Changes the player's volume (0 to 200)."""
    if 0 <= volume <= 200:
        guild_id = ctx.guild.id
        volumes[guild_id] = volume / 100.0

        # update current playing volume if possible
        if guild_id in voice_clients and voice_clients[guild_id].source:
            # We can't directly alter discord.PCMVolumeTransformer volume once playing without accessing its .volume
            # discord.py's voice_client.source is the transformed source
            if hasattr(voice_clients[guild_id].source, 'volume'):
                voice_clients[guild_id].source.volume = volumes[guild_id]

        await ctx.send(f"Volume set to {volume}%")
    else:
        await ctx.send("Volume must be between 0 and 200.")

@bot.command()
async def lyrics(ctx):
    """Fetches and displays the lyrics for the currently playing song."""
    guild_id = ctx.guild.id
    if guild_id not in current_song or not current_song[guild_id]:
        await ctx.send("Nothing is playing right now!")
        return

    title = current_song[guild_id]['title']

    # Simple clean up of title (e.g. remove "(Official Video)", "[Official Music Video]")
    clean_title = re.sub(r'[[({].*?[]})]', '', title).strip()

    await ctx.send(f"Searching lyrics for: **{clean_title}**...")

    url = f"https://lrclib.net/api/search?q={urllib.parse.quote(clean_title)}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if data and len(data) > 0:
                    lyrics_text = data[0].get('plainLyrics')
                    if lyrics_text:
                        # Discord messages max length is 2000 chars. We might need to split it or use embed description
                        embed = discord.Embed(title=f"Lyrics for {clean_title}", color=discord.Color.purple())

                        if len(lyrics_text) > 4096:
                            lyrics_text = lyrics_text[:4093] + "..."

                        embed.description = lyrics_text
                        await ctx.send(embed=embed)
                        return

    await ctx.send(f"Could not find lyrics for {clean_title}.")

# Run the bot
bot.run(TOKEN)
