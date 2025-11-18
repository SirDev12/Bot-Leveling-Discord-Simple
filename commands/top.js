const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('View top users in different categories')
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('Category to view')
        .setRequired(true)
        .addChoices(
          { name: '⭐ Total XP', value: 'xp' },
          { name: '📊 Level', value: 'level' },
          { name: '💬 Messages', value: 'messages' }
        ))
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of users to display (default: 10)')
        .setMinValue(5)
        .setMaxValue(25)),

  async execute(interaction) {
    const category = interaction.options.getString('category');
    const amount = interaction.options.getInteger('amount') || 10;

    await interaction.deferReply();

    const leaderboard = await getLeaderboard(interaction.guild.id, 100);

    if (leaderboard.length === 0) {
      return await interaction.editReply({
        content: '❌ No users with XP found in this server!'
      });
    }

    // Sort based on category
    let sortedUsers;
    let categoryName;
    let emoji;

    switch (category) {
      case 'level':
        sortedUsers = leaderboard.sort((a, b) => b.level - a.level);
        categoryName = 'Level';
        emoji = '📊';
        break;
      case 'messages':
        sortedUsers = leaderboard.sort((a, b) => b.messages - a.messages);
        categoryName = 'Messages';
        emoji = '💬';
        break;
      default:
        sortedUsers = leaderboard; // Already sorted by total_xp
        categoryName = 'Total XP';
        emoji = '⭐';
    }

    const topUsers = sortedUsers.slice(0, amount);

    // Fetch usernames
    const userDataPromises = topUsers.map(async (userData, index) => {
      try {
        const user = await interaction.client.users.fetch(userData.user_id);
        let value;
        
        switch (category) {
          case 'level':
            value = `Level ${userData.level}`;
            break;
          case 'messages':
            value = `${userData.messages.toLocaleString()} messages`;
            break;
          default:
            value = `${userData.total_xp.toLocaleString()} XP`;
        }

        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `**${index + 1}.**`;
        return `${medal} ${user.username} • ${value}`;
      } catch {
        return `${index + 1}. Unknown User • N/A`;
      }
    });

    const userList = await Promise.all(userDataPromises);

    const embed = new EmbedBuilder()
      .setColor('#e67e22')
      .setTitle(`${emoji} Top ${amount} - ${categoryName}`)
      .setDescription(userList.join('\n'))
      .setFooter({ text: `Server: ${interaction.guild.name} • Use /top to view different categories` })
      .setTimestamp();

    // Add statistics
    const totalValue = topUsers.reduce((sum, user) => {
      switch (category) {
        case 'level':
          return sum + user.level;
        case 'messages':
          return sum + user.messages;
        default:
          return sum + user.total_xp;
      }
    }, 0);

    const avgValue = Math.round(totalValue / topUsers.length);

    embed.addFields({
      name: '📊 Statistics',
      value: `**Average ${categoryName}:** ${avgValue.toLocaleString()}\n**Total Users Shown:** ${topUsers.length}`,
      inline: false
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
