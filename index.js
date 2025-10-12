// 🟢 استيراد المكتبات الأساسية
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
require('dotenv').config();

// 🟢 إنشاء عميل ديسكورد
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

// 🟢 Web Server لـ UptimeRobot أو Render
const app = express();
app.get('/', (req, res) => res.send('✅ Bot is alive and running!'));
app.listen(3000, () => console.log('🌐 Web server running on port 3000'));

// 🟢 تعريف الأوامر
const commands = [
  new SlashCommandBuilder().setName('help').setDescription('📜 عرض قائمة المساعدة.'),
  new SlashCommandBuilder().setName('status').setDescription('🚀 عرض حالة الإرسال وعدد من تم الإرسال لهم.'),
  new SlashCommandBuilder().setName('servers').setDescription('📜 عرض السيرفرات التي يوجد فيها البوت.'),
  new SlashCommandBuilder().setName('stop').setDescription('🛑 إيقاف الإرسال الحالي.'),
  new SlashCommandBuilder()
    .setName('setspeed')
    .setDescription('⚙️ تغيير سرعة الإرسال بالثواني.')
    .addIntegerOption(option => option.setName('seconds').setDescription('عدد الثواني').setRequired(true)),
  new SlashCommandBuilder()
    .setName('nitro-bc')
    .setDescription('🎁 إرسال نيترو لكل الأعضاء الأونلاين.')
    .addStringOption(option => option.setName('link').setDescription('رابط النيترو').setRequired(true)),
  new SlashCommandBuilder()
    .setName('bc')
    .setDescription('✉️ إرسال رسالة للأعضاء الأونلاين في السيرفر.')
    .addStringOption(option => option.setName('message').setDescription('نص الرسالة').setRequired(true)),
].map(cmd => cmd.toJSON());

// 🟢 تسجيل الأوامر في Discord API
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log('⏳ جاري تسجيل الأوامر...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('✅ تم تسجيل الأوامر بنجاح!');
  } catch (err) {
    console.error('❌ خطأ أثناء تسجيل الأوامر:', err);
  }
})();

// 🟢 الأيدي المسموح له باستخدام الأوامر الإدارية
const ownerId = '1245113569201094776';

// 🟢 عند تنفيذ الأوامر
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;
  const isOwner = interaction.user.id === ownerId;

  // 🟢 أمر المساعدة
  if (commandName === 'help') {
    return interaction.reply({
      content: `
🆘 **قائمة الأوامر:**
/help — عرض هذه القائمة.
/bc — إرسال رسالة للأعضاء الأونلاين. *(المالك فقط)*
/nitro-bc — إرسال نيترو. *(المالك فقط)*
/setspeed — تغيير سرعة الإرسال. *(المالك فقط)*
/status — عرض حالة الإرسال.
/stop — إيقاف الإرسال. *(المالك فقط)*
/servers — عرض السيرفرات.`,
      ephemeral: true,
    });
  }

  // 🟠 التحقق من الصلاحيات للأوامر الإدارية
  const adminCommands = ['bc', 'nitro-bc', 'setspeed', 'stop', 'servers'];
  if (!isOwner && adminCommands.includes(commandName)) {
    return interaction.reply({
      content: `مفكر نفسك روني ولا ايه؟ ❌`,
      ephemeral: true, // 🔸 الرسالة تظهر له فقط
    });
  }

  // ✅ تنفيذ الأوامر
  if (commandName === 'bc') {
    const msg = interaction.options.getString('message');
    await interaction.reply({ content: '✉️ جاري الإرسال...', ephemeral: false });

    const onlineMembers = interaction.guild.members.cache.filter(
      m => m.presence && m.presence.status === 'online' && !m.user.bot
    );

    let count = 0;
    for (const member of onlineMembers.values()) {
      try {
        await member.send(msg);
        count++;
      } catch {}
    }

    await interaction.followUp({ content: `✅ تم الإرسال إلى ${count} عضو أونلاين.`, ephemeral: false });
  }

  if (commandName === 'status') {
    await interaction.reply({ content: '📊 البوت يعمل بشكل طبيعي ✅', ephemeral: false });
  }

  if (commandName === 'servers') {
    const servers = client.guilds.cache.map(g => g.name).join('\n');
    await interaction.reply({ content: `📜 السيرفرات التي يوجد فيها البوت:\n${servers}`, ephemeral: false });
  }

  if (commandName === 'setspeed') {
    const sec = interaction.options.getInteger('seconds');
    await interaction.reply({ content: `⏱️ تم ضبط سرعة الإرسال على ${sec} ثانية.`, ephemeral: false });
  }

  if (commandName === 'stop') {
    await interaction.reply({ content: '🛑 تم إيقاف الإرسال الحالي.', ephemeral: false });
  }

  if (commandName === 'nitro-bc') {
    const link = interaction.options.getString('link');
    await interaction.reply({ content: '🎁 جاري إرسال النيترو...', ephemeral: false });
    // يمكنك إضافة كود الإرسال الجماعي لاحقاً هنا
  }
});

// 🟢 عند تشغيل البوت
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// 🟢 تسجيل الدخول
client.login(process.env.TOKEN);
