// استدعاء المكتبات المطلوبة
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config();

// إنشاء عميل الديسكورد
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// عند تشغيل البوت
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// تعريف الأوامر
const commands = [
  {
    name: 'help',
    description: '📜 عرض قائمة المساعدة.',
  },
  {
    name: 'status',
    description: '🚀 عرض حالة التقدم وعدد من تم الإرسال لهم.',
  },
  {
    name: 'setspeed',
    description: '⚙️ تغيير سرعة الإرسال بالثواني.',
    options: [
      {
        name: 'seconds',
        description: 'عدد الثواني',
        type: 4, // رقم صحيح
        required: true,
      },
    ],
  },
  {
    name: 'nitro-bc',
    description: '🎁 إرسال نيترو لكل الأعضاء الأونلاين.',
    options: [
      {
        name: 'link',
        description: 'رابط النيترو',
        type: 3, // نص
        required: true,
      },
    ],
  },
  {
    name: 'bc',
    description: '✉️ إرسال رسالة للأعضاء الأونلاين في السيرفر.',
    options: [
      {
        name: 'message',
        description: 'نص الرسالة',
        type: 3, // نص
        required: true,
      },
    ],
  },
];

// تسجيل الأوامر باستخدام Discord REST API
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('📦 جاري تسجيل الأوامر...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ تم تسجيل الأوامر بنجاح!');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء تسجيل الأوامر:');
    console.error(error);
  }
})();

// تسجيل الدخول بالبوت
client.login(process.env.TOKEN);
