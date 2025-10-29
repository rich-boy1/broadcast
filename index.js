require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is alive! ✅'));
app.listen(port, () => console.log(`✅ Express server running on port ${port}`));

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Collection
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

const authorizedIDs = ['1245113569201094776','1364673596806533132','1057325112724049983']; // فقط المالك الحقيقي
const mainServerId = '1386543197018132560';
const LOG_CHANNEL_ID = "1422532389669830714";

let sending = false;
let speed = 10 * 1000;
let sentCount = 0;

const commands = [
    new SlashCommandBuilder().setName('help').setDescription('📜 خد هساعدك يخويا.'),
    new SlashCommandBuilder().setName('status').setDescription('🚀 عرض حالة التقدم وعدد من تم الإرسال لهم.'),
    new SlashCommandBuilder().setName('servers').setDescription('📜 عرض السيرفرات.'),
    new SlashCommandBuilder().setName('stop').setDescription('🛑 إيقاف الإرسال الحالي.'),
    new SlashCommandBuilder()
        .setName('setspeed')
        .setDescription('⚙️ تغيير سرعة الإرسال بالثواني.')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('عدد الثواني').setRequired(true)),
    new SlashCommandBuilder()
        .setName('nitro-bc')
        .setDescription('🎁 إرسال نيترو لكل الأعضاء الأونلاين.')
        .addStringOption(opt => opt.setName('link').setDescription('رابط النيترو').setRequired(true)),
    new SlashCommandBuilder()
        .setName('bc')
        .setDescription('✉️ إرسال رسالة للأعضاء الأونلاين في السيرفر.')
        .addStringOption(opt => opt.setName('message').setDescription('نص الرسالة').setRequired(true)),
    // ✅ الأمر الجديد لتغيير حالة البوت
    new SlashCommandBuilder()
        .setName('setstatus')
        .setDescription('🟢 تغيير حالة البوت (online / idle / dnd / invisible).')
        .addStringOption(opt =>
            opt
                .setName('status')
                .setDescription('اختر الحالة الجديدة.')
                .setRequired(true)
                .addChoices(
                    { name: '🟢 Online', value: 'online' },
                    { name: '🌙 Idle', value: 'idle' },
                    { name: '⛔ DND (مشغول)', value: 'dnd' },
                    { name: '⚫ Invisible (أوفلاين)', value: 'invisible' }
                )
        ),
];

