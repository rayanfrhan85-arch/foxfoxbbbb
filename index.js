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

// مستويات البوست
const BOOST_MILESTONES = [
    { label: "1m", months: 1 },
    { label: "2m", months: 2 },
    { label: "3m", months: 3 },
    { label: "6m", months: 6 },
    { label: "9m", months: 9 },
    { label: "12m", months: 12 },
    { label: "15m", months: 15 },
    { label: "18m", months: 18 },
    { label: "24m", months: 24 }
];

// مستويات النيترو
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

// دالة رسم بطاقة "يافقير" (بدون الدائرة المضيئة)
async function generateNoBadgeCard(titleText, isNitro = false) {
    const width = 750;
    const height = 480;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.90)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0a0314');
        grad.addColorStop(1, '#18052e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    // إطار نيوني متوهج
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.shadowBlur = 0;

    // العنوان العلوي
    ctx.font = 'bold 34px "Segoe UI", Arial, Tahoma, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 100);

    // النص الرئيسي
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 38px "Segoe UI", Arial, Tahoma, sans-serif';
    ctx.fillStyle = '#fb7185';
    ctx.fillText('يافقير بعدك ممقدم تنازلات 😉', width / 2, 230);
    ctx.shadowBlur = 0;

    // نص فرعي
    ctx.font = 'bold 22px "Segoe UI", Arial, Tahoma, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('لا توجد لديك هذه الشارة في السيرفر حالياً', width / 2, 300);

    // الحقوق
    ctx.font = 'bold 18px "Segoe UI", Arial, Tahoma, sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('dev fox  |  idea by reba', width / 2, 415);

    return canvas.toBuffer('image/png');
}

// دالة رسم البطاقات الرئيسية للمشتركين
async function generateBadgeCard(titleText, currentMonths, maxMonths, remainingTimeStr, isNitro = false) {
    const width = 750;
    const height = 650;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
        ctx.drawImage(bg, 0, 0, width, height);
        ctx.fillStyle = 'rgba(8, 2, 15, 0.88)';
        ctx.fillRect(0, 0, width, height);
    } catch (e) {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0a0314');
        grad.addColorStop(1, '#18052e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 34px "Segoe UI", Arial, Tahoma, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(titleText, width / 2, 80);

    const milestones = isNitro ? NITRO_MILESTONES : BOOST_MILESTONES;
    const cols = 5;
    const startX = 95;
    const startY = 150;
    const gapX = 140;
    const gapY = 95;

    milestones.forEach((m, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = startX + (col * gapX);
        const y = startY + (row * gapY);

        const isAchieved = currentMonths >= m.months;

        if (isAchieved) {
            ctx.shadowColor = isNitro ? '#06b6d4' : '#ec4899';
            ctx.shadowBlur = 8;
        }

        ctx.fillStyle = isAchieved ? (isNitro ? '#06b6d4' : '#ec4899') : '#1e1b4b';
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = isAchieved ? '#ffffff' : '#4c1d95';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = 'bold 16px "Segoe UI", Arial, Tahoma, sans-serif';
        ctx.fillStyle = isAchieved ? '#ffffff' : '#7c3aed';
        ctx.fillText(m.label, x, y + 45);
    });

    // شريط التقدم
    const barX = 60;
    const barY = 405;
    const barW = width - 120;
    const barH = 16;

    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 8);
    ctx.fill();

    let ratio = currentMonths / maxMonths;
    if (ratio > 1) ratio = 1;
    if (ratio < 0) ratio = 0;
    const fillW = barW * ratio;

    if (fillW > 0) {
        const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        barGrad.addColorStop(0, '#9333ea');
        barGrad.addColorStop(1, isNitro ? '#22d3ee' : '#f472b6');
        
        ctx.shadowColor = isNitro ? '#22d3ee' : '#f472b6';
        ctx.shadowBlur = 10;
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    ctx.font = 'bold 22px "Segoe UI", Arial, Tahoma, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('سوف تصل الى الشارة التالية بعد', width / 2, 475);

    ctx.font = 'bold 26px "Segoe UI", Arial, Tahoma, sans-serif';
    ctx.fillStyle = isNitro ? '#38bdf8' : '#f472b6';
    ctx.fillText(remainingTimeStr, width / 2, 525);

    ctx.font = 'bold 18px "Segoe UI", Arial, Tahoma, sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('dev fox  |  idea by reba', width / 2, 605);

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`✅ [reba System] Ready as ${client.user.tag}`);
    console.log(`👑 Dev: fox | Idea by Reba`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const command = message.content.toLowerCase().trim();

    // ==========================================
    // 🚀 أمر البوست (-b)
    // ==========================================
    if (command === `${PREFIX}b` || command === `${PREFIX}boost`) {
        const member = message.member;

        if (!member.premiumSince) {
            const imageBuffer = await generateNoBadgeCard('إشارة البوست | Server Boost', false);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-boost.png' });
            return message.reply({
                content: `<@${message.author.id}> التنازلات بل روم الخاص يم rebean`,
                files: [attachment]
            });
        }

        const now = new Date();
        const boostStart = new Date(member.premiumSince);
        const diffMs = now - boostStart;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const currentMonths = diffDays / 30.4375;

        const nextMilestone = BOOST_MILESTONES.find(m => m.months > currentMonths);

        let timeText = '';
        if (!nextMilestone) {
            timeText = 'وصلت لأعلى شارة بوست! 🎉';
        } else {
            const targetDays = Math.ceil(nextMilestone.months * 30.4375);
            const remainingDaysTotal = targetDays - diffDays;

            const monthsLeft = Math.floor(remainingDaysTotal / 30.4375);
            const daysLeft = Math.floor(remainingDaysTotal % 30.4375);
            const hoursLeft = Math.floor((remainingDaysTotal * 24) % 24);

            if (monthsLeft > 0) timeText += `${monthsLeft} أشهر و `;
            if (daysLeft > 0) timeText += `${daysLeft} يوم و `;
            timeText += `${hoursLeft} ساعة`;
        }

        const imageBuffer = await generateBadgeCard('إشارة البوست | Server Boost', currentMonths, 24, timeText, false);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-boost.png' });

        return message.reply({
            content: `<@${message.author.id}> انتة خوش تنازلات مقدم 😉`,
            files: [attachment]
        });
    }

    // ==========================================
    // ⚡ أمر النيترو (-n)
    // ==========================================
    if (command === `${PREFIX}n` || command === `${PREFIX}nitro`) {
        const userFlags = message.author.flags ? message.author.flags.toArray() : [];
        const hasNitroBadge = userFlags.some(flag => flag.includes('Premium') || flag.includes('Nitro'));

        if (!hasNitroBadge) {
            const imageBuffer = await generateNoBadgeCard('إشارة النيترو | Nitro Status', true);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-nitro.png' });
            return message.reply({
                content: `<@${message.author.id}> التنازلات بل روم الخاص يم rebean`,
                files: [attachment]
            });
        }

        const currentMonthsNitro = 3; 
        const timeText = "9 أشهر";

        const imageBuffer = await generateBadgeCard('إشارة النيترو | Nitro Status', currentMonthsNitro, 72, timeText, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}> انتة خوش تنازلات مقدم 😉`,
            files: [attachment]
        });
    }
});

client.login(process.env.TOKEN);
