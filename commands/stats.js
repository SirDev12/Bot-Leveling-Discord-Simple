const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getLeaderboard, getUserRank } = require('../database');
const { getXPForLevel } = require('../xpSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View detailed statistics about a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to view stats for (leave empty for yourself)')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    if (target.bot) {
      return await interaction.reply({
        content: '❌ Bots do not have leveling stats!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const userData = await getUser(target.id, interaction.guild.id);
    const rank = await getUserRank(target.id, interaction.guild.id);
    const leaderboard = await getLeaderboard(interaction.guild.id, 100);
    
    const xpForNextLevel = getXPForLevel(userData.level);
    const xpProgress = Math.floor((userData.xp / xpForNextLevel) * 100);
    
    // Calculate percentile
    const totalUsers = leaderboard.length;
    const percentile = totalUsers > 0 ? Math.round((1 - (rank - 1) / totalUsers) * 100) : 100;

    // Calculate average XP per message
    const avgXpPerMessage = userData.messages > 0 
      ? Math.round(userData.total_xp / userData.messages) 
      : 0;

    // Estimate messages to next level
    const xpNeeded = xpForNextLevel - userData.xp;
    const messagesToLevel = avgXpPerMessage > 0 
      ? Math.ceil(xpNeeded / avgXpPerMessage)
      : '???';

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(`📊 Statistics for ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { 
          name: '🎯 Rank & Level', 
          value: `**Rank:** #${rank}\n**Level:** ${userData.level}\n**Percentile:** Top ${percentile}%`, 
          inline: true 
        },
        { 
          name: '⭐ Experience', 
          value: `**Current XP:** ${userData.xp.toLocaleString()} / ${xpForNextLevel.toLocaleString()}\n**Total XP:** ${userData.total_xp.toLocaleString()}\n**Progress:** ${xpProgress}%`, 
          inline: true 
        },
        { 
          name: '💬 Messages', 
          value: `**Total:** ${userData.messages.toLocaleString()}\n**Avg XP/Msg:** ${avgXpPerMessage}\n**To Level:** ~${messagesToLevel} msgs`, 
          inline: true 
        }
      )
      .setFooter({ text: `Server: ${interaction.guild.name}` })
      .setTimestamp();

    // Add progress bar
    const progressBarLength = 20;
    const filledLength = Math.round((userData.xp / xpForNextLevel) * progressBarLength);
    const emptyLength = progressBarLength - filledLength;
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

    embed.addFields({
      name: '📈 Progress to Next Level',
      value: `\`${progressBar}\` ${xpProgress}%\n${userData.xp.toLocaleString()} / ${xpForNextLevel.toLocaleString()} XP`,
      inline: false
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
