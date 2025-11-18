const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { resetUserXP, resetAllXP } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetxp')
    .setDescription('Reset XP for a user or entire server (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to reset (leave empty to reset entire server)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    if (targetUser) {
      // Reset specific user
      if (targetUser.bot) {
        return interaction.reply({ content: '❌ Cannot reset bot XP!', ephemeral: true });
      }

      await resetUserXP(targetUser.id, interaction.guild.id);
      await interaction.reply({
        content: `✅ Successfully reset XP for **${targetUser.username}**`,
        ephemeral: true
      });
    } else {
      // Reset entire server - ask for confirmation using buttons
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_reset')
        .setLabel('Confirm Reset')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_reset')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder()
        .addComponents(confirmButton, cancelButton);

      const response = await interaction.reply({
        content: '⚠️ **WARNING:** Are you sure you want to reset XP for **everyone** in this server?\nThis action cannot be undone!',
        components: [row],
        ephemeral: true
      });

      const collectorFilter = i => i.user.id === interaction.user.id;
      
      try {
        const confirmation = await response.awaitMessageComponent({ 
          filter: collectorFilter, 
          time: 30000 
        });

        if (confirmation.customId === 'confirm_reset') {
          await resetAllXP(interaction.guild.id);
          await confirmation.update({
            content: '✅ Successfully reset XP for all users in the server!',
            components: []
          });
        } else {
          await confirmation.update({
            content: '❌ XP reset cancelled.',
            components: []
          });
        }
      } catch (e) {
        await interaction.editReply({
          content: '❌ XP reset cancelled - no response received within 30 seconds.',
          components: []
        });
      }
    }
  },
};
