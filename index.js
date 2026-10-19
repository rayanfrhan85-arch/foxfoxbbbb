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

// مستويات البوست
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

// دالة حساب الوقت المتبقي
function getExactRemainingTimeText(targetDate) {
    const now = new Date();
    let diffMs = targetDate - now;

    if (diffMs <= 0) return "لقد وصلت إلى أعلى مستوى للشارة!";

    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor((diffMs / (1000 * 60 * 60 * 24)) % 30);
    const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));

    let parts = [];
    if (months > 0) parts.push(`${months} أشهر`);
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0) parts.push(`${minutes} دقيقة`);

    return `سوف تصل الى الشارة التالية بعد ${parts.join(' و ')}`;
}

// بطاقة عدم وجود الشارة
async function generateNoBadgeCard(titleText) {
    const width = 800;
    const height = 400;
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

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 85);

    ctx.fillStyle = '#ff4a4a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText("ليس لديك هذه الشارة", width / 2, 220);

    return canvas.toBuffer('image/png');
}

// دالة رسم البطاقة
async function generateBadgeCard(titleText, startDate, milestones, isNitro = false) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.88)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#0a0512';
        ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
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

    const remainingText = getExactRemainingTimeText(nextBadgeDate);
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

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // جلب المستخدم والعضو بالكامل
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
            const imageBuffer = await generateNoBadgeCard('اشارة البوست');
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
    // أمر النيترو (-n / -nitro) المعدل والموسع
    // ===================================
    if (command === 'n' || command === 'nitro') {
        const userFlags = user.flags ? user.flags.toArray() : [];
        const avatarDecoration = user.avatarDecoration;
        const isCustomBanner = user.banner !== null;
        const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
        const isBoosting = member && member.premiumSince !== null;

        // طريقة فحص النيترو الموسعة (تشمل الصور المتحركة، البانر، الزخارف، الشارات، أو البوست)
        const hasNitro = userFlags.some(flag => flag.includes('Premium') || flag.includes('Nitro')) || 
                         isAnimatedAvatar || 
                         isCustomBanner || 
                         avatarDecoration || 
                         isBoosting;

        if (!hasNitro) {
            const imageBuffer = await generateNoBadgeCard('اشارة النيترو');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-nitro.png' });
            return message.reply({
                content: `<@${message.author.id}>`,
                files: [attachment]
            });
        }

        // استخدام تاريخ البوست إن وجد أو تاريخ افتراضي حساسيته عالية
        const nitroStartDate = (member && member.premiumSince) ? new Date(member.premiumSince) : new Date(Date.now() - (60 * 24 * 60 * 60 * 1000));

        const imageBuffer = await generateBadgeCard('اشارة النيترو', nitroStartDate, NITRO_MILESTONES, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