client.commands = new Collection();
commands.forEach(cmd => client.commands.set(cmd.name, cmd));

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands.map(c => c.toJSON()) });
    console.log('✅ Slash commands registered globally.');

    // 🔴 الحالة الافتراضية: أوفلاين
    client.user.setPresence({ status: 'invisible' });
    console.log('🔴 تم تعيين حالة البوت إلى Offline بشكل افتراضي.');
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    const isAdminCommand = ['stop', 'setspeed', 'nitro-bc', 'bc', 'setstatus'].includes(commandName);

    // التحقق من صلاحية المستخدم
    if (isAdminCommand && !authorizedIDs.includes(interaction.user.id)) {
        return interaction.reply({ content: 'مفكر نفسك روني ولا إيه؟ ❌', flags: 64 });
    }

    if (commandName === 'help') {
        return interaction.reply({
            content: `📜 **أوامر البوت:**\n\n`
                + `1️⃣ /status - يعرض حالة التقدم وعدد المرسلين.\n`
                + `2️⃣ /servers - يعرض السيرفرات اللي فيها البوت.\n`
                + `3️⃣ /stop - يوقف الإرسال الحالي.\n`
                + `4️⃣ /setspeed <ثواني> - يغير سرعة الإرسال.\n`
                + `5️⃣ /nitro-bc <link> - يرسل نيترو للأعضاء الأونلاين.\n`
                + `6️⃣ /bc <message> - يرسل رسالة للأعضاء الأونلاين.\n`
                + `7️⃣ /setstatus <الحالة> - يغير حالة البوت.\n`
                + `8️⃣ /help - عرض المساعدة.`,
        });
    }

    else if (commandName === 'status') {
        return interaction.reply({
            content: `🚀 الحالة: ${sending ? `الإرسال جاري ✅ (أُرسل إلى ${sentCount} عضو)` : `❌ لا يوجد إرسال حالي. تم الإرسال لـ ${sentCount} عضو.`}`
        });
    }

    else if (commandName === 'servers') {
        const servers = client.guilds.cache.map((g, i) => `${i + 1}. ${g.name}`).join('\n');
        return interaction.reply({ content: `📜 السيرفرات التي يوجد فيها البوت:\n${servers}` });
    }

    else if (commandName === 'stop') {
        sending = false;
        return interaction.reply({ content: '🛑 تم إيقاف الإرسال الحالي.' });
    }

    else if (commandName === 'setspeed') {
        const sec = interaction.options.getInteger('seconds');
        speed = sec * 1000;
        return interaction.reply({ content: `⚙️ تم تعيين سرعة الإرسال إلى **${sec} ثانية**.` });
    }

    else if (commandName === 'nitro-bc') {
        const link = interaction.options.getString('link');
        await interaction.reply({ content: '🚀 بدأ إرسال نيترو للأعضاء الأونلاين...' });

        sending = true;
        sentCount = 0;
        const sentUsers = new Set();

        for (const [id, guild] of client.guilds.cache) {
            if (!sending) break;
            try {
                const members = await guild.members.fetch({ withPresences: true });
                for (const member of members.values()) {
                    if (!sending) break;
                    const status = member.presence?.status;
                    if (!member.user.bot && ['online', 'idle', 'dnd'].includes(status) && !sentUsers.has(member.user.id)) {
                        try {
                            const embed = new EmbedBuilder()
                                .setColor(0x5865F2)
                                .setDescription(`🎁 Hello ${member.toString()},\nYou’ve been gifted a **Discord Nitro Boost (1 year)**!\nClick below to claim your Nitro!`)
                                .setImage('https://cdn.discordapp.com/attachments/1344770064703946802/1362981864305987594/271-A2-D28-057-B-4-B8-F-ADDE-A547-CC3-E36-B8.jpg')
                                .setFooter({ text: `🎉 Gift sent!` });

                            const button = new ButtonBuilder()
                                .setLabel('Claim')
                                .setStyle(ButtonStyle.Link)
                                .setURL(link)
                                .setEmoji('🎁');

                            const row = new ActionRowBuilder().addComponents(button);

                            await member.send({ embeds: [embed], components: [row] });
                            sentUsers.add(member.user.id);
                            sentCount++;
                            console.log(`📤 Sent to ${member.user.tag}`);
                            await sleep(speed);
                        } catch { }
                    }
                }
            } catch { }
        }
    }

    else if (commandName === 'bc') {
        const msg = interaction.options.getString('message');
        const guild = client.guilds.cache.get(mainServerId);
        if (!guild) return interaction.reply({ content: '❌ السيرفر الأساسي غير موجود.' });

        await interaction.reply({ content: '🚀 جاري إرسال الرسائل...' });

        const members = await guild.members.fetch({ withPresences: true });
        for (const member of members.values()) {
            const status = member.presence?.status;
            if (!member.user.bot && ['online', 'idle', 'dnd'].includes(status)) {
                member.send(`${msg}\n${member.toString()}`).catch(() => { });
                sentCount++;
                await sleep(speed);
            }
        }
    }

    else if (commandName === 'setstatus') {
        const status = interaction.options.getString('status');
        try {
            await client.user.setPresence({ status });
            return interaction.reply({ content: `✅ تم تغيير حالة البوت إلى **${status}**.` });
        } catch (err) {
            return interaction.reply({ content: `⚠️ حدث خطأ أثناء تغيير الحالة: ${err.message}` });
        }
    }
});

client.on("guildCreate", async (guild) => {
    let inviteLink = "❌ لم أستطع إنشاء رابط.";
    try {
        const channel = guild.channels.cache.find(c =>
            c.isTextBased() && c.permissionsFor(guild.members.me).has("CreateInstantInvite")
        );
        if (channel) {
            const invite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
            inviteLink = invite.url;
        }
    } catch (err) {
        console.log("خطأ في إنشاء الدعوة:", err.message);
    }
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

    if (logChannel) {
        logChannel.send(`✅ دخلت إلى السيرفر: **${guild.name}**\n🔗 رابط الدعوة: ${inviteLink}`);
        logChannel.send(`${guild.id}`);
    }
});

client.on("guildDelete", async (guild) => {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;
    logChannel.send(`❌ خرجت من السيرفر: **${guild.name}**`);
});

client.login(process.env.TOKEN);
