with open('music.py', 'r') as f:
    content = f.read()

skip_search = """@bot.command()
async def skip(ctx):
    \"\"\"Skips the current song.\"\"\"
    if ctx.guild.id in voice_clients and voice_clients[ctx.guild.id].is_playing():
        voice_clients[ctx.guild.id].stop()
        await ctx.send("Skipped the current song.")
    else:
        await ctx.send("Nothing is playing to skip!")"""

skip_replace = """@bot.command()
async def skip(ctx):
    \"\"\"Skips the current song.\"\"\"
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
        await ctx.send("Nothing is playing to skip!")"""

queue_search = """@bot.command()
async def queue(ctx):
    \"\"\"Displays the current queue.\"\"\"
    if ctx.guild.id in queues and queues[ctx.guild.id]:
        queue_list = "\\n".join([f"{i+1}. {title}" for i, (title, _) in enumerate(queues[ctx.guild.id])])
        await ctx.send(f"Current queue:\\n{queue_list}")
    else:
        await ctx.send("The queue is empty!")"""

queue_replace = """@bot.command(aliases=['q'])
async def queue(ctx):
    \"\"\"Displays the current queue.\"\"\"
    guild_id = ctx.guild.id

    if guild_id not in queues or not queues[guild_id]:
        if guild_id in current_song and current_song[guild_id]:
            await ctx.send(f"The queue is empty, but currently playing: **{current_song[guild_id]['title']}**")
        else:
            await ctx.send("The queue is empty!")
        return

    queue_list = "\\n".join([f"{i+1}. {song['title']}" for i, song in enumerate(queues[guild_id][:10])])
    if len(queues[guild_id]) > 10:
        queue_list += f"\\n\\n...and {len(queues[guild_id]) - 10} more songs."

    embed = discord.Embed(title=f"Queue for {ctx.guild.name}", description=queue_list, color=discord.Color.blue())

    if guild_id in current_song and current_song[guild_id]:
        embed.set_footer(text=f"Currently playing: {current_song[guild_id]['title']}")

    await ctx.send(embed=embed)"""

content = content.replace(skip_search, skip_replace)
content = content.replace(queue_search, queue_replace)

with open('music.py', 'w') as f:
    f.write(content)
