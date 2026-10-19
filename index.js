require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const PREFIX = "-";

// مستويات النيترو بالشهور وألوانها الرسمية
const NITRO_MILESTONES = [
    { label: "1m", months: 1, color: "#e67e22" },
    { label: "3m", months: 3, color: "#bdc3c7" },
    { label: "6m", months: 6, color: "#f1c40f" },
    { label: "1y", months: 12, color: "#3498db" },
    { label: "2y", months: 24, color: "#9b59b6" },
    { label: "3y", months: 36, color: "#2ecc71" },
    { label: "5y", months: 60, color: "#e74c3c" },
    { label: "6y", months: 72, color: "#1abc9c" }
];

// مستويات البوست بالشهور وألوانها الرسمية
const BOOST_MILESTONES = [
    { label: "1M", months: 1, color: "#f47fff" },
    { label: "2M", months: 2, color: "#f47fff" },
    { label: "3M", months: 3, color: "#ff73fa" },
    { label: "6M", months: 6, color: "#ff73fa" },
    { label: "9M", months: 9, color: "#e056fd" },
    { label: "12M", months: 12, color: "#e056fd" },
    { label: "15M", months: 15, color: "#be2edd" },
    { label: "18M", months: 18, color: "#be2edd" },
    { label: "24M", months: 24, color: "#d63031" }
];

// دالة رسم الحقوق
function drawCreativeWatermarks(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('REBA SERVER', width - 25, height - 20);

    ctx.fillStyle = '#ff73fa';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DEV: FOX', 25, height - 20);
    ctx.restore();
}

// دالة حساب الوقت المتبقي الدقيق
function calculateExactRemainingTime(startDate, targetMonths) {
    const now = new Date();
    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    let diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return "وصلت لنهاية المطاف عاشت ايدك";

    let temp = new Date(now.getTime());
    let months = 0;

    while (true) {
        let testDate = new Date(temp.getTime());
        testDate.setMonth(testDate.getMonth() + 1);
        if (testDate <= targetDate) {
            months++;
            temp = testDate;
        } else {
            break;
        }
    }

    let remainingSeconds = Math.floor((targetDate.getTime() - temp.getTime()) / 1000);
    let days = Math.floor(remainingSeconds / (3600 * 24));
    remainingSeconds %= (3600 * 24);
    let hours = Math.floor(remainingSeconds / 3600);
    remainingSeconds %= 3600;
    let minutes = Math.floor(remainingSeconds / 60);

    let parts = [];
    if (months > 0) parts.push(`${months} أشهر`);
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0) parts.push(`${minutes} دقيقة`);

    if (parts.length === 0) return "سوف تصل الى الشارة التالية بعد دقائق قليلة";

    return `سوف تصل الى الشارة التالية بعد ${parts.join(' ')}`;
}

// دالة رسم شارات البوست (الجواهر الملونة الفخمة)
function drawBoostBadgeIcon(ctx, x, y, size, color, isActive) {
    ctx.save();
    ctx.translate(x, y);

    if (isActive) {
        // رسم الألماسة النيون الملونة والمضيئة
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.85, -size * 0.35);
        ctx.lineTo(size * 0.85, size * 0.35);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.85, size * 0.35);
        ctx.lineTo(-size * 0.85, -size * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // بريق داخلي
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.65);
        ctx.lineTo(size * 0.35, 0);
        ctx.lineTo(0, size * 0.65);
        ctx.lineTo(-size * 0.35, 0);
        ctx.closePath();
        ctx.fill();
    } else {
        // ألماسة معتمة غير مفعلة
        ctx.fillStyle = '#221833';
        ctx.strokeStyle = '#3d2e54';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(0, -size * 0.8);
        ctx.lineTo(size * 0.65, -size * 0.25);
        ctx.lineTo(size * 0.65, size * 0.25);
        ctx.lineTo(0, size * 0.8);
        ctx.lineTo(-size * 0.65, size * 0.25);
        ctx.lineTo(-size * 0.65, -size * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
}

// دالة رسم شارات النيترو الملونة الرسمية
function drawNitroBadgeIcon(ctx, x, y, size, color, isActive) {
    ctx.save();
    ctx.translate(x, y);

    if (isActive) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // دائرة نيون داخلية
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    } else {
        ctx.fillStyle = '#221833';
        ctx.strokeStyle = '#3d2e54';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
}

// بطاقة عدم وجود الشارة
async function generateNoBadgeCard(titleText, iraqiMessage) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.90)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#08020f';
        ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = 'rgba(255, 74, 74, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 85);

    ctx.fillStyle = '#ff5c5c';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(iraqiMessage, width / 2, 215);

    drawCreativeWatermarks(ctx, width, height);

    return canvas.toBuffer('image/png');
}

