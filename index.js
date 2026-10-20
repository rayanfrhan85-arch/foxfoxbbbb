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

// شارات النيترو والبوست الرسمية بالشهور حسب ديسكورد
const NITRO_MILESTONES_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72];
const BOOST_MILESTONES_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

function getExactProgressData(startDate, milestones) {
    const now = new Date();
    
    let yearsDiff = now.getFullYear() - startDate.getFullYear();
    let monthsDiff = now.getMonth() - startDate.getMonth();
    let currentTotalMonths = yearsDiff * 12 + monthsDiff;

    if (now.getDate() < startDate.getDate()) {
        currentTotalMonths--;
    }
    currentTotalMonths = Math.max(0, currentTotalMonths);

    let targetMilestone = milestones[milestones.length - 1];
    let prevMilestone = 0;

    for (let i = 0; i < milestones.length; i++) {
        if (milestones[i] > currentTotalMonths) {
            targetMilestone = milestones[i];
            prevMilestone = (i > 0) ? milestones[i - 1] : 0;
            break;
        }
    }

    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMilestone);

    let progress = 1;
    if (targetDate > now) {
        let lastMonthDate = new Date(now.getFullYear(), now.getMonth(), startDate.getDate());
        if (lastMonthDate > now) {
            lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        }
        let nextMonthDate = new Date(lastMonthDate.getTime());
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

        let monthDays = (nextMonthDate - lastMonthDate) / (1000 * 60 * 60 * 24);
        let currentDays = (now - lastMonthDate) / (1000 * 60 * 60 * 24);
        let dayFraction = currentDays / monthDays;

        let totalRange = targetMilestone - prevMilestone;
        let currentRange = currentTotalMonths - prevMilestone;

        progress = Math.min(1, Math.max(0, (currentRange + dayFraction) / totalRange));
    }

    let remainingMs = targetDate.getTime() - now.getTime();
    if (remainingMs <= 0) {
        return {
            timeText: "وصلت لنهاية المطاف عاشت ايدك 🎉",
            progressPercent: 100,
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

    let timeText = parts.length > 0 ? `سوف تصل الى الشارة التالية بعد **${parts.join(' و ')}**` : "سوف تصل الى الشارة التالية قريباً جداً ⚡";

    return {
        timeText,
        progressPercent: Math.floor(progress * 100),
        currentMonths: currentTotalMonths,
        targetMilestone
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

    // استجابة فورية
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
            return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
        }

        const startDate = new Date(member.premiumSince);
        const timeData = getExactProgressData(startDate, BOOST_MILESTONES_MONTHS);
        const bgPath = path.join(__dirname, 'boost-bg.png');
        const attachment = new AttachmentBuilder(bgPath, { name: 'boost-bg.png' });

        return message.reply({
            content: `<@${message.author.id}>\n⏱️ ${timeData.timeText}\n📊 **نسبة التقدم:** \`${timeData.progressPercent}%\` (${timeData.currentMonths} / ${timeData.targetMilestone} شهر)`,
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
            return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
        }

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const timeData = getExactProgressData(startDate, NITRO_MILESTONES_MONTHS);
        const bgPath = path.join(__dirname, 'nitro-bg.png');
        const attachment = new AttachmentBuilder(bgPath, { name: 'nitro-bg.png' });

        return message.reply({
            content: `<@${message.author.id}>\n⏱️ ${timeData.timeText}\n📊 **نسبة التقدم:** \`${timeData.progressPercent}%\` (${timeData.currentMonths} / ${timeData.targetMilestone} شهر)`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
