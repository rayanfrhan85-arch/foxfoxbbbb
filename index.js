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

// دالة رسم بطاقة "ليس لديك شارة"
async function generateNoBadgeCard(titleText) {
    const width = 750;
    const height = 480;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.88)';
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

    // نص ليس لديك شارة
    ctx.fillStyle = '#ff4a4a';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText("ليس لديك هذه الشارة", width / 2, 240);

    return canvas.toBuffer('image/png');
}

// دالة رسم البطاقة بالوقت الحقيقي الصحيح
async function generateBadgeCard(titleText, timeText, subtitleText, isNitro = false) {
    const width = 750;
    const height = 480;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.82)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#08020f';
        ctx.fillRect(0, 0, width, height);
    }

    // عنوان البطاقة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 60);

    // دائرة المنتصف
    const centerX = width / 2;
    const centerY = 210;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
    ctx.fillStyle = isNitro ? 'rgba(255, 115, 250, 0.2)' : 'rgba(244, 127, 255, 0.2)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = isNitro ? '#ff73fa' : '#f47fff';
    ctx.stroke();

    // الوقت الحقيقي المستخرج
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(timeText, centerX, centerY - 5);

    // التفاصيل التابعة
    ctx.fillStyle = '#d4d4d4';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(subtitleText, centerX, centerY + 30);

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // جلب العضو من السيرفر لضمان قراءة معلومات البوست والاشتراك الحقيقية
    let member = message.member;
    if (!member) {
        try {
            member = await message.guild.members.fetch(message.author.id);
        } catch (err) {
            member = null;
        }
    }

    // ===================================
    // أمر البوست (-b / -boost)
    // ===================================
    if (command === 'b' || command === 'boost') {
        const premiumSince = member ? member.premiumSince : null;

        if (!premiumSince) {
            const imageBuffer = await generateNoBadgeCard('إشارة البوست | Server Boost');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-boost.png' });
            return message.reply({
                content: `<@${message.author.id}> ليس لديك هذه الشارة`,
                files: [attachment]
            });
        }

        // حساب الوقت الحقيقي للبوست من تاريخ الاشتراك الفعلي
        const diffTime = Math.abs(new Date() - new Date(premiumSince));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;

        const timeText = months > 0 ? `${months} شهر و ${days} يوم` : `${days} يوم`;
        const subtitleText = `منذ ${diffDays} يوماً نشط`;

        const imageBuffer = await generateBadgeCard('إشارة البوست | Server Boost', timeText, subtitleText, false);
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
            const imageBuffer = await generateNoBadgeCard('إشارة النيترو | Nitro Status');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-nitro.png' });
            return message.reply({
                content: `<@${message.author.id}> ليس لديك هذه الشارة`,
                files: [attachment]
            });
        }

        // بما أن ديسكورد لا يعطي تاريخ بدء النيترو بدقة للملف الشخصي العام، نعتمد التحقق الحقيقي من الـ Badges والنظام
        const timeText = "مفعل حالياً";
        const subtitleText = "حساب مستخدم للنيترو";

        const imageBuffer = await generateBadgeCard('إشارة النيترو | Nitro Status', timeText, subtitleText, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}> انتة خوش تنازلت مقدم 🛑`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
