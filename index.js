// index.js
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Bot is running ✅'));
app.listen(3000, () => console.log('✅ Express server is live!'));

const TOKEN = "توكن_البوت";
const CLIENT_ID = "ايدي_البوت";
const OWNER_ID = "1245113569201094776";

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
  {
    name: 'servers',
    description: '📜 عرض السيرفرات التي يوجد فيها البوت (للأونر فقط)',
  },
];

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

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, user } = interaction;
  const adminCommands = ['setspeed', 'bc', 'servers'];

  if (adminCommands.includes(commandName) && user.id !== OWNER_ID) {
    return interaction.reply({ content: '❌ مفكر نفسك روني ولا ايه؟', ephemeral: true });
  }

  if (commandName === 'ping') {
    return interaction.reply({ content: `🏓 سرعة البوت: ${client.ws.ping}ms`, ephemeral: false });
  }

  if (commandName === 'setspeed') {
    const seconds = interaction.options.getInteger('seconds');
    return interaction.reply({ content: `⚙️ تم تغيير السرعة إلى ${seconds} ثانية بنجاح.`, ephemeral: false });
  }

  if (commandName === 'bc') {
    const message = interaction.options.getString('message');
    return interaction.reply({ content: `📢 تم إرسال الرسالة التالية:\n\n${message}`, ephemeral: false });
  }

  if (commandName === 'servers') {
    const servers = client.guilds.cache.map(g => `- ${g.name} (${g.id})`).join('\n');
    return interaction.reply({ content: `📜 السيرفرات التي يوجد فيها البوت:\n${servers}`, ephemeral: false });
  }
});

client.login(TOKEN);
