require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

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

// روابط شارات النيترو الملونة الرسمية
const NITRO_BADGE_URLS = [
    "https://cdn.discordapp.com/badge-icons/2ba85e802c7f0d03b30200877990d0b0.png",
    "https://cdn.discordapp.com/badge-icons/e9b1114b726c04f5e3e29f59f6356e84.png",
    "https://cdn.discordapp.com/badge-icons/011928099e4f20f019f6229c92e42817.png",
    "https://cdn.discordapp.com/badge-icons/3aed58a2d1d03339167389ed301b4478.png",
    "https://cdn.discordapp.com/badge-icons/862ae21808b8b09d29e3a65c92f15e71.png",
    "https://cdn.discordapp.com/badge-icons/24a8e63a13a2908f0376c3ef6f4b66b3.png",
    "https://cdn.discordapp.com/badge-icons/0a020be0ba80874017f8a37943f29051.png",
    "https://cdn.discordapp.com/badge-icons/3c0a5d2b7754f9d6b9a8cf4f36a87c12.png"
];

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

const BOOST_MILESTONES = [
    { label: "1M", months: 1 }, { label: "2M", months: 2 }, { label: "3M", months: 3 },
    { label: "6M", months: 6 }, { label: "9M", months: 9 }, { label: "12M", months: 12 },
    { label: "15M", months: 15 }, { label: "18M", months: 18 }, { label: "24M", months: 24 }
];

function drawWatermarks(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = '#2ecc71'; // لون أخضر فخم لـ DEV: FOX
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DEV: FOX', 25, height - 20);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('REBA SERVER', width - 25, height - 20);
    ctx.restore();
}

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

// رسم بطاقة عدم وجود النيترو برمجياً بالكامل
async function generateNoBadgeCard() {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // خلفية مظلمة فخمة
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // إطار معدني مزدوج
    ctx.strokeStyle = '#2b3b5c';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // عنوان البطاقة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('اشارة النيترو', width / 2, 70);

    const startX = 65;
    const endX = width - 65;
    const step = (endX - startX) / (NITRO_MILESTONES.length - 1);
    const iconsY = 135;

    // رسم شارات رمادية باهتة
    for (let i = 0; i < NITRO_MILESTONES.length; i++) {
        const x = startX + (i * step);
        const m = NITRO_MILESTONES[i];

        try {
            const badgeImg = await loadImage(NITRO_BADGE_URLS[i]);
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.drawImage(badgeImg, x - 20, iconsY - 20, 40, 40);
            ctx.restore();
        } catch (e) {
            ctx.beginPath();
            ctx.arc(x, iconsY, 16, 0, Math.PI * 2);
            ctx.fillStyle = '#2c2538';
            ctx.fill();
        }

        ctx.fillStyle = '#777088';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x, iconsY + 45);
    }

    // شريط التقدم الفحمي الفارغ
    const progressBarY = iconsY + 65;
    const barWidth = endX - startX;
    ctx.fillStyle = '#181f2c';
    ctx.beginPath();
    ctx.roundRect(startX, progressBarY, barWidth, 14, 7);
    ctx.fill();

    // النص العراقي المطلوب
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('اكو غلط !! هسة عرفت انت ماعندك هاي شارة يمعود', width / 2, progressBarY + 85);

    drawWatermarks(ctx, width, height);
    return canvas.toBuffer('image/png');
}

