import re

with open('music.py', 'r') as f:
    content = f.read()

play_search = """@bot.command()
async def play(ctx, *, query: str):
    \"\"\"Plays a song from a URL or searches by song name.\"\"\"
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

        # Check if query is a URL or a search term
        if query.startswith("http://") or query.startswith("https://"):
            url = query
            with yt_dlp.YoutubeDL(YTDL_OPTIONS) as ydl:
                info = ydl.extract_info(url, download=False)
                title = info.get('title', 'Unknown Title')
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

        # If nothing is playing, start immediately
        if not voice_client.is_playing():
            with yt_dlp.YoutubeDL(YTDL_OPTIONS) as ydl:
                info = ydl.extract_info(url, download=False)
                url2 = info['url']
                voice_client.play(discord.FFmpegPCMAudio(url2, **FFMPEG_OPTIONS), after=lambda e: play_next(ctx))
                await ctx.send(f"Now playing: {title}")
        else:
            # Add to queue
            if ctx.guild.id not in queues:
                queues[ctx.guild.id] = []
            queues[ctx.guild.id].append((title, url))
            await ctx.send(f"Added to queue: {title}")

    except Exception as e:
        await ctx.send(f"An error occurred: {str(e)}")
        if ctx.guild.id in voice_clients and not voice_clients[ctx.guild.id].is_playing():
            await voice_clients[ctx.guild.id].disconnect()
            del voice_clients[ctx.guild.id]"""

play_replace = """@bot.command()
async def play(ctx, *, query: str):
    \"\"\"Plays a song or playlist from a URL or searches by song name.\"\"\"
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
            del voice_clients[ctx.guild.id]"""

content = content.replace(play_search, play_replace)
with open('music.py', 'w') as f:
    f.write(content)
