require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// شارات النيترو والبوست الرسمية (بالشهور)
const NITRO_MILESTONES_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72];
const BOOST_MILESTONES_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

// ==========================================================
// ⚙️ الإعدادات اليدوية:
// 1. تاريخ بداية النيترو الخاص بك (لتشغيل أمر n بدقة)
// 2. تاريخ انتهاء اشتراك النيترو الحالي (لتشغيل أمر t)
// ==========================================================
const MANUAL_NITRO_START = new Date('2024-01-15T00:00:00Z'); 
const NITRO_EXPIRE_DATE = new Date('2026-12-31T23:59:59Z');  

// دالة حساب الوقت المتبقي للشارة القادمة بدقة
function getExactTargetRemainingTime(startDate, targetMonths) {
    const now = new Date();
    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    if (targetDate <= now) return "وصلت لنهاية المطاف عاشت ايدك 🎉";

    let yearsDiff = targetDate.getFullYear() - now.getFullYear();
    let monthsDiff = targetDate.getMonth() - now.getMonth();
    let totalMonths = yearsDiff * 12 + monthsDiff;

    let tempDate = new Date(now.getTime());
    tempDate.setMonth(tempDate.getMonth() + totalMonths);

    if (tempDate > targetDate) {
        totalMonths--;
        tempDate = new Date(now.getTime());
        tempDate.setMonth(tempDate.getMonth() + totalMonths);
    }

    let remainingMs = targetDate.getTime() - tempDate.getTime();
    let totalDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    let weeks = Math.floor(totalDays / 7);

    let parts = [];
    if (totalMonths > 0) parts.push(`${totalMonths} شهر`);
    if (weeks > 0) parts.push(`${weeks} أسابيع`);
    if (totalDays % 7 > 0) parts.push(`${totalDays % 7} أيام`);

    if (parts.length === 0) return "سوف تصل الى الشارة التالية بعد دقائق قليلة ⚡";

    return `سوف تصل الى الشارة التالية بعد ${parts.join(' و ')}`;
}

// حساب الوقت المتبقي لانتهاء اشتراك النيترو (أمر t)
function getNitroExpiryRemainingTime(expireDate) {
    const now = new Date();
    const totalMs = expireDate.getTime() - now.getTime();

    if (totalMs <= 0) return "انتهى اشتراك النيترو بالفعل!";

    let totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    let months = Math.floor(totalDays / 30);
    let days = totalDays % 30;
    let hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);

    let parts = [];
    if (months > 0) parts.push(`${months} شهر`);
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);

    return parts.join(' و ');
}

// حساب نسبة التقدم بين الشارة الحالية والشارة القادمة
function calculateStepProgress(startDate, milestones) {
    const now = new Date();
    let prevMonths = 0;
    let targetMonth = milestones[0];

    for (let i = 0; i < milestones.length; i++) {
        let milestoneDate = new Date(startDate.getTime());
        milestoneDate.setMonth(milestoneDate.getMonth() + milestones[i]);

        if (now >= milestoneDate) {
            prevMonths = milestones[i];
            targetMonth = milestones[i + 1] || milestones[i];
        } else {
            targetMonth = milestones[i];
            break;
        }
    }

    let prevDate = new Date(startDate.getTime());
    prevDate.setMonth(prevDate.getMonth() + prevMonths);

    let targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonth);

    let totalDuration = targetDate.getTime() - prevDate.getTime();
    let elapsed = now.getTime() - prevDate.getTime();

    if (totalDuration <= 0) return { progress: 1, targetMonth };

    let progress = Math.max(0, Math.min(1, elapsed / totalDuration));
    return { progress, targetMonth };
}