// رسم بطاقة النيترو برمجياً بالكامل مع شارات ملونة وخط مضيء
async function generateNitroBadgeCard(startDate, milestones) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0512';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(244, 127, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('اشارة النيترو', width / 2, 65);

    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const totalDaysElapsed = diffTime / (1000 * 60 * 60 * 24);
    const currentMonths = totalDaysElapsed / 30.4375;

    let nextMilestone = milestones.find(m => m.months > currentMonths);
    if (!nextMilestone) nextMilestone = milestones[milestones.length - 1];

    const startX = 65;
    const endX = width - 65;
    const step = (endX - startX) / (milestones.length - 1);
    const iconsY = 135;

    for (let i = 0; i < milestones.length; i++) {
        const x = startX + (i * step);
        const m = milestones[i];
        const isActive = currentMonths >= m.months;

        try {
            const badgeImg = await loadImage(NITRO_BADGE_URLS[i]);
            ctx.save();
            if (!isActive) ctx.globalAlpha = 0.25;
            ctx.drawImage(badgeImg, x - 20, iconsY - 20, 40, 40);
            ctx.restore();
        } catch (e) {
            ctx.beginPath();
            ctx.arc(x, iconsY, 16, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? '#f47fff' : '#2c2538';
            ctx.fill();
        }

        ctx.fillStyle = isActive ? '#ffffff' : '#777088';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x, iconsY + 45);
    }

    const progressBarY = iconsY + 65;
    const barWidth = endX - startX;
    
    ctx.fillStyle = '#3a3148';
    ctx.beginPath();
    ctx.roundRect(startX, progressBarY, barWidth, 14, 7);
    ctx.fill();

    const maxMonths = milestones[milestones.length - 1].months;
    const progressRatio = Math.min(1, currentMonths / maxMonths);
    
    if (progressRatio > 0) {
        ctx.fillStyle = '#c252ff';
        ctx.shadowColor = '#c252ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(startX, progressBarY, Math.max(14, barWidth * progressRatio), 14, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    const remainingText = calculateExactRemainingTime(startDate, nextMilestone.months);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(remainingText, width / 2, progressBarY + 65);

    drawWatermarks(ctx, width, height);
    return canvas.toBuffer('image/png');
}

// رسم بطاقة البوست برمجياً بالكامل
async function generateBoostBadgeCard(startDate, milestones) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#12050f';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 115, 250, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('اشارة البوست', width / 2, 65);

    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const totalDaysElapsed = diffTime / (1000 * 60 * 60 * 24);
    const currentMonths = totalDaysElapsed / 30.4375;

    let nextMilestone = milestones.find(m => m.months > currentMonths);
    if (!nextMilestone) nextMilestone = milestones[milestones.length - 1];

    const startX = 65;
    const endX = width - 65;
    const step = (endX - startX) / (milestones.length - 1);
    const iconsY = 135;

    for (let i = 0; i < milestones.length; i++) {
        const x = startX + (i * step);
        const m = milestones[i];
        const isActive = currentMonths >= m.months;

        ctx.beginPath();
        ctx.arc(x, iconsY, 18, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#ff73fa' : '#3a2535';
        ctx.fill();

        ctx.fillStyle = isActive ? '#ffffff' : '#777088';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x, iconsY + 45);
    }

    const progressBarY = iconsY + 65;
    const barWidth = endX - startX;
    
    ctx.fillStyle = '#3a2535';
    ctx.beginPath();
    ctx.roundRect(startX, progressBarY, barWidth, 14, 7);
    ctx.fill();

    const maxMonths = milestones[milestones.length - 1].months;
    const progressRatio = Math.min(1, currentMonths / maxMonths);
    
    if (progressRatio > 0) {
        ctx.fillStyle = '#ff73fa';
        ctx.shadowColor = '#ff73fa';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(startX, progressBarY, Math.max(14, barWidth * progressRatio), 14, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    const remainingText = calculateExactRemainingTime(startDate, nextMilestone.months);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(remainingText, width / 2, progressBarY + 65);

    drawWatermarks(ctx, width, height);
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
            const imageBuffer = await generateNoBadgeCard();
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-nitro.png' });
            return message.reply({
                content: `<@${message.author.id}>`,
                files: [attachment]
            });
        }

        const startDate = (user.createdTimestamp) ? new Date(user.createdTimestamp) : new Date();
        const imageBuffer = await generateNitroBadgeCard(startDate, NITRO_MILESTONES);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // أمر البوست (-b / -boost)
    if (command === 'b' || command === 'boost') {
        if (!member || !member.premiumSince) {
            return message.reply({ content: `<@${message.author.id}> أنت لست مساهماً ببوست في هذا السيرفر حالياً` });
        }

        const startDate = new Date(member.premiumSince);
        const imageBuffer = await generateBoostBadgeCard(startDate, BOOST_MILESTONES);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-boost.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // أمر معلومات النيترو (-t / -type)
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
        const diffTime = Math.abs(now - startDate);
        const currentMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375));

        return message.reply({
            content: `🔍 **معلومات اشتراك المستخدم <@${message.author.id}>:**\n📌 **نوع الاشتراك:** ${nitroType}\n⏳ **المدة التقريبية المضيئة:** ${currentMonths} أشهر تقريباً\n🛠️ **DEV: FOX** | **REBA SERVER**`
        });
    }
});

client.login(process.env.TOKEN);
