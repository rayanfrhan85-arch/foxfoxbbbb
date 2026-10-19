require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = "-";

// مستويات البوست
const BOOST_MILESTONES = [
    { label: "1m", months: 1 },
    { label: "2m", months: 2 },
    { label: "3m", months: 3 },
    { label: "6m", months: 6 },
    { label: "9m", months: 9 },
    { label: "12m", months: 12 },
    { label: "15m", months: 15 },
    { label: "18m", months: 18 },
    { label: "24m", months: 24 }
];

// مستويات النيترو
const NITRO_MILESTONES = [
    { label: "1m", months: 1 },
    { label: "3m", months: 3 },
    { label: "6m", months: 6 },
    { label: "1y", months: 12 },
    { label: "2y", months: 24 },
    { label: "3y", months: 36 },
    { label: "5y", months: 60 },
    { label: "6y", months: 72 }
];

// دالة رسم بطاقة عدم وجود الشارة (ياقير / بدون نيترو)
async function generateNoBadgeCard(titleText, isNitro = false) {
    const width = 750;
    const height = 480;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.85)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#08020f';
        ctx.fillRect(0, 0, width, height);
    }

    // عنوان البطاقة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 80);

    // نص تنبيه عدم وجود الشارة
    ctx.fillStyle = '#ff4a4a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText("لا تمتلك هذه الشارة حالياً!", width / 2, 250);

    return canvas.toBuffer('image/png');
}

// دالة رسم البطاقة المخصصة للمشتركين والتفاصيل
async function generateBadgeCard(titleText, currentMonths, maxMonths, timeText, isNitro = false) {
    const width = 750;
    const height = 480;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. رسم الخلفية reba_bg.png
    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.82)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#08020f';
        ctx.fillRect(0, 0, width, height);
    }

    // 2. عنوان البطاقة العلوي
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 60);

    // 3. رسم دائرة مضيئة للتفاصيل في منتصف الصورة
    const centerX = width / 2;
    const centerY = 210;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
    ctx.fillStyle = isNitro ? 'rgba(255, 115, 250, 0.2)' : 'rgba(244, 127, 255, 0.2)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = isNitro ? '#ff73fa' : '#f47fff';
    ctx.stroke();

    // 4. كتابة تفاصيل المدة بالمنتصف
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(timeText, centerX, centerY + 8);

    // 5. كتابة إحصائيات المستوى بالأرقام أسفل الدائرة
    ctx.fillStyle = '#cccccc';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`المستوى الحالي: ${currentMonths} شهر / الأقصى: ${maxMonths} شهر`, centerX, 340);

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ===================================
    // أمر البوست (-b / -boost)
    // ===================================
    if (command === 'b' || command === 'boost') {
        const currentMonths = 12;
        const timeText = "سنة واحدة";
        
        const imageBuffer = await generateBadgeCard('إشارة البوست | Server Boost', currentMonths, 24, timeText, false);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-boost.png' });

        return message.reply({
            content: `<@${message.author.id}> انتة خوش تنازلت مقدم 🛑`,
            files: [attachment]
        });
    }

    // ===================================
    // أمر النيترو (-n / -nitro)
    // ===================================
    if (command === 'n' || command === 'nitro') {
        const userFlags = message.author.flags ? message.author.flags.toArray() : [];
        const hasNitroBadge = userFlags.some(flag => flag.includes('Premium') || flag.includes('Nitro'));

        if (!hasNitroBadge) {
            // إذا كان المستخدم لا يملك نيترو
            const imageBuffer = await generateNoBadgeCard('إشارة النيترو | Nitro Status', true);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-nitro.png' });
            return message.reply({
                content: `<@${message.author.id}> التنازلات بل روم الخاص يم rebean`,
                files: [attachment]
            });
        }

        // إذا كان المستخدم يملك نيترو (رسم التفاصيل الخاصة بالنيترو)
        const currentMonthsNitro = 3;
        const timeText = "9 أشهر";

        const imageBuffer = await generateBadgeCard('إشارة النيترو | Nitro Status', currentMonthsNitro, 72, timeText, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}> انتة خوش تنازلت مقدم 🛑`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