// 🎨 ترتيب مكان النص وشريط التقدم بدقة داخل الصورة
async function renderCustomCard(bgFileName, timeText, progressPercent) {
    const bgPath = path.join(__dirname, bgFileName);
    
    if (!fs.existsSync(bgPath)) {
        const canvas = createCanvas(850, 420);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f111a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("الصورة غير موجودة في المستودع!", canvas.width / 2, canvas.height / 2);
        return canvas.toBuffer('image/png');
    }

    const bgImage = await loadImage(bgPath);
    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext('2d');

    // رسم الخلفية الأصلية
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // 📍 إحداثيات شريط التقدم (مكان مرتب ومنتصف الصورة تماماً)
    const barX = canvas.width * 0.1;       // يبدأ من 10% من عرض الصورة
    const barY = canvas.height * 0.52;     // في منتصف الارتفاع تقريباً
    const maxBarWidth = canvas.width * 0.8;// عرض الشريط 80% من الكارد
    const barHeight = 14;                  // سمك الشريط

    const currentBarWidth = Math.max(15, Math.min(maxBarWidth, maxBarWidth * progressPercent));

    // رسم خلفية الشريط (اختياري، لون خفيف) أو رسم شريط التقدم البنفسجي مباشرة
    ctx.fillStyle = '#a855f7'; // لون بنفسجي مميز
    ctx.beginPath();
    ctx.roundRect(barX, barY, currentBarWidth, barHeight, 7);
    ctx.fill();

    // 📍 إحداثيات مكان النص (تحت شريط التقدم بمسافة مناسبة ومرتبة)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeText, canvas.width / 2, canvas.height * 0.72);

    return canvas.toBuffer('image/png');
}

// دالة إرسال صورة عدم وجود شارة مباشرة
async function renderNoBadgeCard(bgFileName) {
    const bgPath = path.join(__dirname, bgFileName);
    
    if (!fs.existsSync(bgPath)) {
        const canvas = createCanvas(850, 420);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f111a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return canvas.toBuffer('image/png');
    }

    const bgImage = await loadImage(bgPath);
    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} | DEV: FOX`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.trim().toLowerCase();
    let command = "";
    if (content === 'n' || content === 'nitro' || content === '-n') command = 'n';
    else if (content === 'b' || content === 'boost' || content === '-b') command = 'b';
    else if (content === 't' || content === 'time' || content === '-t') command = 't';
    else return;

    await message.channel.sendTyping().catch(() => {});

    let member = message.member;
    let user = message.author;

    try {
        user = await client.users.fetch(message.author.id, { force: true });
        if (message.guild) {
            member = await message.guild.members.fetch({ user: message.author.id, force: true });
        }
    } catch (e) {}

    // --- أمر البوست (b) ---
    if (command === 'b') {
        if (!member || !member.premiumSince) {
            const buffer = await renderNoBadgeCard('no-boost.png');
            const attachment = new AttachmentBuilder(buffer, { name: 'no-boost.png' });
            return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
        }

        const startDate = new Date(member.premiumSince);
        const { progress, targetMonth } = calculateStepProgress(startDate, BOOST_MILESTONES_MONTHS);
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);

        const buffer = await renderCustomCard('boost-bg.png', timeRemaining, progress);
        const attachment = new AttachmentBuilder(buffer, { name: 'boost-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
    }

    // --- أمر النيترو (n) ---
    if (command === 'n') {
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
            const buffer = await renderNoBadgeCard('no-nitro.png');
            const attachment = new AttachmentBuilder(buffer, { name: 'no-nitro.png' });
            return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
        }

        const startDate = MANUAL_NITRO_START;
        const { progress, targetMonth } = calculateStepProgress(startDate, NITRO_MILESTONES_MONTHS);
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);

        // تم ربطها بالصورة الصحيحة المتاحة في مستودعك: nitro-bg.png
        const buffer = await renderCustomCard('nitro-bg.png', timeRemaining, progress);
        const attachment = new AttachmentBuilder(buffer, { name: 'nitro-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
    }

    // --- أمر الوقت المتبقي لانتهاء اشتراك النيترو (t) ---
    if (command === 't') {
        let timeRemaining = getNitroExpiryRemainingTime(NITRO_EXPIRE_DATE);
        return message.reply(`<@${message.author.id}> ⏳ الوقت المتبقي لانتهاء اشتراك النيترو الخاص بك هو: **${timeRemaining}**`);
    }
});

client.login(process.env.TOKEN);
