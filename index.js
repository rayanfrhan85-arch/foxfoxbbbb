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

// شارات النيترو والبوست الرسمية بالشهور حسب ديسكورد
const NITRO_MILESTONES_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72];
const BOOST_MILESTONES_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

// دالة حساب الوقت والنسبة بدقة فائقة
function calculateExactMilestoneData(startDate, milestones) {
    const now = new Date();
    
    // حساب الفرق الإجمالي بالشهور والدقائق
    let yearsDiff = now.getFullYear() - startDate.getFullYear();
    let monthsDiff = now.getMonth() - startDate.getMonth();
    let currentTotalMonths = yearsDiff * 12 + monthsDiff;

    if (now.getDate() < startDate.getDate()) {
        currentTotalMonths--;
    }
    currentTotalMonths = Math.max(0, currentTotalMonths);

    let prevMilestone = 0;
    let targetMilestone = milestones[milestones.length - 1];

    for (let i = 0; i < milestones.length; i++) {
        if (milestones[i] > currentTotalMonths) {
            targetMilestone = milestones[i];
            prevMilestone = i > 0 ? milestones[i - 1] : 0;
            break;
        }
    }

    // التاريخ الفعلي للوصول للشارة المستهدفة
    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMilestone);

    // التاريخ الفعلي للشارة السابقة
    const lastMilestoneDate = new Date(startDate.getTime());
    lastMilestoneDate.setMonth(lastMilestoneDate.getMonth() + prevMilestone);

    // حساب نسبة تقدم الشريط بكسورها الدقيقة (بدقة الميللي ثانية)
    let progress = 1;
    if (targetDate > now) {
        let totalSpan = targetDate.getTime() - lastMilestoneDate.getTime();
        let currentSpan = now.getTime() - lastMilestoneDate.getTime();
        progress = Math.min(1, Math.max(0, currentSpan / totalSpan));
    }

    // حساب الوقت المتبقي بالأيام والأسابيع والشهور
    let remainingMs = targetDate.getTime() - now.getTime();
    if (remainingMs <= 0) {
        return {
            timeText: "وصلت لنهاية المطاف عاشت ايدك 🎉",
            progress: 1,
            currentMonths: currentTotalMonths,
            prevMilestone,
            targetMilestone
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

    let timeText = parts.length > 0 ? `سوف تصل الى الشارة التالية بعد ${parts.join(' و ')}` : "سوف تصل الى الشارة التالية قريباً جداً ⚡";

    return {
        timeText,
        progress,
        currentMonths: currentTotalMonths,
        prevMilestone,
        targetMilestone
    };
}

// دالة رسم الصورة والتعديل المحترف عليها
async function renderCanvasCard(bgFileName, milestoneData) {
    const bgPath = path.join(__dirname, bgFileName);
    
    if (!fs.existsSync(bgPath)) {
        const canvas = createCanvas(850, 420);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f111a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("الصورة غير موجودة!", canvas.width / 2, canvas.height / 2);
        return canvas.toBuffer('image/png');
    }

    const bgImage = await loadImage(bgPath);
    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext('2d');

    // رسم الخلفية الأصلية المصممة
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // إحداثيات ومقاسات شريط التقدم
    const barX = canvas.width * 0.1;
    const barY = canvas.height * 0.54;
    const maxBarWidth = canvas.width * 0.8;
    const barHeight = 16;

    // خلفية الشريط (رمادي شفاف ناعم)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, maxBarWidth, barHeight, 8);
    ctx.fill();

    // الشريط البنفسجي المحسوب بدقة
    const currentBarWidth = Math.max(16, Math.min(maxBarWidth, maxBarWidth * milestoneData.progress));
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(barX, barY, currentBarWidth, barHeight, 8);
    ctx.fill();

    // إضافة ظلال خفيفة للخط لجعله واضحاً وفخماً
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;

    // 1. كتابة النسبة المئوية والتقدم أعلى الشريط
    const percentText = `${Math.floor(milestoneData.progress * 100)}%`;
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(percentText, barX, barY - 12);

    // 2. كتابة الأرقام تحت الشارات (مثلاً: 3 / 6 أشهر) أعلى الشريط يميناً
    const monthsText = `${milestoneData.currentMonths} / ${milestoneData.targetMilestone} شهر`;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(monthsText, barX + maxBarWidth, barY - 12);

    // 3. كتابة الوقت المتبقي الكبير بالأسفل بوضوح كامل
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(milestoneData.timeText, canvas.width / 2, canvas.height * 0.76);

    // إعادة ضبط الظل
    ctx.shadowBlur = 0;

    return canvas.toBuffer('image/png');
}

// دالة إرسال صورة بدون شارة كما صممتها
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
    else return;

    // استجابة فورية بدون تأخير
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
        const milestoneData = calculateExactMilestoneData(startDate, BOOST_MILESTONES_MONTHS);

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
        const milestoneData = calculateExactMilestoneData(startDate, NITRO_MILESTONES_MONTHS);

        const buffer = await renderCanvasCard('nitro-bg.png', milestoneData);
        const attachment = new AttachmentBuilder(buffer, { name: 'nitro-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
    }
});

client.login(process.env.TOKEN);
