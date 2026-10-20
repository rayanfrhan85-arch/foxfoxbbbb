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

function getProgressAndRemainingTime(startDate, milestones) {
    const now = new Date();
    
    // حساب إجمالي الشهور منذ تاريخ البداية
    let yearsDiff = now.getFullYear() - startDate.getFullYear();
    let monthsDiff = now.getMonth() - startDate.getMonth();
    let currentTotalMonths = yearsDiff * 12 + monthsDiff;

    if (now.getDate() < startDate.getDate()) {
        currentTotalMonths--;
    }
    currentTotalMonths = Math.max(0, currentTotalMonths);

    // تحديد الشارة السابقة والشارة المستهدفة القادمة
    let prevMilestone = 0;
    let targetMilestone = milestones[milestones.length - 1];

    for (let i = 0; i < milestones.length; i++) {
        if (milestones[i] > currentTotalMonths) {
            targetMilestone = milestones[i];
            prevMilestone = i > 0 ? milestones[i - 1] : 0;
            break;
        }
    }

    // تاريخ الوصول للشارة المستهدفة
    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMilestone);

    // حساب نسبة الشريط البنفسجي بين الشارة السابقة والمستهدفة
    let progress = 1;
    let totalRange = targetMilestone - prevMilestone;
    let currentRange = currentTotalMonths - prevMilestone;
    
    if (targetDate > now) {
        let lastMilestoneDate = new Date(startDate.getTime());
        lastMilestoneDate.setMonth(lastMilestoneDate.getMonth() + prevMilestone);

        let totalMs = targetDate.getTime() - lastMilestoneDate.getTime();
        let elapsedMs = now.getTime() - lastMilestoneDate.getTime();
        progress = Math.min(1, Math.max(0, elapsedMs / totalMs));
    }

    // حساب الوقت المتبقي الفعلي بدقة للشارة القادمة
    let remainingMs = targetDate.getTime() - now.getTime();
    if (remainingMs <= 0) {
        return {
            timeText: "وصلت لنهاية المطاف عاشت ايدك 🎉",
            progress: 1,
            currentMonths: currentTotalMonths,
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
        targetMilestone
    };
}

async function renderCustomCard(bgFileName, timeData) {
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

    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    const barX = canvas.width * 0.1;
    const barY = canvas.height * 0.52;
    const maxBarWidth = canvas.width * 0.8;
    const barHeight = 16;

    const currentBarWidth = Math.max(15, Math.min(maxBarWidth, maxBarWidth * timeData.progress));

    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(barX, barY, currentBarWidth, barHeight, 8);
    ctx.fill();

    const percentText = `${Math.floor(timeData.progress * 100)}% (${timeData.currentMonths} / ${timeData.targetMilestone} شهر)`;
    ctx.fillStyle = '#e9d5ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(percentText, barX + maxBarWidth, barY - 10);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeData.timeText, canvas.width / 2, canvas.height * 0.75);

    return canvas.toBuffer('image/png');
}

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

    await message.channel.sendTyping().catch(() => {});

    let member = message.member;
    let user = message.author;

    try {
        user = await client.users.fetch(message.author.id, { force: true });
        if (message.guild) {
            member = await message.guild.members.fetch({ user: message.author.id, force: true });
        }
    } catch (e) {}

    if (command === 'b') {
        if (!member || !member.premiumSince) {
            const buffer = await renderNoBadgeCard('no-boost.png');
            const attachment = new AttachmentBuilder(buffer, { name: 'no-boost.png' });
            return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
        }

        const startDate = new Date(member.premiumSince);
        const timeData = getProgressAndRemainingTime(startDate, BOOST_MILESTONES_MONTHS);

        const buffer = await renderCustomCard('boost-bg.png', timeData);
        const attachment = new AttachmentBuilder(buffer, { name: 'boost-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
    }

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
        const timeData = getProgressAndRemainingTime(startDate, NITRO_MILESTONES_MONTHS);

        const buffer = await renderCustomCard('no_nitro_bg.png', timeData);
        const attachment = new AttachmentBuilder(buffer, { name: 'nitro-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
    }
});

client.login(process.env.TOKEN);
