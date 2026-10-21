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

// 👑 آيدي المطور (FOX VIP)
const SPECIAL_USER_ID = "1554347941471453186";

// شارات النيترو (بالشهور)
const NITRO_BADGES = [
    { months: 1, name: "1M (شهر واحد)" },
    { months: 3, name: "3M (3 أشهر)" },
    { months: 6, name: "6M (6 أشهر)" },
    { months: 12, name: "1Y (سنة واحدة)" },
    { months: 24, name: "2Y (سنتين)" },
    { months: 36, name: "3Y (3 سنوات)" },
    { months: 60, name: "5Y (5 سنوات)" },
    { months: 72, name: "6Y (6 سنوات)" }
];

// شارات البوست (بالشهور)
const BOOST_BADGES = [
    { months: 1, name: "1M (شهر واحد)" },
    { months: 2, name: "2M (شهرين)" },
    { months: 3, name: "3M (3 أشهر)" },
    { months: 6, name: "6M (6 أشهر)" },
    { months: 9, name: "9M (9 أشهر)" },
    { months: 12, name: "12M (سنة واحدة)" },
    { months: 15, name: "15M (15 شهر)" },
    { months: 18, name: "18M (18 شهر)" },
    { months: 24, name: "24M (سنتين)" }
];

// دالة حساب خوارزمية الشارات والوقت المتبقي
function calculateSkyMilestone(startDate, badgeList, maxMonths) {
    const now = new Date();

    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let totalMonths = years * 12 + months;

    if (now.getDate() < startDate.getDate()) {
        totalMonths--;
    }
    totalMonths = Math.max(0, totalMonths);

    let currentBadge = "بداية الطريق بعدك كتكوت (أقل من شهر)";
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

    if (totalMonths >= badgeList[badgeList.length - 1].months) {
        currentBadge = badgeList[badgeList.length - 1].name;
        nextBadge = "وصلت لأعلى شارة 🎉";
        targetMonths = badgeList[badgeList.length - 1].months;
    }

    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    let overallProgressPercent = Math.min(100, Math.floor((totalMonths / maxMonths) * 100));

    let diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0 || totalMonths >= badgeList[badgeList.length - 1].months) {
        return {
            currentBadge,
            nextBadge,
            overallProgressPercent: 100,
            timeText: "وصلت إلى الشارة النهائية 🎉",
            currentMonths: totalMonths,
            targetMonths
        };
    }

    let totalMinutes = Math.floor(diffMs / (1000 * 60));
    let remMonths = Math.floor(totalMinutes / (30 * 24 * 60));
    let remMinutesAfterMonths = totalMinutes % (30 * 24 * 60);
    
    let remWeeks = Math.floor(remMinutesAfterMonths / (7 * 24 * 60));
    let remMinutesAfterWeeks = remMinutesAfterMonths % (7 * 24 * 60);

    let remDays = Math.floor(remMinutesAfterWeeks / (24 * 60));
    let remMinutesAfterDays = remMinutesAfterWeeks % (24 * 60);

    let remHours = Math.floor(remMinutesAfterDays / 60);
    let remMinutes = remMinutesAfterDays % 60;

    let parts = [];
    if (remMonths > 0) parts.push(`${remMonths} شهر`);
    if (remWeeks > 0) parts.push(`${remWeeks} أسابيع`);
    if (remDays > 0) parts.push(`${remDays} يوم`);
    if (remHours > 0) parts.push(`${remHours} ساعة`);
    if (remMinutes > 0) parts.push(`${remMinutes} دقيقة`);

    let timeText = parts.length > 0 ? `سوف تصل الى الشاره التالية بعد **${parts.join(' و ')}**` : "سوف تصل الى الشارة التالية خلال لحظات ⚡";

    return {
        currentBadge,
        nextBadge,
        overallProgressPercent,
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
    let isNitroTime = (cmd === 't' || cmd === '-t'); // الأمر الجديد t

    if (!isNitro && !isBoost && !isNitroTime) return;

    // 👑 رد المطور الخاص VIP
    if (message.author.id === SPECIAL_USER_ID) {
        return message.reply({
            content: `<@${message.author.id}>\n` +
                     `✨ **أهلاً بك سيدي (VIP)** 👑\n` +
                     ` **السكربت خاص ب: FOX** `
        });
    }

    let member = message.member;
    let user = message.author;

    try {
        user = await client.users.fetch(message.author.id, { force: true });
        if (message.guild) {
            member = await message.guild.members.fetch({ user: message.author.id, force: true });
        }
    } catch (e) {}

    // --- أمر تتبع بداية ونهاية النيترو (t) ---
    if (isNitroTime) {
        const userFlags = user.flags ? user.flags.toArray() : [];
        const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
        const isCustomBanner = user.banner !== null;
        const avatarDecoration = user.avatarDecoration;
        const isBoosting = member && member.premiumSince !== null;

        const hasNitroBadge = userFlags.some(flag => flag.includes('Premium') || flag.includes('Nitro')) || 
                              isAnimatedAvatar || 
                              isCustomBanner || 
                              avatarDecoration || 
                              isBoosting;

        if (!hasNitroBadge) {
            return message.reply({ content: `<@${message.author.id}> ❌ **ليس لديك شارة نيترو حالياً ❤️**` });
        }

        // حساب تاريخ البدء وتاريخ التجديد/الانتهاء القادم (دورة شهرية افتراضية)
        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        
        // حساب تاريخ التجديد القادم (نهاية الشهر الحالي للاشتراك)
        let nextRenewalDate = new Date(startDate.getTime());
        const now = new Date();
        while (nextRenewalDate <= now) {
            nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
        }

        let diffMs = nextRenewalDate.getTime() - now.getTime();
        let totalMinutes = Math.floor(diffMs / (1000 * 60));
        let remDays = Math.floor(totalMinutes / (24 * 60));
        let remHours = Math.floor((totalMinutes % (24 * 60)) / 60);
        let remMinutes = totalMinutes % 60;

        return message.reply({
            content: `<@${message.author.id}>\n` +
                     `⏳ **تفاصيل موعد النيترو (بشكل دقيق):**\n` +
                     `📅 **تاريخ البداية المسجل:** \`${startDate.toISOString().split('T')[0]}\`\n` +
                     `🔄 **موعد التجديد / انتهاء الدورة الحالية:** \`${nextRenewalDate.toISOString().split('T')[0]}\`\n` +
                     `⏱️ **الوقت المتبقي لتجديد الاشتراك:** \`${remDays} يوم و ${remHours} ساعة و ${remMinutes} دقيقة\` ⚡`
        });
    }

    // --- أمر البوست ---
    if (isBoost) {
        if (!member || !member.premiumSince) {
            return message.reply({ content: `<@${message.author.id}> ❌ **ليس لديك شارة بوست حالياً ❤️**` });
        }

        const startDate = new Date(member.premiumSince);
        const data = calculateSkyMilestone(startDate, BOOST_BADGES, 24);

        return message.reply({
            content: `<@${message.author.id}>\n` +
                     `🔮 **اشارة البوست**\n` +
                     `📍 **الشارة الحالية:** \`${data.currentBadge}\`\n` +
                     `🎯 **الشارة التالية:** \`${data.nextBadge}\`\n` +
                     `📊 **نسبة الشارة الكلية:** \`${data.overallProgressPercent}%\`\n` +
                     `⏳ ${data.timeText}`
        });
    }

    // --- أمر النيترو ---
    if (isNitro) {
        const userFlags = user.flags ? user.flags.toArray() : [];
        const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
        const isCustomBanner = user.banner !== null;
        const avatarDecoration = user.avatarDecoration;
        const isBoosting = member && member.premiumSince !== null;

        const hasNitroBadge = userFlags.some(flag => flag.includes('Premium') || flag.includes('Nitro')) || 
                              isAnimatedAvatar || 
                              isCustomBanner || 
                              avatarDecoration || 
                              isBoosting;

        if (!hasNitroBadge) {
            return message.reply({ content: `<@${message.author.id}> ❌ **ليس لديك شارة نيترو حالياً ❤️**` });
        }

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const data = calculateSkyMilestone(startDate, NITRO_BADGES, 72);

        return message.reply({
            content: `<@${message.author.id}>\n` +
                     `🔮 **اشارة النيترو**\n` +
                     `📍 **الشارة الحالية:** \`${data.currentBadge}\`\n` +
                     `🎯 **الشارة التالية:** \`${data.nextBadge}\`\n` +
                     `📊 **نسبة الشارة الكلية:** \`${data.overallProgressPercent}%\`\n` +
                     `⏳ ${data.timeText}`
        });
    }
});

client.login(process.env.TOKEN);
