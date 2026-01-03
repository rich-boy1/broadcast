import discord
from discord.ext import commands
import asyncio
import os
import random
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

client = commands.Bot(command_prefix=".", self_bot=True, help_command=None)

# ============ GLOBALS ============
ai_mode = False
cooldown_seconds = 6
last_ai_reply = 0
scheduled_posts = {}
genie_sessions = {}
REPLY_CHANCE = 0.8  # حماية ضد rate limit

# ================= READY =================
@client.event
async def on_ready():
    print(f"✅ Logged in as {client.user}")

# ================= AI TOGGLE =================
@client.command()
async def ai(ctx):
    global ai_mode
    ai_mode = not ai_mode
    await ctx.send(f"🤖 AI is now {'ON' if ai_mode else 'OFF'}", delete_after=4)

# ================= COOLDOWN COMMAND =================
@client.command()
async def cooldown(ctx, seconds: int):
    global cooldown_seconds
    cooldown_seconds = seconds
    await ctx.send(f"⏱️ تم ضبط الكول داون على {seconds} ثانية", delete_after=4)

# ================= GENIE GAME =================
def new_genie():
    return {"questions": [], "last_q": "", "confirmed": False}

async def genie_ask(session):
    prompt = "اسأل سؤال نعم او لا واحد فقط لتخمين شخصية أو كرتون أو شيء لا تكرر أسئلة سابقة."
    r = model.generate_content(prompt)
    session["last_q"] = r.text.strip()
    return session["last_q"]

async def genie_guess(session):
    prompt = f"المستخدم فكر في شيء. هذه الاسئلة واجابتها:\n{session['questions']}\nاعطني تخمين واحد فقط مختصر وواثق."
    r = model.generate_content(prompt)
    return r.text.strip()

# ================= MESSAGE HANDLER =================
@client.event
async def on_message(message):
    global last_ai_reply

    if message.author.id == client.user.id:
        await client.process_commands(message)
        return

    now = time.time()
    if now - last_ai_reply < cooldown_seconds:
        return

    mentioned = client.user.mentioned_in(message)
    replied = message.reference and message.reference.resolved and message.reference.resolved.author.id == client.user.id

    # ===== GENIE ACTIVE =====
    if message.author.id in genie_sessions:
        session = genie_sessions[message.author.id]

        if message.content.lower() in ["نعم", "لا"]:
            session["questions"].append(f"س: {session['last_q']} | ج: {message.content}")
            guess = await genie_guess(session)
            await message.reply(f"🤔 تخمين المارد: **{guess}** ؟")
            session["confirmed"] = True

        elif session.get("confirmed"):
            if "لا" in message.content.lower():
                await message.reply("🎉 مبروك كسبت علي 😄 تحب نكمل؟")
                del genie_sessions[message.author.id]
            else:
                await message.reply("😎 كنت متأكد!")
                del genie_sessions[message.author.id]

        else:
            q = await genie_ask(session)
            await message.reply(q)

        last_ai_reply = now
        return

    # ===== AI CHAT =====
    if ai_mode and (mentioned or replied or isinstance(message.channel, discord.DMChannel)):
        if random.random() > REPLY_CHANCE:
            return
        try:
            prompt = f"رد مختصر وبهيبة وبلهجة عامية:\n{message.content}"
            r = model.generate_content(prompt)
            await asyncio.sleep(random.uniform(1.5, 3))
            await message.reply(r.text[:1800])
            last_ai_reply = now
        except:
            pass

    await client.process_commands(message)

# ================= COMMANDS =================
@client.command()
async def genie(ctx):
    genie_sessions[ctx.author.id] = new_genie()
    q = await genie_ask(genie_sessions[ctx.author.id])
    await ctx.send("🧞‍♂️ فكر في شخصية او كرتون...\n" + q)

@client.command()
async def post(ctx, minutes: int, *, msg: str):
    await ctx.message.delete()
    async def loop():
        while True:
            await ctx.send(msg)
            await asyncio.sleep(minutes * 60)
    scheduled_posts[ctx.channel.id] = asyncio.create_task(loop())

@client.command()
async def stop_post(ctx):
    t = scheduled_posts.get(ctx.channel.id)
    if t:
        t.cancel()
        del scheduled_posts[ctx.channel.id]
        await ctx.send("🛑 تم ايقاف النشر", delete_after=3)

@client.command()
async def purge(ctx):
    await ctx.message.delete()
    async for m in ctx.channel.history(limit=100):
        if m.author.id == client.user.id:
            await m.delete()
            await asyncio.sleep(0.3)

@client.command()
async def tax(ctx, amount: int):
    await ctx.send(f"💰 الضريبة: {int(amount / 0.95) + 1}")

@client.command()
async def av(ctx, user: discord.User = None):
    user = user or ctx.author
    await ctx.send(user.avatar.url)

# ================= RUN =================
client.run(TOKEN)
