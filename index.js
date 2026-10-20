require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
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

// شارات النيترو الرسمية (بالشهور ومسمياتها)
const NITRO_MILESTONES = [
    { months: 0, name: "بدون شارة" },
    { months: 1, name: "Bronze (شهر واحد)" },
    { months: 3, name: "Silver (3 أشهر)" },
    { months: 6, name: "Gold (6 أشهر)" },
    { months: 12, name: "Platinum (سنة واحدة)" },
    { months: 24, name: "Diamond (سنتين)" },
    { months: 36, name: "Emerald (3 سنوات)" },
    { months: 60, name: "Ruby (5 سنوات)" },
    { months: 72, name: "Opal (6+ سنوات)" }
];

// شارات البوست الرسمية (بالشهور ومسمياتها)
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

// دالة حساب الشارات والوقت والنسبة بدقة فائقة
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

    if (currentTotalMonths >= milestonesList[milestonesList.length - 1].months) {
        nextBadge = "وصلت لنهاية المطاف (أعلى شارة) 🎉";
    }

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
            progressPercent: 100,
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

    let timeText = parts.length > 0 ? `بعد **${parts.join(' و ')}**` : "قريباً جداً ⚡";

    return {
        timeText,
        progressPercent: Math.floor(progress * 100),
        currentMonths: currentTotalMonths,
        currentBadge,
        nextBadge
    };
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
            const bgPath = path.join(__dirname, 'no-boost.png');
            const attachment = new AttachmentBuilder(bgPath, { name: 'no-boost.png' });
            return message.reply({ 
                content: `<@${message.author.id}>\n` +
                         `📍 **الشارة الحالية:** \`بدون شارة\` (0 شهر)\n` +
                         `🎯 **الشارة التالية:** \`الشارة الأولى (شهر)\`\n` +
                         `📊 **نسبة التقدم:** \`0%\`\n` +
                         `⏱️ **الوقت المتبقي:** غير متوفر`,
                files: [attachment] 
            });
        }

        const startDate = new Date(member.premiumSince);
        const data = calculateMilestoneDetails(startDate, BOOST_MILESTONES);
        const bgPath = path.join(__dirname, 'boost-bg.png'); // صورة البوست الفخمة الخاصة بك
        const attachment = new AttachmentBuilder(bgPath, { name: 'boost-bg.png' });

        return message.reply({
            content: `<@${message.author.id}>\n` +
                     `📍 **الشارة الحالية:** \`${data.currentBadge}\` (${data.currentMonths} شهر)\n` +
                     `🎯 **الشارة التالية:** \`${data.nextBadge}\`\n` +
                     `📊 **نسبة التقدم:** \`${data.progressPercent}%\`\n` +
                     `⏱️ **الوقت المتبقي:** ${data.timeText}`,
            files: [attachment]
        });
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
            const bgPath = path.join(__dirname, 'no-nitro.png');
            const attachment = new AttachmentBuilder(bgPath, { name: 'no-nitro.png' });
            return message.reply({ 
                content: `<@${message.author.id}>\n` +
                         `📍 **الشارة الحالية:** \`بدون شارة\` (0 شهر)\n` +
                         `🎯 **الشارة التالية:** \`Bronze (شهر واحد)\`\n` +
                         `📊 **نسبة التقدم:** \`0%\`\n` +
                         `⏱️ **الوقت المتبقي:** غير متوفر`,
                files: [attachment] 
            });
        }

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const data = calculateMilestoneDetails(startDate, NITRO_MILESTONES);
        const bgPath = path.join(__dirname, 'nitro-bg.png'); // صورة النيترو الفخمة الخاصة بك
        const attachment = new AttachmentBuilder(bgPath, { name: 'nitro-bg.png' });

        return message.reply({
            content: `<@${message.author.id}>\n` +
                     `📍 **الشارة الحالية:** \`${data.currentBadge}\` (${data.currentMonths} شهر)\n` +
                     `🎯 **الشارة التالية:** \`${data.nextBadge}\`\n` +
                     `📊 **نسبة التقدم:** \`${data.progressPercent}%\`\n` +
                     `⏱️ **الوقت المتبقي:** ${data.timeText}`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
