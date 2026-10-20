require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// أشهر شارات النيترو والبوست الرسمية
const NITRO_MILESTONES_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72]; // بالشهور
const BOOST_MILESTONES_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

// دالة حساب الوقت المتبقي للشارة التالية
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

// دالة لتوليد صورة الحالة (تشبه التصميم الموجود في الصورة)
async function generateBadgeImage(type, currentMonths, timeRemainingText) {
    const canvas = createCanvas(800, 450);
    const ctx = canvas.getContext('2d');

    // خلفية سوداء فخمة مع زوايا أو إطار
    ctx.fillStyle = '#0b0b0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // عنوان اللوحة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type === 'boost' ? 'اشارة البوست' : 'اشارة النيترو', canvas.width / 2, 60);

    // رسم خط التقدم (Progress Bar)
    const barX = 100;
    const barY = 280;
    const barWidth = 600;
    const barHeight = 8;

    ctx.fillStyle = '#2f3136';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // حساب نسبة التقدم بناءً على الشارة الحالية
    const milestones = type === 'boost' ? BOOST_MILESTONES_MONTHS : NITRO_MILESTONES_MONTHS;
    const maxMilestone = milestones[milestones.length - 1];
    const progressPercent = Math.min(currentMonths / maxMilestone, 1);

    ctx.fillStyle = '#7289da';
    ctx.fillRect(barX, barY, barWidth * progressPercent, barHeight);

    // نص الوقت المتبقي بالأسفل
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    ctx.fillText(timeRemainingText, canvas.width / 2, 360);

    return canvas.toBuffer();
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
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
            return message.reply({ content: `<@${message.author.id}> ليس لديك شارة بوست 💎` });
        }

        const startDate = new Date(member.premiumSince);
        let now = new Date();
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) currentMonths--;
        currentMonths = Math.max(0, currentMonths);

        let targetMonth = BOOST_MILESTONES_MONTHS.find(m => m > currentMonths) || BOOST_MILESTONES_MONTHS[BOOST_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);

        const buffer = await generateBadgeImage('boost', currentMonths, timeRemaining);
        const attachment = new AttachmentBuilder(buffer, { name: 'boost-badge.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // أمر النيترو (n)
    if (command === 'n') {
        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        
        let now = new Date();
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) currentMonths--;
        currentMonths = Math.max(0, currentMonths);

        let targetMonth = NITRO_MILESTONES_MONTHS.print ? NITRO_MILESTONES_MONTHS.find(m => m > currentMonths) : (NITRO_MILESTONES_MONTHS.find(m => m > currentMonths) || NITRO_MILESTONES_MONTHS[NITRO_MILESTONES_MONTHS.length - 1]);
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);

        const buffer = await generateBadgeImage('nitro', currentMonths, timeRemaining);
        const attachment = new AttachmentBuilder(buffer, { name: 'nitro-badge.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
