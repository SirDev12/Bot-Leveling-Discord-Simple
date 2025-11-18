const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getUserRank } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('compare')
    .setDescription('Compare your stats with another user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to compare with')
        .setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');

    if (target.bot) {
      return await interaction.reply({
        content: '❌ You cannot compare stats with a bot!',
        ephemeral: true
      });
    }

    if (target.id === interaction.user.id) {
      return await interaction.reply({
        content: '❌ You cannot compare with yourself!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const user1Data = await getUser(interaction.user.id, interaction.guild.id);
    const user2Data = await getUser(target.id, interaction.guild.id);
    const user1Rank = await getUserRank(interaction.user.id, interaction.guild.id);
    const user2Rank = await getUserRank(target.id, interaction.guild.id);
    const levelDiff = user1Data.level - user2Data.level;
    const xpDiff = user1Data.total_xp - user2Data.total_xp;
    const msgDiff = user1Data.messages - user2Data.messages;
    const rankDiff = user2Rank - user1Rank;
    const levelWinner = levelDiff > 0 ? interaction.user : levelDiff < 0 ? target : null;
    const xpWinner = xpDiff > 0 ? interaction.user : xpDiff < 0 ? target : null;
    const msgWinner = msgDiff > 0 ? interaction.user : msgDiff < 0 ? target : null;
    const rankWinner = rankDiff > 0 ? interaction.user : rankDiff < 0 ? target : null;

    const getEmoji = (winner, user) => {
      if (!winner) return '🤝';
      return winner.id === user.id ? '🏆' : '❌';
    };

    const embed = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle('⚔️ User Comparison')
      .setDescription(`Comparing **${interaction.user.username}** vs **${target.username}**`)
      .addFields(
        {
          name: '📊 Level',
          value: `${getEmoji(levelWinner, interaction.user)} **${interaction.user.username}:** ${user1Data.level}\n${getEmoji(levelWinner, target)} **${target.username}:** ${user2Data.level}\n\n**Difference:** ${Math.abs(levelDiff)} levels`,
          inline: true
        },
        {
          name: '⭐ Total XP',
          value: `${getEmoji(xpWinner, interaction.user)} **${interaction.user.username}:** ${user1Data.total_xp.toLocaleString()}\n${getEmoji(xpWinner, target)} **${target.username}:** ${user2Data.total_xp.toLocaleString()}\n\n**Difference:** ${Math.abs(xpDiff).toLocaleString()} XP`,
          inline: true
        },
        {
          name: '🏅 Rank',
          value: `${getEmoji(rankWinner, interaction.user)} **${interaction.user.username}:** #${user1Rank}\n${getEmoji(rankWinner, target)} **${target.username}:** #${user2Rank}\n\n**Difference:** ${Math.abs(rankDiff)} ranks`,
          inline: true
        },
        {
          name: '💬 Messages',
          value: `${getEmoji(msgWinner, interaction.user)} **${interaction.user.username}:** ${user1Data.messages.toLocaleString()}\n${getEmoji(msgWinner, target)} **${target.username}:** ${user2Data.messages.toLocaleString()}\n\n**Difference:** ${Math.abs(msgDiff).toLocaleString()} messages`,
          inline: false
        }
      );
    const user1Score = [levelWinner, xpWinner, msgWinner, rankWinner].filter(w => w && w.id === interaction.user.id).length;
    const user2Score = [levelWinner, xpWinner, msgWinner, rankWinner].filter(w => w && w.id === target.id).length;

    let overallResult;
    if (user1Score > user2Score) {
      overallResult = `🏆 **${interaction.user.username}** is ahead! (${user1Score}-${user2Score})`;
    } else if (user2Score > user1Score) {
      overallResult = `🏆 **${target.username}** is ahead! (${user2Score}-${user1Score})`;
    } else {
      overallResult = `🤝 **It's a tie!** Both users are equally matched!`;
    }

    embed.addFields({
      name: '🎯 Overall Result',
      value: overallResult,
      inline: false
    });

    embed.setFooter({ text: 'Keep grinding to stay ahead!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
