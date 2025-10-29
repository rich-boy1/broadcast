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

// ✅ إعدادات رئيسية
const authorizedIDs = ['1245113569201094776', '1364673596806533132'];
const mainServerId = '1386543197018132560';
const LOG_CHANNEL_ID = "1422532389669830714";

let sending = false;
let speed = 10 * 1000;
let sentCount = 0;

// ✅ الأوامر
const commands = [
    new SlashCommandBuilder().setName('help').setDescription('📜 عرض أوامر المساعدة.'),
    new SlashCommandBuilder().setName('status').setDescription('🚀 عرض حالة الإرسال.'),
    new SlashCommandBuilder().setName('servers').setDescription('📜 عرض السيرفرات اللي فيها البوت.'),
    new SlashCommandBuilder().setName('stop').setDescription('🛑 إيقاف الإرسال الحالي.'),
    new SlashCommandBuilder()
        .setName('setspeed')
        .setDescription('⚙️ تغيير سرعة الإرسال (بالثواني).')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('عدد الثواني').setRequired(true)),
    new SlashCommandBuilder()
        .setName('nitro-bc')
        .setDescription('🎁 إرسال نيترو لكل الأعضاء الأونلاين.')
        .addStringOption(opt => opt.setName('link').setDescription('رابط النيترو').setRequired(true)),
    new SlashCommandBuilder()
        .setName('bc')
        .setDescription('✉️ إرسال رسالة للأعضاء الأونلاين في السيرفر.')
        .addStringOption(opt => opt.setName('message').setDescription('نص الرسالة').setRequired(true)),
    new SlashCommandBuilder()
        .setName('setstatus')
        .setDescription('🟢 تغيير حالة البوت (online / idle / dnd / invisible).')
        .addStringOption(opt =>
            opt.setName('status')
                .setDescription('اختر الحالة الجديدة')
                .setRequired(true)
                .addChoices(
                    { name: '🟢 Online', value: 'online' },
                    { name: '🌙 Idle', value: 'idle' },
                    { name: '⛔ DND', value: 'dnd' },
                    { name: '⚫ Invisible', value: 'invisible' }
                )
        ),
    // ✅ أمر الشبح
    new SlashCommandBuilder()
        .setName('ghostmode')
        .setDescription('👻 يخفي البوت (يظهر أوفلاين لكنه يشتغل فعلياً).'),
    new SlashCommandBuilder()
        .setName('online')
        .setDescription('🔵 يرجّع البوت للوضع الطبيعي (أونلاين).'),
];

