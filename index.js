require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = "-";

// مستويات النيترو بالشهور
const NITRO_MILESTONES = [
    { label: "1m", months: 1 },
    { label: "3m", months: 3 },
    { label: "6m", months: 6 },
    { label: "1y", months: 12 },
    { label: "2y", months: 24 },
    { label: "3y", months: 36 },
    { label: "5y", months: 60 },
    { label: "6y", months: 72 }
];

// مستويات البوست بالشهور
const BOOST_MILESTONES = [
    { label: "1M", months: 1 },
    { label: "2M", months: 2 },
    { label: "3M", months: 3 },
    { label: "6M", months: 6 },
    { label: "9M", months: 9 },
    { label: "12M", months: 12 },
    { label: "15M", months: 15 },
    { label: "18M", months: 18 },
    { label: "24M", months: 24 }
];

// دالة حساب الوقت المتبقي بالتفصيل (أشهر، أيام، ساعات، دقائق)
function getRemainingTimeText(targetDate) {
    const now = new Date();
    let diffMs = targetDate - now;

    if (diffMs <= 0) return "لقد وصلت إلى أعلى شارة!";

    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor((diffMs / (1000 * 60 * 60 * 24)) % 30);
    const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));

    let parts = [];
    if (months > 0) parts.push(`${months} أشهر`);
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0) parts.push(`${minutes} دقيقة`);

    return `سوف تصل الى الشارة التالية بعد ${parts.join(' و ')}`;
}

// دالة رسم بطاقة "ليس لديك شارة"
async function generateNoBadgeCard(titleText) {
    const width = 750;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.90)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#08020f';
        ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 80);

    ctx.fillStyle = '#ff4a4a';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText("ليس لديك هذه الشارة", width / 2, 220);

    return canvas.toBuffer('image/png');
}

// دالة رسم الشارة الحسابية المطابقة للصورة 100%
async function generateBadgeCard(titleText, startDate, milestones, isNitro = false) {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // الخلفية
    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.88)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        ctx.fillStyle = '#0a0512';
        ctx.fillRect(0, 0, width, height);
    }

    // 1. عنوان الصورة (اشارة النيترو / اشارة البوست)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 65);

    // حساب الشهور المنقضية والشارة القادمة
    const now = new Date();
    const diffMs = Math.max(0, now - startDate);
    const totalDays = diffMs / (1000 * 60 * 60 * 24);
    const currentMonths = totalDays / 30.4375;

    let nextMilestone = milestones.find(m => m.months > currentMonths);
    if (!nextMilestone) nextMilestone = milestones[milestones.length - 1];

    // حساب تاريخ الوصول للشارة القادمة
    const nextBadgeDate = new Date(startDate.getTime());
    nextBadgeDate.setMonth(nextBadgeDate.getMonth() + nextMilestone.months);

    // 2. رسم الأيقونات والأسماء للمستويات
    const startX = 70;
    const endX = width - 70;
    const step = (endX - startX) / (milestones.length - 1);
    const iconsY = 140;

    milestones.forEach((m, i) => {
        const x = startX + (i * step);
        
        // رسم دائرة مكان الأيقونة (رمز الشارة)
        ctx.beginPath();
        ctx.arc(x, iconsY, 18, 0, Math.PI * 2);
        ctx.fillStyle = currentMonths >= m.months ? (isNitro ? '#ff73fa' : '#f47fff') : '#332d42';
        ctx.fill();

        // كتابة نص المستوى تحت الأيقونة (1m, 3m, 1y...)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x, iconsY + 45);
    });

    // 3. شريط التقدم (Progress Bar)
    const progressBarY = iconsY + 65;
    const barWidth = endX - startX;
    
    // خلفية الشريط المظلمة
    ctx.fillStyle = '#221a30';
    ctx.beginPath();
    ctx.roundRect(startX, progressBarY, barWidth, 10, 5);
    ctx.fill();

    // نسبة التقدم الملونة
    const maxMonths = milestones[milestones.length - 1].months;
    const progressRatio = Math.min(1, currentMonths / maxMonths);
    
    ctx.fillStyle = isNitro ? '#ff73fa' : '#f47fff';
    ctx.beginPath();
    ctx.roundRect(startX, progressBarY, barWidth * progressRatio, 10, 5);
    ctx.fill();

    // 4. النص العربي المكتوب (سوف تصل الى الشارة التالية بعد...)
    const remainingText = getRemainingTimeText(nextBadgeDate);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(remainingText, width / 2, progressBarY + 60);

    // 5. رسم الشارة الحالية بالأسفل
    const currentBadgeY = progressBarY + 110;
    ctx.beginPath();
    ctx.arc(width / 2, currentBadgeY, 24, 0, Math.PI * 2);
    ctx.fillStyle = isNitro ? '#ff73fa' : '#f47fff';
    ctx.fill();

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    let member = message.member;
    if (!member) {
        try { member = await message.guild.members.fetch(message.author.id); } catch (e) {}
    }

    // ===================================
    // أمر البوست (-b / -boost)
    // ===================================
    if (command === 'b' || command === 'boost') {
        const premiumSince = member ? member.premiumSince : null;

        if (!premiumSince) {
            const imageBuffer = await generateNoBadgeCard('اشارة البوست');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-boost.png' });
            return message.reply({
                content: `<@${message.author.id}> ليس لديك هذه الشارة`,
                files: [attachment]
            });
        }

        const imageBuffer = await generateBadgeCard('اشارة البوست', new Date(premiumSince), BOOST_MILESTONES, false);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-boost.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // ===================================
    // أمر النيترو (-n / -nitro)
    // ===================================
    if (command === 'n' || command === 'nitro') {
        const userFlags = message.author.flags ? message.author.flags.toArray() : [];
        const hasNitroBadge = userFlags.some(flag => flag.includes('Premium') || flag.includes('Nitro'));

        if (!hasNitroBadge) {
            const imageBuffer = await generateNoBadgeCard('اشارة النيترو');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-nitro.png' });
            return message.reply({
                content: `<@${message.author.id}> ليس لديك هذه الشارة`,
                files: [attachment]
            });
        }

        // إذا كان يملك نيترو، يحسب الوقت بناءً على الشارة والبيانات
        // ملاحظة: ديسكورد يعطي تاريخ البوست بالدقة كاملة، وللنيترو نحسب الوقت بناءً على العضوية
        const nitroStartDate = member.premiumSince ? new Date(member.premiumSince) : new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));

        const imageBuffer = await generateBadgeCard('اشارة النيترو', nitroStartDate, NITRO_MILESTONES, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
