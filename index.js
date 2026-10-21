require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// شارات النيترو (بالشهور)
const NITRO_BADGES = [
    { months: 1, name: "Bronze (شهر واحد)" },
    { months: 3, name: "Silver (3 أشهر)" },
    { months: 6, name: "Gold (6 أشهر)" },
    { months: 12, name: "Platinum (سنة واحدة)" },
    { months: 24, name: "Diamond (سنتين)" },
    { months: 36, name: "Emerald (3 سنوات)" },
    { months: 60, name: "Ruby (5 سنوات)" },
    { months: 72, name: "Opal (6+ سنوات)" }
];

// شارات البوست (بالشهور)
const BOOST_BADGES = [
    { months: 1, name: "الشارة الأولى (شهر واحد)" },
    { months: 2, name: "الشارة الثانية (شهرين)" },
    { months: 3, name: "الشارة الثالثة (3 أشهر)" },
    { months: 6, name: "الشارة الرابعة (6 أشهر)" },
    { months: 9, name: "الشارة الخامسة (9 أشهر)" },
    { months: 12, name: "الشارة السادسة (سنة واحدة)" },
    { months: 15, name: "الشارة السابعة (15 شهر)" },
    { months: 18, name: "الشارة الثامنة (18 شهر)" },
    { months: 24, name: "الشارة التاسعة (سنتين)" }
];

function getAccurateBadgeData(startDate, badgeList) {
    const now = new Date();

    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let totalMonths = years * 12 + months;

    if (now.getDate() < startDate.getDate()) {
        totalMonths--;
    }
    totalMonths = Math.max(0, totalMonths);

    if (totalMonths < badgeList[0].months) {
        return null;
    }

    let currentBadge = badgeList[0].name;
    let nextBadge = badgeList[badgeList.length - 1].name;
    let targetMonths = badgeList[badgeList.length - 1].months;
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

    if (totalMonths >= badgeList[badgeList.length - 1].months) {
        nextBadge = "وصلت لأعلى شارة 🎉";
        targetMonths = badgeList[badgeList.length - 1].months;
    }

    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    const prevDate = new Date(startDate.getTime());
    prevDate.setMonth(prevDate.getMonth() + prevMonths);

    let progress = 1;
    if (targetDate > now && targetMonths > prevMonths) {
        let totalTime = targetDate.getTime() - prevDate.getTime();
        let passedTime = now.getTime() - prevDate.getTime();
        progress = Math.min(1, Math.max(0, passedTime / totalTime));
    }

    let diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0 || totalMonths >= badgeList[badgeList.length - 1].months) {
        return {
            currentBadge,
            nextBadge,
            progressPercent: 100,
            timeText: "وصلت إلى أعلى الشارات 🎉",
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

    let timeText = parts.length > 0 ? `بعد **${parts.join(' و ')}**` : "خلال ساعات قليلة ⚡";

    return {
        currentBadge,
        nextBadge,
        progressPercent: Math.floor(progress * 100),
        timeText,
        currentMonths: totalMonths,
        targetMonths
    };
}

client.on('ready', () => {
    console.log(`Bot Online: ${client.user.tag} | DEV: FOX`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const cmd = message.content.trim().toLowerCase();
    let isNitro = (cmd === 'n' || cmd === 'nitro' || cmd === '-n');
    let isBoost = (cmd === 'b' || cmd === 'boost' || cmd === '-b');

    if (!isNitro && !isBoost) return;

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
        // الفحص المباشر لشارة البوست في الحساب
        if (!member || !member.premiumSince) {
            return message.reply({ content: `<@${message.author.id}> ❌ **ليس لديك شارة بوست حالياً ❤️**` });
        }

        const startDate = new Date(member.premiumSince);
        const data = getAccurateBadgeData(startDate, BOOST_BADGES);

        if (!data) {
            return message.reply({ content: `<@${message.author.id}> ❌ **ليس لديك شارة بوست حالياً ❤️**` });
        }

        return message.reply({
            content: `<@${message.author.id}>\n` +
                     `📍 **الشارة الحالية:** \`${data.currentBadge}\` (${data.currentMonths} شهر)\n` +
                     `🎯 **الشارة التالية:** \`${data.nextBadge}\`\n` +
                     `📊 **نسبة التقدم:** \`${data.progressPercent}%\` (${data.currentMonths} / ${data.targetMonths} شهر)\n` +
                     `⏱️ **الوقت المتبقي:** ${data.timeText}`
        });
    }

    // --- أمر النيترو ---
    if (isNitro) {
        // فحص شارات الحساب المباشرة (User Badges / Flags)
        const userFlags = user.flags ? user.flags.toArray() : [];
        const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
        const isCustomBanner = user.banner !== null;
        const avatarDecoration = user.avatarDecoration;
        const isBoosting = member && member.premiumSince !== null;

        // التأكد الفعلي من وجود أي شارة نيترو ظاهرية بالبروفايل
        const hasNitroBadge = userFlags.some(flag => flag.includes('Premium') || flag.includes('Nitro')) || 
                              isAnimatedAvatar || 
                              isCustomBanner || 
                              avatarDecoration || 
                              isBoosting;

        if (!hasNitroBadge) {
            return message.reply({ content: `<@${message.author.id}> ❌ **ليس لديك شارة نيترو حالياً ❤️**` });
        }

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const data = getAccurateBadgeData(startDate, NITRO_BADGES);

        if (!data) {
            return message.reply({ content: `<@${message.author.id}> ❌ **ليس لديك شارة نيترو حالياً ❤️**` });
        }

        return message.reply({
            content: `<@${message.author.id}>\n` +
                     `📍 **الشارة الحالية:** \`${data.currentBadge}\` (${data.currentMonths} شهر)\n` +
                     `🎯 **الشارة التالية:** \`${data.nextBadge}\`\n` +
                     `📊 **نسبة التقدم:** \`${data.progressPercent}%\` (${data.currentMonths} / ${data.targetMonths} شهر)\n` +
                     `⏱️ **الوقت المتبقي:** ${data.timeText}`
        });
    }
});

client.login(process.env.TOKEN);
