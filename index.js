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

// شارات النيترو والبوست (بالشهور)
const NITRO_MILESTONES_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72];
const BOOST_MILESTONES_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

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
    let days = totalDays % 7;

    let parts = [];
    if (totalMonths > 0) parts.push(`${totalMonths} شهر`);
    if (weeks > 0) parts.push(`${weeks} أسابيع`);
    if (days > 0) parts.push(`${days} أيام`);

    if (parts.length === 0) return "سوف تصل الى الشارة التالية بعد دقائق قليلة ⚡";

    return `سوف تصل الى الشارة التالية بعد ${parts.join(' و ')}`;
}

// دالة دمج الصورة ورسم الخط البنفسجي مع النص الدقيق
async function renderCustomCard(bgFileName, timeText, progressPercent) {
    const bgPath = path.join(__dirname, 'assets', bgFileName);
    const bgImage = await loadImage(bgPath);

    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext('2d');

    // رسم الصورة المصممة
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // رسم الخط البنفسجي المتزايد
    const barX = canvas.width * 0.1;
    const barY = canvas.height * 0.52;
    const maxBarWidth = canvas.width * 0.8;
    const barHeight = 14;

    const currentBarWidth = Math.max(15, Math.min(maxBarWidth, maxBarWidth * progressPercent));

    ctx.fillStyle = '#a855f7'; // خط بنفسجي فخم
    ctx.beginPath();
    ctx.roundRect(barX, barY, currentBarWidth, barHeight, 7);
    ctx.fill();

    // كتابة الوقت المتبقي داخل الصورة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeText, canvas.width / 2, canvas.height * 0.72);

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
            const noBoostPath = path.join(__dirname, 'assets', 'no-boost.png');
            const attachment = new AttachmentBuilder(noBoostPath);
            return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
        }

        const startDate = new Date(member.premiumSince);
        let now = new Date();
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) currentMonths--;
        currentMonths = Math.max(0, currentMonths);

        let targetMonth = BOOST_MILESTONES_MONTHS.find(m => m > currentMonths) || BOOST_MILESTONES_MONTHS[BOOST_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);
        let progress = currentMonths / targetMonth;

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
            const noNitroPath = path.join(__dirname, 'assets', 'no-nitro.png');
            const attachment = new AttachmentBuilder(noNitroPath);
            return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
        }

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        let now = new Date();
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) currentMonths--;
        currentMonths = Math.max(0, currentMonths);

        let targetMonth = NITRO_MILESTONES_MONTHS.find(m => m > currentMonths) || NITRO_MILESTONES_MONTHS[NITRO_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);
        let progress = currentMonths / targetMonth;

        const buffer = await renderCustomCard('nitro-bg.png', timeRemaining, progress);
        const attachment = new AttachmentBuilder(buffer, { name: 'nitro-card.png' });

        return message.reply({ content: `<@${message.author.id}>`, files: [attachment] });
    }
});

client.login(process.env.TOKEN);
