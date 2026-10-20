require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const NITRO_MILESTONES_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72];
const BOOST_MILESTONES_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

function getExactTargetRemainingTime(startDate, targetMonths) {
    const now = new Date();
    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    if (targetDate <= now) return "وصلت لنهاية المطاف عاشت ايدك";

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

    if (parts.length === 0) return "سوف تصل الى الشارة التالية بعد دقائق قليلة";

    return `سوف تصل الى الشارة التالية بعد ${parts.join(' و ')}`;
}

// دالة لتوليد الصورة المطابقة تماماً لتصميمك
async function generateBadgeCanvas(type, currentMonths, timeRemainingText) {
    const canvas = createCanvas(900, 480);
    const ctx = canvas.getContext('2d');

    // خلفية سوداء فخمة
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // عنوان اللوحة في الأعلى
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type === 'boost' ? 'اشارة البوست' : 'اشارة النيترو', canvas.width / 2, 60);

    // خط التقدم (Progress Bar)
    const barX = 80;
    const barY = 220;
    const barWidth = 740;
    const barHeight = 12;

    // الخط الخلفي الرمادي
    ctx.fillStyle = '#2f3136';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 6);
    ctx.fill();

    // حساب نسبة التقدم بناءً على الشهور الحالية
    const milestones = type === 'boost' ? BOOST_MILESTONES_MONTHS : NITRO_MILESTONES_MONTHS;
    const maxMilestone = milestones[milestones.length - 1];
    const progressPercent = Math.min(currentMonths / maxMilestone, 1);
    const progressWidth = Math.max(20, barWidth * progressPercent);

    // الخط الملون المتقدم (بنفسجي / وردي متناسق)
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.roundRect(barX, barY, progressWidth, barHeight, 6);
    ctx.fill();

    // النصوص بالأسفل (الوقت المتبقي)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeRemainingText, canvas.width / 2, 330);

    // حقوق البوت أو البصمة بالأسفل
    ctx.fillStyle = '#72767d';
    ctx.font = '16px sans-serif';
    ctx.fillText('DEV: FOX | REBA SERVER', canvas.width / 2, 430);

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag} | Developed by FOX`);
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

    // أمر البوست (b)
    if (command === 'b') {
        if (!member || !member.premiumSince) {
            // إذا لم يكن لديه شارة بوست يرسل له صورة أو رسالة توضح ذلك مع منشن
            return message.reply({
                content: `<@${message.author.id}> حبيب قلبي ما عندك شارة بوست، من وين أجيبلك؟! 💎❌`
            });
        }

        const startDate = new Date(member.premiumSince);
        let now = new Date();
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) currentMonths--;
        currentMonths = Math.max(0, currentMonths);

        let targetMonth = BOOST_MILESTONES_MONTHS.find(m => m > currentMonths) || BOOST_MILESTONES_MONTHS[BOOST_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);

        const buffer = await generateBadgeCanvas('boost', currentMonths, timeRemaining);
        const attachment = new AttachmentBuilder(buffer, { name: 'boost-badge.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // أمر النيترو (n)
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
            // إذا لم يكن لديه شارة نيترو يرسل له رسالة مع منشن
            return message.reply({
                content: `<@${message.author.id}> حبيب قلبي ما عندك شارة نيترو، شتريد أجبلك؟! ✨❌`
            });
        }

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        
        let now = new Date();
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) currentMonths--;
        currentMonths = Math.max(0, currentMonths);

        let targetMonth = NITRO_MILESTONES_MONTHS.find(m => m > currentMonths) || NITRO_MILESTONES_MONTHS[NITRO_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);

        const buffer = await generateBadgeCanvas('nitro', currentMonths, timeRemaining);
        const attachment = new AttachmentBuilder(buffer, { name: 'nitro-badge.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