client.commands = new Collection();
commands.forEach(cmd => client.commands.set(cmd.name, cmd));

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands.map(c => c.toJSON()) });
    console.log('✅ Slash commands registered globally.');
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    const isAdminCommand = ['stop', 'setspeed', 'nitro-bc', 'bc', 'setstatus', 'ghostmode', 'online'].includes(commandName);

    if (isAdminCommand && !authorizedIDs.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ هنهزر ولا ايه؟', flags: 64 });
    }

    if (commandName === 'help') {
        return interaction.reply({
            content: `📜 **أوامر البوت:**\n
/status ➜ حالة الإرسال  
/servers ➜ عرض السيرفرات  
/stop ➜ إيقاف الإرسال  
/setspeed ➜ تغيير سرعة الإرسال  
/nitro-bc ➜ إرسال نيترو  
/bc ➜ إرسال رسالة  
/setstatus ➜ تغيير حالة البوت  
/ghostmode ➜ يخفي البوت (يظهر أوفلاين)  
/online ➜ يرجع الحالة طبيعية  
/help ➜ المساعدة`
        });
    }

    if (commandName === 'setstatus') {
        const newStatus = interaction.options.getString('status');
        try {
            await client.user.setPresence({
                status: newStatus,
                activities: [{ name: '💫 By Ronny', type: 0 }]
            });
            await interaction.reply({ content: `✅ كفو خويي قرشع غيرت الحالة **${newStatus}** وثبتت.` });
        } catch (err) {
            await interaction.reply({ content: `❌ مشقادر اغير الحالة شوف شصاير ${err.message}` });
        }
        return;
    }

    // ✅ أمر الشبح
    if (commandName === 'ghostmode') {
        try {
            await client.user.setPresence({
                status: "invisible",
                activities: [{ name: "👻 Ghost Mode Active", type: 0 }]
            });
            await interaction.reply({ content: '✅ دخلت وضع **الشبح 👻** — البوت ظاهر أوفلاين لكنه شغال 🔥' });
        } catch (err) {
            await interaction.reply({ content: `❌ حصل خطأ ياخوي: ${err.message}` });
        }
        return;
    }

    // ✅ أمر رجوع أونلاين
    if (commandName === 'online') {
        try {
            await client.user.setPresence({
                status: "online",
                activities: [{ name: "💫 By Ronny", type: 0 }]
            });
            await interaction.reply({ content: '✅ رجعت الحالة إلى **Online 🔵** والبوت ظاهر طبيعي.' });
        } catch (err) {
            await interaction.reply({ content: `❌ حصل خطأ ياخوي: ${err.message}` });
        }
        return;
    }

    if (commandName === 'status') {
        return interaction.reply({
            content: `🚀 الحالة: ${sending ? `الإرسال جاري ✅ (${sentCount} عضو)` : `❌ لا يوجد إرسال حالي.`}`
        });
    }

    if (commandName === 'servers') {
        const servers = client.guilds.cache.map((g, i) => `${i + 1}. ${g.name}`).join('\n');
        return interaction.reply({ content: `📜 السيرفرات:\n${servers}` });
    }

    if (commandName === 'stop') {
        sending = false;
        return interaction.reply({ content: '🛑 تم إيقاف الإرسال.' });
    }

    if (commandName === 'setspeed') {
        const sec = interaction.options.getInteger('seconds');
        speed = sec * 1000;
        return interaction.reply({ content: `⚙️ تم ضبط سرعة الإرسال إلى **${sec} ثانية**.` });
    }

    if (commandName === 'nitro-bc') {
        const link = interaction.options.getString('link');
        await interaction.reply({ content: '🚀 بدأ الإرسال...' });
        sending = true;
        sentCount = 0;
        const sentUsers = new Set();

        for (const guild of client.guilds.cache.values()) {
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
                                .setDescription(`🎁 Hello ${member.toString()}, claim your **Discord Nitro (1 Year)** now!`)
                                .setImage('https://cdn.discordapp.com/attachments/1344770064703946802/1362981864305987594/271-A2-D28-057-B-4-B8-F-ADDE-A547-CC3-E36-B8.jpg');
                            const button = new ButtonBuilder().setLabel('Claim').setStyle(ButtonStyle.Link).setURL(link).setEmoji('🎁');
                            const row = new ActionRowBuilder().addComponents(button);
                            await member.send({ embeds: [embed], components: [row] });
                            sentUsers.add(member.user.id);
                            sentCount++;
                            await sleep(speed);
                        } catch {}
                    }
                }
            } catch {}
        }
        sending = false;
    }

    if (commandName === 'bc') {
        const msg = interaction.options.getString('message');
        const guild = client.guilds.cache.get(mainServerId);
        if (!guild) return interaction.reply({ content: '❌ السيرفر الأساسي مش موجود.' });

        await interaction.reply({ content: '🚀 جاري الإرسال...' });
        const members = await guild.members.fetch({ withPresences: true });
        for (const member of members.values()) {
            const status = member.presence?.status;
            if (!member.user.bot && ['online', 'idle', 'dnd'].includes(status)) {
                member.send(`${msg}\n${member.toString()}`).catch(() => {});
                sentCount++;
                await sleep(speed);
            }
        }
    }
});

// 🔔 تسجيل دخول وخروج السيرفرات
client.on("guildCreate", async (guild) => {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    let inviteLink = "رابط الدعوة غير متاح";
    try {
        const invites = await guild.invites.fetch();
        if (invites.size > 0) inviteLink = invites.first().url;
    } catch (err) {
        inviteLink = "❌ مفيش صلاحيات لجلب رابط الدعوة";
    }
    if (logChannel)
        logChannel.send(`✅ دخلت لسيرفر جديد <@1245113569201094776>:\n**${guild.name}** (${guild.id})\n📎 رابط الدعوة: ${inviteLink}`);
});

client.on("guildDelete", async (guild) => {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel)
        logChannel.send(`❌ والله طردوني يزلمة: **${guild.name}** (${guild.id})`);
});

client.login(process.env.TOKEN);
