require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = name => path.join(__dirname, name); // تم تعديلها لتكون آمنة وسريعة
const fs = require('fs');
const pathModule = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// شارات النيترو والبوست الرسمية مع مسمياتها لتعرف الشارة الحالية والتالية بدقة
const NITRO_MILESTONES = [
    { months: 0, name: "بدون شارة" },
    { months: 1, name: "Bronze (شُهر واحد)" },
    { months: 3, name: "Silver (3 أشهر)" },
    { months: 6, name: "Gold (6 أشهر)" },
    { months: 12, name: "Platinum (سنة واحدة)" },
    { months: 24, name: "Diamond (سنتين)" },
    { months: 36, name: "Emerald (3 سنوات)" },
    { months: 60, name: "Ruby (5 سنوات)" },
    { months: 72, name: "Opal (6+ سنوات)" }
];

const BOOST_MILESTONES = [
    { months: 0, name: "بدون شارة" },
    { months: 1, name: "الشارة الأولى (شهر)" },
    { months: 2, name: "الشارة الثانية (شهرين)" },
    { months: 3, name: "الشارة الثالثة (3 أشهر)" },
    { months: 6, name: "الشارة الرابعة (6 أشهر)" },
    { months: 9, name: "الشارة الخامسة (9 أشهر)" },
    { months: 12, name: "الشارة السادسة (سنة)" },
    { months: 15, name: "الشارة السابعة (15 شهر)" },
    { months: 18, name: "الشارة الثامنة (18 شهر)" },
    { months: 24, name: "الشارة التاسعة (سنتين)" }
];

// دالة حساب الشارات والوقت بدقة
function calculateMilestoneDetails(startDate, milestonesList) {
    const now = new Date();
    
    let yearsDiff = now.getFullYear() - startDate.getFullYear();
    let monthsDiff = now.getMonth() - startDate.getMonth();
    let currentTotalMonths = yearsDiff * 12 + monthsDiff;

    if (now.getDate() < startDate.getDate()) {
        currentTotalMonths--;
    }
    currentTotalMonths = Math.max(0, currentTotalMonths);

    let currentBadge = milestonesList[0].name;
    let nextBadge = milestonesList[milestonesList.length - 1].name;
    let targetMonths = milestonesList[milestonesList.length - 1].months;
    let prevMonths = 0;

    for (let i = 0; i < milestonesList.length; i++) {
        if (milestonesList[i].months <= currentTotalMonths) {
            currentBadge = milestonesList[i].name;
            prevMonths = milestonesList[i].months;
        }
        if (milestonesList[i].months > currentTotalMonths) {
            targetMonths = milestonesList[i].months;
            nextBadge = milestonesList[i].name;
            break;
        }
    }

    // إذا وصل لأعلى شارة
    if (currentTotalMonths >= milestonesList[milestonesList.length - 1].months) {
        nextBadge = "وصلت لنهاية المطاف (أعلى شارة) 🎉";
    }

    // التاريخ المستهدف للوصول للشارة التالية
    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    const prevDate = new Date(startDate.getTime());
    prevDate.setMonth(prevDate.getMonth() + prevMonths);

    let progress = 1;
    if (targetDate > now && currentTotalMonths < targetMonths) {
        let totalSpan = targetDate.getTime() - prevDate.getTime();
        let currentSpan = now.getTime() - prevDate.getTime();
        progress = Math.min(1, Math.max(0, currentSpan / totalSpan));
    }

    let remainingMs = targetDate.getTime() - now.getTime();
    if (remainingMs <= 0 || currentTotalMonths >= milestonesList[milestonesList.length - 1].months) {
        return {
            timeText: "وصلت لنهاية المطاف عاشت ايدك 🎉",
            progress: 1,
            currentMonths: currentTotalMonths,
            currentBadge,
            nextBadge: "مكتملة بالكامل ✨"
        };
    }

    let totalDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    let monthsLeft = Math.floor(totalDays / 30);
    let remainingDaysAfterMonths = totalDays % 30;
    let weeksLeft = Math.floor(remainingDaysAfterMonths / 7);
    let daysLeft = remainingDaysAfterMonths % 7;

    let parts = [];
    if (monthsLeft > 0) parts.push(`${monthsLeft} شهر`);
    if (weeksLeft > 0) parts.push(`${weeksLeft} أسابيع`);
    if (daysLeft > 0) parts.push(`${daysLeft} أيام`);

    let timeText = parts.length > 0 ? `بعد ${parts.join(' و ')}` : "قريباً جداً ⚡";

    return {
        timeText,
        progress,
        currentMonths: currentTotalMonths,
        currentBadge,
        nextBadge
    };
}

// دالة رسم الشارات الحالية والتالية والكتابة بشكل مرتب داخل الصورة
async function renderCanvasCard(bgFileName, data) {
    const bgPath = pathModule.join(__dirname, bgFileName);
    
    const canvas = createCanvas(850, 480); // قمنا بتكبير طول الصورة قليلاً لتتسع للكتابة براحة
    const ctx = canvas.getContext('2d');

    if (fs.existsSync(bgPath)) {
        const bgImage = await loadImage(bgPath);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#0f111a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // شريط التقدم البنفسجي
    const barX = canvas.width * 0.1;
    const barY = canvas.height * 0.46;
    const maxBarWidth = canvas.width * 0.8;
    const barHeight = 14;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, maxBarWidth, barHeight, 7);
    ctx.fill();

    const currentBarWidth = Math.max(14, Math.min(maxBarWidth, maxBarWidth * data.progress));
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(barX, barY, currentBarWidth, barHeight, 7);
    ctx.fill();

    // تأثير الظل للنصوص لضمان وضوحها الفائق
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;

    // 1. الشارة الحالية تحت الشريط يميناً أو يساراً
    ctx.fillStyle = '#38bdf8'; // لون سماوي مميز للحالية
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📍 الشارة الحالية: ${data.currentBadge}`, barX, barY + 45);

    // 2. الشارة التالية تحتها
    ctx.fillStyle = '#c084fc'; // لون بنفسجي فاتح للتالية
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🎯 الشارة التالية: ${data.nextBadge}`, barX, barY + 80);

    // 3. الوقت المتبقي بالأسفل
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ الوقت المتبقي للوصول: ${data.timeText}`, canvas.width / 2, canvas.height * 0.85);

    ctx.shadowBlur = 0;
    return canvas.toBuffer('image/png');
}

async function renderNoBadgeCard(bgFileName) {
    const bgPath = pathModule.join(__dirname, bgFileName);
    const canvas = createCanvas(850, 480);
    const ctx = canvas.getContext('2d');
    if (fs.existsSync(bgPath)) {
        const bgImage = await loadImage(bgPath);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#0f111a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
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
        const milestoneData = calculateMilestoneDetails(startDate, BOOST_MILESTONES);

        const buffer = await renderCanvasCard('boost-bg.png', milestoneData);
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

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const milestoneData = calculateMilestoneDetails(startDate, NITRO_MILESTONES);

        const buffer = await renderCanvasCard('nitro-bg.png', milestoneData);
        const attachment = new AttachmentBuilder(buffer, { name: 'nitro-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
    }
});

client.login(process.env.TOKEN);
