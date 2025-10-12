require('dotenv').config();
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

const authorizedIDs = ['1209548876877402163'];
const mainServerId = '1386543197018132560'; // ضع هنا ID السيرفر الأساسي

let sending = false;
let speed = 10 * 1000;
let sentCount = 0;

const commands = [
    new SlashCommandBuilder().setName('help').setDescription('📜 عرض قائمة المساعدة.'),
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
];

client.commands = new Collection();
commands.forEach(cmd => client.commands.set(cmd.name, cmd));

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands("أيدي بوتك"), { body: commands.map(c => c.toJSON()) });
    console.log('✅ Slash commands registered globally.');
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (!authorizedIDs.includes(interaction.user.id)) return interaction.reply('❌ ما عندك صلاحية تستخدم هذا الأمر.');

    const { commandName } = interaction;

    if (commandName === 'help') {
        return interaction.reply(`📜 **أوامر البوت:**\n\n` +
            `1️⃣ /status - يعرض حالة التقدم وكم شخص بُعثت له الرسائل\n` +
            `2️⃣ /servers - يعرض قائمة السيرفرات اللي فيها البوت\n` +
            `3️⃣ /stop - يوقف أي إرسال جاري\n` +
            `4️⃣ /setspeed <ثواني> - يضبط سرعة الإرسال\n` +
            `5️⃣ /nitro-bc <link> - يرسل نيترو لكل الأعضاء الأونلاين\n` +
            `6️⃣ /bc <message> - يرسل رسالة مخصصة للأعضاء الأونلاين في السيرفر الأساسي مع منشن\n` +
            `7️⃣ /help - يعرض هذه القائمة`);
    }

    else if (commandName === 'status') {
        await interaction.reply(`🚀 الحالة: ${sending ? `الإرسال جاري وتم الإرسال إلى **${sentCount}** عضو حتى الآن.` : `لا يوجد إرسال حاليا. تم الإرسال ل **${sentCount}** عضو حتى الآن.`}`);
    }

    else if (commandName === 'servers') {
        const guilds = client.guilds.cache.map((g, i) => `${i + 1}. ${g.name}`).join('\n');
        await interaction.reply(`📜 السيرفرات التي يوجد بها البوت:\n${guilds}`);
    }

    else if (commandName === 'stop') {
        sending = false;
        await interaction.reply('🛑 تم إيقاف الإرسال الحالي.');
    }

    else if (commandName === 'setspeed') {
        const sec = interaction.options.getInteger('seconds');
        speed = sec * 1000;
        await interaction.reply(`⚙️ تم تعيين سرعة الإرسال إلى **${sec} ثانية**.`);
    }

    else if (commandName === 'nitro-bc') {
        const link = interaction.options.getString('link');

        await interaction.reply('🚀 بدأ إرسال رسالة نيترو لكل الأعضاء الأونلاين...');

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
                                .setDescription(`Hello ${member.toString()} ,\nYou’ve been gifted a **Discord Nitro Boost for 1 year!**\nClick the button below to claim your Nitro!`)
                                .setImage('https://cdn.discordapp.com/attachments/1344770064703946802/1362981864305987594/271-A2-D28-057-B-4-B8-F-ADDE-A547-CC3-E36-B8.jpg')
                                .setFooter({ text: `Gift sent now!` });

                            const button = new ButtonBuilder()
                                .setLabel('Claim')
                                .setStyle(ButtonStyle.Link)
                                .setURL(link)
                                .setEmoji('🎁');

                            const row = new ActionRowBuilder().addComponents(button);

                            await member.send({ embeds: [embed], components: [row] });
                            sentUsers.add(member.user.id);
                            sentCount++;
                            console.log(`📤 أُرسل إلى: ${member.user.tag}`);
                            await sleep(speed);
                        } catch {}
                    }
                }
            } catch {}
        }
    }

    else if (commandName === 'bc') {
        const msg = interaction.options.getString('message');
        const guild = client.guilds.cache.get(mainServerId);
        if (!guild) return interaction.reply('❌ السيرفر الأساسي غير موجود عند البوت.');

        await interaction.reply('🚀 جاري إرسال رسالتك لكل الأعضاء الأونلاين في السيرفر...');

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

client.login(process.env.TOKEN);
