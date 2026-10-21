require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} = require('discord.js');

// 🎵 استدعاء مكتبة الموسيقى للجودة العالية
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates // 🔊 صلاحيات الروم الصوتي
    ]
});

// 🎶 إعداد مشغل الموسيقى بأعلى جودة (تم إصلاح الخيار المسبب للخطأ)
const distube = new DisTube(client, {
    emitNewSongOnly: true,
    savePreviousSongs: true,
    plugins: [new YtDlpPlugin()]
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
    
    // 🎵 الأوامر الجديدة reba و fox
    let isMusicCmd = (cmd === 'reba' || cmd === 'fox');
    let isNitro = (cmd === 'n' || cmd === 'nitro' || cmd === '-n');
    let isBoost = (cmd === 'b' || cmd === 'boost' || cmd === '-b');
    let isNitroTime = (cmd === 't' || cmd === '-t');

    if (!isNitro && !isBoost && !isNitroTime && !isMusicCmd) return;

    // 🎵 1️⃣ أمر الموسيقى (reba أو fox)
    if (isMusicCmd) {
        const embed = new EmbedBuilder()
            .setTitle('🎵 نظام تشغيل الموسيقى المتطور')
            .setDescription('✨ **أهلاً بك!** اضغط على الزر بالأسفل لكتابة اسم الأغنية أو الرابط لتشغيلها بأعلى جودة 🎧.')
            .setColor('#2b2d31')
            .setFooter({ text: 'FOX Music System 🚀', iconURL: client.user.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('fox_open_music_modal')
                .setLabel('ابحث أو شغّل أغنية 🎶')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔍')
        );

        return message.reply({ embeds: [embed], components: [row] });
    }

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

        let startDate = member && member.premiumSince ? new Date(member.premiumSince) : new Date(user.createdTimestamp);
        
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

// 🎵 2️⃣ معالجة النافذة المنبثقة (Modal) والبحث
client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && interaction.customId === 'fox_open_music_modal') {
        const modal = new ModalBuilder()
            .setCustomId('fox_music_modal')
            .setTitle('تشغيل الأغاني - FOX Music');

        const songInput = new TextInputBuilder()
            .setCustomId('song_input')
            .setLabel('اكتب اسم الأغنية أو رابط يوتيوب/سوتفاي:')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('مثال: اسم الأغنية أو الرابط...')
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(songInput));
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'fox_music_modal') {
        if (!interaction.member.voice.channel) {
            return interaction.reply({ content: '❌ **يجب أن تكون متواجداً داخل روم صوتي أولاً!**', ephemeral: true });
        }

        const query = interaction.fields.getTextInputValue('song_input');
        await interaction.reply({ content: `🔍 **جاري التحميل والتأكد من الجودة العالية:** \`${query}\`...`, ephemeral: true });

        try {
            await distube.play(interaction.member.voice.channel, query, {
                textChannel: interaction.channel,
                member: interaction.member,
            });
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: `❌ **حدث خطأ أثناء التشغيل:** \`${e.message}\`` });
        }
    }
});

// 🎵 3️⃣ إرسال لوحة التحكم التفاعلية مع بدء التشغيل
distube.on('playSong', (queue, song) => {
    const embed = new EmbedBuilder()
        .setTitle('🎶 جاري تشغيل الأغنية الآن')
        .setDescription(`**[${song.name}](${song.url})**`)
        .addFields(
            { name: '⏱️ المدة', value: `\`${song.formattedDuration}\``, inline: true },
            { name: '👤 طلب بواسطة', value: `${song.user}`, inline: true },
            { name: '🔊 مستوى الصوت', value: `\`${queue.volume}%\``, inline: true }
        )
        .setThumbnail(song.thumbnail)
        .setColor('#00ffcc')
        .setTimestamp();

    const controlsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_pause').setLabel('إيقاف مؤقت').setStyle(ButtonStyle.Secondary).setEmoji('⏸️'),
        new ButtonBuilder().setCustomId('music_vol_down').setLabel('خفض الصوت').setStyle(ButtonStyle.Primary).setEmoji('🔉'),
        new ButtonBuilder().setCustomId('music_vol_up').setLabel('رفع الصوت').setStyle(ButtonStyle.Primary).setEmoji('🔊'),
        new ButtonBuilder().setCustomId('music_skip').setLabel('تخطي').setStyle(ButtonStyle.Success).setEmoji('⏭️'),
        new ButtonBuilder().setCustomId('music_stop').setLabel('إيقاف ومغادرة').setStyle(ButtonStyle.Danger).setEmoji('⏹️')
    );

    queue.textChannel.send({ embeds: [embed], components: [controlsRow] });
});

// 🎵 4️⃣ أزرار التحكم (رفع/خفض الصوت، تخطي، إلخ)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('music_')) return;

    const queue = distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ **لا توجد أي أغنية تعمل حالياً!**', ephemeral: true });

    if (!interaction.member.voice.channel) {
        return interaction.reply({ content: '❌ **يجب أن تكون معي في نفس الروم الصوتي!**', ephemeral: true });
    }

    try {
        switch (interaction.customId) {
            case 'music_pause':
                if (queue.paused) {
                    queue.resume();
                    await interaction.reply({ content: '▶️ **تم استئناف تشغيل الأغنية.**', ephemeral: true });
                } else {
                    queue.pause();
                    await interaction.reply({ content: '⏸️ **تم إيقاف الأغنية مؤقتاً.**', ephemeral: true });
                }
                break;

            case 'music_vol_down':
                const newVolDown = Math.max(queue.volume - 10, 0);
                queue.setVolume(newVolDown);
                await interaction.reply({ content: `🔉 **تم خفض الصوت إلى:** \`${newVolDown}%\``, ephemeral: true });
                break;

            case 'music_vol_up':
                const newVolUp = Math.min(queue.volume + 10, 100);
                queue.setVolume(newVolUp);
                await interaction.reply({ content: `🔊 **تم رفع الصوت إلى:** \`${newVolUp}%\``, ephemeral: true });
                break;

            case 'music_skip':
                await distube.skip(interaction.guildId);
                await interaction.reply({ content: '⏭️ **تم تخطي الأغنية.**', ephemeral: true });
                break;

            case 'music_stop':
                distube.stop(interaction.guildId);
                await interaction.reply({ content: '⏹️ **تم إيقاف المشغل ومغادرة الروم الصوتي.**', ephemeral: true });
                break;
        }
    } catch (e) {
        await interaction.reply({ content: `❌ **حدث خطأ:** ${e.message}`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
