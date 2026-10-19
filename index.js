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

// قائمة الشارات بالأشهر الحقيقية لديسكورد
const NITRO_MILESTONES_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72];
const BOOST_MILESTONES_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

// دالة حساب الوقت الدقيق والمطابق للبوت الثاني باليوم، الأسبوع، الساعة، والدقيقة
function getPreciseRemainingTime(startDate, targetMonths) {
    const now = new Date();
    const targetDate = new Date(startDate.getTime());
    targetDate.setMonth(targetDate.getMonth() + targetMonths);

    let diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return "وصلت لنهاية المطاف عاشت ايدك";

    let temp = new Date(now.getTime());
    let months = 0;

    // حساب الشهور المتبقية بدقة تقويمية
    while (true) {
        let testDate = new Date(temp.getTime());
        testDate.setMonth(testDate.getMonth() + 1);
        if (testDate <= targetDate) {
            months++;
            temp = testDate;
        } else {
            break;
        }
    }

    let remainingMs = targetDate.getTime() - temp.getTime();
    let totalDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    let weeks = Math.floor(totalDays / 7);
    let days = totalDays % 7;

    remainingMs %= (1000 * 60 * 60 * 24);
    let hours = Math.floor(remainingMs / (1000 * 60 * 60));
    remainingMs %= (1000 * 60 * 60);
    let minutes = Math.floor(remainingMs / (1000 * 60));

    let parts = [];
    if (months > 0) parts.push(`${months} شهر`);
    if (weeks > 0) parts.push(`${weeks} أسابيع`);
    if (days > 0) parts.push(`${days} أيام`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0) parts.push(`${minutes} دقيقة`);

    if (parts.length === 0) return "سوف تصل الى الشارة التالية بعد دقائق قليلة";

    return `سوف تصل الى الشارة التالية بعد ${parts.join(' و ')}`;
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.trim().toLowerCase();
    
    let command = "";
    if (content === 'n' || content === 'nitro') command = 'n';
    else if (content === 'b' || content === 'boost') command = 'b';
    else if (content === 't' || content === 'type') command = 't';
    else return;

    let member = message.member;
    let user = message.author;

    try {
        user = await client.users.fetch(message.author.id, { force: true });
        if (message.guild) {
            member = await message.guild.members.fetch({ user: message.author.id, force: true });
        }
    } catch (e) {}

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
            return message.reply({
                content: `<@${message.author.id}> حبيب قلبي ماعندك شارة ✨❤️`
            });
        }

        // استخدام تاريخ التأسيس أو الحساب المبدئي كبداية صحيحة للنيترو
        const startDate = new Date(user.createdTimestamp);
        
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const currentMonths = (diffTime / (1000 * 60 * 60 * 24)) / 30.4375;

        let targetMonth = NITRO_MILESTONES_MONTHS.find(m => m > currentMonths) || NITRO_MILESTONES_MONTHS[NITRO_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getPreciseRemainingTime(startDate, targetMonth);

        return message.reply({
            content: `<@${message.author.id}> 🌟 **معلومات اشارة النيترو:**\n⏳ ${timeRemaining}\n🛠️ DEV: FOX | REBA SERVER`
        });
    }

    // أمر البوست (b)
    if (command === 'b') {
        if (!member || !member.premiumSince) {
            return message.reply({ content: `<@${message.author.id}> حبيب قلبي ماعندك شارة ✨❤️` });
        }

        // تاريخ البوست الفعلي للمستخدم في السيرفر
        const startDate = new Date(member.premiumSince);

        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const currentMonths = (diffTime / (1000 * 60 * 60 * 24)) / 30.4375;

        let targetMonth = BOOST_MILESTONES_MONTHS.find(m => m > currentMonths) || BOOST_MILESTONES_MONTHS[BOOST_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getPreciseRemainingTime(startDate, targetMonth);

        return message.reply({
            content: `<@${message.author.id}> 💎 **معلومات شارة البوست:**\n⏳ ${timeRemaining}\n🛠️ DEV: FOX | REBA SERVER`
        });
    }

    // أمر المعلومات (t)
    if (command === 't') {
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
            return message.reply({ content: `<@${message.author.id}> حبيب قلبي ماعندك شارة ✨❤️` });
        }

        const startDate = (member && member.premiumSince) ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const currentMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375));

        return message.reply({
            content: `🔍 **معلومات اشتراك المستخدم <@${message.author.id}>:**\n📌 **نوع الاشتراك:** ${nitroType}\n⏳ **المدة المضيئة:** ${currentMonths} أشهر تقريباً\n🛠️ **DEV: FOX** | **REBA SERVER**`
        });
    }
});

client.login(process.env.TOKEN);
