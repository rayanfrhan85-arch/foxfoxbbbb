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

// أشهر شارات النيترو والبوست الرسمية
const NITRO_MILESTONES_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72];
const BOOST_MILESTONES_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];

// دالة حساب الوقت المتبقي للشارة التالية بدقة
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
            return message.reply({ content: `<@${message.author.id}> ليس لديك شارة بوست 💎` });
        }

        const startDate = new Date(member.premiumSince);
        let now = new Date();
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) currentMonths--;
        currentMonths = Math.max(0, currentMonths);

        let targetMonth = BOOST_MILESTONES_MONTHS.find(m => m > currentMonths) || BOOST_MILESTONES_MONTHS[BOOST_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);

        return message.reply({
            content: `<@${message.author.id}> 💎 **اشارة البوست**\n⏳ ${timeRemaining}\n🎯 **الهدف القادم:** شارة الـ ${targetMonth} أشهر\n🛠️ **DEV: FOX | REBA SERVER**`
        });
    }

    // أمر النيترو (n)
    if (command === 'n') {
        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        
        let now = new Date();
        let currentMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        if (now.getDate() < startDate.getDate()) currentMonths--;
        currentMonths = Math.max(0, currentMonths);

        let targetMonth = NITRO_MILESTONES_MONTHS.find(m => m > currentMonths) || NITRO_MILESTONES_MONTHS[NITRO_MILESTONES_MONTHS.length - 1];
        let timeRemaining = getExactTargetRemainingTime(startDate, targetMonth);

        return message.reply({
            content: `<@${message.author.id}> 🌟 **اشارة النيترو**\n⏳ ${timeRemaining}\n🎯 **الهدف القادم:** شارة الـ ${targetMonth} شهر\n🛠️ **DEV: FOX | REBA SERVER**`
        });
    }
});

client.login(process.env.TOKEN);
