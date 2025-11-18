const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server XP leaderboard')
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Page number to view')
        .setMinValue(1)
        .setRequired(false)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();

    const page = interaction.options.getInteger('page') || 1;
    const itemsPerPage = 10;
    const offset = (page - 1) * itemsPerPage;

    const leaderboardData = await getLeaderboard(interaction.guild.id, 100);
    const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);

    if (page > totalPages && totalPages > 0) {
      return interaction.editReply({ 
        content: `❌ Invalid page! There are only ${totalPages} pages.`, 
        ephemeral: true 
      });
    }

    if (leaderboardData.length === 0) {
      return interaction.editReply({ 
        content: '❌ No one has earned any XP yet!', 
        ephemeral: true 
      });
    }

    const pageData = leaderboardData.slice(offset, offset + itemsPerPage);

    let description = '';
    for (let i = 0; i < pageData.length; i++) {
      const data = pageData[i];
      const position = offset + i + 1;
      
      let medal = '';
      if (position === 1) medal = '🥇';
      else if (position === 2) medal = '🥈';
      else if (position === 3) medal = '🥉';
      else medal = `**${position}.**`;

      const user = await interaction.client.users.fetch(data.user_id).catch(() => null);
      const username = user ? user.username : 'Unknown User';

      description += `${medal} **${username}**\n`;
      description += `└ Level ${data.level} • ${data.total_xp.toLocaleString()} XP • ${data.messages.toLocaleString()} msgs\n\n`;
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`🏆 ${interaction.guild.name} - Leaderboard`)
      .setDescription(description)
      .setFooter({ text: `Page ${page}/${totalPages} • Total Members: ${leaderboardData.length}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
