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

// 1. مصفوفة شارات النيترو الرسمية
const NITRO_BADGES = [
    { months: 1, name: "Bronze" },
    { months: 3, name: "Silver" },
    { months: 6, name: "Gold" },
    { months: 12, name: "Platinum" },
    { months: 24, name: "Diamond" },
    { months: 36, name: "Emerald" },
    { months: 60, name: "Ruby" },
    { months: 72, name: "Opal" }
];

// 2. مصفوفة شارات البوست الرسمية
const BOOST_BADGES = [
    { months: 1, name: "Level 1" },
    { months: 2, name: "Level 2" },
    { months: 3, name: "Level 3" },
    { months: 6, name: "Level 4" },
    { months: 9, name: "Level 5" },
    { months: 12, name: "Level 6" },
    { months: 15, name: "Level 7" },
    { months: 18, name: "Level 8" },
    { months: 24, name: "Level 9" }
];

// دالة حساب البيانات والوقت بدقة كاملة
function calculateMilestone(startDate, badgeList) {
    const now = new Date();

    // حساب الشهور الإجمالية بين تاريخ البداية وتاريخ اليوم
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let totalMonths = years * 12 + months;

    if (now.getDate() < startDate.getDate()) {
        totalMonths--;
    }
    totalMonths = Math.max(0, totalMonths);

    // تحديد الشارة الحالية والشارة القادمة
    let currentBadge = "لا توجد شارة";
    let nextBadge = badgeList[0].name;
    let targetMonths = badgeList[0].months;
    let prevMonths = 0;

    for (let i = 0; i < badgeList.length; i++) {
        if (totalMonths >= badgeList[i].months) {
            currentBadge = badgeList[i].name;
            prevMonths = badgeList[i].months;
        }
        if (totalMonths < badgeList[i].months) {
            nextBadge = badgeList[i].name;
            targetMonths = badgeList[i].months;
            break;
        }
    }

    // إذا تجاوز أعلى شارة
    if (totalMonths >= badgeList[badgeList.length - 1].months) {
        nextBadge = "أعلى شارة 🎉";
        targetMonths = badgeList[badgeList.length - 1].months;
    }

    // حساب موعد الشارة القادمة بالتمام
    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    const prevDate = new Date(startDate.getTime());
    prevDate.setMonth(prevDate.getMonth() + prevMonths);

    // حساب نسبة التقدم لشريط الرسم
    let progress = 1;
    if (targetDate > now && targetMonths > prevMonths) {
        let totalTime = targetDate.getTime() - prevDate.getTime();
        let passedTime = now.getTime() - prevDate.getTime();
        progress = Math.min(1, Math.max(0, passedTime / totalTime));
    }

    // حساب الأيام والأسابيع والشهور المتبقية
    let diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0 || totalMonths >= badgeList[badgeList.length - 1].months) {
        return {
            currentBadge,
            nextBadge,
            progress: 1,
            timeText: "وصلت إلى الشارة النهائية 🎉",
            currentMonths: totalMonths,
            targetMonths
        };
    }

    let totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let remMonths = Math.floor(totalDays / 30);
    let remDays = totalDays % 30;
    let remWeeks = Math.floor(remDays / 7);
    let finalDays = remDays % 7;

    let parts = [];
    if (remMonths > 0) parts.push(`${remMonths} شهر`);
    if (remWeeks > 0) parts.push(`${remWeeks} أسابيع`);
    if (finalDays > 0) parts.push(`${finalDays} أيام`);

    let timeText = parts.length > 0 ? `متبقي: ${parts.join(' و ')}` : "متبقي ساعات قليلة ⚡";

    return {
        currentBadge,
        nextBadge,
        progress,
        timeText,
        currentMonths: totalMonths,
        targetMonths
    };
}

// دالة الرسم على صورة الخلفية
async function drawCard(bgName, data) {
    const bgPath = path.join(__dirname, bgName);
    const canvas = createCanvas(850, 420);
    const ctx = canvas.getContext('2d');

    if (fs.existsSync(bgPath)) {
        const bg = await loadImage(bgPath);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#0f111a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (!data) return canvas.toBuffer('image/png');

    // إحداثيات ومواقع الرسم
    const barX = canvas.width * 0.08;
    const barY = canvas.height * 0.58;
    const barWidth = canvas.width * 0.84;
    const barHeight = 18;

    // 1. خلفية شريط التقدم
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 9);
    ctx.fill();

    // 2. الشريط البنفسجي الممتلئ
    const fillWidth = Math.max(18, Math.min(barWidth, barWidth * data.progress));
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillWidth, barHeight, 9);
    ctx.fill();

    // إضافة ظلال خفيفة للنصوص لتظهر بشكل فخم وواضح جداً
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;

    // 3. كتابة الشارة الحالية والشارة التالية فوق الشريط
    ctx.font = 'bold 22px sans-serif';

    // الشارة الحالية (جهة اليسار)
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(`الحالية: ${data.currentBadge}`, barX, barY - 14);

    // الشارة التالية (جهة اليمين)
    ctx.fillStyle = '#c084fc';
    ctx.textAlign = 'right';
    ctx.fillText(`التالية: ${data.nextBadge}`, barX + barWidth, barY - 14);

    // 4. النسبة المئوية والشهور تحت الشريط
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#e2e8f0';

    ctx.textAlign = 'left';
    ctx.fillText(`التقدم: ${Math.floor(data.progress * 100)}%`, barX, barY + barHeight + 24);

    ctx.textAlign = 'right';
    ctx.fillText(`الشهور: ${data.currentMonths} / ${data.targetMonths}`, barX + barWidth, barY + barHeight + 24);

    // 5. الوقت المتبقي في الأسفل بمنتصف الكرت
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ ${data.timeText}`, canvas.width / 2, canvas.height * 0.88);

    ctx.shadowBlur = 0;
    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Bot Ready: ${client.user.tag} | Dev: FOX`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const cmd = message.content.trim().toLowerCase();
    let isNitro = (cmd === 'n' || cmd === 'nitro' || cmd === '-n');
    let isBoost = (cmd === 'b' || cmd === 'boost' || cmd === '-b');

    if (!isNitro && !isBoost) return;

    await message.channel.sendTyping().catch(() => {});

    let member = message.member;
    let user = message.author;

    try {
        user = await client.users.fetch(message.author.id, { force: true });
        if (message.guild) {
            member = await message.guild.members.fetch({ user: message.author.id, force: true });
        }
    } catch (e) {}

    // --- أمر البوست ---
    if (isBoost) {
        if (!member || !member.premiumSince) {
            const buffer = await drawCard('no-boost.png', null);
            const file = new AttachmentBuilder(buffer, { name: 'no-boost.png' });
            return message.reply({ content: `<@${message.author.id}>`, files: [file] });
        }

        const startDate = new Date(member.premiumSince);
        const data = calculateMilestone(startDate, BOOST_BADGES);

        const buffer = await drawCard('boost-bg.png', data);
        const file = new AttachmentBuilder(buffer, { name: 'boost-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [file] });
    }

    // --- أمر النيترو ---
    if (isNitro) {
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
            const buffer = await drawCard('no-nitro.png', null);
            const file = new AttachmentBuilder(buffer, { name: 'no-nitro.png' });
            return message.reply({ content: `<@${message.author.id}>`, files: [file] });
        }

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const data = calculateMilestone(startDate, NITRO_BADGES);

        const buffer = await drawCard('nitro-bg.png', data);
        const file = new AttachmentBuilder(buffer, { name: 'nitro-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [file] });
    }
});

client.login(process.env.TOKEN);
