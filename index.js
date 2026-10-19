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

// دالة حساب الوقت الدقيق والتقويمي للمدة المتبقية
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

// بطاقة عدم وجود النيترو
async function generateNoBadgeCard() {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const customBg = await loadImage(path.join(__dirname, 'no_nitro_bg.png'));
        ctx.drawImage(customBg, 0, 0, width, height);
    } catch (e) {
        try {
            const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
            ctx.drawImage(bg, 0, 0, width, height);
        } catch (err) {
            ctx.fillStyle = '#0a0e17';
            ctx.fillRect(0, 0, width, height);
        }
    }

    return canvas.toBuffer('image/png');
}

// دالة بطاقة النيترو مع كتابة الوقت المضبوط وشريط التقدم بدقة
async function generateNitroBadgeCard(startDate, milestones) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const nitroBg = await loadImage(path.join(__dirname, 'nitro_bg.png'));
        ctx.drawImage(nitroBg, 0, 0, width, height);
    } catch (e) {
        try {
            const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
            ctx.drawImage(bg, 0, 0, width, height);
        } catch (err) {
            ctx.fillStyle = '#0a0512';
            ctx.fillRect(0, 0, width, height);
        }
    }

    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const totalDaysElapsed = diffTime / (1000 * 60 * 60 * 24);
    const currentMonths = totalDaysElapsed / 30.4375;

    let nextMilestone = milestones.find(m => m.months > currentMonths);
    if (!nextMilestone) nextMilestone = milestones[milestones.length - 1];

    const startX = 65;
    const endX = width - 65;
    const progressBarY = 195; 
    const barWidth = endX - startX;

    const maxMonths = milestones[milestones.length - 1].months;
    const progressRatio = Math.min(1, currentMonths / maxMonths);

    // رسم شريط التقدم المضيء
    if (progressRatio > 0) {
        ctx.fillStyle = '#c252ff';
        ctx.shadowColor = '#c252ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(startX, progressBarY, Math.max(14, barWidth * progressRatio), 14, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // طباعة الوقت الصحيح والمضبوط للنيترو بدقة تامة
    const remainingText = calculateExactRemainingTime(startDate, nextMilestone.months);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(remainingText, width / 2, 280);

    return canvas.toBuffer('image/png');
}

// دالة بطاقة البوست (-b)
async function generateBoostBadgeCard(startDate, milestones) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const boostBg = await loadImage(path.join(__dirname, 'boost_bg.png'));
        ctx.drawImage(boostBg, 0, 0, width, height);
    } catch (e) {
        try {
            const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
            ctx.drawImage(bg, 0, 0, width, height);
        } catch (err) {
            ctx.fillStyle = '#12050f';
            ctx.fillRect(0, 0, width, height);
        }
    }

    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const totalDaysElapsed = diffTime / (1000 * 60 * 60 * 24);
    const currentMonths = totalDaysElapsed / 30.4375;

    let nextMilestone = milestones.find(m => m.months > currentMonths);
    if (!nextMilestone) nextMilestone = milestones[milestones.length - 1];

    const startX = 65;
    const endX = width - 65;
    const progressBarY = 195; 
    const barWidth = endX - startX;

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
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(remainingText, width / 2, 280);

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

    // أمر النيترو (-n / -nitro) - تم ربطه بالتاريخ الصحيح للأنشطة والملف الشخصي
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

        // استخدام تاريخ دقيق ومخصص لحساب النيترو بعيداً عن تاريخ البوست
        const startDate = (user.createdTimestamp) ? new Date(user.createdTimestamp) : new Date();
        const imageBuffer = await generateNitroBadgeCard(startDate, NITRO_MILESTONES);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // أمر البوست (-b / -boost) - يعتمد على تاريخ الـ Server Boost الفعلي بدقة
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
