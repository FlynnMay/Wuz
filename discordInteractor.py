import discord
from discord.ext import commands
from discord.commands.options import Option
from speaker import queue
class Interactor:
    bot = commands.Bot()

    def __init__(self):
        self.bot.run("MTE2MjYyNzU5MTUyMjUwNDcyNA.G6WRa1.mcO-h_NUUD7CcpUCAmdGkw__4tsZpxfZrPIwII")

    @bot.slash_command(name="talk", description="Sends a TTS Message to the speaker", guild_ids=[931439358123343872, 908992837650120775])
    async def talk(ctx: discord.ApplicationContext, voice: Option(str, "Enter the name of the voice to speak your message"), message: Option(str, "The message you would like the voice to say")):
        await ctx.respond(f"Definetly talking as {voice}, and am for sure saying {message}")
        queue(voice, message)
        