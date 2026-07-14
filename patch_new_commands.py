import re

with open('music.py', 'r') as f:
    content = f.read()

new_commands = """
@bot.command(aliases=['np', 'nowplaying'])
async def now_playing(ctx):
    \"\"\"Displays information about the currently playing song.\"\"\"
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
    \"\"\"Removes a specific song from the queue by its index (e.g. !remove 1).\"\"\"
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
    \"\"\"Clears the entire queue.\"\"\"
    guild_id = ctx.guild.id
    if guild_id in queues:
        queues[guild_id].clear()
        await ctx.send("Cleared the queue.")
    else:
        await ctx.send("The queue is already empty.")

@bot.command()
async def shuffle(ctx):
    \"\"\"Randomizes the order of songs in the current queue.\"\"\"
    guild_id = ctx.guild.id
    if guild_id in queues and len(queues[guild_id]) > 1:
        random.shuffle(queues[guild_id])
        await ctx.send("Shuffled the queue!")
    else:
        await ctx.send("Not enough songs in the queue to shuffle.")

@bot.command()
async def loop(ctx, mode: str = None):
    \"\"\"Toggles loop mode: 'off', 'song', or 'queue'.\"\"\"
    guild_id = ctx.guild.id
    if mode not in ['off', 'song', 'queue']:
        await ctx.send("Invalid mode. Use `!loop off`, `!loop song`, or `!loop queue`.")
        return

    loop_state[guild_id] = mode
    await ctx.send(f"Loop mode set to: **{mode}**")

@bot.command()
async def volume(ctx, volume: int):
    \"\"\"Changes the player's volume (0 to 200).\"\"\"
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
    \"\"\"Fetches and displays the lyrics for the currently playing song.\"\"\"
    guild_id = ctx.guild.id
    if guild_id not in current_song or not current_song[guild_id]:
        await ctx.send("Nothing is playing right now!")
        return

    title = current_song[guild_id]['title']

    # Simple clean up of title (e.g. remove "(Official Video)", "[Official Music Video]")
    clean_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', title).strip()

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
"""

content = content.replace("# Run the bot\nbot.run(TOKEN)", new_commands + "\n# Run the bot\nbot.run(TOKEN)")

with open('music.py', 'w') as f:
    f.write(content)
