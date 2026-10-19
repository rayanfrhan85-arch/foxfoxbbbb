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

const PREFIX = "-";

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

const BOOST_MILESTONES = [
    { label: "1M", months: 1 }, { label: "2M", months: 2 }, { label: "3M", months: 3 },
    { label: "6M", months: 6 }, { label: "9M", months: 9 }, { label: "12M", months: 12 },
    { label: "15M", months: 15 }, { label: "18M", months: 18 }, { label: "24M", months: 24 }
];

// دالة الحقوق المحدثة (لون DEV: FOX أخضر وبدون تكرار لـ REBA SERVER لتجنب التشابك)
function drawGreenWatermark(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = '#2ecc71'; // لون أخضر فخم لـ DEV: FOX
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText('DEV: FOX', 25, height - 20);
    ctx.restore();
}

// دالة عرض بطاقة الشخص الذي ليس لديه نيترو (صورة no_nitro_bg.png)
async function generateNoBadgeCard() {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const customBg = await loadImage(path.join(__dirname, 'no_nitro_bg.png'));
        ctx.drawImage(customBg, 0, 0, width, height);
    } catch (e) {
        try {
            const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
            ctx.drawImage(bg, 0, 0, width, height);
            ctx.fillStyle = 'rgba(10, 14, 23, 0.90)';
            ctx.fillRect(0, 0, width, height);
        } catch (err) {
            ctx.fillStyle = '#0a0e17';
            ctx.fillRect(0, 0, width, height);
        }
    }

    drawGreenWatermark(ctx, width, height);
    return canvas.toBuffer('image/png');
}

// دالة عرض بطاقة المشترك بالنيترو (صورة nitro_bg.png بدون تكرار وبدون تشابك)
async function generateNitroBadgeCard() {
    const width = 800;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        const nitroBg = await loadImage(path.join(__dirname, 'nitro_bg.png'));
        ctx.drawImage(nitroBg, 0, 0, width, height);
    } catch (e) {
        try {
            const bg = await loadImage(path.join(__dirname, 'reba_bg.png'));
            ctx.drawImage(bg, 0, 0, width, height);
            ctx.fillStyle = 'rgba(8, 2, 15, 0.88)';
            ctx.fillRect(0, 0, width, height);
        } catch (err) {
            ctx.fillStyle = '#0a0512';
            ctx.fillRect(0, 0, width, height);
        }
    }

    drawGreenWatermark(ctx, width, height);
    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    let member = message.member;
    let user = message.author;

    try {
        user = await client.users.fetch(message.author.id, { force: true });
        if (message.guild) {
            member = await message.guild.members.fetch({ user: message.author.id, force: true });
        }
    } catch (e) {}

    // أمر النيترو (-n / -nitro)
    if (command === 'n' || command === 'nitro') {
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
            const imageBuffer = await generateNoBadgeCard();
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-no-nitro.png' });
            return message.reply({
                content: `<@${message.author.id}>`,
                files: [attachment]
            });
        }

        const imageBuffer = await generateNitroBadgeCard();
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'reba-nitro.png' });

        return message.reply({
            content: `<@${message.author.id}>`,
            files: [attachment]
        });
    }

    // أمر معلومات النيترو (-t / -type)
    if (command === 't' || command === 'type') {
        const userFlags = user.flags ? user.flags.toArray() : [];
        const isBoosting = member && member.premiumSince !== null;
        const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
        const isCustomBanner = user.banner !== null;
        const avatarDecoration = user.avatarDecoration;

        let nitroType = "غير مفعل";
        if (userFlags.some(f => f.includes('Nitro')) || isAnimatedAvatar || isCustomBanner || avatarDecoration) {
            nitroType = isBoosting ? "Discord Nitro (مع بوست للسيرفر) 🚀" : "Discord Nitro Classic ✨";
        } else if (isBoosting) {
            nitroType = "Server Booster فقط 💎";
        } else {
            return message.reply({ content: `<@${message.author.id}> ما عندك أي اشتراك نيترو حالياً` });
        }

        const startDate = (member && member.premiumSince) ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const currentMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375));

        return message.reply({
            content: `🔍 **معلومات اشتراك المستخدم <@${message.author.id}>:**\n📌 **نوع الاشتراك:** ${nitroType}\n⏳ **المدة التقريبية المضيئة:** ${currentMonths} أشهر تقريباً\n🛠️ **DEV: FOX** | **REBA SERVER**`
        });
    }
});

client.login(process.env.TOKEN);
