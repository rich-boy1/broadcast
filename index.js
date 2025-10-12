// index.js
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const express = require('express'); // ✅ مهم جداً لتشغيل البوت على Render
const app = express();

// ==================== إعداد السيرفر الصغير لـ Render ====================
app.get('/', (req, res) => res.send('Bot is running ✅'));
app.listen(3000, () => console.log('✅ Express server is live!'));

// ==================== إعداد البوت ====================
const TOKEN = "توكن_البوت";
const CLIENT_ID = "ايدي_البوت"; // من https://discord.com/developers/applications
const OWNER_ID = "1245113569201094776"; // الايدي اللي مسموح له بالأوامر الإدارية فقط

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const commands = [
  {
    name: 'ping',
    description: '🏓 اختبار سرعة البوت',
  },
  {
    name: 'setspeed',
    description: '⚙️ تغيير سرعة الإرسال بالثواني (خاص بالأونر)',
    options: [
      {
        name: 'seconds',
        type: 4,
        description: 'عدد الثواني',
        required: true,
      },
    ],
  },
  {
    name: 'bc',
    description: '✉️ إرسال رسالة للأعضاء الأونلاين في السيرفر (خاص بالأونر)',
    options: [
      {
        name: 'message',
        type: 3,
        description: 'نص الرسالة',
        required: true,
      },
    ],
  },
];

// ==================== تسجيل الأوامر ====================
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔁 جاري رفع الأوامر...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ تم رفع الأوامر بنجاح!');
  } catch (error) {
    console.error(error);
  }
})();

// ==================== تنفيذ الأوامر ====================
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, user } = interaction;

  // أمر ping
  if (commandName === 'ping') {
    return interaction.reply({ content: `🏓 سرعة البوت: ${client.ws.ping}ms`, ephemeral: false });
  }

  // أوامر الأونر فقط
  const adminCommands = ['setspeed', 'bc'];
  if (adminCommands.includes(commandName) && user.id !== OWNER_ID) {
    return interaction.reply({ content: '❌ مفكر نفسك روني ولا ايه؟', ephemeral: true });
  }

  // تنفيذ أمر setspeed
  if (commandName === 'setspeed') {
    const seconds = interaction.options.getInteger('seconds');
    return interaction.reply({ content: `⚙️ تم تغيير السرعة إلى ${seconds} ثانية بنجاح.`, ephemeral: false });
  }

  // تنفيذ أمر bc
  if (commandName === 'bc') {
    const message = interaction.options.getString('message');
    return interaction.reply({ content: `📢 تم إرسال الرسالة التالية:\n\n${message}`, ephemeral: false });
  }
});

client.login(TOKEN);
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
