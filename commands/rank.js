const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getUser, getUserRank } = require('../database');
const { getXPForLevel } = require('../xpSystem');
const { createRankCard } = require('../cardGenerator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your or someone else\'s rank and level')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check (leave empty for yourself)')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id);

    if (targetUser.bot) {
      return interaction.editReply({ content: '❌ Bots don\'t have levels!', ephemeral: true });
    }

    const userData = await getUser(targetUser.id, interaction.guild.id);
    const rank = await getUserRank(targetUser.id, interaction.guild.id);

    if (!userData || userData.total_xp === 0) {
      return interaction.editReply({ 
        content: `${targetUser.username} hasn't earned any XP yet!`, 
        ephemeral: true 
      });
    }

    const xpForNextLevel = getXPForLevel(userData.level);

    try {
      // Generate rank card
      const cardBuffer = await createRankCard({
        rank,
        level: userData.level,
        xp: userData.xp,
        totalXP: userData.total_xp,
        messages: userData.messages,
        xpForNextLevel
      }, member);

      // If canvas not available, use embed instead
      if (!cardBuffer) {
        const progressPercent = Math.floor((userData.xp / xpForNextLevel) * 100);
        const progressBar = '█'.repeat(Math.floor(progressPercent / 5)) + '░'.repeat(20 - Math.floor(progressPercent / 5));
        
        const embed = {
          color: 0x5865F2,
          title: `📊 Rank Card - ${targetUser.username}`,
          thumbnail: {
            url: targetUser.displayAvatarURL({ size: 256 })
          },
          fields: [
            {
              name: '🏆 Rank',
              value: `#${rank}`,
              inline: true
            },
            {
              name: '📈 Level',
              value: `${userData.level}`,
              inline: true
            },
            {
              name: '💬 Messages',
              value: `${userData.messages.toLocaleString()}`,
              inline: true
            },
            {
              name: '✨ XP Progress',
              value: `\`${progressBar}\`\n${userData.xp.toLocaleString()} / ${xpForNextLevel.toLocaleString()} XP (${progressPercent}%)`,
              inline: false
            },
            {
              name: '🎯 Total XP',
              value: `${userData.total_xp.toLocaleString()}`,
              inline: true
            }
          ],
          footer: {
            text: '⚠️ Canvas not installed - using embed format'
          },
          timestamp: new Date()
        };

        return interaction.editReply({ embeds: [embed] });
      }

      const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank-card.png' });

      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Error generating rank card:', error);
      await interaction.editReply({ 
        content: '❌ An error occurred while generating the rank card. Please try again later.', 
        ephemeral: true 
      });
    }
  },
};
