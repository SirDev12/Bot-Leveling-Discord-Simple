const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard, getRoleRewards, getIgnoredChannels, getGuildConfig } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('View server leveling statistics and info'),

  async execute(interaction) {
    await interaction.deferReply();

    const leaderboard = await getLeaderboard(interaction.guild.id, 100);
    const roleRewards = await getRoleRewards(interaction.guild.id);
    const ignoredChannels = await getIgnoredChannels(interaction.guild.id);
    const config = await getGuildConfig(interaction.guild.id);
    const totalUsers = leaderboard.length;
    const totalXP = leaderboard.reduce((sum, user) => sum + user.total_xp, 0);
    const totalMessages = leaderboard.reduce((sum, user) => sum + user.messages, 0);
    const avgLevel = totalUsers > 0 
      ? (leaderboard.reduce((sum, user) => sum + user.level, 0) / totalUsers).toFixed(1)
      : 0;
    const avgXP = totalUsers > 0 
      ? Math.round(totalXP / totalUsers)
      : 0;
    const topUser = leaderboard[0];
    const topUserTag = topUser 
      ? await interaction.client.users.fetch(topUser.user_id).then(u => u.tag).catch(() => 'Unknown User')
      : 'None';
    const beginners = leaderboard.filter(u => u.level < 10).length;
    const intermediate = leaderboard.filter(u => u.level >= 10 && u.level < 30).length;
    const advanced = leaderboard.filter(u => u.level >= 30 && u.level < 50).length;
    const experts = leaderboard.filter(u => u.level >= 50).length;

    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle(`📊 ${interaction.guild.name} - Leveling Statistics`)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .addFields(
        {
          name: '👥 User Statistics',
          value: [
            `**Total Active Users:** ${totalUsers.toLocaleString()}`,
            `**Total Messages:** ${totalMessages.toLocaleString()}`,
            `**Total XP Earned:** ${totalXP.toLocaleString()}`,
            `**Average Level:** ${avgLevel}`,
            `**Average XP:** ${avgXP.toLocaleString()}`
          ].join('\n'),
          inline: false
        },
        {
          name: '🏆 Top Performer',
          value: topUser 
            ? `**${topUserTag}**\nLevel ${topUser.level} • ${topUser.total_xp.toLocaleString()} XP`
            : 'No users with XP yet',
          inline: true
        },
        {
          name: '📈 Level Distribution',
          value: [
            `🥉 Beginners (0-9): **${beginners}**`,
            `🥈 Intermediate (10-29): **${intermediate}**`,
            `🥇 Advanced (30-49): **${advanced}**`,
            `💎 Experts (50+): **${experts}**`
          ].join('\n'),
          inline: true
        },
        {
          name: '⚙️ Configuration',
          value: [
            `**XP Rate:** ${config.xp_rate}x`,
            `**Announcements:** ${config.announcement_enabled ? 'Enabled' : 'Disabled'}`,
            `**Stack Roles:** ${config.stack_roles ? 'Yes' : 'No'}`,
            `**Role Rewards:** ${roleRewards.length}`,
            `**Ignored Channels:** ${ignoredChannels.length}`
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: `Use /leaderboard to see top users • Use /stats to see your stats` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
