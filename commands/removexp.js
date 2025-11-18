const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUser, updateUser } = require('../database');
const { getLevelFromXP, getCurrentLevelXP } = require('../xpSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removexp')
    .setDescription('Remove XP from a user (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove XP from')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Amount of XP to remove')
        .setMinValue(1)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const xpAmount = interaction.options.getInteger('amount');

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ Cannot modify bot XP!', ephemeral: true });
    }

    const userData = await getUser(targetUser.id, interaction.guild.id);
    const newTotalXP = Math.max(0, userData.total_xp - xpAmount);
    const newLevel = getLevelFromXP(newTotalXP);
    const currentXP = getCurrentLevelXP(newTotalXP);

    await updateUser(
      targetUser.id,
      interaction.guild.id,
      currentXP,
      newLevel,
      newTotalXP,
      userData.messages,
      userData.last_message
    );

    await interaction.reply({
      content: `✅ Removed **${xpAmount.toLocaleString()} XP** from **${targetUser.username}**!\nNew Total: **${newTotalXP.toLocaleString()} XP** (Level ${newLevel})`,
      ephemeral: true
    });
  },
};
