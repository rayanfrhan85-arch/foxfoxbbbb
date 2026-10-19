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

// مستويات النيترو بالشهور
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

// مستويات البوست بالشهور
const BOOST_MILESTONES = [
    { label: "1M", months: 1 },
    { label: "2M", months: 2 },
    { label: "3M", months: 3 },
    { label: "6M", months: 6 },
    { label: "9M", months: 9 },
    { label: "12M", months: 12 },
    { label: "15M", months: 15 },
    { label: "18M", months: 18 },
    { label: "24M", months: 24 }
];

// دالة رسم حقوق المطور والسيرفر الإبداعية
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

// دالة حساب الوقت الدقيق جداً
function calculateExactRemainingTime(targetDate) {
    const now = new Date();
    let diffMs = targetDate - now;

    if (diffMs <= 0) return "وصلت لنهاية المطاف يمعود، عاشت ايدك!";

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    const months = Math.floor(totalDays / 30.4375);
    const days = Math.floor(totalDays % 30.4375);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    let parts = [];
    if (months > 0) parts.push(`${months} أشهر`);
    if (days > 0) parts.push(`${days} يوم و ${hours} ساعة`);
    else if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0) parts.push(`${minutes} دقيقة`);

    if (parts.length === 0) return "وراها بشوية وتوصل للشارة التالية!";

    return `توصل للشارة التالية بعد ${parts.join(' و ')}`;
}

// بطاقة عدم وجود الشارة بالكلام العراقي المرتب
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

    // الكلام العراقي المرتب
    ctx.fillStyle = '#ff5c5c';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(iraqiMessage, width / 2, 215);

    drawCreativeWatermarks(ctx, width, height);

    return canvas.toBuffer('image/png');
}

