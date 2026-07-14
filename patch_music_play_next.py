import re

with open('music.py', 'r') as f:
    content = f.read()

def_play_next_search = """def play_next(ctx):
    \"\"\"Plays the next song in the queue.\"\"\"
    if ctx.guild.id in queues and queues[ctx.guild.id]:
        title, url = queues[ctx.guild.id].pop(0)
        voice_client = voice_clients[ctx.guild.id]
        with yt_dlp.YoutubeDL(YTDL_OPTIONS) as ydl:
            info = ydl.extract_info(url, download=False)
            url2 = info['url']
            voice_client.play(discord.FFmpegPCMAudio(url2, **FFMPEG_OPTIONS), after=lambda e: play_next(ctx))
        asyncio.run_coroutine_threadsafe(ctx.send(f"Now playing: {title}"), bot.loop)
    else:
        asyncio.run_coroutine_threadsafe(ctx.send("Queue is empty!"), bot.loop)
        if ctx.guild.id in voice_clients:
            asyncio.run_coroutine_threadsafe(voice_clients[ctx.guild.id].disconnect(), bot.loop)
            del voice_clients[ctx.guild.id]"""

def_play_next_replace = """def format_duration(seconds):
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
    \"\"\"Plays the next song in the queue.\"\"\"
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
"""

content = content.replace(def_play_next_search, def_play_next_replace)
with open('music.py', 'w') as f:
    f.write(content)