// رسم بطاقة الكانفاس الملونة والمضمونة 100% فوق خلفية reba_bg
async function generateBadgeCard(titleText, startDate, milestones, isNitro = false) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // خلفية سيرفر ريبين
    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.88)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#0a0512';
        ctx.fillRect(0, 0, width, height);
    }

    // إطار مضيء
    ctx.strokeStyle = isNitro ? 'rgba(244, 127, 255, 0.25)' : 'rgba(255, 115, 250, 0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // عنوان البطاقة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 65);

    const now = new Date();
    let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    if (now.getDate() < startDate.getDate()) {
        currentMonths--;
    }
    currentMonths = Math.max(0, currentMonths);

    let nextMilestone = milestones.find(m => m.months > currentMonths);
    if (!nextMilestone) nextMilestone = milestones[milestones.length - 1];

    const startX = 65;
    const endX = width - 65;
    const step = (endX - startX) / (milestones.length - 1);
    const iconsY = 135;

    // رسم الشارات الملونة لكل مستوى
    milestones.forEach((m, i) => {
        const x = startX + (i * step);
        const isActive = currentMonths >= m.months;

        if (isNitro) {
            drawNitroBadgeIcon(ctx, x, iconsY, 16, m.color || '#f47fff', isActive);
        } else {
            drawBoostBadgeIcon(ctx, x, iconsY, 16, m.color || '#ff73fa', isActive);
        }

        ctx.fillStyle = isActive ? '#ffffff' : '#777088';
        ctx.font = 'italic bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x, iconsY + 45);
    });

    // شريط التقدم المضيء
    const progressBarY = iconsY + 65;
    const barWidth = endX - startX;
    
    ctx.fillStyle = '#231836';
    ctx.beginPath();
    ctx.roundRect(startX, progressBarY, barWidth, 14, 7);
    ctx.fill();

    const maxMonths = milestones[milestones.length - 1].months;
    const progressRatio = Math.min(1, currentMonths / maxMonths);
    
    if (progressRatio > 0) {
        ctx.fillStyle = isNitro ? '#f47fff' : '#ff73fa';
        ctx.beginPath();
        ctx.roundRect(startX, progressBarY, Math.max(14, barWidth * progressRatio), 14, 7);
        ctx.fill();
    }

    // حساب النص المتبقي المباشر والدقيق
    const remainingText = calculateExactRemainingTime(startDate, nextMilestone.months);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(remainingText, width / 2, progressBarY + 60);

    // أيقونة الشارة الحالية النشطة بالأسفل
    const currentBadgeY = progressBarY + 110;
    let activeMilestone = milestones.slice().reverse().find(m => currentMonths >= m.months) || milestones[0];

    if (isNitro) {
        drawNitroBadgeIcon(ctx, width / 2, currentBadgeY, 22, activeMilestone.color || '#f47fff', true);
    } else {
        drawBoostBadgeIcon(ctx, width / 2, currentBadgeY, 22, activeMilestone.color || '#ff73fa', true);
    }

    // الحقوق
    drawCreativeWatermarks(ctx, width, height);

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    let member = message.member;
    let user = message.author;

    try {
        user = await client.users.fetch(message.author.id, { force: true });
        if (message.guild) {
            member = await message.guild.members.fetch({ user: message.author.id, force: true });
        }
    } catch (e) {}

    // أمر البوست (-b / -boost)
    if (command === 'b' || command === 'boost') {
        const premiumSince = member ? member.premiumSince : null;

        if (!premiumSince) {
            const imageBuffer = await generateNoBadgeCard('اشارة البوست', 'وين رايح يمعود لا بوست ولا هم يحزنون');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-boost.png' });
            return message.reply({
                content: `<@${message.author.id}>`,
                files: [attachment]
            });
        }

        const imageBuffer = await generateBadgeCard('اشارة البوست', new Date(premiumSince), BOOST_MILESTONES, false);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-boost.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // أمر النيترو (-n / -nitro)
    if (command === 'n' || command === 'nitro') {
        const userFlags = user.flags ? user.flags.toArray() : [];
        const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
        const isCustomBanner = user.banner !== null;
        const avatarDecoration = user.avatarDecoration;
        const isBoosting = member && member.premiumSince !== null;

        const hasNitro = userFlags.some(flag => flag.includes('Premium') || flag.includes('Nitro')) || 
                         isAnimatedAvatar || 
                         isCustomBanner || 
                         avatarDecoration || 
                         isBoosting;

        if (!hasNitro) {
            const imageBuffer = await generateNoBadgeCard('اشارة النيترو', 'وين رايح يمعود ما عندك هاي الشارة');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-nitro.png' });
            return message.reply({
                content: `<@${message.author.id}>`,
                files: [attachment]
            });
        }

        const startDate = (member && member.premiumSince) ? new Date(member.premiumSince) : new Date(user.createdTimestamp);

        const imageBuffer = await generateBadgeCard('اشارة النيترو', startDate, NITRO_MILESTONES, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // أمر معلومات النيترو (-t / -type) - نصي بسيط
    if (command === 't' || command === 'type') {
        const userFlags = user.flags ? user.flags.toArray() : [];
        const isBoosting = member && member.premiumSince !== null;
        const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
        const isCustomBanner = user.banner !== null;
        const avatarDecoration = user.avatarDecoration;

        let nitroType = "غير مفعل";
        if (userFlags.some(f => f.includes('Nitro')) || isAnimatedAvatar || isCustomBanner || avatarDecoration) {
            nitroType = isBoosting ? "Discord Nitro (مع بوست للسيرفر) 🚀" : "Discord Nitro Classic ✨";
        } else if (isBoosting) {
            nitroType = "Server Booster فقط 💎";
        } else {
            return message.reply({ content: `<@${message.author.id}> ما عندك أي اشتراك نيترو حالياً` });
        }

        const startDate = (member && member.premiumSince) ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const now = new Date();
        
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) {
            currentMonths--;
        }
        currentMonths = Math.max(0, currentMonths);

        return message.reply({
            content: `🔍 **معلومات اشتراك المستخدم <@${message.author.id}>:**\n📌 **نوع الاشتراك:** ${nitroType}\n⏳ **المدة التقريبية المضيئة:** ${currentMonths} أشهر تقريباً\n🛠️ **DEV: FOX** | **REBA SERVER**`
        });
    }
});

client.login(process.env.TOKEN);