// دالة رسم معلومات أمر -t (معلومات الاشتراك ونوع النيترو والمدة المتبقية)
async function generateTypeCard(userName, nitroTypeDesc, startDate, milestones, isNitro = true) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.86)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#0a0512';
        ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = 'rgba(244, 127, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // العنوان
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🔍 معلومات اشتراك: ${userName}`, width / 2, 65);

    // نوع الاشتراكات
    ctx.fillStyle = '#ff73fa';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`📌 النوع: ${nitroTypeDesc}`, width / 2, 140);

    // الحساب والوقت المتبقي
    const now = new Date();
    const diffMs = Math.max(0, now - startDate);
    const totalDays = diffMs / (1000 * 60 * 60 * 24);
    const currentMonths = totalDays / 30.4375;

    let nextMilestone = milestones.find(m => m.months > currentMonths);
    if (!nextMilestone) nextMilestone = milestones[milestones.length - 1];

    const nextBadgeDate = new Date(startDate.getTime());
    nextBadgeDate.setMonth(nextBadgeDate.getMonth() + nextMilestone.months);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`⏳ المدة المضيئة تقريباً: ${Math.floor(currentMonths)} شهر`, width / 2, 210);

    const remainingText = calculateExactRemainingTime(nextBadgeDate);
    ctx.fillStyle = '#d4d4d4';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(remainingText, width / 2, 275);

    drawCreativeWatermarks(ctx, width, height);

    return canvas.toBuffer('image/png');
}

// دالة رسم بطاقات الشارات الأساسية (-n و -b)
async function generateBadgeCard(titleText, startDate, milestones, isNitro = false) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.85)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#0a0512';
        ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = isNitro ? 'rgba(244, 127, 255, 0.25)' : 'rgba(255, 115, 250, 0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 65);

    const now = new Date();
    const diffMs = Math.max(0, now - startDate);
    const totalDays = diffMs / (1000 * 60 * 60 * 24);
    const currentMonths = totalDays / 30.4375;

    let nextMilestone = milestones.find(m => m.months > currentMonths);
    if (!nextMilestone) nextMilestone = milestones[milestones.length - 1];

    const nextBadgeDate = new Date(startDate.getTime());
    nextBadgeDate.setMonth(nextBadgeDate.getMonth() + nextMilestone.months);

    const startX = 65;
    const endX = width - 65;
    const step = (endX - startX) / (milestones.length - 1);
    const iconsY = 145;

    milestones.forEach((m, i) => {
        const x = startX + (i * step);
        const isActive = currentMonths >= m.months;

        ctx.beginPath();
        if (isNitro) {
            ctx.arc(x, iconsY, 16, 0, Math.PI * 2);
        } else {
            ctx.moveTo(x, iconsY - 18);
            ctx.lineTo(x + 16, iconsY);
            ctx.lineTo(x, iconsY + 18);
            ctx.lineTo(x - 16, iconsY);
            ctx.closePath();
        }
        
        ctx.fillStyle = isActive ? (isNitro ? '#f47fff' : '#ff73fa') : '#2c2538';
        ctx.fill();

        if (isActive) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        }

        ctx.fillStyle = isActive ? '#ffffff' : '#777088';
        ctx.font = 'italic bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x, iconsY + 45);
    });

    const progressBarY = iconsY + 65;
    const barWidth = endX - startX;
    
    ctx.fillStyle = '#221a30';
    ctx.beginPath();
    ctx.roundRect(startX, progressBarY, barWidth, 12, 6);
    ctx.fill();

    const maxMonths = milestones[milestones.length - 1].months;
    const progressRatio = Math.min(1, currentMonths / maxMonths);
    
    if (progressRatio > 0) {
        ctx.fillStyle = isNitro ? '#f47fff' : '#ff73fa';
        ctx.beginPath();
        ctx.roundRect(startX, progressBarY, Math.max(12, barWidth * progressRatio), 12, 6);
        ctx.fill();
    }

    const remainingText = calculateExactRemainingTime(nextBadgeDate);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(remainingText, width / 2, progressBarY + 60);

    const currentBadgeY = progressBarY + 110;
    ctx.beginPath();
    ctx.arc(width / 2, currentBadgeY, 22, 0, Math.PI * 2);
    ctx.fillStyle = isNitro ? '#f47fff' : '#ff73fa';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    drawCreativeWatermarks(ctx, width, height);

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
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

    // ===================================
    // أمر البوست (-b / -boost)
    // ===================================
    if (command === 'b' || command === 'boost') {
        const premiumSince = member ? member.premiumSince : null;

        if (!premiumSince) {
            const imageBuffer = await generateNoBadgeCard('اشارة البوست', 'وين رايح يمعود، لا بوست ولا هم يحزنون!');
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

    // ===================================
    // أمر النيترو (-n / -nitro)
    // ===================================
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
            const imageBuffer = await generateNoBadgeCard('اشارة النيترو', 'وين رايح يمعود، ما عندك هاي الشارة!');
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

    // ===================================
    // أمر معلومات النيترو (-t / -type) كصورة مع منشن
    // ===================================
    if (command === 't' || command === 'type') {
        const userFlags = user.flags ? user.flags.toArray() : [];
        const isBoosting = member && member.premiumSince !== null;
        const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
        const isCustomBanner = user.banner !== null;
        const avatarDecoration = user.avatarDecoration;

        let nitroType = "غير مفعل";
        if (userFlags.some(f => f.includes('Nitro')) || isAnimatedAvatar || isCustomBanner || avatarDecoration) {
            nitroType = isBoosting ? "Discord Nitro (مع بوست للسيرفر 🚀)" : "Discord Nitro Classic ✨";
        } else if (isBoosting) {
            nitroType = "Server Booster فقط 💎";
        } else {
            const imageBuffer = await generateNoBadgeCard('معلومات الاشتراك', 'كلشي ماعندك يمعود، تعال اشتري وتعال!');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-type.png' });
            return message.reply({
                content: `<@${message.author.id}>`,
                files: [attachment]
            });
        }

        const startDate = (member && member.premiumSince) ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const displayName = member ? member.displayName : user.username;

        const imageBuffer = await generateTypeCard(displayName, nitroType, startDate, NITRO_MILESTONES, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-type.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
